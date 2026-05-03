import { Component, Input, ViewChild, OnDestroy, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { NgClass } from '@angular/common';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { AuthService } from '../../../services/auth/auth.service';
import { GameService } from '../../../services/game/game.service';
import { SoloRoomService } from '../../../services/solo-room/solo-room.service';
import { PlayerHelperService } from '../../_helpers/player.helper';
import { CardType } from '../../_models/card-type.model';
import { PlayerModel } from '../../_models/player.model';
import { DrinkChoiceEnum } from '../../_models/enums/drink_choice.enum';
import { ToastComponent } from '../toast/toast.component';
import { PlayingCardComponent } from '../playing-card/playing-card.component';
import { AccountGateModalComponent } from '../../../_components/auth/account-gate-modal/account-gate-modal.component';

/** Animation phase for prediction flow */
type AnimationPhase = 'idle' | 'selected' | 'revealing' | 'result' | 'transitioning';

/** Routes where the game footer should be hidden */
const HIDDEN_ROUTES = ['/login', '/register', '/forgot-password', '/room', '/home'];

/** Key used to store pending summary flag in localStorage */
const PENDING_SUMMARY_KEY = 'pendingSummary';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  standalone: true,
  imports: [
    TranslateModule,
    FontAwesomeIconsModule,
    NgClass,
    ToastComponent,
    PlayingCardComponent,
    AccountGateModalComponent,
  ],
})
export class FooterComponent implements OnDestroy {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  readonly gameSrv = inject(GameService);
  private readonly soloRoomService = inject(SoloRoomService);
  readonly playerHelper = inject(PlayerHelperService);

  @Input() public withSummaryMode: boolean = false;
  @ViewChild('notAllSipsGiven') toastComponent: ToastComponent | undefined;
  @ViewChild('accountGateModal') accountGateModal: AccountGateModalComponent | undefined;

  readonly cardSlots = [0, 1, 2, 3, 4, 5];

  /** Guard flag to prevent double-click on beginGame */
  private _beginGameInProgress = false;

  // === Animation state for prediction flow ===
  readonly animationPhase = signal<AnimationPhase>('idle');
  readonly selectedChoice = signal<string | null>(null);
  readonly revealedCard = signal<CardType | null>(null);
  readonly predictionCorrect = signal<boolean | null>(null);
  /** The turn number during animation (null when not animating) */
  readonly animatingTurn = signal<number | null>(null);
  /** The ID of the player who triggered the animation — frozen for the animation duration
   * so the UI keeps showing that player's data even after `gameSrv.activePlayer()` advances. */
  readonly animatingPlayerId = signal<string | null>(null);
  /** Player to display in the prediction panel: frozen during animation, else the current active player. */
  readonly displayPlayer = computed<PlayerModel | null>(() => {
    const id = this.animatingPlayerId();
    if (id) {
      return this.gameSrv.players().find((p) => p.id === id) ?? this.gameSrv.activePlayer() ?? null;
    }
    return this.gameSrv.activePlayer() ?? null;
  });
  /** Track if we're transitioning between turns */
  readonly turnTransitioning = signal(false);

  /** Whether the prediction panel is locked during animation */
  readonly isAnimationLocked = computed(() => this.animationPhase() !== 'idle');
  /** Convenience computed for incorrect prediction check in template */
  readonly predictionIncorrect = computed(() => this.predictionCorrect() === false);

  /** Whether the user prefers reduced motion */
  private readonly prefersReducedMotion =
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Active timeout IDs for animation cleanup on destroy */
  private readonly _animationTimers: ReturnType<typeof setTimeout>[] = [];

  // === Phase 2 draw pile state ===
  /** Whether a Phase 2 card flip is in progress */
  readonly revealingPhase2 = signal(false);
  /** The last drawn Phase 2 card (shown in draw area during flip animation) */
  readonly lastDrawnCard = signal<CardType | null>(null);
  /** Whether the last drawn card was a drink card */
  readonly lastDrawnIsDrink = signal(true);

  /** Whether the next draw is a drink card (even total = drink, odd = give) */
  readonly nextIsDrink = computed(() => {
    const total = this.gameSrv.drinkingCards().length + this.gameSrv.givingCards().length;
    return total % 2 === 0;
  });

  /** Number of sips for the next card */
  readonly nextSipValue = computed(() => this.gameSrv.getSipsNumber());

  /** Whether all 12 Phase 2 cards have been drawn */
  readonly phase2Complete = computed(() => this.gameSrv.givingCards().length >= 6);

  /** Remaining cards in the draw pile */
  readonly cardsRemaining = computed(
    () => 12 - this.gameSrv.drinkingCards().length - this.gameSrv.givingCards().length
  );

  ngOnDestroy(): void {
    this._animationTimers.forEach((id) => clearTimeout(id));
    this._animationTimers.length = 0;
  }

  /** Reference card for Turn 2 (the card drawn in Turn 1 for the active player) */
  getReferenceCard(): CardType | null {
    const activePlayer = this.displayPlayer();
    if (activePlayer?.cards?.length) {
      return activePlayer.cards[0];
    }
    return null;
  }

  /** Check if current route is a page where game footer should be hidden */
  isHiddenPage(): boolean {
    return HIDDEN_ROUTES.some((route) => this.router.url.startsWith(route));
  }

  /** Check if current route is the players page (where local game start UI should be visible) */
  isPlayersPage(): boolean {
    return this.router.url.split('?')[0] === '/players';
  }

  chooseColor(color: string) {
    if (!color) {
      return;
    }
    this.animatedChoice(DrinkChoiceEnum.Color, color);
  }

  plusOrMinus(selection: string) {
    if (!selection) {
      return;
    }
    this.animatedChoice(DrinkChoiceEnum.PlusOrMinus, selection);
  }

  inOut(selection: string) {
    if (!selection) {
      return;
    }
    this.animatedChoice(DrinkChoiceEnum.InAndOut, selection);
  }

  chooseSuit(selection: string) {
    if (!selection) {
      return;
    }
    this.animatedChoice(DrinkChoiceEnum.Suit, selection);
  }

  /**
   * Orchestrates the prediction animation sequence:
   * 1. Button selection highlight (200ms)
   * 2. Card flip reveal (400ms)
   * 3. Result feedback - correct/incorrect (600ms)
   * 4. Slide transition to next turn (300ms)
   *
   * When prefers-reduced-motion is active, delays are minimized.
   */
  private animatedChoice(choiceEnum: DrinkChoiceEnum, selection: string): void {
    if (!selection) {
      return;
    } // Guard: prevent empty selections
    if (this.isAnimationLocked()) {
      return;
    }

    const currentTurn = this.gameSrv.turn();
    const activePlayerId = this.gameSrv.activePlayer()?.id;

    // Timing: respect prefers-reduced-motion
    const t = this.prefersReducedMotion
      ? { select: 0, reveal: 0, result: 100, transition: 0 }
      : { select: 200, reveal: 400, result: 600, transition: 300 };

    // Phase 1: Button selected
    this.animatingTurn.set(currentTurn);
    this.animatingPlayerId.set(activePlayerId ?? null);
    this.selectedChoice.set(selection);
    this.animationPhase.set('selected');

    this._scheduleTimer(() => {
      // Verify turn hasn't changed before executing (fix HIGH #1 race condition)
      if (this.gameSrv.turn() !== currentTurn) {
        return;
      }

      // Execute the actual game logic
      this.gameSrv.setChoiceAndPickCard(choiceEnum, selection);

      // Get the drawn card and result (read sips from card directly to avoid race condition)
      const players = this.gameSrv.players();
      const player = players.find((p) => p.id === activePlayerId);
      const drawnCard = player?.cards[player.cards.length - 1] ?? null;

      this.revealedCard.set(drawnCard);
      this.predictionCorrect.set((drawnCard?.sips ?? 0) === 0);

      // Phase 2: Card flip reveal
      this.animationPhase.set('revealing');

      this._scheduleTimer(() => {
        // Phase 3: Show result
        this.animationPhase.set('result');

        this._scheduleTimer(() => {
          // Phase 4: Slide transition
          this.animationPhase.set('transitioning');
          this.turnTransitioning.set(true);

          this._scheduleTimer(() => {
            // Reset all animation state
            this.animationPhase.set('idle');
            this.selectedChoice.set(null);
            this.revealedCard.set(null);
            this.predictionCorrect.set(null);
            this.animatingTurn.set(null);
            this.animatingPlayerId.set(null);
            this.turnTransitioning.set(false);
          }, t.transition);
        }, t.result);
      }, t.reveal);
    }, t.select);
  }

  /** Schedule a timer and track it for cleanup on destroy */
  private _scheduleTimer(fn: () => void, ms: number): void {
    const id = setTimeout(() => {
      const idx = this._animationTimers.indexOf(id);
      if (idx !== -1) {
        this._animationTimers.splice(idx, 1);
      }
      fn();
    }, ms);
    this._animationTimers.push(id);
  }

  async restartGame(): Promise<void> {
    if (await this.ensureAllSipsGiven()) {
      this.gameSrv.resetGame();
      this.router.navigate(['/players']);
    }
  }

  async displaySummary(): Promise<void> {
    if (await this.ensureAllSipsGiven()) {
      if (this.canAccessSummary()) {
        this.gameSrv.setStatus(3);
      } else {
        this.accountGateModal?.show();
      }
    }
  }

  /**
   * Check if the current user can access the game summary.
   * In local mode (no backend), summary is always accessible.
   * In room mode, requires a non-anonymous authenticated user.
   *
   * Designed for extensibility: can be replaced with subscription check later.
   */
  canAccessSummary(): boolean {
    if (this.gameSrv.gameMode() === 'local') {
      return true;
    }
    return this.authService.isLoggedIn() && !this.authService.isAnonymous();
  }

  onGateCreateAccount(): void {
    localStorage.setItem(PENDING_SUMMARY_KEY, 'true');
    this.router.navigate(['/register']);
  }

  onGateLogin(): void {
    localStorage.setItem(PENDING_SUMMARY_KEY, 'true');
    this.router.navigate(['/login']);
  }

  private async ensureAllSipsGiven(): Promise<boolean> {
    if (!this.gameSrv.isNotAllSipsGiven()) {
      return true;
    }

    this.toastComponent?.show();
    await this.delay(2500);
    this.openSipGiveModal(this.gameSrv.getLastCard());
    return false;
  }

  openSipGiveModal(newCardGiven: CardType | undefined): void {
    if (!this.gameSrv.summary() || this.gameSrv.drinkingCards().length !== this.gameSrv.givingCards().length) {
      return;
    }

    if (!newCardGiven?.value) {
      return;
    }

    const playersWithNewCard = this.gameSrv
      .players()
      .filter((player) => this.playerHelper.getPlayerCardListValues(player).includes(newCardGiven.value!));

    playersWithNewCard.forEach((player) => this.gameSrv.openSipGiveModal(player));
  }

  async onDisplayCard(): Promise<void> {
    const newCardGiven = this.gameSrv.displayNewCard();
    if (newCardGiven) {
      this.openSipGiveModal(newCardGiven);
      return;
    }

    this.toastComponent?.show();
    await this.delay(2500);
    this.openSipGiveModal(this.gameSrv.getLastCard());
  }

  /** Draw the next card from the Phase 2 pile */
  onDrawPhase2Card(): void {
    if (this.revealingPhase2() || this.phase2Complete()) {
      return;
    }

    const isDrink = this.nextIsDrink();

    // Draw the card (adds to drinkingCards/givingCards)
    const newCard = this.gameSrv.displayNewCard();
    if (!newCard) {
      // When sips remain, show toast and auto-open sip modal
      if (this.gameSrv.isNotAllSipsGiven()) {
        this.toastComponent?.show();
        this.openSipGiveModal(this.gameSrv.getLastCard());
      }
      return;
    }

    this.lastDrawnIsDrink.set(isDrink);
    this.revealingPhase2.set(true);
    this.lastDrawnCard.set(newCard);

    const flipDelay = this.prefersReducedMotion ? 50 : 500;

    // Wait for the flip animation, then unlock
    this._scheduleTimer(() => {
      this.revealingPhase2.set(false);
      this.lastDrawnCard.set(null);
      this.openSipGiveModal(newCard);
    }, flipDelay);
  }

  hasPlayers(): boolean {
    return this.playerHelper?.getPlayers()?.length > 1;
  }

  needsMorePlayers(): boolean {
    const count = this.playerHelper?.getPlayers()?.length ?? 0;
    return count > 0 && count < 2;
  }

  async beginGame(): Promise<void> {
    if (this._beginGameInProgress) {
      return;
    }
    this._beginGameInProgress = true;

    try {
      // Await background solo room creation (no-op if already ready or local mode)
      await this.soloRoomService.awaitRoom();
      await this.gameSrv.beginGame(this.withSummaryMode);
      this.router.navigate(['/game']);
    } finally {
      this._beginGameInProgress = false;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
