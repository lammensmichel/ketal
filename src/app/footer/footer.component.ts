import {Component, OnDestroy, OnInit} from '@angular/core';
import {Game} from "../../models/game.model";
import {LocalService} from "../services/local/local.service";
import {Subscription} from "rxjs";
import {GameService} from "../services/game/game.service";
import {CardDeckHelperService} from "../../helpers/card-deck.helper";
import {CardType} from "../../models/card-type.model";
import {PlayerModel} from "../../models/player.model";
import {PlayerHelperService} from "../../helpers/player.helper";
import {CardService} from "../services/card/card.service";
import { InAndOutEnum } from 'src/models/enums/in_and_out.enum';
import { DrinkChoiceEnum } from 'src/models/enums/drinnk_choice.enum';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  game: Game | undefined;

  gameSubs: Subscription | undefined;
  public currentCard: CardType | undefined;

  public drinkingCards: Array<CardType> = [];
  public givingCards: Array<CardType> = [];
  public activeTurn: number = 0;


  constructor(public localSrv: LocalService,
              public gameSrv: GameService,
              public cardDeckHelperService: CardDeckHelperService,
              public playerHelper: PlayerHelperService,
              public cardSrv: CardService) {

  }


  getLowerCardVal(firstVal: number, secondVal: number): number {
    return firstVal > secondVal ? secondVal : firstVal;
  }

  getUpperCardVal(firstVal: number, secondVal: number): number {
    return firstVal > secondVal ? firstVal : secondVal;
  }

  gotSwallowNumber(currentCard: CardType, playerId: string) {
    const currentPlayer = this.gameSrv.game.players.find((player: PlayerModel) => player.id === playerId);
    let previousCard: CardType | undefined;
    let previousCardValue: number = 0;
    let newValue: number = 0;
    let firstCard: CardType | undefined;
    let secondCard: CardType | undefined;
    let firstCardValue: number = 0;
    let secondCardValue: number = 0;
    let lowestValue: number = 0;
    let highestValue: number = 0;
    let currentPlayerChoice: string | undefined;

    if (currentPlayer) {
      switch (this.gameSrv.game.turn) {
        case 1 :
          if ((currentPlayer?.choice['color'] === 'red' && currentCard.suit !== "diams" && currentCard.suit !== "hearths") ||
            (currentPlayer?.choice['color'] === 'black' && currentCard.suit !== "spades" && currentCard.suit !== "clubs")) {
            currentCard.swallow = 1;
          } else {
            currentCard.swallow = 0;
          }
          break;
        case 2 :
          previousCard = currentPlayer.cards[currentPlayer?.cards.length - 1];
          previousCardValue = this.cardSrv.getCardValue(previousCard);
          newValue = this.cardSrv.getCardValue(currentCard);

          if (previousCardValue === newValue) {
            currentCard.swallow = 4;
          } else if ((currentPlayer?.choice['plus_or_minus'] === 'plus' && previousCardValue > newValue) ||
            (currentPlayer?.choice['plus_or_minus'] === 'minus' && previousCardValue < newValue)) {
            currentCard.swallow = 2;
          } else {
            currentCard.swallow = 0;
          }
          break;
        case 3 :
          firstCard = currentPlayer.cards[0];
          secondCard = currentPlayer.cards[1];

          firstCardValue = this.cardSrv.getCardValue(firstCard);
          secondCardValue = this.cardSrv.getCardValue(secondCard);
          lowestValue = this.getLowerCardVal(firstCardValue, secondCardValue);
          highestValue = this.getUpperCardVal(firstCardValue, secondCardValue);
          newValue = this.cardSrv.getCardValue(currentCard);
          currentPlayerChoice = currentPlayer?.choice[DrinkChoiceEnum.InAndOut];

          if (newValue === lowestValue || newValue === highestValue) {
            currentCard.swallow = 6;
          } else if (currentPlayerChoice === InAndOutEnum.In) {
            if (newValue > lowestValue && newValue < highestValue) {
              currentCard.swallow = 0;
            } else {
              currentCard.swallow = 3;
            }
          } else if (currentPlayerChoice === InAndOutEnum.Out) {
            if (newValue < lowestValue || newValue > highestValue) {
              currentCard.swallow = 0;
            } else {
              currentCard.swallow = 3;
            }
          }

          break;
        case 4 :
          switch (true) {
            case currentPlayer?.choice[DrinkChoiceEnum.Suit] !== currentCard.suit :
              currentCard.swallow = 4;
              break;
            default:
              currentCard.swallow = 0;
          }

          break;
      }
    }
  }

  pickCard() {
    if (this.game && this.game.activePlayer) {
      this.currentCard = this.cardDeckHelperService.getRandomCard();
      this.gotSwallowNumber(this.currentCard, this.game.activePlayer.id);

      this.gameSrv.addCardToPlayer(this.currentCard, this.game.activePlayer.id);

      this.gameSrv.refreshSession();


      const currentIndex = this.game.players.findIndex(player => player.id === this.game?.activePlayer?.id);

      if (currentIndex === -1 || currentIndex === this.game.players.length - 1) {
        this.gameSrv.game.activePlayer = undefined;
      } else {
        this.gameSrv.game.activePlayer = this.game.players[currentIndex + 1];
      }

      this.gameSrv.refreshSession();

      let existsUndefinedValue: boolean = false;
      this.gameSrv.game.players.forEach((player) => {
        switch (this.gameSrv.game.turn) {
          case 1:
            if (player.choice[DrinkChoiceEnum.Color] === undefined) {
              existsUndefinedValue = true;
            }
            break;
          case 2:
            if (player.choice[DrinkChoiceEnum.PlusOrMinus] === undefined) {
              existsUndefinedValue = true;
            }
            break;
          case 3:
            if (player.choice[DrinkChoiceEnum.InAndOut] === undefined) {
              existsUndefinedValue = true;
            }
            break;
          case 4:
            if (player.choice[DrinkChoiceEnum.Suit] === undefined) {
              existsUndefinedValue = true;
            }
            break;
        }
      })
      if (!existsUndefinedValue) {
        this.gameSrv.addTurn();

        if (this.gameSrv.game.turn > 4) {
          this.gameSrv.game.phase = 2;
        }

        this.gameSrv.refreshSession();

      }
    }
  }


  chooseColor(color: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer) {
      this.gameSrv.setCardChoice(DrinkChoiceEnum.Color, color, this.gameSrv.game.activePlayer.id)
      this.pickCard();
    }
  }


  plusOrMinus(selection: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer && this.game) {
      this.gameSrv.setCardChoice(DrinkChoiceEnum.PlusOrMinus, selection, this.gameSrv.game.activePlayer.id)
      this.pickCard();
    }
  }

  inOut(selection: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer && this.game) {
      this.gameSrv.setCardChoice(DrinkChoiceEnum.InAndOut, selection, this.gameSrv.game.activePlayer.id)
      this.pickCard();
    }
  }

  chooseSuit(selection: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer && this.game) {
      this.gameSrv.setCardChoice(DrinkChoiceEnum.Suit, selection, this.gameSrv.game.activePlayer.id)
      this.pickCard();
    }
  }

  restartGame() {
    this.gameSrv.resetGame();
    location.reload();
  }


  onDisplayCard() {
    if (this.gameSrv.game) {
      if (this.gameSrv.game.givingCards.length === 6) return;
      this.currentCard = this.cardDeckHelperService.getRandomCard();

      this.gameSrv.game.players.forEach((players) => {
        return players.cards.forEach((cards) => {
          cards.selected = cards.value === this.currentCard?.value;
          return cards;
        });
      });

      if (this.currentCard) {
        switch (true) {
          case this.gameSrv.game.drinkingCards.length === 0 && this.gameSrv.game.givingCards.length === 0:
            this.currentCard.swallow = 1;
            this.gameSrv.addDrinkingCard(<CardType>this.currentCard)
            break;

          case this.gameSrv.game.drinkingCards.length > 0 && this.gameSrv.game.givingCards.length === 0:
            this.currentCard.swallow = 1;
            this.gameSrv.addGivingCard(<CardType>this.currentCard);
            break;
          case this.gameSrv.game.drinkingCards.length !== 0 && this.gameSrv.game.givingCards.length !== 0
          && this.gameSrv.game.drinkingCards.length === this.gameSrv.game.givingCards.length :
            this.currentCard.swallow = this.gameSrv.game.drinkingCards.length + 1;
            this.gameSrv.addDrinkingCard(<CardType>this.currentCard)
            break;
          case this.gameSrv.game.drinkingCards.length !== 0 && this.gameSrv.game.givingCards.length !== 0
          && this.gameSrv.game.drinkingCards.length > this.gameSrv.game.givingCards.length :
            this.currentCard.swallow = this.gameSrv.game.givingCards.length + 1
            this.gameSrv.addGivingCard(<CardType>this.currentCard);
        }
      }
      this.gameSrv.refreshSession();
    }
  }

  ngOnInit() {
    this.gameSrv.gameSubject?.subscribe((game) => {
      this.game = game;
      if (this.game) {
        if (!this.game.activePlayer) {
          this.game.activePlayer = this.game.players[0];
        }

        this.activeTurn = this.game.turn;
        this.drinkingCards = this.game.drinkingCards;
        this.givingCards = this.game.givingCards;
      }
    })
  }

  public hasPlayers(): boolean {
    return this.playerHelper?.players?.length > 0;
  }

  public beginGame(): void {
    this.cardDeckHelperService.construcDesck();

    if (!this.gameSrv.game) {
      const players: Array<PlayerModel> = JSON.parse(this.localSrv.getData('players') as string)
      this.gameSrv.game = {
        players: players,
        maxTurnCount: players.length * 4,
        turn: 1,
        phase: 1,
        drinkingCards: [],
        givingCards: [],
        activePlayer: players[0]
      } as Game;
    }
  }

  ngOnDestroy() {
    this.gameSubs?.unsubscribe()
  }

}
