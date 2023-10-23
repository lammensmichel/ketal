import { CardType } from "./card-type.model";


type UUIDv4 = string;


export interface PlayerChoice {
  [key: string]: string;
}



export class PlayerModel {
    public name: string = '';
    public id: UUIDv4 = '';
    public cards: Array<CardType> = [];
    public avatarSrc: string = '';
    public choice: PlayerChoice = {
        color: '',
        plus_or_minus: '',
        in_out: '',
        suit: ''
    };


    public constructor(init?: Partial<PlayerModel>) {
        Object.bind(this, init);
    }
}
