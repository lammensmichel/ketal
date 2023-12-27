import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild
} from '@angular/core';
import {Subscription} from "rxjs";
import {String} from 'typescript-string-operations';
import {CardService} from "../../../services/card/card.service";
import {GameService} from "../../../services/game/game.service";
import {LocalService} from "../../../services/local/local.service";
import {CardDeckHelperService} from "../../_helpers/card-deck.helper";
import {PlayerHelperService} from "../../_helpers/player.helper";
import {CardType} from '../../_models/card-type.model';
import {ColorsEnum} from '../../_models/enums/color.enum';
import {DrinkChoiceEnum} from '../../_models/enums/drink_choice.enum';
import {InAndOutEnum} from '../../_models/enums/in_out.enum';
import {PlusOrMinusEnum} from '../../_models/enums/plus_minus.enum';
import {SuitsEnum} from '../../_models/enums/suits.enum';
import {Game} from '../../_models/game.model';
import {PlayerModel} from '../../_models/player.model';
import {ToastComponent} from "../toast/toast.component";


@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  @Input() public withSummaryMode: boolean = false;
  @ViewChild('notAllSipsGiven') toastComponent: ToastComponent | undefined;

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
              public cardSrv: CardService,
              private cdr: ChangeDetectorRef,
              private ngZone: NgZone
  ) {

  }

  ngOnInit() {
    this.gameSubs = this.gameSrv.gameSubject?.subscribe((game) => {
      this.game = game;
      if (this.game) {
        if (!this.game.activePlayer) {
          this.game.activePlayer = this.game.players[0];
        }

        this.activeTurn = this.game.turn;
        this.drinkingCards = this.game.drinkingCards;
        this.givingCards = this.game.givingCards;
      }
    });
  }


  getLowerCardVal(firstVal: number, secondVal: number): number {
    return firstVal > secondVal ? secondVal : firstVal;
  }

  getUpperCardVal(firstVal: number, secondVal: number): number {
    return firstVal > secondVal ? firstVal : secondVal;
  }

  gotSipsNumber(currentCard: CardType, playerId: string) {
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
          if ((currentPlayer?.choice[DrinkChoiceEnum.Color] === ColorsEnum.Red && currentCard.suit !== SuitsEnum.Diams && currentCard.suit !== SuitsEnum.Hearts) ||
            (currentPlayer?.choice[DrinkChoiceEnum.Color] === ColorsEnum.Black && currentCard.suit !== SuitsEnum.Spades && currentCard.suit !== SuitsEnum.Clubs)) {
            currentCard.sips = 1;
          } else {
            currentCard.sips = 0;
          }
          break;
        case 2 :
          previousCard = currentPlayer.cards[currentPlayer?.cards.length - 1];
          previousCardValue = this.cardSrv.getCardValue(previousCard);
          newValue = this.cardSrv.getCardValue(currentCard);

          if (previousCardValue === newValue) {
            currentCard.sips = 4;
          } else if ((currentPlayer?.choice[DrinkChoiceEnum.PlusOrMinus] === PlusOrMinusEnum.Plus && previousCardValue > newValue) ||
            (currentPlayer?.choice[DrinkChoiceEnum.PlusOrMinus] === PlusOrMinusEnum.Minus && previousCardValue < newValue)) {
            currentCard.sips = 2;
          } else {
            currentCard.sips = 0;
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
            currentCard.sips = 6;
          } else if (currentPlayerChoice === InAndOutEnum.In) {
            if (newValue > lowestValue && newValue < highestValue) {
              currentCard.sips = 0;
            } else {
              currentCard.sips = 3;
            }
          } else if (currentPlayerChoice === InAndOutEnum.Out) {
            if (newValue < lowestValue || newValue > highestValue) {
              currentCard.sips = 0;
            } else {
              currentCard.sips = 3;
            }
          }

          break;
        case 4 :
          switch (true) {
            case currentPlayer?.choice[DrinkChoiceEnum.Suit] !== currentCard.suit :
              currentCard.sips = 4;
              break;
            default:
              currentCard.sips = 0;
          }

          break;
      }
      this.playerHelper.addPlayerSip(currentPlayer, currentCard.sips);
    }
  }

  pickCard() {
    if (this.game && this.game.activePlayer) {
      this.currentCard = this.cardDeckHelperService.getRandomCard();
      this.gotSipsNumber(this.currentCard, this.game.activePlayer.id);
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
            if (String.isNullOrWhiteSpace(player.choice[DrinkChoiceEnum.Color])) {
              existsUndefinedValue = true;
            }
            break;
          case 2:
            if (String.isNullOrWhiteSpace(player.choice[DrinkChoiceEnum.PlusOrMinus])) {
              existsUndefinedValue = true;
            }
            break;
          case 3:
            if (String.isNullOrWhiteSpace(player.choice[DrinkChoiceEnum.InAndOut])) {
              existsUndefinedValue = true;
            }
            break;
          case 4:
            if (String.isNullOrWhiteSpace(player.choice[DrinkChoiceEnum.Suit])) {
              existsUndefinedValue = true;
            }
            break;
        }
      });
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
      this.gameSrv.setCardChoice(DrinkChoiceEnum.Color, color, this.gameSrv.game.activePlayer.id);
      this.pickCard();
    }
  }


  plusOrMinus(selection: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer && this.game) {
      this.gameSrv.setCardChoice(DrinkChoiceEnum.PlusOrMinus, selection, this.gameSrv.game.activePlayer.id);
      this.pickCard();
    }
  }

  inOut(selection: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer && this.game) {
      this.gameSrv.setCardChoice(DrinkChoiceEnum.InAndOut, selection, this.gameSrv.game.activePlayer.id);
      this.pickCard();
    }
  }

  chooseSuit(selection: string) {
    if (this.gameSrv.game && this.gameSrv.game.activePlayer && this.game) {
      this.gameSrv.setCardChoice(DrinkChoiceEnum.Suit, selection, this.gameSrv.game.activePlayer.id);
      this.pickCard();
    }
  }


  restartGame() {

    // Check if all given sips are given if summary mode is activated
    // If not, display a toast and return
    if (this.isNotAllSipsGiven()) {
      return;
    }

    this.gameSrv.resetGame();
    this.playerHelper.resetPlayers();
    this.gameSrv.game.status = 0;
  }

  displaySummary(): void {
    // Check if all given sips are given if summary mode is activated
    // If not, display a toast and return
    if (this.isNotAllSipsGiven()) {
      return;
    }

    this.gameSrv.setStatus(3);
  }


  addSips(sipNb: number) {
    this.gameSrv.game.players.forEach((player: PlayerModel) => {
      let sipTurnNb = 0;
      player.cards.forEach((card) => {
        if (card.value === this.currentCard?.value) {
          sipTurnNb += sipNb;
        }
      });
      if (this.currentCard) this.playerHelper.addPlayerSip(player, sipTurnNb, !this.isGivingCard());
    });

  }

  saveCardAndSips(sipNb: number) {
    if (this.currentCard) {
      this.addSips(sipNb);
      this.gameSrv[this.isGivingCard() ? 'addGivingCard' : 'addDrinkingCard'](this.currentCard);
    }
  }

  isGivingCard(): boolean {
    return !!this.currentCard && this.gameSrv.game.drinkingCards.length > this.gameSrv.game.givingCards.length;
  }

  getSipsNumber(): number {
    let sipNb: number = 0;

    if (this.currentCard) {
      switch (true) {
        case this.gameSrv.game.drinkingCards.length === 0 && this.gameSrv.game.givingCards.length === 0:
          sipNb = 1;
          break;
        case this.gameSrv.game.drinkingCards.length > 0 && this.gameSrv.game.givingCards.length === 0:
          sipNb = 1;
          break;
        case this.gameSrv.game.drinkingCards.length !== 0 && this.gameSrv.game.givingCards.length !== 0
        && this.gameSrv.game.drinkingCards.length === this.gameSrv.game.givingCards.length :
          sipNb = this.gameSrv.game.drinkingCards.length + 1;
          break;
        case this.gameSrv.game.drinkingCards.length !== 0 && this.gameSrv.game.givingCards.length !== 0
        && this.gameSrv.game.drinkingCards.length > this.gameSrv.game.givingCards.length :
          sipNb = this.gameSrv.game.givingCards.length + 1;
      }
    }
    return sipNb;
  }


  isNotAllSipsGiven(): boolean {
    let returnVal: boolean = false;
    if (this.gameSrv.isSummaryActivated() && this.gameSrv.game.drinkingCards.length > 0) {
      let remainingSipsToGive: number = 0;
      this.gameSrv.game.players.forEach((players) => {
        players.cards.forEach((cards) => {
          if (cards.givenSips) {
            remainingSipsToGive += cards.givenSips;
          }
        });
      });

      if (remainingSipsToGive > 0) {
        returnVal = true;
        if (this.toastComponent) {
          this.toastComponent.show();
        }
      }
    }
    return returnVal;

  }

  selectCardOnPlayer(sipNb: number) {
    this.gameSrv.game.players.forEach((players) => {
      players.cards.forEach((cards) => {
        cards.selected = cards.value === this.currentCard?.value;
        if (cards.selected && this.gameSrv.isSummaryActivated() && this.isGivingCard() && sipNb > 0) {

          // this.cardSrv.addGivenSips(player, cards, sipNb);

          cards.givenSips = sipNb;
        }

      });
    });
  }

  onDisplayCard() {
    if (this.gameSrv.game) {
      if (this.gameSrv.game.givingCards.length === 6) return;
      this.gameSrv.game.givingCards.forEach((card) => (card.selected = false));
      this.gameSrv.game.drinkingCards.forEach((card) => (card.selected = false));
      let sipNb: number = 0;

      // Check if all given sips are given if summary mode is activated
      // If not, display a toast and return
      if (this.isNotAllSipsGiven() && this.gameSrv.game.drinkingCards.length > 0) {
        return;
      }

      // Get new card
      this.currentCard = this.cardDeckHelperService.getRandomCard();
      this.currentCard.selected = true;

      // get sips number
      sipNb = this.getSipsNumber();


      // Select Card on each player
      this.selectCardOnPlayer(sipNb);

      this.currentCard.sips = sipNb;
      this.saveCardAndSips(sipNb);

      // Finish game if 6 cards are given
      if (this.gameSrv.game.givingCards.length === 6) {
        this.gameSrv.setStatus(2);
      }

      this.gameSrv.refreshSession();
    }
  }

  public hasPlayers(): boolean {
    return this.playerHelper?.players?.length > 0;
  }

  public beginGame(): void {
    this.cardDeckHelperService.constructDeck();

    const players: Array<PlayerModel> = JSON.parse(this.localSrv.getData('players') as string);
    this.gameSrv.game = {
      players: players,
      maxTurnCount: players.length * 4,
      turn: 1,
      phase: 1,
      drinkingCards: [],
      givingCards: [],
      activePlayer: players[0],
      status: 1,
      summary: this.withSummaryMode
    } as Game;

  }

  ngOnDestroy() {
    this.gameSubs?.unsubscribe();
  }

}
