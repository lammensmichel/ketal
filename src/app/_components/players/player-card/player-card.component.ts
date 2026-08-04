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
import { DisplayModeService } from '../../../services/display-mode/display-mode.service';

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
  private readonly displayMode = inject(DisplayModeService);

  @ViewChild(PlayerGivenSipsSelectionComponent)
  private playerGivenSipsModal: PlayerGivenSipsSelectionComponent | undefined;

  /**
   * Solde de gorgees a distribuer au tick precedent. `null` = effect pas encore
   * passe, ce qui evite d'ouvrir la modale au montage (ngOnInit s'en charge).
   */
  private _prevPendingGiven: number | null = null;

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

  /** Total de gorgees bues sur TOUTE la partie (phase 1 + phase 2).
   *
   * POURQUOI on ne retranche plus `phase1Drunk` (snapshot pris au passage en
   * phase 2) : ce badge est le total de la session et ne doit jamais redescendre
   * entre les deux phases. Le montant du tirage courant est porte separement par
   * le badge orange `lastTurnSips`, alimente par GameService — donc rendre ce
   * total cumulatif n'affecte pas l'affichage « par tirage ».
   * Voir aussi PlayerHelperService.getSipCnt pour le detail du raisonnement. */
  readonly sipsDrunk = computed(() => {
    const game = this.gameSrv.game();
    if (game.phase === 2 && this.player?.sips) {
      return this.player.sips['drunk'] ?? 0;
    }
    const count = this.sipCount();
    return count < 0 ? Math.abs(count) : 0;
  });

  /** Total de gorgees a donner sur toute la partie (`given` n'est alimente qu'en
   * phase 2, il est donc deja cumulatif). Le solde encore a distribuer est
   * expose separement via `sipsGivenPending`. */
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

    // Ouverture de la modale de distribution pilotee par l'ETAT, et non par
    // l'emission locale du footer.
    //
    // openSipGiveModal() du footer ne s'execute que sur l'appareil qui tire la
    // carte. En multi-appareils, le joueur qui doit donner ne recoit l'etat que
    // par la synchro realtime de KetalSession — il n'entre jamais dans
    // displayNewCard() — et sa modale ne s'ouvrait donc jamais. Meme raison qui
    // avait deja impose un effect pour les badges par tirage.
    effect(() => {
      const players = this.gameSrv.players();
      const me = players.find((p) => p.id === this.player?.id);
      const pending = me ? this.playerSrv.getTotalGivenSips(me) : 0;

      const previous = this._prevPendingGiven;
      this._prevPendingGiven = pending;

      // Premier passage : on memorise seulement. L'ouverture au montage (apres
      // un F5 avec des gorgees en attente) reste geree par ngOnInit, sans quoi
      // la modale s'ouvrirait deux fois.
      if (previous === null) {
        return;
      }

      // Front montant uniquement : sinon la modale se reouvrirait a chaque
      // distribution partielle, tant que le solde reste positif.
      if (previous === 0 && pending > 0 && me) {
        // Differe d'un tick : @ViewChild n'est pas encore resolu au premier
        // passage de l'effect.
        setTimeout(() => this.openPlayerGivenSipsModal(me), 0);
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

  /**
   * Est-ce ma fiche ? Vrai uniquement en mode `personnel` : en `table` et en
   * `viewer` il n'y a pas de « moi » a distinguer, et le rendu doit rester
   * exactement celui d'aujourd'hui.
   */
  isMyCard(): boolean {
    return this.displayMode.isMyPlayer(this.player?.id);
  }

  /**
   * Verrouillage porte par la VUE, jamais par le jeu : c'est le mode d'affichage
   * de CET appareil qui decide si la distribution de gorgees de ce joueur est
   * actionnable ici. En `table` (defaut) la reponse est toujours oui, donc rien
   * ne change. Ne remontez pas ce test dans GameService : le mode `table` et les
   * joueurs fictifs ont besoin que le jeu reste permissif.
   */
  canControlThisPlayer(): boolean {
    return this.displayMode.canControlPlayer(this.player?.id);
  }

  openPlayerGivenSipsModal(player: PlayerModel): void {
    if (!this.displayMode.canControlPlayer(player?.id)) {
      return;
    }

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
