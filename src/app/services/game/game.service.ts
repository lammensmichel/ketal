import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {CardType} from 'src/app/_shared/_models/card-type.model';
import {Game} from 'src/app/_shared/_models/game.model';
import {PlayerModel} from 'src/app/_shared/_models/player.model';
import {LocalService} from "../local/local.service";

@Injectable({
  providedIn: 'root'
})
export class GameService {
  public gameSubject: BehaviorSubject<Game> | undefined;

  private _game: Game | undefined;

  constructor(public localSrv: LocalService) {
    if (!this.gameSubject) {
      const game: Game = JSON.parse(this.localSrv.getData('game') as string);
      this.gameSubject = new BehaviorSubject<Game>(game);
    }
  }

  get game(): Game {
    if (!this._game) {
      this._game = JSON.parse(this.localSrv.getData('game') as string);
    }
    return <Game>this._game;
  }

  set game(game: Game | undefined) {
    if (game) {
      this._game = game;
      this.localSrv.saveData('game', JSON.stringify(this._game));
      this.gameSubject?.next(game);
    } else {
      this.localSrv.removeData('game');
      this.gameSubject?.complete();

    }
  }

  setCardChoice(choice: string, value: string, activePlayerId: string) {
    const currentPlayer = this.game.players.find((player: PlayerModel) => player.id === activePlayerId);

    if (currentPlayer) {
      currentPlayer.choice[choice] = value;
      this.game.activePlayer = currentPlayer;
      this.refreshSession();
    }

  }

  refreshSession() {
    this.localSrv.saveData('game', JSON.stringify(this._game));
    this.gameSubject?.next(this.game);
  }

  addDrinkingCard(card: CardType) {
    this.game.drinkingCards.push(card);
  }

  addGivingCard(card: CardType) {
    this.game.givingCards.push(card);
  }

  addCardToPlayer(card: CardType, playerId: string) {
    const currentPlayer = this.game.players.find((player: PlayerModel) => player.id === playerId);
    if (currentPlayer) currentPlayer.cards.push(card);
    if (this.game && this.game.activePlayer) this.game.activePlayer = currentPlayer;
  }

  isGameFinished(): boolean {
    return this.getStatus() === 2;
  }

  addTurn() {
    this.game.turn++;
    this.game = this.game;
  }

  resetGame() {
    this.game = undefined;
  }

  getStatus(): number {
    if (!this.game) {
      return 0;
    } else {
      return this.game.status;
    }
  }
}
