import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  Input,
  input,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { FontAwesomeIconsModule } from '../../../font-awesome.module';
import { PlayerHelperService } from '../../../_shared/_helpers/player.helper';
import { PlayerModel } from '../../../_shared/_models/player.model';
import { GameService } from '../../../services/game/game.service';
import { PlayerGivenSipsSelectionComponent } from '../player-given-sips-selection/player-given-sips-selection.component';
import { PlayingCardComponent } from '../../../_shared/_components/playing-card/playing-card.component';
import { AuthService } from '../../../services/auth/auth.service';

@Component({
  selector: 'app-player-card',
  templateUrl: './player-card.component.html',
  styleUrls: ['./player-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgClass, TranslateModule, FontAwesomeIconsModule, PlayerGivenSipsSelectionComponent, PlayingCardComponent],
})
export class PlayerCardComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);
  private readonly playerSrv = inject(PlayerHelperService);
  readonly gameSrv = inject(GameService);
  private readonly authService = inject(AuthService);

  @ViewChild(PlayerGivenSipsSelectionComponent)
  private playerGivenSipsModal: PlayerGivenSipsSelectionComponent | undefined;

  /** NOTE on reactivity: `player` is a plain `@Input` (not an `input()` signal), yet
   * the computeds below read `this.player.sips` / `this.player.cards`. Re-evaluation
   * relies on `gameSrv.game()` ticking whenever player data changes — which is
   * always the case because mutations flow through `GameService.updateGame()` which
   * calls `_game.set(...)`. Any change to `player` identity or contents therefore
   * happens alongside a game-signal emission. Do not introduce code paths that
   * mutate `player` without going through `updateGame` or the badges will go stale. */
  @Input() player: PlayerModel = new PlayerModel();
  @Input() isActive = false;
  @Input() hasActivePlayer = false;
  compact = input(false); // Signal input for OnPush detection

  readonly cardSlots = [0, 1, 2, 3];

  /** Avatar load error flag */
  avatarError = false;

  /** Bounce animation trigger */
  readonly sipBounce = signal(false);
  /** Shake animation for large sip jumps */
  readonly sipShake = signal(false);
  /** Match highlight when Phase 2 card matches player's hand */
  readonly matchHighlight = signal(false);

  /** Player initials for avatar fallback */
  readonly initials = computed(() => {
    if (!this.player?.name) {
      return '?';
    }
    return this.player.name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  });

  /** Cached sip count (signed) - recomputed via game signal */
  readonly sipCount = computed(() => {
    return this.player ? this.playerSrv.getSipCnt(this.gameSrv.game(), this.player, false) : 0;
  });

  /** Cached absolute sip count - recomputed via game signal */
  readonly sipCountAbsolute = computed(() => {
    return this.player ? this.playerSrv.getSipCnt(this.gameSrv.game(), this.player, true) : 0;
  });

  /** Cumulative sips drunk in Phase 2 (mirrors Phase 1 red-badge semantics).
   * Per-event amount is carried by the orange `lastTurnSips` badge instead. */
  readonly sipsDrunk = computed(() => {
    const game = this.gameSrv.game();
    if (game.phase === 2 && this.player?.sips) {
      const total = this.player.sips['drunk'] ?? 0;
      const phase1 = this.player.sips['phase1Drunk'] ?? 0;
      return total - phase1;
    }
    const count = this.sipCount();
    return count < 0 ? Math.abs(count) : 0;
  });

  /** Cumulative sips to give in Phase 2 (historical). Pending still-to-dispatch is
   * surfaced separately via `sipsGivenPending`. */
  readonly sipsGiven = computed(() => {
    const game = this.gameSrv.game();
    if (game.phase === 2 && this.player?.sips) {
      return this.player.sips['given'] ?? 0;
    }
    const count = this.sipCount();
    return count > 0 ? count : 0;
  });

  /** Pending sips not yet distributed via the give modal. Only meaningful when summary
   * mode is active (otherwise `card.givenSips` is never assigned, so this stays 0). */
  readonly sipsGivenPending = computed(() => {
    const game = this.gameSrv.game();
    if (game.phase === 2 && this.player) {
      return this.playerSrv.getTotalGivenSips(this.player);
    }
    return 0;
  });

  /** Sip severity for color-coded counter (T4) */
  readonly sipSeverity = computed<'low' | 'medium' | 'high'>(() => {
    const abs = this.sipCountAbsolute();
    if (abs >= 13) {
      return 'high';
    }
    if (abs >= 6) {
      return 'medium';
    }
    return 'low';
  });

  /** Per-turn drink indicator (Phase 1 & Phase 2 drink events). Resets when
   * the active player changes (Phase 1) or next card is drawn (Phase 2). */
  readonly lastTurnSips = computed(() => {
    this.gameSrv.lastTurnSips();
    return this.player ? this.gameSrv.getLastTurnSipsForPlayer(this.player.id) : 0;
  });

  /** Per-turn give indicator (Phase 2 give events only). Works with or without
   * summary mode — shows how many sips this player must give this draw. Clears
   * on next card draw. */
  readonly lastTurnGiven = computed(() => {
    this.gameSrv.lastTurnGiven();
    return this.player ? this.gameSrv.getLastTurnGivenForPlayer(this.player.id) : 0;
  });

  private sipInitialized = false;
  private prevSipCount = 0;
  private bounceTimer: ReturnType<typeof setTimeout> | null = null;
  private shakeTimer: ReturnType<typeof setTimeout> | null = null;
  private matchTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    // Trigger bounce/shake animation when sip count changes (skip initial)
    effect(() => {
      const current = this.sipCountAbsolute();
      if (!this.sipInitialized) {
        this.sipInitialized = true;
        this.prevSipCount = current;
        return;
      }

      const delta = Math.abs(current - this.prevSipCount);
      this.prevSipCount = current;

      // Always bounce
      if (this.bounceTimer) {
        clearTimeout(this.bounceTimer);
      }
      this.sipBounce.set(true);
      this.bounceTimer = setTimeout(() => this.sipBounce.set(false), 300);

      // Shake on large jumps (3+ sips at once)
      if (delta >= 3) {
        if (this.shakeTimer) {
          clearTimeout(this.shakeTimer);
        }
        this.sipShake.set(true);
        this.shakeTimer = setTimeout(() => this.sipShake.set(false), 400);
      }
    });

    // Match highlight when Phase 2 card matches (T6)
    effect(() => {
      const matchValue = this.gameSrv.phase2LastCardValue?.();
      if (!matchValue || !this.player?.cards) {
        this.matchHighlight.set(false);
        return;
      }
      const hasMatch = this.player.cards.some((c) => c?.value === matchValue);
      if (hasMatch) {
        if (this.matchTimer) {
          clearTimeout(this.matchTimer);
        }
        this.matchHighlight.set(true);
        this.matchTimer = setTimeout(() => this.matchHighlight.set(false), 2000);
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.bounceTimer) {
        clearTimeout(this.bounceTimer);
      }
      if (this.shakeTimer) {
        clearTimeout(this.shakeTimer);
      }
      if (this.matchTimer) {
        clearTimeout(this.matchTimer);
      }
    });
  }

  ngOnInit(): void {
    this.gameSrv.openSipGiveModalEvent$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((player) => {
      if (this.player.id === player.id) {
        this.openPlayerGivenSipsModal(player);
      }
    });

    // On component mount (incl. after page refresh), if this player has pending
    // givenSips to distribute, auto-open the modal so the user isn't stuck.
    // Anonymous users don't use summary/give flows — skip the timer entirely.
    if (!this.authService.isLoggedIn() || this.authService.isAnonymous()) {
      return;
    }
    // Deferred to next tick so @ViewChild (playerGivenSipsModal) is resolved.
    setTimeout(() => {
      if (this.player && this.playerSrv.getTotalGivenSips(this.player) > 0) {
        this.openPlayerGivenSipsModal(this.player);
      }
    }, 0);
  }

  openPlayerGivenSipsModal(player: PlayerModel): void {
    if (this.playerSrv.getPlayerNumber() === 1 || !this.gameSrv.isSummaryActivated()) {
      return;
    }

    // Anonymous / logged-out users have no summary UI and must not receive give modals
    // (game state might still carry summary=true from a previous logged-in session).
    if (!this.authService.isLoggedIn() || this.authService.isAnonymous()) {
      return;
    }

    if (this.playerSrv.getTotalGivenSips(player) > 0) {
      this.playerGivenSipsModal?.openModal(player);
    }
  }
}
