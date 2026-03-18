# Story 14.12: Guest Menu - Connect vs Quit Options

**Status**: Done
**Epic**: Epic 14: UX Polish
**Priority**: Medium

---

## Story

**As an** anonymous player (Partie rapide)
**I want** clear menu options to either connect my account or quit the game
**So that** I can upgrade my session without losing my game, or exit cleanly

---

## Context

Currently the side menu shows "Se déconnecter" for anonymous users, which is confusing since they're not really connected. The menu needs different options based on auth state.

### Menu for anonymous users (Partie rapide)
- **"Se connecter"** → Navigate to /login, KEEP current game data in localStorage. After login/register, the anonymous session is upgraded to a real account and the game can be resumed.
- **"Quitter la partie"** → Navigate to /login, CLEAR game data (full reset like logout cleanup).

### Menu for connected users (email/Google)
- **"Se déconnecter"** → Current behavior (reset game + logout + navigate to /login)

---

## Acceptance Criteria

1. **AC1**: Anonymous users see "Se connecter" and "Quitter la partie" in the side menu (not "Se déconnecter")
2. **AC2**: "Se connecter" navigates to /login without clearing game data
3. **AC3**: After login/register from "Se connecter", the previous game is still available to continue
4. **AC4**: "Quitter la partie" clears all game state and navigates to /login
5. **AC5**: Connected users see "Se déconnecter" (existing behavior unchanged)

---

## Dev Notes

### Files to modify
- `src/app/_shared/_components/side-menu/side-menu.component.ts` - Auth state check, different actions
- `src/app/_shared/_components/side-menu/side-menu.component.html` - Conditional buttons based on isAnonymous
- `src/app/services/auth/auth.service.ts` - May need a `softLogout()` that clears Appwrite session but keeps localStorage

### "Se connecter" flow
```
Anonymous user clicks "Se connecter"
  → Delete anonymous Appwrite session (no game cleanup)
  → Navigate to /login
  → User logs in or registers
  → Game data still in localStorage
  → Navigate to /players or /game (resume)
```

### "Quitter la partie" flow
```
Anonymous user clicks "Quitter la partie"
  → Full logout cleanup (reset game, clear localStorage, clear session)
  → Navigate to /login
```

### i18n keys to add
```json
{
  "menu": {
    "connect": "Se connecter",
    "quitGame": "Quitter la partie"
  }
}
```

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-17 | 1.0 | Requested during MCP testing | User |
| 2026-03-18 | 2.0 | Implemented and merged | Dev |
