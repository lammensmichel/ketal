import {PlayerModel} from "./player.model";
import {CardType} from "./card-type.model";

export interface Game {
    players: PlayerModel[] ;
    turn: number;
    maxTurnCount: number;
    inProgress: boolean;
    phase: number;
    drinkingCards: CardType[];
    givingCards: CardType[];
    activePlayer: PlayerModel | undefined
}
