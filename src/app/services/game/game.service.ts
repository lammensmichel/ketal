import { computed, inject, Injectable, signal } from '@angular/core';
import { Subject } from 'rxjs';
import { CardType } from 'src/app/_shared/_models/card-type.model';
import { Game } from 'src/app/_shared/_models/game.model';
import { PlayerModel } from 'src/app/_shared/_models/player.model';
import { isNullOrWhiteSpace } from '../../_shared/_helpers/string.helper';
import { CardDeckHelperService } from '../../_shared/_helpers/card-deck.helper';
import { PlayerHelperService } from '../../_shared/_helpers/player.helper';
import { ColorsEnum } from '../../_shared/_models/enums/color.enum';
import { DrinkChoiceEnum } from '../../_shared/_models/enums/drink_choice.enum';
import { InAndOutEnum } from '../../_shared/_models/enums/in_out.enum';
import { PlusOrMinusEnum } from '../../_shared/_models/enums/plus_minus.enum';
import { CardService } from '../card/card.service';
import { LocalService } from '../local/local.service';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly localSrv = inject(LocalService);
  private readonly cardSrv = inject(CardService);
  private readonly playerHelper = inject(PlayerHelperService);
  private readonly cardDeckHelperService = inject(CardDeckHelperService);

  /** Signal holding the current game state */
  private readonly _game = signal<Game | null>(this.loadGameFromStorage());

  /** Public readonly signal for game state */
  readonly game = computed(() => this._game() ?? this.createEmptyGame());

  /** Computed signals for commonly accessed properties */
  readonly status = computed(() => this._game()?.status ?? 0);
  readonly turn = computed(() => this._game()?.turn ?? 0);
  readonly phase = computed(() => this._game()?.phase ?? 0);
  readonly players = computed(() => this._game()?.players ?? []);
  readonly activePlayer = computed(() => this._game()?.activePlayer);
  readonly drinkingCards = computed(() => this._game()?.drinkingCards ?? []);
  readonly givingCards = computed(() => this._game()?.givingCards ?? []);
  readonly summary = computed(() => this._game()?.summary ?? false);

  /** Signal for summary mode */
  readonly withSummaryMode = signal<boolean>(false);

  /** Subject for modal events */
  private readonly openSipGiveModalEvent = new Subject<PlayerModel>();
  readonly openSipGiveModalEvent$ = this.openSipGiveModalEvent.asObservable();

  private loadGameFromStorage(): Game | null {
    const data = this.localSrv.getData('game');
    return data ? JSON.parse(data) : null;
  }

  private createEmptyGame(): Game {
    return {
      players: [],
      maxTurnCount: 0,
      turn: 0,
      phase: 0,
      drinkingCards: [],
      givingCards: [],
      activePlayer: undefined,
      status: 0,
      summary: false,
    };
  }

  private updateGame(updater: (game: Game) => void): void {
    const currentGame = this._game();
    if (currentGame) {
      updater(currentGame);
      this.saveAndNotify(currentGame);
    }
  }

  private saveAndNotify(game: Game): void {
    this.localSrv.saveData('game', JSON.stringify(game));
    // Deep clone to ensure signal detects changes in nested objects
    this._game.set(JSON.parse(JSON.stringify(game)));
  }

  setCardChoice(choice: string, value: string, activePlayerId: string): void {
    this.updateGame((game) => {
      const currentPlayer = game.players.find((p) => p.id === activePlayerId);
      if (currentPlayer) {
        currentPlayer.choice[choice] = value;
        game.activePlayer = currentPlayer;
      }
    });
  }

  addDrinkingCard(card: CardType): void {
    this.updateGame((game) => game.drinkingCards.push(card));
  }

  addGivingCard(card: CardType): void {
    this.updateGame((game) => game.givingCards.push(card));
  }

  addCardToPlayer(card: CardType, playerId: string): void {
    this.updateGame((game) => {
      const player = game.players.find((p) => p.id === playerId);
      if (player) {
        player.cards.push(card);
        game.activePlayer = player;
      }
    });
  }

  isGameFinished(): boolean {
    return this.status() === 2;
  }

  isGameStarted(): boolean {
    return this.status() === 1;
  }

  isNewGame(): boolean {
    return this.status() === 0;
  }

  isSummaryMode(): boolean {
    return this.isSummaryActivated() && this.status() === 3;
  }

  isSummaryActivated(): boolean {
    return this.summary();
  }

  addTurn(): void {
    this.updateGame((game) => game.turn++);
  }

  resetGame(): void {
    this.updateGame((game) => {
      game.givingCards = [];
      game.drinkingCards = [];
      game.phase = 0;
      game.turn = 0;
      game.activePlayer = undefined;
      game.status = 0;

      game.players.forEach((player) => {
        player.sips = { drunk: 0, given: 0 };
        player.cards = [];
        player.choice = { color: '', plus_or_minus: '', in_out: '', suit: '' };
      });

      this.playerHelper.savePlayerToStorage(game.players);
    });
  }

  setStatus(status: number): void {
    this.updateGame((game) => (game.status = status));
  }

  private getSipsNumberForColorChoice(player: PlayerModel, card: CardType): number {
    const colorChoice = this.playerHelper.getPlayerChoice(player, DrinkChoiceEnum.Color);
    if (
      (colorChoice === ColorsEnum.Red && this.cardSrv.isBlackCard(card)) ||
      (colorChoice === ColorsEnum.Black && this.cardSrv.isRedCard(card))
    ) {
      return 1;
    }
    return 0;
  }

  private getSipsNumberForMinusChoice(player: PlayerModel, card: CardType): number {
    const previousCardValue = this.cardSrv.getCardValue(player.cards[player.cards.length - 1]);
    const newValue = this.cardSrv.getCardValue(card);
    const plusMinusChoice = this.playerHelper.getPlayerChoice(player, DrinkChoiceEnum.PlusOrMinus);

    if (previousCardValue === newValue) {
      return 4;
    }
    if (
      (plusMinusChoice === PlusOrMinusEnum.Plus && previousCardValue > newValue) ||
      (plusMinusChoice === PlusOrMinusEnum.Minus && previousCardValue < newValue)
    ) {
      return 2;
    }
    return 0;
  }

  private getSipsNumberForInAndOutChoice(player: PlayerModel, card: CardType): number {
    const cardsToCompare = [player.cards[0], player.cards[1]];
    const lowestValue = this.cardSrv.getCardValue(this.cardSrv.lowestCard(cardsToCompare));
    const highestValue = this.cardSrv.getCardValue(this.cardSrv.greatestCard(cardsToCompare));
    const newValue = this.cardSrv.getCardValue(card);
    const choice = this.playerHelper.getPlayerChoice(player, DrinkChoiceEnum.InAndOut);

    if (newValue === lowestValue || newValue === highestValue) {
      return 6;
    }

    const isInside = newValue > lowestValue && newValue < highestValue;
    const isCorrect = choice === InAndOutEnum.In ? isInside : !isInside;
    return isCorrect ? 0 : 3;
  }

  private getSipsNumberForSuitChoice(player: PlayerModel, card: CardType): number {
    const suitChoice = this.playerHelper.getPlayerChoice(player, DrinkChoiceEnum.Suit);
    return suitChoice !== card.suit ? 4 : 0;
  }

  assignSipsForFirstTurn(currentCard: CardType, playerId: string): void {
    const game = this._game();
    if (!game) {
      return;
    }

    const currentPlayer = game.players.find((p) => p.id === playerId);
    if (!currentPlayer) {
      return;
    }

    switch (game.turn) {
      case 1:
        currentCard.sips = this.getSipsNumberForColorChoice(currentPlayer, currentCard);
        break;
      case 2:
        currentCard.sips = this.getSipsNumberForMinusChoice(currentPlayer, currentCard);
        break;
      case 3:
        currentCard.sips = this.getSipsNumberForInAndOutChoice(currentPlayer, currentCard);
        break;
      case 4:
        currentCard.sips = this.getSipsNumberForSuitChoice(currentPlayer, currentCard);
        break;
    }

    this.addPlayerSip(currentPlayer, currentCard.sips);
  }

  addPlayerSip(player: PlayerModel, sipNbr: number, drink = true): void {
    this.updateGame((game) => {
      const currPlayer = game.players.find((p) => p.id === player.id);
      if (!currPlayer || !sipNbr) {
        return;
      }

      if (!currPlayer.cards || currPlayer.cards.length < 4) {
        currPlayer.sips['drunk'] += sipNbr;
      } else {
        currPlayer.sips[drink ? 'drunk' : 'given'] += sipNbr;
      }
    });
  }

  updatePlayerGivenSipsFromCard(player: PlayerModel, card: CardType, sips: number): void {
    this.updateGame((game) => {
      const currPlayer = game.players.find((p) => p.id === player.id);
      if (!currPlayer) {
        return;
      }

      const cardToUpdate = currPlayer.cards.find((c) => c.suit === card.suit && c.value === card.value);
      if (cardToUpdate) {
        cardToUpdate.givenSips = sips;
      }
    });
  }

  isChoiceUndefinedOrWhiteSpace(choice: string): boolean {
    return isNullOrWhiteSpace(choice);
  }

  pickCard(): void {
    const game = this._game();
    if (!game?.activePlayer) {
      return;
    }

    const currentCard = this.cardDeckHelperService.getRandomCard();
    this.assignSipsForFirstTurn(currentCard, game.activePlayer.id);
    this.addCardToPlayer(currentCard, game.activePlayer.id);

    this.updateGame((g) => {
      const currentIndex = g.players.findIndex((p) => p.id === g.activePlayer?.id);
      const isLastPlayer = currentIndex === -1 || currentIndex === g.players.length - 1;

      if (isLastPlayer) {
        g.turn++;
        if (g.turn > 4) {
          g.phase = 2;
          g.activePlayer = undefined;
        } else {
          g.activePlayer = g.players[0];
        }
      } else {
        g.activePlayer = g.players[currentIndex + 1];
      }
    });
  }

  private allPlayersMadeChoices(): boolean {
    const game = this._game();
    if (!game) {
      return true;
    }

    return game.players.every((player) => {
      switch (game.turn) {
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

  setChoiceAndPickCard(choiceEnum: DrinkChoiceEnum, selection: string): void {
    const game = this._game();
    if (game?.activePlayer) {
      this.setCardChoice(choiceEnum, selection, game.activePlayer.id);
      this.pickCard();
    }
  }

  isNotAllSipsGiven(): boolean {
    if (!this.isSummaryActivated() || this.drinkingCards().length === 0) {
      return false;
    }
    const remainingSipsToGive = this.players().reduce((total, player) => {
      const playerSips = player.cards.reduce((sum, card) => sum + (card.givenSips || 0), 0);
      return total + playerSips;
    }, 0);

    return remainingSipsToGive > 0;
  }

  getLastCard(): CardType {
    const giving = this.givingCards();
    const drinking = this.drinkingCards();
    if (giving.length >= drinking.length) {
      return giving[giving.length - 1];
    }
    return drinking[drinking.length - 1];
  }

  displayNewCard(): CardType | void {
    const game = this._game();
    if (!game || game.givingCards.length === 6) {
      return;
    }

    game.givingCards.forEach((card) => (card.selected = false));
    game.drinkingCards.forEach((card) => (card.selected = false));

    if (this.isNotAllSipsGiven() && game.drinkingCards.length > 0) {
      return;
    }

    const newCard = this.cardDeckHelperService.getRandomCard();
    newCard.selected = true;

    const sipNb = this.getSipsNumber();
    this.selectCardOnPlayer(sipNb, newCard);

    newCard.sips = sipNb;
    this.saveCardAndSips(newCard, sipNb);

    if (this.givingCards().length === 6) {
      this.setStatus(2);
    }

    return newCard;
  }

  addSips(card: CardType, sipNb: number): void {
    this.players().forEach((player) => {
      let sipTurnNb = 0;
      player.cards.forEach((c) => {
        if (c.value === card.value) {
          sipTurnNb += sipNb;
        }
      });
      this.addPlayerSip(player, sipTurnNb, !this.isGivingCard());
    });
  }

  saveCardAndSips(card: CardType, sipNb: number): void {
    this.addSips(card, sipNb);
    if (this.isGivingCard()) {
      this.addGivingCard(card);
    } else {
      this.addDrinkingCard(card);
    }
  }

  isGivingCard(): boolean {
    return this.drinkingCards().length > this.givingCards().length;
  }

  selectCardOnPlayer(sipNb: number, currentCard: CardType): void {
    this.updateGame((game) => {
      game.players.forEach((player) => {
        player.cards.forEach((card) => {
          card.selected = card.value === currentCard.value;
          if (card.selected && this.isSummaryActivated() && this.isGivingCard() && sipNb > 0) {
            card.givenSips = sipNb;
          }
        });
      });
    });
  }

  getSipsNumber(): number {
    const drinkingLen = this.drinkingCards().length;
    const givingLen = this.givingCards().length;

    if (givingLen === 0) {
      return 1;
    }
    return drinkingLen === givingLen ? drinkingLen + 1 : givingLen + 1;
  }

  beginGame(withSummaryMode = false): void {
    this.cardDeckHelperService.constructDeck();
    const players: PlayerModel[] = JSON.parse(this.localSrv.getData('players') as string);

    const newGame: Game = {
      players: players,
      maxTurnCount: players.length * 4,
      turn: 1,
      phase: 1,
      drinkingCards: [],
      givingCards: [],
      activePlayer: players[0],
      status: 1,
      summary: withSummaryMode,
    };

    this.saveAndNotify(newGame);
  }

  openSipGiveModal(player: PlayerModel): void {
    this.openSipGiveModalEvent.next(player);
  }
}
