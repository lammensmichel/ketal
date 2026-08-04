import { inject, Injectable } from '@angular/core';
import { ID } from 'appwrite';
import { AppwriteService } from '../appwrite/appwrite.service';
import { KetalSessionService } from '../ketal-session/ketal-session.service';
import { MemberService } from '../member/member.service';
import { RoomService } from '../room/room.service';
import { getAppwriteMessage } from '../../_shared/helpers/appwrite-exception.helper';
import { SipExchange } from '../../_shared/_models/sip-exchange.model';

/**
 * Collection des transferts de gorgees (migration 047, enrichie par la 048).
 */
const COLLECTION_KETAL_SIP_EVENTS = 'ketal_sip_events';

/**
 * Payload d'un evenement de gorgees tel qu'attendu par Appwrite.
 *
 * `fromUserId` / `toUserId` sont absents du type quand ils ne sont pas
 * resolvables : la collection les declare optionnels, et on prefere ne pas
 * envoyer la cle plutot que d'inventer une valeur.
 */
interface SipEventPayload {
  sessionId: string;
  roomId: string;
  fromPlayerId: string;
  toPlayerId: string;
  sips: number;
  gameNumber?: number;
  createdAt: string;
  fromUserId?: string;
  toUserId?: string;
}

/**
 * SipEventService - Persiste les transferts de gorgees dans `ketal_sip_events`
 *
 * ## Pourquoi une collection dediee
 *
 * `player.sips` n'agrege que les totaux `drunk` / `given` : le detail « qui a
 * donne combien a qui » n'est reconstituable nulle part. Cette collection le
 * conserve, avec un `createdAt` renseigne par le client (les attributs systeme
 * d'Appwrite ne sont pas librement indexables, or l'index `roomId + createdAt`
 * en depend).
 *
 * ## Deux niveaux d'identite, volontairement
 *
 * - `fromPlayerId` / `toPlayerId` portent le `memberId` : c'est le bon grain
 *   pour le detail intra-partie, ou seul le joueur de la session compte.
 * - `fromUserId` / `toUserId` portent le compte Appwrite. Ils existent parce
 *   qu'un membre est rattache a UNE room (`fug_game_members.roomId` est requis) :
 *   la meme personne a un `memberId` different dans chaque room, ce qui rend
 *   « combien de gorgees ai-je donnees a Michel au total » incalculable a partir
 *   du seul `memberId`. Ils sont optionnels car un invite anonyme n'a pas de
 *   compte (il n'a qu'un `deviceId`) : ses echanges ne sont alors comptabilises
 *   que par room, et c'est assume.
 *
 * ## Portee : room uniquement
 *
 * L'ecriture exige un `roomId` ET un `sessionId`. Le declencheur est donc la
 * presence effective d'une session Appwrite, pas le libelle du mode : une partie
 * solo adossee a une room solo (cf. SoloRoomService) est bien persistee, alors
 * qu'une partie retombee en mode local (echec de creation de room, partie
 * rapide anonyme) n'a aucune session et reste uniquement en memoire dans
 * `Game.sipExchanges`.
 *
 * ## Une statistique ne doit jamais bloquer le jeu
 *
 * Toutes les erreurs sont logues puis avalees. Un echec reseau ne doit pas
 * empecher un joueur de valider sa distribution de gorgees.
 */
@Injectable({
  providedIn: 'root',
})
export class SipEventService {
  private readonly appwrite = inject(AppwriteService);
  private readonly roomService = inject(RoomService);
  private readonly ketalSessionService = inject(KetalSessionService);
  private readonly memberService = inject(MemberService);

  /**
   * Persiste une liste de transferts de gorgees.
   *
   * Ne rejette jamais : les echecs sont logues. Chaque evenement est ecrit
   * independamment pour qu'une erreur sur l'un ne fasse pas perdre les autres.
   *
   * @param exchanges - Transferts a persister (sips <= 0 et auto-dons ignores)
   */
  async recordExchanges(exchanges: SipExchange[]): Promise<void> {
    if (!exchanges || exchanges.length === 0) {
      return;
    }

    const roomId = this.roomService?.currentRoom()?.$id;
    const session = this.ketalSessionService.currentSession();

    // Mode local : aucune session Appwrite, l'historique reste en memoire.
    if (!roomId || !session) {
      console.debug('[SipEventService] Skipping persistence - no room/session (local mode)', {
        hasRoom: !!roomId,
        hasSession: !!session,
      });
      return;
    }

    // Le backend refuse sips < 1 et un auto-don n'a aucun sens statistique :
    // on filtre ici pour ne pas transformer une donnee inutile en erreur 400.
    const persistable = exchanges.filter((e) => e.sips > 0 && e.fromPlayerId !== e.toPlayerId);
    if (persistable.length === 0) {
      return;
    }

    await Promise.all(
      persistable.map((exchange) => this.createSipEvent(exchange, roomId, session.$id, session.gameNumber))
    );
  }

  /**
   * Ecrit un seul evenement. Avale son erreur apres l'avoir loguee.
   */
  private async createSipEvent(
    exchange: SipExchange,
    roomId: string,
    sessionId: string,
    gameNumber: number | undefined
  ): Promise<void> {
    const payload: SipEventPayload = {
      sessionId,
      roomId,
      fromPlayerId: exchange.fromPlayerId,
      toPlayerId: exchange.toPlayerId,
      sips: exchange.sips,
      createdAt: exchange.at,
    };

    if (gameNumber !== undefined) {
      payload.gameNumber = gameNumber;
    }

    const fromUserId = this.resolveUserId(exchange.fromPlayerId);
    if (fromUserId) {
      payload.fromUserId = fromUserId;
    }

    const toUserId = this.resolveUserId(exchange.toPlayerId);
    if (toUserId) {
      payload.toUserId = toUserId;
    }

    try {
      await this.appwrite.databases.createDocument({
        databaseId: this.appwrite.databaseId,
        collectionId: COLLECTION_KETAL_SIP_EVENTS,
        documentId: ID.unique(),
        data: payload,
      });
    } catch (error: unknown) {
      // Volontairement non propage : perdre une statistique est acceptable,
      // bloquer la distribution de gorgees ne l'est pas.
      console.warn(
        '[SipEventService] Failed to persist sip event:',
        getAppwriteMessage(error) ?? (error instanceof Error ? error.message : 'Unknown error')
      );
    }
  }

  /**
   * Resout le `userId` du compte Appwrite a partir d'un `memberId`.
   *
   * Lit le signal deja en memoire de MemberService : aucun aller-retour reseau
   * par echange. Renvoie null pour un invite anonyme (`userId` absent) ou pour
   * un joueur purement local (id uuid sans document membre).
   */
  private resolveUserId(memberId: string): string | null {
    const member = this.memberService.members().find((m) => m.$id === memberId);
    return member?.userId ?? null;
  }
}
