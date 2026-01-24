# Story 11.1: Game Phase Indicator

## Status
In Progress

## Story
**As a** Ketal player,
**I want** to see a clear indicator of the current game phase and turn,
**so that** I understand where I am in the game progression

## Acceptance Criteria
1. Phase indicator shows "Phase 1" or "Phase 2"
2. Turn indicator shows current turn (1-4 for Phase 1)
3. Progress visualization (stepper or progress bar)
4. Indicator updates in real-time as game progresses
5. Clear visual distinction between phases
6. Mobile-responsive design

## UI/UX Design

### Desktop Layout
```
+------------------------------------------+
|  Phase 1: Prédictions                    |
|  ● ○ ○ ○                                 |
|  Tour 1/4 - Couleur                      |
+------------------------------------------+
```

### Phase 1 Steps
1. Tour 1: Couleur (Rouge/Noir)
2. Tour 2: Plus ou Moins
3. Tour 3: Entre ou Extérieur
4. Tour 4: Couleur exacte

### Phase 2 Display
```
+------------------------------------------+
|  Phase 2: Distribution                   |
|  ● ● ● ○ ○ ○ | ○ ○ ○ ○ ○ ○               |
|  Tu bois: 3/6 | Tu donnes: 0/6           |
+------------------------------------------+
```

## Technical Design

### Component
```typescript
// src/app/_shared/_components/game-progress/game-progress.component.ts
@Component({
  selector: 'app-game-progress',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GameProgressComponent {
  readonly gameSrv = inject(GameService);

  phase = computed(() => this.gameSrv.phase());
  turn = computed(() => this.gameSrv.turn());
  drinkingCardsCount = computed(() => this.gameSrv.drinkingCards().length);
  givingCardsCount = computed(() => this.gameSrv.givingCards().length);

  turnLabels = ['Couleur', 'Plus/Moins', 'Entre/Dehors', 'Couleur exacte'];
}
```

### i18n Keys
```json
{
  "game": {
    "phase1": "Phase 1: Prédictions",
    "phase2": "Phase 2: Distribution",
    "turn": "Tour",
    "turnLabels": {
      "color": "Couleur",
      "plusMinus": "Plus ou Moins",
      "inOut": "Entre ou Dehors",
      "suit": "Couleur exacte"
    },
    "youDrink": "Tu bois",
    "youGive": "Tu donnes"
  }
}
```

## Tasks
- [x] **T1**: Create GameProgressComponent
- [x] **T2**: Add stepper UI for Phase 1
- [x] **T3**: Add progress UI for Phase 2
- [x] **T4**: Add i18n translations
- [x] **T5**: Integrate into game layout
- [x] **T6**: Add unit tests

## Dependencies
- Requires: GameService (existing)

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-24 | 1.0 | Initial story creation | Claude |
