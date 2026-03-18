# Story 11.3: Game Summary Screen

## Status
Done

## Story
**As a** Ketal player,
**I want** to see a summary of the game results when it ends,
**so that** I can see who drank the most and final statistics

## Acceptance Criteria
1. Summary appears after last card in Phase 2
2. Shows total sips per player (drunk + given)
3. Highlights winner (least sips) and loser (most sips)
4. Option to restart or exit
5. Optional: Share results button

## UI/UX Design

### Summary Modal
```
+------------------------------------------+
|           🏆 RÉSULTATS 🏆                 |
+------------------------------------------+
|                                          |
|  🍺 Le plus assoiffé: Bob (12 gorgées)   |
|  🏆 Le plus sobre: Alice (4 gorgées)     |
|                                          |
|  +------------------------------------+  |
|  | Joueur  | Bues | Données | Total  |  |
|  |---------|------|---------|--------|  |
|  | Alice   |   2  |    2    |   4    |  |
|  | Bob     |   8  |    4    |  12    |  |
|  +------------------------------------+  |
|                                          |
|  [🔄 Rejouer]      [🚪 Quitter]          |
+------------------------------------------+
```

## Technical Design

### Component
```typescript
@Component({
  selector: 'app-game-summary',
  standalone: true,
})
export class GameSummaryComponent {
  readonly gameSrv = inject(GameService);

  players = computed(() => this.gameSrv.players());

  sortedByTotal = computed(() =>
    [...this.players()].sort(
      (a, b) => this.totalSips(a) - this.totalSips(b)
    )
  );

  winner = computed(() => this.sortedByTotal()[0]);
  loser = computed(() => this.sortedByTotal().at(-1));

  totalSips(player: PlayerModel): number {
    return player.sips.drunk + player.sips.given;
  }
}
```

### i18n Keys
```json
{
  "summary": {
    "title": "Résultats",
    "mostDrunk": "Le plus assoiffé",
    "leastDrunk": "Le plus sobre",
    "player": "Joueur",
    "sipsDrunk": "Bues",
    "sipsGiven": "Données",
    "total": "Total",
    "sips": "gorgées",
    "replay": "Rejouer",
    "exit": "Quitter"
  }
}
```

## Tasks
- [x] **T1**: Create GameSummaryComponent
- [x] **T2**: Add results table
- [x] **T3**: Add winner/loser highlighting
- [x] **T4**: Add i18n translations
- [x] **T5**: Integrate into game flow
- [x] **T6**: Add unit tests

## Dependencies
- Requires: GameService, PlayerModel

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-24 | 1.0 | Initial story creation | Claude |
