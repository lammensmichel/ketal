import { computed, effect, inject, Injectable, Optional, signal, DestroyRef } from '@angular/core';
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
import { RoomService } from '../room/room.service';
import { SoloRoomService } from '../solo-room/solo-room.service';
import { mapGameToSessionUpdate, mapPlayerModelToKetalPlayer, mapSessionToGame } from './game-mappers';

/** Game mode type: local (localStorage) or room (Appwrite) */
export type GameMode = 'local' | 'room';

@Injectable()
export class GameService {
  private readonly localSrv = inject(LocalService);
  private readonly cardSrv = inject(CardService);
  private readonly playerHelper = inject(PlayerHelperService);
  private readonly cardDeckHelperService = inject(CardDeckHelperService);
  @Optional() private readonly roomService = inject(RoomService);
  private readonly ketalSessionService = inject(KetalSessionService);
  private readonly memberService = inject(MemberService);
  private readonly soloRoomService = inject(SoloRoomService);
  private readonly destroyRef = inject(DestroyRef);

  /** Signal for pause state (Story 14.0) */
  readonly paused = signal(false);

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
   * When a sync is in progress and another mutation occurs, the latest game state
   * is queued here. After the current sync completes, a follow-up sync is triggered
   * with the queued state so that no mutations are lost.
   */
  private _pendingGameSync: Game | null = null;

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

  /** localStorage keys for the per-turn badges, persisted so a F5 mid-game does
   * not erase the "previous player drinks N" indicator. */
  private static readonly LAST_TURN_SIPS_KEY = 'last_turn_sips';
  private static readonly LAST_TURN_GIVEN_KEY = 'last_turn_given';

  /**
   * Per-turn sip indicator for Phase 1.
   * Tracks the sips from the most recently dealt card per player.
   * Resets when the active player changes (next player's turn starts).
   * Map key = player ID, value = sips from the last dealt card.
   */
  private readonly _lastTurnSips = signal<Record<string, number>>(this.loadLastTurnMap(GameService.LAST_TURN_SIPS_KEY));
  readonly lastTurnSips = this._lastTurnSips.asReadonly();
  /** Per-draw give sips per player (Phase 2 give card matches) so the UI can show
   * a short-lived "you must give N sips this turn" badge even when summary is off
   * and no modal/pending counter is available. Cleared on each next card draw. */
  private readonly _lastTurnGiven = signal<Record<string, number>>(
    this.loadLastTurnMap(GameService.LAST_TURN_GIVEN_KEY)
  );
  readonly lastTurnGiven = this._lastTurnGiven.asReadonly();

  private loadLastTurnMap(key: string): Record<string, number> {
    try {
      const raw = this.localSrv.getData(key);
      return raw ? (JSON.parse(raw) as Record<string, number>) : {};
    } catch {
      return {};
    }
  }

  /** Phase 2: value of the last revealed card (for match feedback in player-card) */
  readonly phase2LastCardValue = signal<string | null>(null);

  /** localStorage key for summary mode preference */
  private static readonly SUMMARY_MODE_KEY = 'ketal_summary_mode';

  /** Signal for summary mode - persisted in localStorage */
  readonly withSummaryMode = signal<boolean>(localStorage.getItem(GameService.SUMMARY_MODE_KEY) === 'true');

  /** Subject for modal events */
  private readonly openSipGiveModalEvent = new Subject<PlayerModel>();
  readonly openSipGiveModalEvent$ = this.openSipGiveModalEvent.asObservable();

  /** Previous Phase 2 card counts per array, used to detect newly-added cards in
   * the sync effect below. Updated on every tick. */
  private _prevDrinkLen = 0;
  private _prevGiveLen = 0;

  constructor() {
    // Persist summary mode preference to localStorage on every change
    effect(() => {
      localStorage.setItem(GameService.SUMMARY_MODE_KEY, String(this.withSummaryMode()));
    });

    // Persist per-turn drink/give badges so they survive a page reload.
    effect(() => {
      this.localSrv.saveData(GameService.LAST_TURN_SIPS_KEY, JSON.stringify(this._lastTurnSips()));
    });
    effect(() => {
      this.localSrv.saveData(GameService.LAST_TURN_GIVEN_KEY, JSON.stringify(this._lastTurnGiven()));
    });

    // Detect newly-added Phase 2 cards (local OR via realtime sync in room mode)
    // and populate the per-draw badge signals. This makes the pink/orange per-draw
    // badges visible to remote clients that receive the update via KetalSession
    // realtime sync — they never enter displayNewCard themselves.
    effect(() => {
      const game = this._game();
      if (!game || game.phase !== 2) {
        this._prevDrinkLen = 0;
        this._prevGiveLen = 0;
        return;
      }
      const drinkLen = game.drinkingCards?.length ?? 0;
      const giveLen = game.givingCards?.length ?? 0;
      const newDrink = drinkLen > this._prevDrinkLen;
      const newGive = giveLen > this._prevGiveLen;
      this._prevDrinkLen = drinkLen;
      this._prevGiveLen = giveLen;
      if (!newDrink && !newGive) {
        return;
      }
      const latestCard = newGive ? game.givingCards?.[giveLen - 1] : game.drinkingCards?.[drinkLen - 1];
      if (!latestCard) {
        return;
      }
      const { drinkMap, giveMap } = this.computeTurnMapsForCard(latestCard, newGive, game.players ?? []);
      this._lastTurnSips.set(drinkMap);
      this._lastTurnGiven.set(giveMap);
    });

    // Register cleanup on service destruction
    this.destroyRef.onDestroy(() => {
      this.unsubscribeFromSession();
    });
  }

  /** Pure helper: for a newly drawn Phase 2 card, compute which players match
   * (they have a card of the same value in hand) and what sip count each owes. */
  private computeTurnMapsForCard(
    card: CardType,
    isGiving: boolean,
    players: PlayerModel[]
  ): { drinkMap: Record<string, number>; giveMap: Record<string, number> } {
    const sipNb = card.sips ?? 0;
    const drinkMap: Record<string, number> = {};
    const giveMap: Record<string, number> = {};
    if (sipNb <= 0) {
      return { drinkMap, giveMap };
    }
    players.forEach((player) => {
      let sipTurnNb = 0;
      player.cards?.forEach((c) => {
        if (c.value === card.value) {
          sipTurnNb += sipNb;
        }
      });
      if (sipTurnNb > 0 && (player.cards?.length ?? 0) >= 4) {
        if (isGiving) {
          giveMap[player.id] = sipTurnNb;
        } else {
          drinkMap[player.id] = sipTurnNb;
        }
      }
    });
    return { drinkMap, giveMap };
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
   * Save game state to Appwrite via KetalSessionService.
   * Used in room mode for multiplayer games.
   *
   * If a sync is already in progress, the game state is queued and a follow-up
   * sync is triggered after the current one completes. This ensures no mutations
   * are silently dropped while still preventing concurrent API calls.
   *
   * @param game - The game state to sync
   */
  private async saveToAppwrite(game: Game): Promise<void> {
    // If a sync is already in progress, queue this state for a follow-up sync
    if (this._isSyncing()) {
      this._pendingGameSync = JSON.parse(JSON.stringify(game));
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
      console.error(
        '[GameService] Failed to sync to Appwrite:',
        error instanceof Error ? error.message : JSON.stringify(error)
      );
    } finally {
      this._isSyncing.set(false);

      // Apply any pending realtime session update that arrived during sync.
      // Must happen before the follow-up game sync so the session update
      // can be processed while _isSyncing is still false.
      if (this._pendingSessionUpdate) {
        const pending = this._pendingSessionUpdate;
        this._pendingSessionUpdate = null;
        this.handleSessionUpdate(pending);
      }

      // If another mutation was queued during this sync, trigger a follow-up sync
      if (this._pendingGameSync) {
        const pendingGame = this._pendingGameSync;
        this._pendingGameSync = null;
        this.saveToAppwrite(pendingGame);
      }
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
   * Delegates to KetalSessionService which manages subscriptions across all 3 collections.
   *
   * @param sessionId - The session ID to subscribe to
   */
  subscribeToSessionUpdates(sessionId: string): void {
    // Cleanup any existing subscription first
    this.unsubscribeFromSession();

    // Store the session ID for reconnection
    this.activeSessionId = sessionId;

    // Subscribe via KetalSessionService (handles ketal_sessions + ketal_players + ketal_cards)
    this.ketalSessionService.subscribeToSession(sessionId, (updatedSession) => {
      this.handleSessionUpdate(updatedSession);
    });

    console.debug('[GameService] Subscribed to session updates', { sessionId });
  }

  /**
   * Unsubscribe from the current session's realtime updates.
   * Called when game ends, room is left, or service is destroyed.
   */
  unsubscribeFromSession(): void {
    this.ketalSessionService.unsubscribe();
    console.debug('[GameService] Unsubscribed from session');
    // Note: activeSessionId is NOT cleared here to allow reconnection.
    // It is only cleared in resetGame() when the game truly ends.
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
  /** Pending session update received while syncing */
  private _pendingSessionUpdate: KetalSession | null = null;

  handleSessionUpdate(session: KetalSession): void {
    // If we're syncing to Appwrite, queue the update to apply after sync completes
    if (this._isSyncing()) {
      console.debug('[GameService] handleSessionUpdate - queued (syncing)');
      this._pendingSessionUpdate = session;
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
      console.error(
        '[GameService] Failed to handle session update:',
        error instanceof Error ? error.message : JSON.stringify(error)
      );
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
      console.error(
        '[GameService] handleReconnection - failed:',
        error instanceof Error ? error.message : JSON.stringify(error)
      );
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
   * Force the persisted `summary` flag to false. Called at auth resolution
   * for anonymous users so a summary flag inherited from a prior logged-in
   * session cannot leak into Partie rapide.
   */
  clearPersistedSummary(): void {
    const game = this._game();
    if (game && game.summary) {
      this.updateGame((g) => {
        g.summary = false;
      });
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
  }

  /**
   * Add a card to the drinking cards array.
   * Note: In Phase 2, the batched displayNewCard() path is used instead.
   * This method is kept for direct unit testing and potential Phase 1 use.
   */
  addDrinkingCard(card: CardType): void {
    this.updateGame((game) => game.drinkingCards.push(card));
  }

  /**
   * Add a card to the giving cards array.
   * Note: In Phase 2, the batched displayNewCard() path is used instead.
   * This method is kept for direct unit testing and potential Phase 1 use.
   */
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
    // Clear session ID — game is truly ending
    this.activeSessionId = null;
    this._pendingSessionUpdate = null;
    this._pendingGameSync = null;
    // Clear per-turn sip indicators (both drink and give)
    this._lastTurnSips.set({});
    this._lastTurnGiven.set({});

    // Clean up solo room state and leave room
    this.soloRoomService.reset();
    const room = this.roomService.currentRoom();
    if (room) {
      this.roomService.leaveRoom(room.$id);
    }

    this.updateGame((game) => {
      game.givingCards = [];
      game.drinkingCards = [];
      game.phase = 0;
      game.turn = 0;
      game.activePlayer = undefined;
      game.status = 0;

      game.players.forEach((player) => {
        player.sips = { drunk: 0, given: 0, phase1Drunk: 0 };
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
      console.error(
        '[GameService] Failed to finalize game stats:',
        error instanceof Error ? error.message : JSON.stringify(error)
      );
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

      // In Phase 2, a drink event (received via give-modal distribution) must
      // show on the orange per-event badge for the receiving player. The map is
      // keyed by player ID so different recipients in the same modal save don't
      // collide; we overwrite (not accumulate) so a duplicate save on the same
      // player replaces instead of doubling the badge.
      if (drink && game.phase === 2 && (currPlayer.cards?.length ?? 0) >= 4) {
        this._lastTurnSips.set({ ...this._lastTurnSips(), [currPlayer.id]: sipNbr });
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

    // Track per-turn sips: only keep the current player's result (replaces previous)
    this._lastTurnSips.set({
      [game.activePlayer!.id]: currentCard.sips ?? 0,
    });

    this.addCardToPlayer(currentCard, game.activePlayer.id);

    this.updateGame((g) => {
      const currentIndex = g.players.findIndex((p) => p.id === g.activePlayer?.id);
      const isLastPlayer = currentIndex === -1 || currentIndex === g.players.length - 1;

      if (isLastPlayer) {
        g.turn++;
        if (g.turn > 4) {
          g.phase = 2;
          g.activePlayer = undefined;
          // Snapshot Phase 1 sips so Phase 2 display shows only Phase 2 sips
          g.players.forEach((p) => {
            p.sips['phase1Drunk'] = p.sips['drunk'] || 0;
          });
          // Keep lastTurnSips visible until first Phase 2 card is drawn
        } else {
          g.activePlayer = g.players[0];
          // Keep lastTurnSips visible — last player's result stays until next player picks
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

  /** Returns the most recently revealed Phase 2 card (give pile takes precedence
   * when both arrays are equal length). Returns `undefined` when no card has
   * been drawn yet — both call sites in footer already null-check the result. */
  getLastCard(): CardType | undefined {
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

    if (this.isNotAllSipsGiven() && game.drinkingCards.length > 0) {
      return;
    }

    // Reset per-event indicators on every Phase 2 card draw; for a drink card we
    // populate drink matches below, for a give card we populate give matches so the
    // giver gets a "+N to give this turn" badge even when no modal/pending counter exists.
    this._lastTurnSips.set({});
    this._lastTurnGiven.set({});

    const newCard = this.cardDeckHelperService.getRandomCard();
    newCard.selected = true;

    const sipNb = this.getSipsNumber();
    newCard.sips = sipNb;

    // Set Phase 2 match value for player-card feedback, then clear after highlight window
    this.phase2LastCardValue.set(newCard.value ?? null);
    setTimeout(() => this.phase2LastCardValue.set(null), 2100);

    // Determine if this is a giving card BEFORE mutating the game state.
    // This is safe because JavaScript is single-threaded: no concurrent mutation
    // can occur between reading the lengths and entering the updateGame closure.
    // The value must be captured here because updateGame mutates the arrays.
    const isGiving = this.drinkingCards().length > this.givingCards().length;

    // Batch all Phase 2 mutations into a single updateGame call to avoid
    // the _isSyncing flag blocking intermediate Appwrite updates (Bug A + B)
    this.updateGame((g) => {
      // Deselect previous cards
      g.givingCards.forEach((card) => (card.selected = false));
      g.drinkingCards.forEach((card) => (card.selected = false));

      // Mark matching player cards as selected and assign givenSips
      g.players?.forEach((player) => {
        player.cards?.forEach((card) => {
          card.selected = card.value === newCard.value;
          if (card.selected && this.isSummaryActivated() && isGiving && sipNb > 0) {
            card.givenSips = sipNb;
          }
        });
      });

      // Add sips to players and track per-draw amounts for badge display
      const turnSipsMap: Record<string, number> = {};
      const turnGivenMap: Record<string, number> = {};
      g.players?.forEach((player) => {
        player.sips ??= { drunk: 0, given: 0 };
        let sipTurnNb = 0;
        player.cards?.forEach((c) => {
          if (c.value === newCard.value) {
            sipTurnNb += sipNb;
          }
        });
        if (sipTurnNb > 0) {
          if (!player.cards || player.cards.length < 4) {
            player.sips['drunk'] += sipTurnNb;
          } else {
            player.sips[!isGiving ? 'drunk' : 'given'] += sipTurnNb;
          }
          // Drink card → matched players drink this event; Give card → matched players
          // must give this event (each tracked for their own badge).
          if (isGiving) {
            turnGivenMap[player.id] = sipTurnNb;
          } else {
            turnSipsMap[player.id] = sipTurnNb;
          }
        }
      });
      this._lastTurnSips.set(turnSipsMap);
      this._lastTurnGiven.set(turnGivenMap);

      // Add the card to the appropriate array
      if (isGiving) {
        g.givingCards.push(newCard);
      } else {
        g.drinkingCards.push(newCard);
      }

      // Check if game is finished (6 giving cards)
      if (g.givingCards.length === 6) {
        g.status = 2;
      }
    });

    // Finalize game stats if finished
    if (this.status() === 2) {
      this.finalizeGameStats();
    }

    return newCard;
  }

  /**
   * Add sips to all players whose cards match the given card value.
   * Note: In Phase 2, the batched displayNewCard() path handles sips inline.
   * This method is kept for direct unit testing.
   */
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

  /**
   * Save a card and assign sips to matching players.
   * Note: In Phase 2, the batched displayNewCard() path handles this inline.
   * This method is kept for direct unit testing.
   */
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
      try {
        await this.startGameInRoom(withSummaryMode);
      } catch (error) {
        console.warn('[GameService] Appwrite session may be orphaned - will need cleanup on reconnection');
        console.warn('[GameService] Room mode failed, falling back to local mode:', error);
        this.startGameLocally(withSummaryMode);
      }
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

      // Create session in Appwrite (initially status=waiting, phase=setup)
      const session = await this.ketalSessionService.startGame(room.$id, ketalPlayers, withSummary);

      // Transition session to playing state (status=playing, phase=dealing, turn=1)
      const activeSession = await this.ketalSessionService.updateSession(session.$id, {
        status: 'playing',
        phase: 'dealing',
        turn: 1,
        activePlayerId: ketalPlayers.length > 0 ? ketalPlayers[0].memberId : null,
      });

      // Subscribe to session updates for realtime sync (Story 12.5)
      this.subscribeToSessionUpdates(activeSession.$id);

      // Convert session to local Game format and update signal
      const game = mapSessionToGame(activeSession);
      this._game.set(game);

      console.debug('[GameService] Game started in room mode', { sessionId: activeSession.$id });
    } catch (error) {
      console.error(
        '[GameService] Failed to start game in room:',
        error instanceof Error ? error.message : JSON.stringify(error)
      );
      throw error; // Caught by beginGame for offline fallback
    }
  }

  /**
   * Start a game in local/offline mode.
   * Uses localStorage for persistence.
   *
   * @param withSummaryMode - Whether to enable summary mode at game end
   */
  private startGameLocally(withSummaryMode: boolean): void {
    const raw = this.localSrv.getData('players');
    let players: PlayerModel[] = raw ? JSON.parse(raw as string) : [];

    // Fallback to in-memory players from PlayerHelperService
    if (!players || players.length === 0) {
      players = this.playerHelper.getPlayers();
    }

    if (!players || players.length === 0) {
      console.error('[GameService] Cannot start local game: no players found');
      return;
    }

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
    const raw = this.localSrv.getData('players');
    let players: PlayerModel[] = raw ? JSON.parse(raw as string) : [];
    if (!players || players.length === 0) {
      players = this.playerHelper.getPlayers();
    }
    return players.map((player, index) => mapPlayerModelToKetalPlayer(player, index));
  }

  /**
   * Get the per-turn sip count for a player from the most recently dealt card.
   * Returns 0 if no sips were assigned this turn or the turn has advanced.
   */
  getLastTurnSipsForPlayer(playerId: string): number {
    return this._lastTurnSips()[playerId] ?? 0;
  }

  /** Get the per-draw give sips for a player (Phase 2 give card match). */
  getLastTurnGivenForPlayer(playerId: string): number {
    return this._lastTurnGiven()[playerId] ?? 0;
  }

  /**
   * Clear the per-turn sip indicators for drink and give.
   * Used when the sip-giving modal is closed to remove persistent badges.
   */
  clearLastTurnIndicators(): void {
    this._lastTurnSips.set({});
    this._lastTurnGiven.set({});
  }

  /** Clear the per-turn give indicator for a single player. Used when the giver
   * finishes distributing via the modal — the pink "+N 🍷" per-event badge
   * should disappear since the obligation is settled. */
  clearLastTurnGivenForPlayer(playerId: string): void {
    this._lastTurnGiven.update((state) => {
      if (!(playerId in state)) {
        return state;
      }
      const next = { ...state };
      delete next[playerId];
      return next;
    });
  }

  openSipGiveModal(player: PlayerModel): void {
    this.openSipGiveModalEvent.next(player);
  }

  /** Pause the game and navigate to menu (Story 14.0) */
  pauseGame(): void {
    this.paused.set(true);
  }

  /** Resume the paused game (Story 14.0) */
  resumeGame(): void {
    this.paused.set(false);
  }

  /** Check if a game is currently in progress (started or finished but not reset) */
  isGameInProgress(): boolean {
    return this.isGameStarted() || this.isGameFinished();
  }
}
