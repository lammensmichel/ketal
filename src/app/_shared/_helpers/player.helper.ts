import { v4 as uuidv4 } from 'uuid';
import { CardType } from '../_models/card-type.model';
import { PlayerChoice, PlayerModel } from '../_models/player.model';
import { LocalService } from '../../services/local/local.service';
import { inject, Injectable } from '@angular/core';
import { CardService } from '../../services/card/card.service';
import { Game } from '../_models/game.model';

@Injectable({ providedIn: 'root' })
export class PlayerHelperService {
  public localService = inject(LocalService);
  public cardSrv = inject(CardService);

  public players: PlayerModel[] = [];

  public addPlayer(player: string): void {
    const playerModel = new PlayerModel();
    playerModel.name = player;
    playerModel.id = uuidv4();
    playerModel.cards = new Array<CardType>();
    playerModel.choice = {
      color: '',
      plus_or_minus: '',
      in_out: '',
      suit: '',
    } as PlayerChoice;

    playerModel.avatarSrc = `https://api.dicebear.com/7.x/avataaars/svg?seed=${playerModel.id}`;
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

    // Phase 2: use accumulated sips stored in player.sips (Phase 2 only)
    const totalDrunk = player.sips?.['drunk'] ?? 0;
    const phase1Drunk = player.sips?.['phase1Drunk'] ?? 0;
    const drunk = totalDrunk - phase1Drunk;
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
