import { CardType } from "src/models/card-type.model";
import { PlayerModel } from "src/models/player.model";


export class PlayerHelperService {
  public players: PlayerModel[] = [];

  public addPlayer(player: string): void {
    const playerModel = new PlayerModel;
    playerModel.name = player;
    playerModel.cards = new Array<CardType>;

    this.players.push(playerModel);
  }
}
