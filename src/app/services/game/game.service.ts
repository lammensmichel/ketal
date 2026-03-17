import { computed, DestroyRef, effect, inject, Injectable, signal } from '@angular/core';
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
import { KetalPlayer, KetalSession, KetalSessionService } from '../ketal-session/ketal-session.service';
import { LocalService } from '../local/local.service';
import { MemberService } from '../member/member.service';
import { RealtimeService } from '../realtime/realtime.service';
import { RoomService } from '../room/room.service';
import { mapGameToSessionUpdate, mapPlayerModelToKetalPlayer, mapSessionToGame } from './game-mappers';

/** Game mode type: local (localStorage) or room (Appwrite) */
export type GameMode = 'local' | 'room';

@Injectable({
  providedIn: 'root',
})
export class GameService {
  private readonly localSrv = inject(LocalService);
  private readonly cardSrv = inject(CardService);
  private readonly playerHelper = inject(PlayerHelperService);
  private readonly cardDeckHelperService = inject(CardDeckHelperService);
  private readonly roomService = inject(RoomService);
  private readonly ketalSessionService = inject(KetalSessionService);
  private readonly memberService = inject(MemberService);
  private readonly realtimeService = inject(RealtimeService);
  private readonly destroyRef = inject(DestroyRef);

  /**
   * Active subscription ID for realtime session updates.
   * Used to track and cleanup the subscription when needed.
   */
  private sessionSubscriptionId: string | null = null;

  /**
   * The session ID we are currently subscribed to.
   * Used for reconnection to resubscribe after a disconnect.
   */
  private activeSessionId: string | null = null;

  /**
   * Signal to prevent sync loops when receiving realtime updates.
   * When true, incoming session updates will not trigger re-sync to Appwrite.
   */
  private readonly _isSyncing = signal(false);

  /**
   * Computed signal that determines the current game mode.
   * Returns 'room' if there's an active room, 'local' otherwise.
   */
  readonly gameMode = computed<GameMode>(() => (this.roomService.currentRoom() ? 'room' : 'local'));

  /**
   * Computed signal indicating if the game is in room/multiplayer mode.
   */
  readonly isRoomMode = computed(() => this.gameMode() === 'room');

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

  /** localStorage key for summary mode preference */
  private static readonly SUMMARY_MODE_KEY = 'ketal_summary_mode';

  /** Signal for summary mode - persisted in localStorage */
  readonly withSummaryMode = signal<boolean>(
    localStorage.getItem(GameService.SUMMARY_MODE_KEY) === 'true'
  );

  /** Subject for modal events */
  private readonly openSipGiveModalEvent = new Subject<PlayerModel>();
  readonly openSipGiveModalEvent$ = this.openSipGiveModalEvent.asObservable();

  constructor() {
    // Persist summary mode preference to localStorage on every change
    effect(() => {
      localStorage.setItem(GameService.SUMMARY_MODE_KEY, String(this.withSummaryMode()));
    });

    // Register cleanup on service destruction
    this.destroyRef.onDestroy(() => {
      this.unsubscribeFromSession();
    });
  }

  private loadGameFromStorage(): Game | null {
    return this.loadFromLocalStorage();
  }

  // ========================
  // LocalStorage Persistence
  // ========================

  /**
   * Save game state to localStorage
   * Used in local mode for offline play
   */
  private saveToLocalStorage(game: Game): void {
    this.localSrv.saveData('game', JSON.stringify(game));
  }

  /**
   * Load game state from localStorage
   * Used in local mode for offline play
   */
  private loadFromLocalStorage(): Game | null {
    const data = this.localSrv.getData('game');
    return data ? JSON.parse(data) : null;
  }

  // ========================
  // Appwrite Persistence
  // ========================

  /**
   * Save game state to Appwrite via KetalSessionService
   * Used in room mode for multiplayer games.
   *
   * Maps the local Game model to KetalSession format and syncs to Appwrite.
   * Includes player sips (sipsTaken = drunk, sipsGiven = given) and card givenSips.
   *
   * @param game - The game state to sync
   */
  private async saveToAppwrite(game: Game): Promise<void> {
    // Prevent sync loops when receiving realtime updates
    if (this._isSyncing()) {
      return;
    }

    const session = this.ketalSessionService.currentSession();
    if (!session) {
      console.debug('[GameService] saveToAppwrite - no active session');
      return;
    }

    try {
      this._isSyncing.set(true);

      // Map local Game to partial KetalSession update
      // This includes player sips (sipsTaken/sipsGiven) and card givenSips
      const sessionUpdate = mapGameToSessionUpdate(game);

      await this.ketalSessionService.updateSession(session.$id, sessionUpdate);

      console.debug('[GameService] Game synced to Appwrite', {
        sessionId: session.$id,
        status: game.status,
        phase: game.phase,
        turn: game.turn,
        playerCount: game.players.length,
      });
    } catch (error) {
      console.error('[GameService] Failed to sync to Appwrite:', error);
    } finally {
      this._isSyncing.set(false);
    }
  }

  /**
   * Load game state from Appwrite via KetalSessionService
   * Used in room mode for multiplayer games
   *
   * @param _sessionId - The session ID to load (unused - uses current session)
   * @returns Game state or null if not found
   */
  private loadFromAppwrite(_sessionId: string): Game | null {
    // Synchronously return current session if available
    const session = this.ketalSessionService.currentSession();
    if (session) {
      return mapSessionToGame(session);
    }
    return null;
  }

  // ========================
  // Realtime Synchronization (Story 12.5)
  // ========================

  /**
   * Subscribe to realtime updates for a session.
   * When session changes are received from Appwrite, the local game state is updated.
   *
   * @param sessionId - The session ID to subscribe to
   */
  subscribeToSessionUpdates(sessionId: string): void {
    // Cleanup any existing subscription first
    this.unsubscribeFromSession();

    // Store the session ID for reconnection
    this.activeSessionId = sessionId;

    // Subscribe to realtime updates via RealtimeService
    // The payload from Appwrite realtime is a raw document that matches KetalSession
    this.sessionSubscriptionId = this.realtimeService.subscribeToSession(sessionId, (updatedSession) => {
      this.handleSessionUpdate(updatedSession as unknown as KetalSession);
    });

    console.debug('[GameService] Subscribed to session updates', {
      sessionId,
      subscriptionId: this.sessionSubscriptionId,
    });
  }

  /**
   * Unsubscribe from the current session's realtime updates.
   * Called when game ends, room is left, or service is destroyed.
   */
  unsubscribeFromSession(): void {
    if (this.sessionSubscriptionId) {
      this.realtimeService.unsubscribe(this.sessionSubscriptionId);
      console.debug('[GameService] Unsubscribed from session', { subscriptionId: this.sessionSubscriptionId });
      this.sessionSubscriptionId = null;
    }
    this.activeSessionId = null;
  }

  /**
   * Handle incoming session updates from Appwrite realtime.
   * Converts the session to local Game format and updates the signal.
   *
   * Uses the _isSyncing flag to prevent infinite loops:
   * - When we save to Appwrite, we set _isSyncing to true
   * - When we receive our own update back, we skip processing
   *
   * @param session - The updated KetalSession from Appwrite
   */
  handleSessionUpdate(session: KetalSession): void {
    // Skip if we're in the middle of syncing to Appwrite (prevent loops)
    if (this._isSyncing()) {
      console.debug('[GameService] handleSessionUpdate - skipped (syncing)');
      return;
    }

    try {
      // Convert session to local Game format
      const game = mapSessionToGame(session);

      // Update the game signal
      this._game.set(game);

      console.debug('[GameService] handleSessionUpdate - updated game state', {
        sessionId: session.$id,
        status: game.status,
        phase: game.phase,
        turn: game.turn,
      });
    } catch (error) {
      console.error('[GameService] Failed to handle session update:', error);
    }
  }

  /**
   * Handle reconnection after a disconnection.
   * Fetches the complete session state from API and re-subscribes to realtime updates.
   *
   * Called when a disconnection is detected (e.g., realtime connection lost).
   * Uses the stored activeSessionId to know which session to reconnect to.
   *
   * @param sessionId - The session ID to reconnect to (optional, uses stored ID if not provided)
   */
  async handleReconnection(sessionId?: string): Promise<void> {
    const targetSessionId = sessionId ?? this.activeSessionId;
    if (!targetSessionId) {
      console.debug('[GameService] handleReconnection - no session ID to reconnect to');
      return;
    }

    try {
      console.debug('[GameService] handleReconnection - fetching session state', { sessionId: targetSessionId });

      // Fetch complete session state via API
      const session = await this.ketalSessionService.getSession(targetSessionId);
      if (!session) {
        console.debug('[GameService] handleReconnection - session not found');
        return;
      }

      // Update local game state from the fetched session
      const game = mapSessionToGame(session);
      this._game.set(game);

      // Re-subscribe to realtime updates
      this.subscribeToSessionUpdates(targetSessionId);

      console.debug('[GameService] handleReconnection - successfully reconnected', {
        sessionId: targetSessionId,
        status: game.status,
        phase: game.phase,
        turn: game.turn,
      });
    } catch (error) {
      console.error('[GameService] handleReconnection - failed:', error);
    }
  }

  /**
   * Sync current game state to Appwrite
   * Used in room mode for multiplayer synchronization
   *
   * Uses _isSyncing flag to prevent sync loops from realtime updates.
   * This method can be called explicitly after game state changes.
   */
  private async syncToAppwrite(): Promise<void> {
    // Only sync in room mode
    if (this.gameMode() !== 'room') {
      return;
    }

    // Get current session
    const session = this.ketalSessionService.currentSession();
    if (!session) {
      console.debug('[GameService] syncToAppwrite - no current session');
      return;
    }

    // Get current game state
    const game = this._game();
    if (!game) {
      console.debug('[GameService] syncToAppwrite - no game state');
      return;
    }

    // Prevent sync loops
    this._isSyncing.set(true);

    try {
      // Map game state to session update format
      const updates = mapGameToSessionUpdate(game);

      // Update Appwrite session
      await this.ketalSessionService.updateSession(session.$id, updates);
      console.debug('[GameService] syncToAppwrite - synced successfully');
    } catch (error) {
      console.error('[GameService] syncToAppwrite - failed:', error);
    } finally {
      this._isSyncing.set(false);
    }
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

  /**
   * Save game state and notify subscribers via signal update.
   * Routes to appropriate persistence layer based on game mode.
   */
  private saveAndNotify(game: Game): void {
    // Route to appropriate persistence method based on mode
    if (this.gameMode() === 'room') {
      this.saveToAppwrite(game);
    } else {
      this.saveToLocalStorage(game);
    }

    // Deep clone to ensure signal detects changes in nested objects
    this._game.set(JSON.parse(JSON.stringify(game)));
  }

  /**
   * Set a player's choice for the current turn.
   * Syncs to Appwrite in room mode after local update.
   *
   * @param choice - The choice type (color, plus_or_minus, in_out, suit)
   * @param value - The choice value
   * @param activePlayerId - The player's ID
   */
  setCardChoice(choice: string, value: string, activePlayerId: string): void {
    this.updateGame((game) => {
      const currentPlayer = game.players.find((p) => p.id === activePlayerId);
      if (currentPlayer) {
        currentPlayer.choice[choice] = value;
        game.activePlayer = currentPlayer;
      }
    });

    // Sync to Appwrite in room mode (AC1: setCardChoice persists in Appwrite)
    if (this.gameMode() === 'room') {
      this.syncToAppwrite();
    }
  }

  addDrinkingCard(card: CardType): void {
    this.updateGame((game) => game.drinkingCards.push(card));
  }

  addGivingCard(card: CardType): void {
    this.updateGame((game) => game.givingCards.push(card));
  }

  /**
   * Add a card to a player's hand.
   * Syncs to Appwrite in room mode after local update.
   *
   * @param card - The card to add
   * @param playerId - The player's ID
   */
  addCardToPlayer(card: CardType, playerId: string): void {
    this.updateGame((game) => {
      const player = game.players.find((p) => p.id === playerId);
      if (player) {
        player.cards.push(card);
        game.activePlayer = player;
      }
    });

    // Sync to Appwrite in room mode (AC2: addCardToPlayer persists in Appwrite)
    if (this.gameMode() === 'room') {
      this.syncToAppwrite();
    }
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
    // Unsubscribe from realtime updates when resetting the game
    this.unsubscribeFromSession();

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

    // Finalize game stats when game is finished (status 2)
    if (status === 2) {
      this.finalizeGameStats();
    }
  }

  /**
   * Finalize game statistics when game ends.
   * In room mode, updates member stats in Appwrite and ends the session.
   *
   * Called automatically when setStatus(2) is invoked.
   */
  private async finalizeGameStats(): Promise<void> {
    // Only finalize stats in room mode
    if (this.gameMode() !== 'room') {
      return;
    }

    const game = this._game();
    const room = this.roomService.currentRoom();
    const session = this.ketalSessionService.currentSession();

    if (!game || !room) {
      console.debug('[GameService] Cannot finalize stats: no game or room');
      return;
    }

    try {
      // Update each member's cumulative stats
      for (const player of game.players) {
        await this.memberService.updateMemberStats(player.id, 'ketal', {
          sipsGiven: player.sips['given'],
          sipsTaken: player.sips['drunk'],
          gamesPlayed: 1,
        });
      }

      console.debug('[GameService] Member stats updated for all players');

      // End the session in Appwrite
      if (session) {
        await this.ketalSessionService.endGame(session.$id);
        console.debug('[GameService] Session ended', { sessionId: session.$id });
      }

      // Unsubscribe from realtime updates after game ends
      this.unsubscribeFromSession();
    } catch (error) {
      console.error('[GameService] Failed to finalize game stats:', error);
    }
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

  /**
   * Pick a card for the active player.
   * Draws a random card, assigns sips, and advances to the next player/turn/phase.
   * Syncs turn/phase/activePlayer changes to Appwrite in room mode.
   */
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

    // Sync turn/phase/activePlayer changes to Appwrite in room mode
    // (AC3, AC4: pickCard updates session with new player/turn/phase)
    if (this.gameMode() === 'room') {
      this.syncToAppwrite();
    }
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

  /**
   * Begin a new game.
   * Routes to appropriate implementation based on game mode.
   *
   * @param withSummaryMode - Whether to enable summary mode at game end
   */
  async beginGame(withSummaryMode = false): Promise<void> {
    this.cardDeckHelperService.constructDeck();

    if (this.gameMode() === 'room') {
      await this.startGameInRoom(withSummaryMode);
    } else {
      this.startGameLocally(withSummaryMode);
    }
  }

  /**
   * Start a game in room/multiplayer mode.
   * Creates a KetalSession in Appwrite and subscribes to realtime updates.
   *
   * @param withSummary - Whether to enable summary mode at game end
   */
  private async startGameInRoom(withSummary: boolean): Promise<void> {
    const room = this.roomService.currentRoom();
    if (!room) {
      console.error('[GameService] Cannot start game: no active room');
      return;
    }

    try {
      // Map local players to Ketal players format
      const ketalPlayers = this.mapPlayersToKetalPlayers();

      // Create session in Appwrite
      const session = await this.ketalSessionService.startGame(room.$id, ketalPlayers, withSummary);

      // Subscribe to session updates for realtime sync (Story 12.5)
      this.subscribeToSessionUpdates(session.$id);

      // Convert session to local Game format and update signal
      const game = mapSessionToGame(session);
      this._game.set(game);

      console.debug('[GameService] Game started in room mode', { sessionId: session.$id });
    } catch (error) {
      console.error('[GameService] Failed to start game in room:', error);
      throw error;
    }
  }

  /**
   * Start a game in local/offline mode.
   * Uses localStorage for persistence.
   *
   * @param withSummaryMode - Whether to enable summary mode at game end
   */
  private startGameLocally(withSummaryMode: boolean): void {
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

  /**
   * Map local PlayerModel[] to KetalPlayer[] for Appwrite storage.
   *
   * @returns Array of KetalPlayer objects
   */
  private mapPlayersToKetalPlayers(): KetalPlayer[] {
    const players: PlayerModel[] = JSON.parse(this.localSrv.getData('players') as string);
    return players.map((player, index) => mapPlayerModelToKetalPlayer(player, index));
  }

  openSipGiveModal(player: PlayerModel): void {
    this.openSipGiveModalEvent.next(player);
  }
}
