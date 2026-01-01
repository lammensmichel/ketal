# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Ketal is a French drinking card game ("Grosse Guinze") with an Angular 16 frontend and Node.js/Socket.IO backend. The game has two phases: players make predictions about cards (color, higher/lower, in/out, suit), then cards are drawn with sips assigned based on matches.

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

## Architecture

### Two-Server Architecture
- **Angular Frontend** (`src/`): Serves on port 4200, uses Socket.IO client for real-time updates
- **Node.js Backend** (`nodejs/Node.js`): Express + Socket.IO server on port 3000, manages room state

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

- **GameService** (`services/game/game.service.ts`): Central game state management using BehaviorSubject, handles game phases, turn logic, and sip calculations
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

## Git Commit Rules
- Do not add Claude mentions, footers, or co-author tags in commit messages
