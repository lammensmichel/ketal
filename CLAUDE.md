# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ketal is a French drinking card game ("Grosse Guinze") with an **Angular 19** frontend. The game has two phases: players make predictions about cards (color, higher/lower, in/out, suit), then cards are drawn with sips assigned based on matches.

Ketal is part of the **FUG ecosystem** and shares its backend infrastructure.

## Backend Dependency

Ketal uses **fug-backend** as its shared Appwrite infrastructure.

### Prerequisites

Before starting Ketal development:

```bash
# 1. Clone fug-backend (if not already done)
git clone git@github.com:knabo6/fug-backend.git

# 2. Start the backend
cd fug-backend && make dev

# 3. Verify Appwrite is running
open http://localhost  # Should show Appwrite console
```

### Architecture
```
┌─────────────────┐     ┌─────────────────┐
│      FUG        │     │     KETAL       │
│  (Flutter app)  │     │  (Angular app)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │     fug-backend       │
         │  (Appwrite + Docker)  │
         ├───────────────────────┤
         │ • Authentication      │
         │ • Database (MariaDB)  │
         │ • Realtime (WS)       │
         │ • Storage             │
         └───────────────────────┘
```

### Minimum Backend Version
- Required: fug-backend >= v1.0.0

### Ketal Collections in Appwrite
- `games` - Game definitions
- `game_rooms` - Active game rooms
- `game_members` - Players in rooms
- `ketal_sessions` - Game session state

## Modern Angular 19 Patterns

This project uses cutting-edge Angular 19 features:

- **Standalone Components**: All components use `standalone: true` (no NgModules for components)
- **Signals**: `signal()`, `computed()`, `WritableSignal` for reactive state
- **New Control Flow**: `@if`, `@for`, `@switch` with `track` for optimal rendering
- **inject() Function**: Modern DI pattern instead of constructor injection
- **OnPush Change Detection**: All components use `ChangeDetectionStrategy.OnPush`
- **Lazy Loading**: Routes use `loadComponent` for code splitting

## Development Commands

```bash
# Start both Angular frontend and Node.js backend concurrently
npm start

# Start Angular only (port 4200)
npm run start-angular

# Start Node.js backend only (port 3000)
cd nodejs && npm run dev

# Build for production
npm run build

# Run Karma tests
npm test
```

## Application Architecture

### Current State (Transitioning)
- **Angular Frontend** (`src/`): Serves on port 4200
- **Node.js Backend** (`nodejs/`): Legacy Socket.IO server (being replaced by Appwrite)
- **Appwrite Backend** (`fug-backend`): New authentication, database, and realtime

### Target State
- **Angular Frontend** connecting directly to **fug-backend** (Appwrite)
- Node.js backend will be removed once migration is complete

### Frontend Structure
```
src/app/
├── _components/
│   ├── game/          # Game flow: main-game, game-room, game, game-summary
│   └── players/       # Player management: players-list, player-card, player-given-sips-selection
├── _shared/
│   ├── _components/   # Reusable: header, footer, playing-card, toast
│   ├── _helpers/      # Services: player.helper.ts, card-deck.helper.ts
│   └── _models/       # TypeScript interfaces and enums
└── services/          # Core services: game, card, local (localStorage), websocket
```

### Key Services

- **GameService** (`services/game/game.service.ts`): Central game state management using **Signals** (`gameSignal`, `withSummaryMode`), handles game phases, turn logic, and sip calculations
- **PlayerHelperService** (`_shared/_helpers/player.helper.ts`): Player CRUD, choice tracking, sip calculations
- **CardDeckHelperService** (`_shared/_helpers/card-deck.helper.ts`): Deck construction, card randomization (auto-doubles deck for >10 players)
- **LocalService** (`services/local/`): localStorage wrapper for persisting game state

### Game State Model
- **status**: 0=new, 1=started, 2=finished, 3=summary
- **phase**: 1=prediction phase (4 rounds), 2=drinking/giving phase (6 cards)
- **turn**: 1-4 in phase 1 (color, plus/minus, in/out, suit predictions)

### Internationalization
Uses ngx-translate with translation files in `src/assets/i18n/` (French is default).

## Docker Deployment

```bash
# Build and run both containers
./start.sh

# Frontend: nginx on port 4211
# Backend: Node.js on port 3000
```

## Environment Configuration
- Development: `src/environments/environment.ts` (localhost:3000)
- Production: `src/environments/environment.prod.ts` (configurable via window.env)

## Code Quality

- **ESLint + Prettier**: Linting and formatting with pre-commit hooks
- **Husky**: Git hooks for automated checks
- **Tests**: Karma/Jasmine with 80% coverage threshold
- **Tree-shaking**: Custom Bootstrap SCSS, FontAwesome SVG icons

```bash
npm run lint          # Run ESLint
npm run lint:fix      # Auto-fix lint issues
npm run format        # Format with Prettier
npm run test:coverage # Run tests with coverage report
```

## Git Commit Rules
- Do not add Claude mentions, footers, or co-author tags in commit messages

## BMAD Development Methodology

This project uses the **BMAD (Agentic Agile Driven Development)** method for structured development. See `.bmad/README.md` for full details.

### Workflow Overview
1. **Major Features**: Analyst → PM (PRD) → Architect → SM (Stories) → Dev → QA
2. **Small Features**: SM (Stories) → Dev → QA
3. **Bug Fixes**: Dev → QA

### Key Resources
- `.bmad/bmad-config.yaml` - Configuration
- `.bmad/agents/` - Agent definitions for Claude Code sub-agents
- `.bmad/templates/` - PRD, architecture, story templates
- `.bmad/checklists/` - Quality gates
- `.bmad/data/ketal-kb.md` - Project knowledge base

### Documentation Output
- `docs/prd.md` - Product requirements
- `docs/architecture.md` - Architecture documentation
- `docs/stories/` - Story files with full context

## Implementation Tracking
All feature requests and fixes must be tracked in the `implementation/` folder:

1. **New request**: Create a `.md` file in `implementation/pending/` with:
   - Initial request description
   - Implementation details as work progresses

2. **When complete**: Add a summary section with what was done

3. **On user "go"**: Move the file from `pending/` to `implementation/` root

File naming: `YYYY-MM-DD-short-description.md`
