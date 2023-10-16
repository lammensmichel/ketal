import {Injectable} from '@angular/core';
import {PlayerModel} from "../../../models/player.model";
import {Game} from "../../../models/game.model";
import {LocalService} from "../local/local.service";
import {BehaviorSubject} from "rxjs";
import {CardType} from "../../../models/card-type.model";

@Injectable({
    providedIn: 'root'
})
export class GameService {


    gameSubject: BehaviorSubject<Game> | undefined;


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
            // if (!game.players) {
            //     game.players = JSON.parse(this.localSrv.getData('players') as string);
            // }
            this._game = game;
            this.localSrv.saveData('game', JSON.stringify(this._game))
            this.gameSubject?.next(game);
        } else {
            this.localSrv.removeData('game')
            this.gameSubject?.complete();

        }
    }

    setCardChoice(choice: string, value: string, activePlayerId: string) {
        const currentPlayer = this.game.players.find((player: PlayerModel) => player.id === activePlayerId)

        if(currentPlayer) {
            switch (choice) {
                case 'color':
                    currentPlayer.choice.color = value;
                    break;
                case 'plus_or_minus':
                    currentPlayer.choice.plus_or_minus = value;
                    break;
                case 'in_out':
                    currentPlayer.choice.in_out = value;
                    break;
                case 'suit':
                    currentPlayer.choice.suit = value;
                    break;
            }

            this.game.activePlayer = currentPlayer;
        }

    }



    refreshSession() {
        this.localSrv.saveData('game', JSON.stringify(this._game))
        this.gameSubject?.next(this.game);
    }

    addDrinkingCard(card: CardType) {
        this.game.drinkingCards.push(card);
    }

    addGivingCard(card: CardType) {
        this.game.givingCards.push(card);
    }

    addCardToPlayer(card: CardType, playerId: string) {
        const currentPlayer = this.game.players.find((player: PlayerModel) => player.id === playerId)
        if (currentPlayer) currentPlayer.cards.push(card);
        if (this.game && this.game.activePlayer) this.game.activePlayer = currentPlayer;
    }

    addTurn() {
        this.game.turn++;
        this.game = this.game;

    }

    gameStarted() {
        if (this._game) {
            this._game.inProgress = true;
        }
    }

    gameFinished() {
        if (this._game) {
            this._game.inProgress = false;
        }
    }

    resetGame() {
        this.game = undefined;
    }

    private _game: Game | undefined;



    // get maxTurnCount(): number {
    //     return this._maxTurnCount;
    // }
    //
    // set maxTurnCount(value: number) {
    //     this._maxTurnCount = value;
    // }
    //

    // private _maxTurnCount: number = 0;
    private _turnCount: number = 0;


}
