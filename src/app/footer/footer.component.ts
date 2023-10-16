import {Component, EventEmitter, HostListener, OnDestroy, OnInit, Output} from '@angular/core';
import {Game} from "../../models/game.model";
import {LocalService} from "../services/local/local.service";
import {Subscription} from "rxjs";
import {GameService} from "../services/game/game.service";
import {CardDeckHelperService} from "../../helpers/card-deck.helper";
import {CardType} from "../../models/card-type.model";
import {PlayerModel} from "../../models/player.model";
import {PlayerHelperService} from "../../helpers/player.helper";
import {CardService} from "../services/card/card.service";

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  game: Game | undefined;

  gameSubs: Subscription | undefined;
  public currentCard: CardType | undefined ;

  public drinkingCards: Array<CardType> = [];
  public givingCards: Array<CardType> = [];
  public activeTurn: number | undefined;

  // @Output() public goToPhaseTwo: EventEmitter<void> = new EventEmitter<void>();


  constructor(public localSrv: LocalService,
              public gameSrv: GameService,
              public cardDeckHelperService: CardDeckHelperService,
              public playerHelper: PlayerHelperService,
              public cardSrv: CardService) {

  }


  // getActionName() {
  //     if (this.game?.phase === 1) {
  //         console.log(this.activePlayer)
  //         switch (this.game.turn) {
  //             case 0:
  //                 this.question = 'Rouge ou noir';
  //                 break;
  //             case 1:
  //                 this.question = ' + ou -';
  //                 break;
  //             case 2 :
  //                 this.question = ' In  - out';
  //
  //                 break;
  //             case 3:
  //                 this.question = ' coeur carreau pic trefle';
  //                 break
  //         }
  //     } else {
  //         if (this.gameSrv.game) {
  //             switch (true) {
  //                 case this.gameSrv.game.turn % 2 === 1 :
  //                     this.question = ' Tu bois' + (this.gameSrv.game.turn - (4 * this.gameSrv.game.players.length));
  //                     break;
  //                 case this.gameSrv.game.turn % 2 !== 1 :
  //                     this.question = ' Tu donnes' + (this.gameSrv.game.turn - (4 * this.gameSrv.game.players.length));
  //                     break;
  //             }
  //         }
  //     }
  //     return this.question;
  // }

  // getAction() {
  //     switch (this.game?.phase) {
  //         case 1:
  //         // this.currentCard = this.cardDeckHelperService.getRandomCard();
  //         //
  //         //
  //         // // const playerTurn = this.gameSrv.game.
  //         //
  //         //
  //         // this.gameSrv.addCardToPlayer(this.currentCard, this.gameSrv.game.players[this.playerTurn])
  //         //
  //         //
  //         // // this.playerTurn++;
  //         //
  //         // this.gameSrv.addTurn();
  //         //
  //         // if (this.playerTurn === this.gameSrv.game.players.length) {
  //         //     this.playerTurn = 0;
  //         // }
  //         // if (this.gameSrv.game.turn === this.gameSrv.game.maxTurnCount) {
  //         //     this.game.phase = 2
  //         //     this.gameSrv.game = this.game;
  //         // }
  //         //
  //         // this.gameSrv.game = this.game;
  //         // break;
  //         case 2:
  //             let card = this.cardDeckHelperService.getRandomCard();
  //             card.Sips = this.cptNumSips;
  //
  //             this.gameSrv.game.players.forEach((players) => {
  //                 return players.cards.forEach((cards) => {
  //                     cards.SipsSelected = cards.value === card.value;
  //                     return cards;
  //                 });
  //             });
  //
  //             if (this.numSips % 2 == 0) {
  //                 this.takedrink.push(card);
  //                 this.cptNumSips++;
  //             } else {
  //                 this.youdrink.push(card);
  //             }
  //             this.numSips++;
  //             break;
  //     }
  // }

  getLowerCardVal(firstVal: number, secondVal: number): number {
    return firstVal > secondVal ? secondVal : firstVal;
  }

  getUpperCardVal(firstVal: number, secondVal: number): number {
    return firstVal > secondVal ? firstVal : secondVal;
  }

  gotSwallowNumber(currentCard: CardType, playerId: string) {
    const currentPlayer = this.gameSrv.game.players.find((player: PlayerModel) => player.id === playerId);
    let previousCard: CardType | undefined,
      previousCardValue = 0,
      newValue = 0,
      firstCard: CardType | undefined,
      secondCard: CardType | undefined;

    if (currentPlayer) {
      switch (this.gameSrv.game.turn) {
        case 1 :
          if ((currentPlayer?.choice.color === 'red' && currentCard.suit !== "diams" && currentCard.suit !== "hearths") ||
            (currentPlayer?.choice.color === 'black' && currentCard.suit !== "spades" && currentCard.suit !== "clubs")) {
            currentCard.swallow = 1;
          } else {
            currentCard.swallow = 0;
          }
          break;
        case 2 :

          previousCard = currentPlayer.cards[currentPlayer?.cards.length - 1];
          previousCardValue = this.cardSrv.getCardValue(previousCard);
          newValue = this.cardSrv.getCardValue(currentCard);

          switch (true) {
            case previousCardValue === newValue:
              currentCard.swallow = 4;
              break;
            case (currentPlayer?.choice.plus_or_minus === 'plus' && previousCardValue > newValue) || (currentPlayer?.choice.plus_or_minus === 'minus' && previousCardValue < newValue) :
              currentCard.swallow = 2;
              break;
            default:
              currentCard.swallow = 0;
          }
          break;
        case 3 :
          firstCard = currentPlayer.cards[0];
          secondCard = currentPlayer.cards[1];
          previousCardValue = this.cardSrv.getCardValue(secondCard);
          let firstCardValue = this.cardSrv.getCardValue(firstCard);
          let secondCardValue = this.cardSrv.getCardValue(secondCard);
          newValue = this.cardSrv.getCardValue(currentCard);
          switch (true) {
            case newValue === previousCardValue:
              currentCard.swallow = 6;
              break;
            case currentPlayer?.choice.in_out === 'in' && (newValue < this.getLowerCardVal(firstCardValue, secondCardValue) || newValue > this.getUpperCardVal(firstCardValue, secondCardValue)):
              currentCard.swallow = 3;
              break;
            case currentPlayer?.choice.in_out === 'out' && (newValue > this.getLowerCardVal(firstCardValue, secondCardValue) || newValue < this.getUpperCardVal(firstCardValue, secondCardValue)):
              currentCard.swallow = 3;
              break;
            default:
              currentCard.swallow = 0;
          }

          break;
        case 4 :
          switch (true) {
            case currentPlayer?.choice.suit !== currentCard.suit :
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

      // this.gameSrv.game = this.game;


      let existsUndefinedValue: boolean = false;
      this.gameSrv.game.players.forEach((player) => {
        switch (this.gameSrv.game.turn) {
          case 1:
            if (player.choice.color === undefined) {
              existsUndefinedValue = true;
            }
            break;
          case 2:
            if (player.choice.plus_or_minus === undefined) {
              existsUndefinedValue = true;
            }
            break;
          case 3:
            if (player.choice.in_out === undefined) {
              existsUndefinedValue = true;
            }
            break;
          case 4:
            if (player.choice.suit === undefined) {
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

        // this.gameSrv.game = this.game;
        this.gameSrv.refreshSession();

      }
    }
  }


  chooseColor(color: string) {

    if (this.gameSrv.game && this.gameSrv.game.activePlayer) {
      this.gameSrv.setCardChoice('color', color, this.gameSrv.game.activePlayer.id)
      this.pickCard();
    }
  }


  plusOrMinus(selection: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer && this.game) {
      this.gameSrv.setCardChoice('plus_or_minus', selection, this.gameSrv.game.activePlayer.id)
      this.pickCard();
    }
  }

  inOut(selection: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer && this.game) {
      this.gameSrv.setCardChoice('in_out', selection, this.gameSrv.game.activePlayer.id)
      this.pickCard();
    }
  }

  chooseSuit(selection: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer && this.game) {
      this.gameSrv.setCardChoice('suit', selection, this.gameSrv.game.activePlayer.id)
      this.pickCard();
    }
  }

  restartGame() {
    this.gameSrv.gameFinished();
    this.gameSrv.resetGame();
    location.reload();
  }


  onDisplayCard() {
    if (this.game) {
      if (this.game.givingCards.length === 6) return;
      this.currentCard = this.cardDeckHelperService.getRandomCard();

      this.gameSrv.game.players.forEach((players) => {
        return players.cards.forEach((cards) => {
          cards.selected = cards.value === this.currentCard?.value;
          return cards;
        });
      });


      if(this.currentCard) {
        switch (true) {
          case this.gameSrv.game.drinkingCards.length === 0 && this.gameSrv.game.givingCards.length === 0:
            // this.drinkingCards.push(this.currentCard);
            this.currentCard.swallow = 1;
            this.gameSrv.addDrinkingCard(<CardType>this.currentCard)
            break;

          case this.gameSrv.game.drinkingCards.length > 0 && this.gameSrv.game.givingCards.length === 0:
            // this.givingCards.push(this.currentCard);
            this.currentCard.swallow = 1;
            this.gameSrv.addGivingCard(<CardType>this.currentCard);
            break;
          case this.gameSrv.game.drinkingCards.length !== 0 && this.gameSrv.game.givingCards.length !== 0
          && this.gameSrv.game.drinkingCards.length === this.gameSrv.game.givingCards.length :
            // this.drinkingCards.push(this.currentCard);

            if ("swallow" in this.currentCard) {
              this.currentCard.swallow = this.gameSrv.game.drinkingCards.length + 1;
            }
            this.gameSrv.addDrinkingCard(<CardType>this.currentCard)
            break;
          case this.gameSrv.game.drinkingCards.length !== 0 && this.gameSrv.game.givingCards.length !== 0
          && this.gameSrv.game.drinkingCards.length > this.gameSrv.game.givingCards.length :
            // this.givingCards.push(this.currentCard);
            this.gameSrv.game.givingCards.length + 1
            this.gameSrv.addGivingCard(<CardType>this.currentCard);
        }
      }
      this.gameSrv.game = this.game;
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
        maxTurnCount: players.length * 4 ,
        inProgress: false,
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
