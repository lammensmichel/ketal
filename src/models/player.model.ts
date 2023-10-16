import {CardType} from "./card-type.model";


type UUIDv4 = string;


export interface PlayerChoice {
    color: string | undefined,
    plus_or_minus: string | undefined,
    in_out: string | undefined,
    suit: string | undefined
}


export class PlayerModel {
    public name: string = '';
    public id: UUIDv4 = '';
    public cards: Array<CardType> = [];
    public avatarSrc: string = '';
    public choice: PlayerChoice = {
        color: undefined,
        plus_or_minus: undefined,
        in_out: undefined,
        suit: undefined
    };


    public constructor(init?: Partial<PlayerModel>) {
        Object.bind(this, init);
    }
}
