# Ketal Knowledge Base

Quick reference for AI agents working on the Ketal project.

## Project Overview

**Ketal** is a French drinking card game ("Grosse Guinze") with:
- Angular 19 frontend (port 4200)
- Node.js/Socket.IO backend (port 3000)
- Real-time multiplayer gameplay

## Game Flow

### Two Phases
1. **Prediction Phase** (4 rounds):
   - Turn 1: Predict card color (red/black)
   - Turn 2: Predict higher/lower than previous
   - Turn 3: Predict in/out of range
   - Turn 4: Predict suit

2. **Drinking/Giving Phase** (6 cards):
   - Cards drawn one by one
   - Sips assigned based on prediction matches

### Game Status
- `0`: New game
- `1`: Started
- `2`: Finished
- `3`: Summary

## Key Services

### GameService (`services/game/game.service.ts`)
- Central game state via `gameSignal`
- `withSummaryMode` computed signal
- Handles phases, turns, sip calculations

### PlayerHelperService (`_shared/_helpers/player.helper.ts`)
- Player CRUD operations
- Choice tracking
- Sip calculations

### CardDeckHelperService (`_shared/_helpers/card-deck.helper.ts`)
- Deck construction
- Card randomization
- Auto-doubles for >10 players

### WebsocketService (`services/websocket/`)
- Socket.IO client connection
- Room management
- Event handling

### LocalService (`services/local/`)
- localStorage persistence
- Game state recovery

## Component Structure

```
src/app/
├── _components/
│   ├── game/
│   │   ├── main-game/       # Game entry point
│   │   ├── game-room/       # Room lobby
│   │   ├── game/            # Active gameplay
│   │   └── game-summary/    # End game summary
│   └── players/
│       ├── players-list/    # Player roster
│       ├── player-card/     # Individual player display
│       └── player-given-sips-selection/
├── _shared/
│   ├── _components/
│   │   ├── header/
│   │   ├── footer/
│   │   ├── playing-card/    # Card display component
│   │   └── toast/
│   ├── _helpers/            # Services
│   └── _models/             # TypeScript interfaces
└── services/                # Core services
```

## Data Models

### Game Interface
```typescript
interface Game {
  id: string;
  status: number;      // 0-3
  phase: number;       // 1-2
  turn: number;        // 1-4 in phase 1
  players: Player[];
  currentCard?: Card;
}
```

### Player Interface
```typescript
interface Player {
  id: string;
  name: string;
  choices: Choice[];
  sipsToTake: number;
  sipsToGive: number;
}
```

### Card Interface
```typescript
interface Card {
  suit: Suit;
  value: number;
  color: 'red' | 'black';
}
```

## Socket.IO Events

### Client → Server
- `join-room`: Join game room
- `create-room`: Create new room
- `player-action`: Player makes choice
- `start-game`: Host starts game

### Server → Client
- `room-joined`: Confirmation
- `player-joined`: New player notification
- `game-state`: Full state update
- `card-drawn`: New card revealed

## Common Patterns

### Signal Usage
```typescript
private readonly gameSignal = signal<Game | null>(null);
readonly game = this.gameSignal.asReadonly();
readonly isStarted = computed(() => this.game()?.status === 1);
```

### Component Declaration
```typescript
@Component({
  selector: 'app-example',
  standalone: true,
  imports: [...],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `...`
})
```

### Dependency Injection
```typescript
private readonly gameService = inject(GameService);
```

### Control Flow
```html
@if (condition) {
  <content />
}

@for (item of items(); track item.id) {
  <item-component [data]="item" />
}
```

## i18n Keys

Translation files: `src/assets/i18n/`
- `fr.json` (default)
- `en.json`

Usage:
```html
{{ 'key.path' | translate }}
```

## Quick Commands

```bash
npm start              # Both frontend and backend
npm run start-angular  # Frontend only
cd nodejs && npm run dev  # Backend only
npm test              # Run tests
npm run lint:fix      # Fix lint issues
```
