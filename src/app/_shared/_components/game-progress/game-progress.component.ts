import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { GameService } from '../../../services/game/game.service';

@Component({
  selector: 'app-game-progress',
  templateUrl: './game-progress.component.html',
  styleUrls: ['./game-progress.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [TranslateModule],
})
export class GameProgressComponent {
  private readonly gameSrv = inject(GameService);

  /** Current phase (1 = predictions, 2 = distribution) */
  readonly phase = this.gameSrv.phase;

  /** Current turn in phase 1 (1-4) */
  readonly turn = this.gameSrv.turn;

  /** Drinking cards count for phase 2 progress */
  readonly drinkingCardsCount = computed(() => this.gameSrv.drinkingCards().length);

  /** Giving cards count for phase 2 progress */
  readonly givingCardsCount = computed(() => this.gameSrv.givingCards().length);

  /** Total cards in phase 2 (drinking + giving) */
  readonly totalPhase2Cards = computed(() => this.drinkingCardsCount() + this.givingCardsCount());

  /** Phase 1 turn labels translation keys */
  readonly phase1TurnKeys = [
    'game.progress.turn.color',
    'game.progress.turn.plusMinus',
    'game.progress.turn.inOut',
    'game.progress.turn.suit',
  ];

  /** Get translation key for current turn label */
  readonly currentTurnKey = computed(() => {
    const currentTurn = this.turn();
    if (currentTurn >= 1 && currentTurn <= 4) {
      return this.phase1TurnKeys[currentTurn - 1];
    }
    return '';
  });

  /** Check if a step is completed in phase 1 */
  isStepCompleted(step: number): boolean {
    return this.turn() > step;
  }

  /** Check if a step is active in phase 1 */
  isStepActive(step: number): boolean {
    return this.turn() === step;
  }
}
