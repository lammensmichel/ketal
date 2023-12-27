import {v4 as uuidv4} from 'uuid';
import {CardType} from '../_models/card-type.model';
import {PlayerChoice, PlayerModel} from '../_models/player.model';
import {LocalService} from "../../services/local/local.service";
import {Injectable} from "@angular/core";
import {CardService} from "../../services/card/card.service";
import {GameService} from "../../services/game/game.service";

function getRandomRgbColor() {
  const num = Math.round(0xffffff * Math.random());
  return ('000000' + num.toString(16)).slice(-6);
}

@Injectable()
export class PlayerHelperService {
  public players: PlayerModel[] = [];

  constructor(public localService: LocalService,
              public cardSrv: CardService,
              public gameSrv: GameService) {
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
    this.savePlayerToStorage(this.players);
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
    if (this.getPlayers()) {
      return this.getPlayers().length;
    } else {
      return 0;
    }
  }

  public isMaxPlayerNumberNotReached(): boolean {
    return this.getPlayerNumber() < 23;
  }


  public resetPlayers() {
    const players: PlayerModel[] = this.gameSrv.game.players;
    players.forEach((player: PlayerModel) => {
      player.sips = {
        drunk: 0,
        given: 0
      };
      player.cards = [];
      player.choice = {
        color: '',
        plus_or_minus: '',
        in_out: '',
        suit: ''
      };
    });

    this.savePlayerToStorage(players);
  }

  public getPlayers(): Array<PlayerModel> {
    let playerList: Array<PlayerModel> = [];
    if (this.players.length === 0) {
      let playersFromSession = this.localService.getData('players');
      playerList = playersFromSession ? JSON.parse(this.localService.getData('players') as string) : [];
    } else {
      playerList = this.players;
    }
    return playerList;
  }

  public addPlayerSip(player: PlayerModel, sipNbr: number, drink: boolean = true) {
    // check if player has less than 4 cards
    const currPlayer: PlayerModel | undefined = this.gameSrv.game.players.find((playerSelected: PlayerModel) => playerSelected.id === player.id);


    if (!currPlayer?.cards || currPlayer?.cards?.length < 4) {
      if (currPlayer && sipNbr) {
        currPlayer.sips['drunk'] += sipNbr;
      }
    } else {
      currPlayer.sips[drink ? 'drunk' : 'given'] += sipNbr;
    }

    this.gameSrv.refreshSession();

  }


  getSipCnt(player: PlayerModel, absolute: boolean = false) {
    const {activePlayer, drinkingCards, givingCards, phase, players} = this.gameSrv.game;
    const currentIndex = players.findIndex(player => player.id === activePlayer?.id);
    const previousPlayer = currentIndex === 0 ? players[players.length - 1] : players[currentIndex - 1];
    const maybeAbs = absolute ? Math.abs : (v: number) => v;
    if (phase === 1) {
      // Should be 0 for player who is not the previous player
      if (player.id !== previousPlayer.id) {
        return 0;
      }
      return maybeAbs(-(player.cards.at(-1)?.sips ?? 0));
    } else {
      if (player.id === previousPlayer.id && drinkingCards.length === 0 && givingCards.length === 0) {
        return maybeAbs(-(player.cards.at(-1)?.sips ?? 0));
      }
    }

    let cntNbSips = 0;
    const isOdd = (drinkingCards.length + givingCards.length) % 2 === 1;
    for (const card of player.cards) {
      const playerCardValue = this.cardSrv.getCardValue(card);
      const lastCardValue = isOdd ? this.cardSrv.getCardValue(drinkingCards.at(-1)!) : this.cardSrv.getCardValue(givingCards.at(-1)!);
      if (playerCardValue === lastCardValue) {
        cntNbSips += drinkingCards.length * (isOdd ? -1 : 1);
      }
    }

    return maybeAbs(cntNbSips);
  }

  getTotalGivenSips(player: PlayerModel): number {
    let totalGivenSips = 0;

    player.cards.filter((card: CardType) => card.givenSips !== 0).forEach((card: CardType) => {
      if (card.givenSips && card.givenSips > 0) {
        totalGivenSips += card.givenSips;
      }
    });
    return totalGivenSips;
  }
}
