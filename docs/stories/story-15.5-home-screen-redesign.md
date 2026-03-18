# Story 15.5: Home Screen Redesign — Create/Join Game Flow

**Status**: Done
**Epic**: Epic 15: UI/UX Redesign 2026
**Priority**: High

---

## Story

**As a** connected Ketal player
**I want** a simple home screen with "Create game" and "Join game" options
**So that** I can quickly start or join a game without navigating through unnecessary pages

---

## Context

Current flow is fragmented:
- `/players` is the default home after login (just an input for adding players)
- `/room/create` is a separate page with a room name input → creates room → lobby
- `/room/join` is another separate page

### Target flow

**Home screen** (after login, no active game):
- **"Créer une partie"** → auto-creates room in background → navigates to /players with invite capability
- **"Rejoindre une partie"** → input code or scan QR → joins room → lobby

**Players page** (after creating a game):
- Add local players (like today)
- **Invite button** → shows QR code + share link (room already exists from "Créer une partie")
- Summary checkbox (for connected users)
- "Débuter la Grosse Guinze" button

### Pages to remove/repurpose
- `/room/create` → no longer needed as standalone page, room creation happens on button click
- The room name can be auto-generated (e.g., "Partie de {username}" or just "Ketal Game")

---

## Acceptance Criteria

1. **AC1**: Connected user sees home screen with "Créer une partie" + "Rejoindre une partie"
2. **AC2**: "Créer une partie" auto-creates room and navigates to /players
3. **AC3**: /players page has an "Inviter" button showing QR code + shareable link
4. **AC4**: "Rejoindre une partie" shows code input (reuse existing join-room component)
5. **AC5**: Anonymous user (Partie rapide) goes directly to /players without room creation (local mode)
6. **AC6**: If active game exists, skip home screen and go to /game
7. **AC7**: Responsive on mobile/tablet/desktop

---

## Tasks

- [x] **T1**: Create HomeComponent with two CTA buttons
- [x] **T2**: "Créer une partie" → soloRoomService.startBackgroundRoomCreation() + navigate /players
- [x] **T3**: "Rejoindre une partie" → navigate to /room/join (reuse existing)
- [x] **T4**: Add invite button on /players page (QR code + copy link from room)
- [x] **T5**: Update routing: connected user → /home (new), anonymous → /players
- [x] **T6**: Remove or redirect /room/create
- [x] **T7**: Unit tests

---

## Dev Notes

### New component: HomeComponent
```
src/app/_components/home/home.component.ts
```
Simple standalone component with 2 buttons. Lazy loaded via route.

### Invite on /players page
Reuse QR code logic from existing `create-room.component` (QRCodeComponent + clipboard copy).

### Routing changes
```
/home       → HomeComponent (new, for connected users)
/players    → MainGameComponent (existing, add invite capability)
/room/join  → JoinRoomComponent (existing, unchanged)
/room/create → redirect to /home
```

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Requested during MCP testing session | User |
| 2026-03-18 | 2.0 | Implemented and merged | Dev |
