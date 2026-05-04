import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
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

  readonly inactivePlayers = computed(() => {
    const active = this.gameSrv.activePlayer();
    if (!active) {
      return [];
    }
    return this.gameSrv.players().filter((p) => p.id !== active.id);
  });

  // ── Phase 2 compact: persistent, compares vs ONLY the last drawn card ──
  readonly phase2CompactState = computed<Record<string, boolean>>(() => {
    if (this.gameSrv.phase() !== 2) {
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
    return result;
  });

  // ── Phase 1 compact delay control ──
  // Uses a signal so Angular OnPush detects changes from 3s timeouts
  private readonly compactState = signal<Map<string, number | string>>(new Map());

  /** Phase 1: when active player changes, reset compact states.
   * Inactive players start full (compactDelay = 3000), then become compact after 3s. */
  private readonly compactResetEffect = effect(() => {
    const currentActiveId = this.gameSrv.activePlayer()?.id ?? null;
    this.compactState.update((currentState) => {
      const newState = new Map<string, number | string>(currentState);
      const prevActiveId = newState.get('__activePlayer') ?? null;

      gameState: {
        if (currentActiveId !== prevActiveId) {
          // Active player changed — reset all inactive player delays to full (3000)
          const oldKeys = Array.from(newState.keys()).filter((k) => k !== '__activePlayer');
          oldKeys.forEach((k) => newState.delete(k));
          if (currentActiveId) {
            newState.set('__activePlayer', currentActiveId);
          }

          // Schedule 3s timeout for each inactive player to become compact
          for (const playerId of oldKeys) {
            if (playerId !== currentActiveId) {
              setTimeout(() => {
                this.compactState.update((s) => s.set(playerId, 0));
              }, 3000);
            }
          }
          break gameState;
        }
      }
      return newState;
    });
  });

  /** Get compact delay value for a player in Phase 1. */
  getCompactDelay(playerId: string): number {
    if (this.gameSrv.phase() !== 1) {
      return 0;
    }
    const activeId = this.gameSrv.activePlayer()?.id;
    if (!activeId || playerId === activeId) {
      return 0;
    }
    const state = this.compactState();
    const value = state.get(playerId);
    if (value === undefined) {
      return 3000;
    }
    if (typeof value === 'number') {
      return value;
    }
    return 3000;
  }

  /** Phase 2 compact state accessor for a player by ID */
  isPhase2Compact(playerId: string): boolean {
    return this.phase2CompactState()[playerId] ?? false;
  }
}
