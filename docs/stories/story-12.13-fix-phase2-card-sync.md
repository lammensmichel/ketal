# Story 12.13: Fix Phase 2 Card Distribution and Sync

**Status**: Done
**Epic**: Epic 12: GameService Appwrite Integration
**Priority**: Critical
**Bug**: Yes

---

## Story

**As a** player in Phase 2 (Distribution)
**I want** drinking/giving cards to stack properly and sync to Appwrite
**So that** the game Phase 2 works correctly in room mode

---

## Context

During E2E testing via MCP Chrome, two bugs were found in Phase 2:

### Bug A: Cards don't stack locally
When clicking "Tu bois" or "Tu donnes", the revealed card **replaces** the previous one instead of being **added** to the array. The counter stays at 1/6 and the card image changes each click.

### Bug B: Cards not synced to Appwrite
`drinkingCards` and `givingCards` in `ketal_cards` collection remain `[]` even after cards are revealed. The sync to Appwrite doesn't persist Phase 2 cards.

### Observed in Appwrite
- Session: status=playing, phase=pyramid, turn=5
- drinkingCards: [] (should have cards)
- givingCards: [] (should have cards)
- Player sips from Phase 1 are correctly synced

---

## Acceptance Criteria

1. **AC1**: Clicking "Tu bois" adds a card to drinkingCards array (not replaces)
2. **AC2**: Clicking "Tu donnes" adds a card to givingCards array
3. **AC3**: Counter increments correctly (1/6, 2/6, etc.)
4. **AC4**: drinkingCards and givingCards are synced to Appwrite ketal_cards collection
5. **AC5**: Previously revealed cards remain visible

---

## Dev Notes

Key files to investigate:
- `src/app/services/game/game.service.ts` — `displayNewCard()` method, Phase 2 flow
- `src/app/services/game/game-mappers.ts` — `mapGameToSessionUpdate()` serialization of cards
- `src/app/services/ketal-session/ketal-session.service.ts` — `updateCardsDoc()` method
- `src/app/_components/game/` — game component Phase 2 template

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-19 | 1.0 | Found during MCP E2E testing | QA |
| 2026-03-19 | 2.0 | Fixed: batched Phase 2 mutations, PR #47 | Dev |
