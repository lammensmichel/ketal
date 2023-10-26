import {v4 as uuidv4} from 'uuid';
import {CardType} from '../_models/card-type.model';
import {PlayerChoice, PlayerModel} from '../_models/player.model';
import {LocalService} from "../../services/local/local.service";
import {Injectable} from "@angular/core";

function getRandomRgbColor() {
  const num = Math.round(0xffffff * Math.random());
  return ('000000' + num.toString(16)).slice(-6);
}

@Injectable()
export class PlayerHelperService {
  public players: PlayerModel[] = [];

  constructor(public localService: LocalService) {
  }

  public addPlayer(player: string): void {
    const playerModel = new PlayerModel;
    playerModel.name = player;
    playerModel.id = uuidv4();
    playerModel.cards = new Array<CardType>;
    playerModel.choice = {
      color: '',
      plus_or_minus: '',
      in_out: '',
      suit: ''
    } as PlayerChoice;

    const rgbColor = getRandomRgbColor();
    // generate a random avatar id from 1 to 45
    const avatarId = Math.floor(Math.random() * 45) + 1;
    playerModel.avatarSrc = `https://placeskull.com/32/32/${rgbColor}/${avatarId}`;
    this.players.push(playerModel);
  }


  public deletePlayer(player: PlayerModel) {
    this.players = this.players.filter(
      (playerSelected) => playerSelected.id !== player.id
    );

    this.savePlayerToStorage(this.players);
  }

  public savePlayerToStorage(players: Array<PlayerModel>) {
    this.localService.saveData(
      'players',
      JSON.stringify(players)
    );
  }

  public getPlayerNumber(): number {
    return this.getPlayers().length;
  }

  public isMaxPlayerNumberNotReached(): boolean {
    return this.getPlayerNumber() < 23;
  }

  public resetPlayerSwallowCnt() {
    this.players.forEach((player) => {
      player.swallows = {
        drunk: 0,
        given: 0
      };
    });

    this.savePlayerToStorage(this.players);
  }

  public getPlayers(): Array<PlayerModel> {
    let playerList: Array<PlayerModel>;
    if (this.players.length === 0) {
      playerList = JSON.parse(
        this.localService.getData('players') as string
      );
    } else {
      playerList = this.players;
    }
    return playerList;
  }

  public addPlayerSwallow(player: PlayerModel, swallowNbr: number, drink:boolean = true) {
    const currentPlayer: PlayerModel | undefined = this.getPlayers().find((plyr) => {
      return plyr.id === player.id;
    });

    if (currentPlayer) {
      if(drink){
        currentPlayer.swallows['drunk'] += swallowNbr
      }  else{
        currentPlayer.swallows['given'] += swallowNbr
      }
    }
    this.savePlayerToStorage(this.players);

  }
}
