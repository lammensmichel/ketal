import { CardType } from "./card-type.model";

export class PlayerModel {
  public name: string = '';

  public cards: Array<CardType> = [];
  public avatarSrc: string = '';

  public constructor(init?: Partial<PlayerModel>) {
    Object.bind(this, init);
  }
}
