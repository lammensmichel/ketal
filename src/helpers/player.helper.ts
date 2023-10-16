import {CardType} from "src/models/card-type.model";
import {PlayerChoice, PlayerModel} from "src/models/player.model";
import {v4 as uuidv4} from 'uuid';

function getRandomRgbColor() {
    const num = Math.round(0xffffff * Math.random());
    return ('000000' + num.toString(16)).slice(-6);
}

export class PlayerHelperService {
    public players: PlayerModel[] = [];

    public addPlayer(player: string): void {
        const playerModel = new PlayerModel;
        playerModel.name = player;
        playerModel.id = uuidv4();
        playerModel.cards = new Array<CardType>;
        playerModel.choice = {
            color: undefined,
            plus_or_minus: undefined,
            in_out: undefined,
            suit: undefined
        } as PlayerChoice;

        const rgbColor = getRandomRgbColor();
        // generate a random avatar id from 1 to 45
        const avatarId = Math.floor(Math.random() * 45) + 1;
        playerModel.avatarSrc = `https://placeskull.com/32/32/${rgbColor}/${avatarId}`;
        this.players.push(playerModel);
    }
}
