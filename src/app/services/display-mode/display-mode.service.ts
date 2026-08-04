import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { GameService } from '../game/game.service';
import { MemberService } from '../member/member.service';

/**
 * Les trois facons d'afficher une meme partie sur un appareil donne.
 *
 * - `table`    : comportement historique. On voit tout le monde, tout est actionnable.
 * - `personnel`: ma fiche est mise en avant, les autres restent visibles en lecture
 *                seule ; mes controles ne sont actifs qu'a mon tour.
 * - `viewer`   : on voit tout comme en `table`, mais rien n'est actionnable (la TV).
 */
export type DisplayMode = 'table' | 'personnel' | 'viewer';

/** Ordre d'affichage dans le selecteur du menu lateral. */
export const DISPLAY_MODES: readonly DisplayMode[] = ['table', 'personnel', 'viewer'];

/**
 * Mode d'affichage du jeu.
 *
 * ── POURQUOI une preference LOCALE A L'APPAREIL ──────────────────────────────
 * Le scenario cible est une TV en `viewer` PENDANT que chaque telephone est en
 * `personnel`, sur la meme partie. Un reglage partage via KetalSession rendrait
 * ces deux vues mutuellement exclusives. On suit donc le meme schema que
 * `GameService.withSummaryMode` : une cle localStorage lue au demarrage et un
 * `effect` qui reecrit a chaque changement.
 *
 * ── POURQUOI LE VERROUILLAGE AU TOUR VIT ICI, ET SURTOUT PAS DANS GameService ─
 * Ce n'est PAS une regle du jeu, c'est une propriete de la VUE. Le jeu autorise
 * volontairement n'importe quel appareil a agir pour n'importe quel joueur, et
 * deux fonctionnalites en dependent :
 *   1. le mode `table` — un seul telephone qui passe de main en main ;
 *   2. les joueurs fictifs — ils n'ont aucun appareil, donc quelqu'un d'autre
 *      doit pouvoir jouer a leur place.
 * Ajouter un garde `isMyTurn` dans GameService ou dans les helpers casserait les
 * deux d'un coup. Si vous etes tente de « corriger » ca en remontant la regle
 * dans le service de jeu : ne le faites pas, c'est exactement le bug qu'on evite.
 * Les composants demandent ici s'ils doivent desactiver un controle ; le service
 * de jeu, lui, continue d'accepter tout ce qu'on lui demande.
 */
@Injectable({ providedIn: 'root' })
export class DisplayModeService {
  private readonly gameSrv = inject(GameService);
  private readonly memberSrv = inject(MemberService);

  /** Cle localStorage de la preference d'affichage (propre a cet appareil). */
  private static readonly DISPLAY_MODE_KEY = 'ketal_display_mode';

  private static readStoredMode(): DisplayMode {
    const raw = localStorage.getItem(DisplayModeService.DISPLAY_MODE_KEY);
    return DISPLAY_MODES.includes(raw as DisplayMode) ? (raw as DisplayMode) : 'table';
  }

  /**
   * Preference brute choisie sur cet appareil. Persistee, mais pas forcement
   * effective : voir `mode()`.
   */
  readonly preferredMode = signal<DisplayMode>(DisplayModeService.readStoredMode());

  constructor() {
    effect(() => {
      localStorage.setItem(DisplayModeService.DISPLAY_MODE_KEY, this.preferredMode());
    });
  }

  /**
   * Le choix de mode n'a de sens qu'en mode room : hors room il n'y a pas de
   * membre, donc pas de « moi » sur qui appuyer le mode personnel.
   */
  readonly isModeSelectable = computed(() => this.gameSrv.isRoomMode());

  /** Mode effectif : la preference, sauf hors room ou `table` est impose. */
  readonly mode = computed<DisplayMode>(() => (this.isModeSelectable() ? this.preferredMode() : 'table'));

  setMode(mode: DisplayMode): void {
    this.preferredMode.set(mode);
  }

  /**
   * Mon identifiant de joueur. `player.id` EST le `memberId`
   * (cf. `mapKetalPlayerToPlayerModel`), aucune correspondance a reconstruire.
   */
  readonly myPlayerId = computed(() => this.memberSrv.currentMember()?.$id ?? null);

  /** Detection de l'hote, comme partout ailleurs dans l'app. */
  readonly isHost = computed(() => this.memberSrv.currentMember()?.role === 'host');

  /**
   * Joueurs fictifs : membres sans compte ni appareil. Personne ne peut etre en
   * mode `personnel` « pour eux », donc l'hote les garde en main — sinon, des que
   * tous les joueurs reels passent en personnel, plus personne ne peut les jouer.
   */
  private readonly fictionalPlayerIds = computed(
    () =>
      new Set(
        this.memberSrv
          .members()
          .filter((member) => member.isFictional)
          .map((member) => member.$id)
      )
  );

  readonly isPersonalView = computed(() => this.mode() === 'personnel');

  /** Vrai quand cet appareil ne fait que regarder (mode `viewer`). */
  readonly isViewerView = computed(() => this.mode() === 'viewer');

  /**
   * Cet appareil peut-il agir pour ce joueur ?
   * `table` : oui, pour tout le monde (comportement historique, intact).
   * `viewer` : non, pour personne.
   * `personnel` : moi, plus les joueurs fictifs si je suis l'hote.
   */
  canControlPlayer(playerId: string | null | undefined): boolean {
    switch (this.mode()) {
      case 'viewer':
        return false;
      case 'personnel':
        if (!playerId) {
          return false;
        }
        return playerId === this.myPlayerId() || (this.isHost() && this.fictionalPlayerIds().has(playerId));
      default:
        return true;
    }
  }

  /** Est-ce ma fiche ? Sert a la mise en avant en mode personnel uniquement. */
  isMyPlayer(playerId: string | null | undefined): boolean {
    return this.isPersonalView() && !!playerId && playerId === this.myPlayerId();
  }

  /**
   * Les controles de prediction de la phase 1 agissent sur le joueur actif : la
   * seule question que pose la vue est « ce joueur est-il sous mon controle ? ».
   */
  readonly canControlActivePlayer = computed(() => this.canControlPlayer(this.gameSrv.activePlayer()?.id));

  /**
   * Pioche de la phase 2. Il n'y a plus de joueur actif a ce stade
   * (`activePlayer` repasse a `undefined`) : la carte appartient a la table, pas
   * a quelqu'un. On ne verrouille donc que `viewer` — verrouiller aussi
   * `personnel` bloquerait la partie, plus aucun appareil ne pouvant piocher.
   */
  readonly canDrawSharedCard = computed(() => !this.isViewerView());

  /**
   * Actions de fin de manche (resume, rejouer) : elles n'appartiennent a aucun
   * joueur, seul le `viewer` en est prive.
   */
  readonly canRunTableAction = computed(() => !this.isViewerView());
}
