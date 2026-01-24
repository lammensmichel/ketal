# Story 11.2: Player Turn Highlight

## Status
In Progress

## Story
**As a** Ketal player,
**I want** to see the active player clearly highlighted in the player list,
**so that** I know whose turn it is at a glance

## Acceptance Criteria
1. Active player has distinct visual highlight (glow/border)
2. Highlight is visible and clear
3. Non-active players appear slightly dimmed
4. Animation on turn change (optional)
5. Works on mobile screens

## UI/UX Design

### Visual Highlight
```
+----------------+     +----------------+
|  Alice  [0]    |     |  Bob  [0]      |
|  ████████      |     |  ████████      |
|  (glowing)     |     |  (dimmed)      |
+----------------+     +----------------+
    ↑ ACTIVE             normal
```

### CSS Classes
- `.player-card--active`: Glow effect, full opacity
- `.player-card--inactive`: Reduced opacity, no effects

## Technical Design

### Modifications to GameComponent
```typescript
// In game.component.html, add conditional class
@for (player of gameSrv.players(); track player.id) {
  <app-player-card
    [player]="player"
    [isActive]="player.id === gameSrv.activePlayer()?.id"
  />
}
```

### PlayerCardComponent Updates
```typescript
@Input() isActive = false;

// In template
<div [class.player-card--active]="isActive"
     [class.player-card--inactive]="!isActive">
```

### CSS
```scss
.player-card--active {
  box-shadow: 0 0 15px rgba(var(--bs-primary-rgb), 0.5);
  transform: scale(1.02);
}

.player-card--inactive {
  opacity: 0.7;
}
```

## Tasks
- [x] **T1**: Add isActive input to PlayerCardComponent
- [x] **T2**: Add CSS styles for active/inactive states
- [x] **T3**: Update game.component to pass isActive
- [x] **T4**: Add smooth transition animation
- [x] **T5**: Test on mobile

## Dependencies
- Requires: PlayerCardComponent, GameService

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-24 | 1.0 | Initial story creation | Claude |
