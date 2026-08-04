import { v4 as uuidv4 } from 'uuid';
import { CardType } from '../_models/card-type.model';
import { PlayerChoice, PlayerGender, PlayerModel } from '../_models/player.model';
import { LocalService } from '../../services/local/local.service';
import { inject, Injectable } from '@angular/core';
import { CardService } from '../../services/card/card.service';
import { Game } from '../_models/game.model';

@Injectable({ providedIn: 'root' })
export class PlayerHelperService {
  public localService = inject(LocalService);
  public cardSrv = inject(CardService);

  public players: PlayerModel[] = [];

  public addPlayer(player: string, gender: PlayerGender = 'neutral'): void {
    const playerModel = new PlayerModel();
    playerModel.name = player;
    playerModel.id = uuidv4();
    playerModel.gender = gender;
    playerModel.cards = new Array<CardType>();
    playerModel.choice = {
      color: '',
      plus_or_minus: '',
      in_out: '',
      suit: '',
    } as PlayerChoice;

    // Seed prefix nudges Dicebear toward consistent gender-leaning avatars while
    // staying within the same `avataaars` style for visual coherence.
    const seedPrefix = gender === 'male' ? 'm-' : gender === 'female' ? 'f-' : '';
    playerModel.avatarSrc = `https://api.dicebear.com/7.x/avataaars/svg?seed=${seedPrefix}${playerModel.id}`;
    this.players.push(playerModel);
    this.savePlayerToStorage(this.players);
  }

  public deletePlayer(player: PlayerModel) {
    this.players = this.players.filter((playerSelected) => playerSelected.id !== player.id);

    this.savePlayerToStorage(this.players);
  }

  public savePlayerToStorage(players: Array<PlayerModel>) {
    this.localService.saveData('players', JSON.stringify(players));
  }

  public getPlayerNumber(): number {
    return this.getPlayers().length;
  }

  public isMaxPlayerNumberNotReached(): boolean {
    return this.getPlayerNumber() < 23;
  }

  public getPlayers(): Array<PlayerModel> {
    if (this.players.length === 0) {
      const playersFromSession = this.localService.getData('players');
      if (playersFromSession) {
        this.players = JSON.parse(playersFromSession);
      }
    }
    return this.players;
  }

  public getPlayerCardListValues(player: PlayerModel): string[] {
    return player.cards.map((card) => card.value).filter((value) => value !== null) as string[];
  }

  /**
   * Total de gorgees d'un joueur sur TOUTE la partie (phase 1 + phase 2).
   *
   * POURQUOI on cumule au lieu de n'afficher que la phase courante : la branche
   * phase 2 retranchait auparavant `phase1Drunk` (snapshot pris au changement de
   * phase), ce qui remettait visuellement le compteur du joueur a zero entre la
   * phase 1 et la phase 2. C'etait un choix delibere que l'on inverse ici, pour
   * trois raisons :
   *  - le besoin produit est un compteur qui monte tout au long d'une session ;
   *  - le recap de fin de partie (game-summary.component.ts) additionne deja
   *    `drunk` + `given` sans rien retrancher : la soustraction rendait le
   *    compteur en jeu incoherent avec le recap final ;
   *  - `phase1Drunk` n'est pas persiste dans KetalSession (cf.
   *    mapKetalPlayerToPlayerModel), donc en mode room les appareils resynchro-
   *    nises affichaient deja le cumul : la soustraction donnait des totaux
   *    differents d'un appareil a l'autre.
   * Ne pas la reintroduire ici.
   *
   * Ce que ce tirage vient d'ajouter (le « delta ») n'est PAS calcule ici : il
   * vit dans GameService.lastTurnSips / lastTurnGiven, qui alimentent les badges
   * par tirage et sont remis a zero a chaque nouvelle carte.
   *
   * @param absolute true = volume total (bues + donnees, toujours positif) ;
   *   false = solde signe (negatif = boit, positif = donne).
   */
  getSipCnt(game: Game, player: PlayerModel, absolute: boolean = false) {
    const { phase } = game;
    const maybeAbs = absolute ? Math.abs : (v: number) => v;

    if (phase === 1) {
      // Accumulate sips across all cards dealt so far
      let totalSips = 0;
      for (const card of player.cards) {
        totalSips -= card.sips ?? 0;
      }
      return maybeAbs(totalSips);
    }

    // Phase 2 : `drunk` est deja le cumul depuis le debut de la partie, on le
    // prend tel quel (aucune soustraction de `phase1Drunk`).
    const drunk = player.sips?.['drunk'] ?? 0;
    const given = player.sips?.['given'] ?? 0;

    if (absolute) {
      return drunk + given;
    }

    // Signed: negative = drink, positive = give
    return given - drunk;
  }

  getTotalGivenSips(player: PlayerModel): number {
    let totalGivenSips = 0;

    player.cards
      .filter((card: CardType) => card.givenSips !== 0)
      .forEach((card: CardType) => {
        if (card.givenSips && card.givenSips > 0) {
          totalGivenSips += card.givenSips;
        }
      });
    return totalGivenSips;
  }

  getPlayerChoice(player: PlayerModel, choice: string): string {
    return player.choice[choice];
  }
}
