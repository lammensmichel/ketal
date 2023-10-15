import { CardType } from "src/models/card-type.model";
import { PlayerModel } from "src/models/player.model";

function getRandomRgbColor() {
  const num = Math.round(0xffffff * Math.random());
  return ('000000' + num.toString(16)).slice(-6);
}

export class PlayerHelperService {
  public players: PlayerModel[] = [];

  public addPlayer(player: string): void {
    const playerModel = new PlayerModel;
    playerModel.name = player;
    playerModel.cards = new Array<CardType>;
    const rgbColor = getRandomRgbColor();
    // generate a random avatar id from 1 to 45
    const avatarId = Math.floor(Math.random() * 45) + 1;
    playerModel.avatarSrc = `https://placeskull.com/32/32/${rgbColor}/${avatarId}`;
    this.players.push(playerModel);
  }
}
