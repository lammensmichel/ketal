import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";
import {CardType} from 'src/app/_shared/_models/card-type.model';
import {Game} from 'src/app/_shared/_models/game.model';
import {PlayerModel} from 'src/app/_shared/_models/player.model';
import {PlayerHelperService} from "../../_shared/_helpers/player.helper";
import {ColorsEnum} from "../../_shared/_models/enums/color.enum";
import {DrinkChoiceEnum} from "../../_shared/_models/enums/drink_choice.enum";
import {InAndOutEnum} from "../../_shared/_models/enums/in_out.enum";
import {PlusOrMinusEnum} from "../../_shared/_models/enums/plus_minus.enum";
import {CardService} from "../card/card.service";
import {LocalService} from "../local/local.service";
import {String} from "typescript-string-operations";
import {CardDeckHelperService} from "../../_shared/_helpers/card-deck.helper";

@Injectable({
  providedIn: 'root'
})
export class GameService {

  public gameSubject: BehaviorSubject<Game> | undefined;

  private _game: Game | undefined;
  private _withSummaryMode = new BehaviorSubject<boolean>(false);


  get withSummaryMode() {
    return this._withSummaryMode.asObservable();
  }

  setWithSummaryMode(value: boolean) {
    this._withSummaryMode.next(value);
  }

  constructor(public localSrv: LocalService,
              public cardSrv: CardService,
              public playerHelper: PlayerHelperService,
              public cardDeckHelperService: CardDeckHelperService) {
    if (!this.gameSubject) {
      const game: Game = JSON.parse(this.localSrv.getData('game') as string);
      this.gameSubject = new BehaviorSubject<Game>(game);
    }
  }

  get game(): Game {
    if (!this._game) {
      this._game = JSON.parse(this.localSrv.getData('game') as string);
    }
    return <Game>this._game;
  }

  set game(game: Game | undefined) {
    if (game) {
      this._game = game;
      this.localSrv.saveData('game', JSON.stringify(this._game));
      this.gameSubject?.next(game);
    } else {
      this.localSrv.removeData('game');
      this.gameSubject?.complete();

    }
  }

  /**
   * Sets the card choice for the active player and refreshes the session.
   *
   * @param {string} choice - The choice to set.
   * @param {string} value - The value of the choice.
   * @param {string} activePlayerId - The ID of the active player.
   */
  setCardChoice(choice: string, value: string, activePlayerId: string) {
    const currentPlayer = this.game.players.find((player: PlayerModel) => player.id === activePlayerId);

    if (currentPlayer) {
      currentPlayer.choice[choice] = value;
      this.game.activePlayer = currentPlayer;
      this.refreshSession();
    }

  }

  /**
   * Refreshes the session by saving the current game state to local storage and emitting a new value on the game subject.
   */
  refreshSession() {
    this.localSrv.saveData('game', JSON.stringify(this._game));
    this.gameSubject?.next(this.game);
  }

  /**
   * Adds a card to the drinking cards array.
   *
   * @param {CardType} card - The card to add.
   */
  addDrinkingCard(card: CardType) {
    this.game.drinkingCards.push(card);
  }

  /**
   * Adds a card to the giving cards array.
   *
   * @param {CardType} card - The card to add.
   */
  addGivingCard(card: CardType) {
    this.game.givingCards.push(card);
  }

  /**
   * Adds a card to a player's cards array and sets the active player to the player.
   *
   * @param {CardType} card - The card to add.
   * @param {string} playerId - The ID of the player.
   */
  addCardToPlayer(card: CardType, playerId: string) {
    const currentPlayer = this.game.players.find((player: PlayerModel) => player.id === playerId);
    if (currentPlayer) currentPlayer.cards.push(card);
    if (this.game && this.game.activePlayer) this.game.activePlayer = currentPlayer;
  }

  /**
   * Checks if the game is finished.
   *
   * @returns {boolean} - True if the game is finished; otherwise, false.
   */
  isGameFinished(): boolean {
    return this.getStatus() === 2;
  }

  /**
   * Checks if the game has started.
   *
   * @returns {boolean} - True if the game has started; otherwise, false.
   */
  isGameStarted(): boolean {
    return this.getStatus() === 1;
  }

  /**
   * Checks if a new game is being started.
   *
   * @returns {boolean} - True if a new game is being started; otherwise, false.
   */
  isNewGame(): boolean {
    return this.getStatus() === 0;
  }

  /**
   * Checks if the game is in summary mode.
   *
   * @returns {boolean} - True if the game is in summary mode; otherwise, false.
   */
  isSummaryMode(): boolean {
    return this.isSummaryActivated() && this.getStatus() === 3;
  }

  /**
   * Checks if the summary is activated.
   *
   * @returns {boolean} - True if the summary is activated; otherwise, false.
   */
  isSummaryActivated() {
    return this.game?.summary;
  }

  /**
   * Increments the turn count by 1.
   */
  addTurn() {
    this.game.turn++;
    this.game = this.game;
  }

  /**
   * Resets the game state.
   * Sets the game phase and turn to 0, active player to undefined, and status to 0.
   * Resets each player's sips, cards, and choices, and saves the updated players to storage.
   */
  resetGame() {
    this.setStatus(0);
    this.game.givingCards = [];
    this.game.drinkingCards = [];
    this.game.phase = 0;
    this.game.turn = 0;
    this.game.activePlayer = undefined;
    this.setStatus(0);

    const players: PlayerModel[] = this.game.players;
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

    this.playerHelper.savePlayerToStorage(players);
  }

  /**
   * Returns the current game status.
   * If the game is not defined, it returns 0.
   * @returns {number} - The current game status.
   */
  getStatus(): number {
    if (!this.game) {
      return 0;
    } else {
      return this.game.status;
    }
  }

  /**
   * Sets the game status to the provided value and refreshes the session.
   * @param {number} status - The new game status.
   */
  setStatus(status: number) {
    if (this.game) {
      this.game.status = status;
      this.refreshSession();
    }
  }

  /**
   * Calculates the number of sips for a player based on their color choice.
   * If the player's color choice does not match the card color, they get 1 sip.
   * @param {PlayerModel} player - The player making the choice.
   * @param {CardType} card - The card to check.
   * @returns {number} - The number of sips the player gets.
   */
  private getSipsNumberForColorChoice(player: PlayerModel, card: CardType): number {
    const colorChoice = this.playerHelper.getPlayerChoice(player, DrinkChoiceEnum.Color);
    if ((colorChoice === ColorsEnum.Red && this.cardSrv.isBlackCard(card)) ||
      (colorChoice === ColorsEnum.Black && this.cardSrv.isRedCard(card))) {
      return 1;
    }
    return 0;
  }

  /**
   * Calculates the number of sips for a player based on their plus or minus choice.
   * If the player's choice does not match the comparison of the new card value and the previous card value, they get 2 sips.
   * If the new card value is equal to the previous card value, they get 4 sips.
   * @param {PlayerModel} player - The player making the choice.
   * @param {CardType} card - The card to check.
   * @returns {number} - The number of sips the player gets.
   */
  private getSipsNumberForMinusChoice(player: PlayerModel, card: CardType): number {
    const previousCardValue = this.cardSrv.getCardValue(player.cards[player.cards.length - 1]);
    const newValue = this.cardSrv.getCardValue(card);
    const plusMinusChoice = this.playerHelper.getPlayerChoice(player, DrinkChoiceEnum.PlusOrMinus);

    if (previousCardValue === newValue) {
      return 4;
    } else if ((plusMinusChoice === PlusOrMinusEnum.Plus && previousCardValue > newValue) ||
      (plusMinusChoice === PlusOrMinusEnum.Minus && previousCardValue < newValue)) {
      return 2;
    }
    return 0;

  }

  /**
   * Calculates the number of sips for a player based on their in-and-out choice.
   *
   * This method first gets the lowest and highest values of the player's cards. It then gets the value of the new card and the player's in-and-out choice.
   * If the new card's value is equal to the lowest or highest value, the player gets 6 sips.
   * If the player's choice is 'in' and the new card's value is between the lowest and highest values, the player gets 0 sips. Otherwise, they get 3 sips.
   * If the player's choice is 'out' and the new card's value is less than the lowest value or greater than the highest value, the player gets 0 sips. Otherwise, they get 3 sips.
   *
   * @param {PlayerModel} player - The player making the choice.
   * @param {CardType} card - The card to check.
   * @returns {number} - The number of sips the player gets.
   */
  private getSipsNumberForInAndOutChoice(player: PlayerModel, card: CardType): number {
    const cardsToCompare: CardType[] = [player.cards[0], player.cards[1]];
    const lowestValue: number = this.cardSrv.getCardValue(this.cardSrv.lowestCard(cardsToCompare));
    const highestValue: number = this.cardSrv.getCardValue(this.cardSrv.greatestCard(cardsToCompare));
    const newValue = this.cardSrv.getCardValue(card);
    const inAndOutChoice = this.playerHelper.getPlayerChoice(player, DrinkChoiceEnum.InAndOut);

    let sipNbr: number = 0;


    switch (true) {
      case newValue === lowestValue || newValue === highestValue:
        sipNbr = 6;
        break;
      case inAndOutChoice === InAndOutEnum.In:
        if (newValue > lowestValue && newValue < highestValue) {
          sipNbr = 0;
        } else {
          sipNbr = 3;
        }
        break;
      case inAndOutChoice === InAndOutEnum.Out:
        if (newValue < lowestValue || newValue > highestValue) {
          sipNbr = 0;
        } else {
          sipNbr = 3;
        }
        break;
    }
    return sipNbr;

  }

  /**
   * Calculates the number of sips for a player based on their suit choice.
   *
   * This method gets the player's suit choice and compares it with the suit of the new card.
   * If the player's suit choice does not match the card's suit, they get 4 sips. Otherwise, they get 0 sips.
   *
   * @param {PlayerModel} player - The player making the choice.
   * @param {CardType} card - The card to check.
   * @returns {number} - The number of sips the player gets.
   */
  private getSipsNumberForSuitChoice(player: PlayerModel, card: CardType): number {
    const suitChoice = this.playerHelper.getPlayerChoice(player, DrinkChoiceEnum.Suit);
    return suitChoice !== card.suit ? 4 : 0;
  }

  /**
   * Assigns sips to the current player based on their choices and the current turn.
   *
   * This method finds the current player based on the provided player ID. If the player is not found, it returns.
   * Depending on the current turn, it calculates the number of sips for the player based on their color, minus, in and out, or suit choice,
   * and assigns the calculated number of sips to the current card. It then adds the number of sips to the player's total sips.
   *
   * @param {CardType} currentCard - The current card.
   * @param {string} playerId - The ID of the current player.
   */
  assignSipsForFirstTurn(currentCard: CardType, playerId: string) {
    const currentPlayer: PlayerModel | undefined = this.game.players.find((player: PlayerModel) => player.id === playerId);

    if (!currentPlayer) {
      return;
    }

    switch (this.game.turn) {
      case 1 :
        currentCard.sips = this.getSipsNumberForColorChoice(currentPlayer, currentCard);
        break;
      case 2 :
        currentCard.sips = this.getSipsNumberForMinusChoice(currentPlayer, currentCard);
        break;
      case 3 :
        currentCard.sips = this.getSipsNumberForInAndOutChoice(currentPlayer, currentCard);

        break;
      case 4 :
        currentCard.sips = this.getSipsNumberForSuitChoice(currentPlayer, currentCard);
    }

    this.addPlayerSip(currentPlayer, currentCard.sips);
  }

  /**
   * Assigns the number of sips for a player during the first turn based on their choices and the current card.
   *
   * This method finds the current player based on the provided player ID. If the player is not found, it returns immediately.
   * Depending on the current game turn, it calculates the number of sips for the player using the appropriate method and assigns it to the current card.
   * Finally, it adds the number of sips to the player's total sips.
   *
   * @param {CardType} currentCard - The current card.
   * @param {string} playerId - The ID of the player.
   */
  public addPlayerSip(player: PlayerModel, sipNbr: number, drink: boolean = true) {
    const currPlayer: PlayerModel | undefined = this.game.players.find((playerSelected: PlayerModel) => playerSelected.id === player.id);
    if (!currPlayer?.cards || currPlayer?.cards?.length < 4) {
      if (currPlayer && sipNbr) {
        currPlayer.sips['drunk'] += sipNbr;
      }
    } else {
      currPlayer.sips[drink ? 'drunk' : 'given'] += sipNbr;
    }
    this.refreshSession();
  }

  /**
   * Checks if a choice is undefined, null, or consists only of white-space characters.
   *
   * This method uses the `isNullOrWhiteSpace` method of the `String` object to check if the provided choice is undefined, null, or consists only of white-space characters.
   *
   * @param {string} choice - The choice to check.
   * @returns {boolean} - True if the choice is undefined, null, or consists only of white-space characters; otherwise, false.
   */
  isChoiceUndefinedOrWhiteSpace(choice: string): boolean {
    return String.isNullOrWhiteSpace(choice);
  }

  /**
   * Picks a card for the active player and assigns sips based on their choices.
   *
   * This method picks a random card from the deck and assigns sips to the active player based on their choices for the first turn.
   * It then adds the card to the player's hand and refreshes the session.
   * The active player is then set to the next player in the list, or undefined if there are no more players.
   * If all players have made their choices for the current turn, the turn is incremented. If the turn number exceeds 4, the game phase is set to 2.
   * The session is refreshed after each major operation.
   */
  pickCard() {
    let currentCard: CardType | undefined;

    if (this.game && this.game.activePlayer) {
      currentCard = this.cardDeckHelperService.getRandomCard();
      this.assignSipsForFirstTurn(currentCard, this.game.activePlayer.id);
      this.addCardToPlayer(currentCard, this.game.activePlayer.id);
      this.refreshSession();

      const currentIndex = this.game.players.findIndex(player => player.id === this.game?.activePlayer?.id);
      this.game.activePlayer = (currentIndex === -1 || currentIndex === this.game.players.length - 1)
        ? undefined
        : this.game.players[currentIndex + 1];
      this.refreshSession();


      if (this.allPlayersMadeChoices()) {
        this.addTurn();
        if (this.game.turn > 4) {
          this.game.phase = 2;
        }
        this.refreshSession();
      }
    }
  }


  /**
   * Checks if all players have made their choices for the current turn.
   *
   * This method iterates over all players and checks if they have made their choice for the current turn.
   * The choice is considered made if it is not undefined, null, or consists only of white-space characters.
   * The method returns true if all players have made their choices; otherwise, it returns false.
   *
   * @returns {boolean} - True if all players have made their choices; otherwise, false.
   */
  private allPlayersMadeChoices(): boolean {
    return this.game.players.every(player => {
      switch (this.game.turn) {
        case 1:
          return !this.isChoiceUndefinedOrWhiteSpace(player.choice[DrinkChoiceEnum.Color]);
        case 2:
          return !this.isChoiceUndefinedOrWhiteSpace(player.choice[DrinkChoiceEnum.PlusOrMinus]);
        case 3:
          return !this.isChoiceUndefinedOrWhiteSpace(player.choice[DrinkChoiceEnum.InAndOut]);
        case 4:
          return !this.isChoiceUndefinedOrWhiteSpace(player.choice[DrinkChoiceEnum.Suit]);
        default:
          return true;
      }
    });
  }

  /**
   * Sets the card choice for the active player and picks a card.
   *
   * This method first checks if the game exists and if there is an active player.
   * If these conditions are met, it sets the card choice for the active player based on the provided choice enum and selection.
   * After setting the card choice, it picks a card.
   *
   * @param {DrinkChoiceEnum} choiceEnum - The enum value representing the type of choice to be set.
   * @param {string} selection - The selected choice.
   */
  setChoiceAndPickCard(choiceEnum: DrinkChoiceEnum, selection: string) {
    if (this.game && this.game.activePlayer && this.game) {
      this.setCardChoice(choiceEnum, selection, this.game.activePlayer.id);
      this.pickCard();
    }
  }


  /**
   * Checks if there are any remaining sips to be given in the game.
   *
   * This method first checks if the summary is activated and if there are any drinking cards in the game.
   * If these conditions are met, it calculates the total number of remaining sips to be given by iterating over each player's cards.
   * If the total number of remaining sips is greater than 0, it returns true, indicating that not all sips have been given.
   * Otherwise, it returns false.
   *
   * @returns {boolean} - Returns true if there are remaining sips to be given, false otherwise.
   */
  isNotAllSipsGiven(): boolean {
    if (!this.isSummaryActivated() || this.game.drinkingCards.length === 0) {
      return false;
    }
    const remainingSipsToGive = this.game.players.reduce((total, player) => {
      const playerSips = player.cards.reduce((sum, card) => sum + (card.givenSips || 0), 0);
      return total + playerSips;
    }, 0);

    return remainingSipsToGive > 0;
  }

  /**
   * Display a  new card
   * used in game phase 2
   */
  displayNewCard(): number | void {
    if (!this.game) return;

    let newCard: CardType | undefined;

    if (this.game.givingCards.length === 6) return;
    this.game.givingCards.forEach((card) => (card.selected = false));
    this.game.drinkingCards.forEach((card) => (card.selected = false));
    let sipNb: number = 0;

    // Check if all given sips are given if summary mode is activated
    // If not, display a toast and return
    if (this.isNotAllSipsGiven() && this.game.drinkingCards.length > 0) {
      return -1;
    }

    // Get new card
    newCard = this.cardDeckHelperService.getRandomCard();
    newCard.selected = true;

    // get sips number
    sipNb = this.getSipsNumber();


    // Select Card on each player
    this.selectCardOnPlayer(sipNb, newCard);

    newCard.sips = sipNb;
    this.saveCardAndSips(newCard, sipNb);

    // Finish game if 6 cards are given
    if (this.game.givingCards.length === 6) {
      this.setStatus(2);
    }

    this.refreshSession();
  }

  /**
   * Adds sips to players based on the value of a card.
   *
   * This method iterates over all players and their cards. If a player has a card with the same value as the provided card,
   * a certain number of sips (specified by `sipNb`) is added to the player's total sips.
   * The method then calls `addPlayerSip` to add the calculated number of sips to the player's total sips.
   *
   * @param {CardType} card - The card to check.
   * @param {number} sipNb - The number of sips to add for each matching card.
   */
  addSips(card: CardType, sipNb: number) {
    this.game.players.forEach((player: PlayerModel) => {
      let sipTurnNb = 0;
      player.cards.forEach((otherCards) => {
        if (otherCards.value === card.value) {
          sipTurnNb += sipNb;
        }
      });
      this.addPlayerSip(player, sipTurnNb, !this.isGivingCard());
    });
  }

  /**
   * Adds sips to players based on the value of a card and saves the card.
   *
   * This method adds sips to players based on the value of the provided card and the specified number of sips.
   * It then saves the card to either the giving cards or the drinking cards, depending on the current game state.
   *
   * @param {CardType} card - The card to check and save.
   * @param {number} sipNb - The number of sips to add for each matching card.
   */
  saveCardAndSips(card: CardType, sipNb: number) {
    this.addSips(card, sipNb);
    this[this.isGivingCard() ? 'addGivingCard' : 'addDrinkingCard'](card);
  }

  /**
   * Checks if the game is in the giving card phase.
   *
   * This method compares the lengths of the drinking cards and giving cards arrays.
   * If the length of the drinking cards array is greater than the length of the giving cards array, it means the game is in the giving card phase.
   *
   * @returns {boolean} - True if the game is in the giving card phase; otherwise, false.
   */
  isGivingCard(): boolean {
    return this.game.drinkingCards.length > this.game.givingCards.length;
  }

  /**
   * Selects a card on each player and assigns sips if conditions are met.
   *
   * This method iterates over all players and their cards. If a player has a card with the same value as the provided card,
   * that card is marked as selected. If the summary is activated, the game is in the giving card phase, and the number of sips is greater than 0,
   * the number of given sips is set to the provided number of sips.
   *
   * @param {number} sipNb - The number of sips to assign.
   * @param {CardType} currentCard - The card to select.
   */
  selectCardOnPlayer(sipNb: number, currentCard: CardType) {
    this.game.players.forEach((player) => {
      player.cards.forEach((card) => {
        card.selected = card.value === currentCard.value;
        if (card.selected && this.isSummaryActivated() && this.isGivingCard() && sipNb > 0) {
          card.givenSips = sipNb;
        }
      });
    });
  }

  /**
   * Calculates the number of sips based on the current game state.
   *
   * This method calculates the number of sips based on the lengths of the drinking cards and giving cards arrays.
   * If both arrays are empty, or if only the drinking cards array has elements, the number of sips is 1.
   * If both arrays have elements and their lengths are equal, the number of sips is the length of the drinking cards array plus 1.
   * If both arrays have elements and the length of the drinking cards array is greater than the length of the giving cards array,
   * the number of sips is the length of the giving cards array plus 1.
   *
   * @returns {number} - The calculated number of sips.
   */
  getSipsNumber(): number {
    let sipNb: number = 0;

    switch (true) {
      case this.game.drinkingCards.length === 0 && this.game.givingCards.length === 0:
        sipNb = 1;
        break;
      case this.game.drinkingCards.length > 0 && this.game.givingCards.length === 0:
        sipNb = 1;
        break;
      case this.game.drinkingCards.length !== 0 && this.game.givingCards.length !== 0
      && this.game.drinkingCards.length === this.game.givingCards.length :
        sipNb = this.game.drinkingCards.length + 1;
        break;
      case this.game.drinkingCards.length !== 0 && this.game.givingCards.length !== 0
      && this.game.drinkingCards.length > this.game.givingCards.length :
        sipNb = this.game.givingCards.length + 1;
    }
    return sipNb;
  }

  /**
   * Begins a new game with the specified summary mode and constructs a new deck of cards.
   *
   * This method constructs a new deck of cards and retrieves the list of players from local storage.
   * It then initializes the game with the players, sets the maximum turn count to four times the number of players,
   * sets the turn and phase to 1, initializes the drinking and giving cards arrays, sets the active player to the first player,
   * sets the game status to 1, and sets the summary mode to the provided value.
   *
   * @param {boolean} withSummaryMode - Whether to enable summary mode. Defaults to false.
   */
  beginGame(withSummaryMode: boolean = false) {
    this.cardDeckHelperService.constructDeck();
    const players: Array<PlayerModel> = JSON.parse(this.localSrv.getData('players') as string);
    this.game = {
      players: players,
      maxTurnCount: players.length * 4,
      turn: 1,
      phase: 1,
      drinkingCards: [],
      givingCards: [],
      activePlayer: players[0],
      status: 1,
      summary: withSummaryMode
    };
  }
}
