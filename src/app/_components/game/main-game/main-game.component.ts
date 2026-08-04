import { ChangeDetectionStrategy, Component, computed, effect, HostListener, inject, signal } from '@angular/core';
import { DisplayModeService } from '../../../services/display-mode/display-mode.service';
import { GameService } from '../../../services/game/game.service';
import { GameProgressComponent } from '../../../_shared/_components/game-progress/game-progress.component';
import { PlayerCardComponent } from '../../players/player-card/player-card.component';
import { GameSummaryComponent } from '../game-summary/game-summary.component';
import { PlayerModel } from '../../../_shared/_models/player.model';

@Component({
  selector: 'app-main-game',
  templateUrl: './main-game.component.html',
  styleUrls: ['./main-game.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [GameProgressComponent, PlayerCardComponent, GameSummaryComponent],
})
export class MainGameComponent {
  readonly gameSrv = inject(GameService);
  readonly displayMode = inject(DisplayModeService);

  /**
   * Ordre d'affichage des fiches.
   *
   * En mode `personnel`, ma fiche passe simplement en tete : c'est la seule
   * chose que fait la « mise en avant » cote structure. On ne change AUCUN
   * layout — meme grille, meme strip, memes composants. L'autre moitie de la
   * mise en avant est la non-compaction (voir getCompactDelay / phase2CompactState).
   * En `table` et `viewer`, l'ordre reste exactement celui du jeu.
   */
  readonly displayPlayers = computed(() => {
    const players = this.gameSrv.players();
    const myId = this.displayMode.isPersonalView() ? this.displayMode.myPlayerId() : null;
    if (!myId || !players.some((p) => p.id === myId)) {
      return players;
    }
    return [...players.filter((p) => p.id === myId), ...players.filter((p) => p.id !== myId)];
  });

  readonly inactivePlayers = computed(() => {
    const active = this.gameSrv.activePlayer();
    if (!active) {
      return [];
    }
    return this.displayPlayers().filter((p) => p.id !== active.id);
  });

  // ── Viewport tracking for dynamic compact decision ──
  /** Estimated full-mode player card height (incl. gap). Calibrated so a
   * typical desktop viewport (≥800px tall) keeps 6 players full instead of
   * falling back to the compact strip when there's clearly room. */
  private static readonly FULL_CARD_HEIGHT = 200;
  /** Vertical UI chrome reserved for header + footer panel. */
  private static readonly RESERVED_HEIGHT = 180;

  private readonly _viewportH = signal(typeof window !== 'undefined' ? window.innerHeight : 800);
  private readonly _viewportW = signal(typeof window !== 'undefined' ? window.innerWidth : 800);

  @HostListener('window:resize')
  onWindowResize(): void {
    this._viewportH.set(window.innerHeight);
    this._viewportW.set(window.innerWidth);
  }

  /** True when the current viewport can fit every player in FULL mode without
   * the user having to scroll. Drives compact decisions across both phases. */
  readonly canFitAllFull = computed(() => {
    const playerCount = this.gameSrv.players().length;
    if (playerCount === 0) {
      return true;
    }
    const available = this._viewportH() - MainGameComponent.RESERVED_HEIGHT;
    const cols = this._viewportW() >= 768 ? 2 : 1;
    const rows = Math.ceil(playerCount / cols);
    return rows * MainGameComponent.FULL_CARD_HEIGHT <= available;
  });

  // ── Phase 2 compact: persistent, compares vs ONLY the last drawn card ──
  readonly phase2CompactState = computed<Record<string, boolean>>(() => {
    if (this.gameSrv.phase() !== 2) {
      return {};
    }

    // When the screen has room for everyone in full mode, never compact.
    if (this.canFitAllFull()) {
      return {};
    }

    // The last drawn card value — the source of truth for compaction matching
    const drinking = this.gameSrv.drinkingCards();
    const giving = this.gameSrv.givingCards();
    const lastCard = giving.length >= drinking.length ? giving[giving.length - 1] : drinking[drinking.length - 1];

    const lastValue = lastCard?.value;
    if (!lastValue) {
      return {};
    }

    const result: Record<string, boolean> = {};
    for (const player of this.gameSrv.players()) {
      const hasMatch = player.cards?.some((c) => c && c.value === lastValue) ?? false;
      result[player.id] = !hasMatch; // true = compact, false = has matching card
    }

    // Mode personnel : ma fiche reste dépliée quoi qu'il arrive — mon téléphone
    // est censé montrer ma main de cartes, pas une vignette.
    const myId = this.displayMode.isPersonalView() ? this.displayMode.myPlayerId() : null;
    if (myId && myId in result) {
      result[myId] = false;
    }
    return result;
  });

  /** Track which player was last active. Used to detect when active player changes. */
  private _lastActiveId: string | null = null;
  /** Map of inactive players currently in compact mode. Absence from the map means
   * the player is rendered FULL (used during the 3s "drink reveal" window so the
   * orange +N badge is prominent before the card shrinks). */
  private readonly compactState = signal<Map<string, number>>(new Map());

  /** Phase 1: on active-player change, decide compact vs full for each inactive
   * player. Inactive without sips → compact immediately. Inactive with sips →
   * stay full for 3s (player isn't in the map), then a setTimeout flips them
   * to compact. Always rewrites the map — otherwise stale "compact" entries
   * from a previous round survive and block the full window the next time the
   * same player picks. */
  private readonly compactResetEffect = effect(() => {
    const currentActiveId = this.gameSrv.activePlayer()?.id ?? null;
    const players = this.gameSrv.players();

    if (currentActiveId === this._lastActiveId) {
      return;
    }
    this._lastActiveId = currentActiveId;

    const newState = new Map<string, number>();
    const inactivePlayerIds = currentActiveId
      ? players.filter((p) => p.id !== currentActiveId).map((p) => p.id)
      : players.map((p) => p.id);

    for (const playerId of inactivePlayerIds) {
      const sips = this.gameSrv.getLastTurnSipsForPlayer(playerId);
      if (sips > 0) {
        setTimeout(() => {
          this.compactState.update((state) => {
            const s = new Map(state);
            s.set(playerId, 0);
            return s;
          });
        }, 3000);
      } else {
        newState.set(playerId, 0);
      }
    }

    this.compactState.set(newState);
  });

  /** Get compact delay value for a player in Phase 1. */
  getCompactDelay(playerId: string): number {
    // Mode personnel : ma fiche n'est jamais compactee (0 = compact). Meme
    // raison qu'en phase 2 : cet ecran est ma main de cartes.
    if (this.displayMode.isMyPlayer(playerId)) {
      return 3000;
    }
    if (this.gameSrv.phase() !== 1) {
      return 0;
    }
    // Plenty of vertical room: keep every inactive player full so the user
    // doesn't lose context when they're not the spotlight.
    if (this.canFitAllFull()) {
      return 3000;
    }
    const activeId = this.gameSrv.activePlayer()?.id;
    if (!activeId || playerId === activeId) {
      return 0;
    }
    const state = this.compactState();

    // If the player has no entry in compactState, they're still full (3s before compact)
    const value = state.get(playerId);
    if (value === undefined) {
      return 3000; // Still full — hasn't been assigned yet (first run or player count changed)
    }

    // If value is 0, they're already compact
    return value; // 0 or 3000
  }

  /** Phase 2 compact state accessor for a player by ID */
  isPhase2Compact(playerId: string): boolean {
    return this.phase2CompactState()[playerId] ?? false;
  }
}
