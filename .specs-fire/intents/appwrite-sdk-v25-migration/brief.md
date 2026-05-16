# Intent Brief: Appwrite SDK v25 Migration

## Context
The Ketal project frontend is running an outdated implementation of the Appwrite SDK. While `package.json` already specifies `"appwrite": "^25.0.0"`, the code relies on legacy positional argument signatures and a deprecated Realtime subscription pattern. This creates typing conflicts and future-proofing risks as the current patterns may be removed in minor updates.

## Goal
Migrate all interactions with Appwrite (Account, Databases, and Realtime) to use the updated object-based parameter structures and the recommended `Realtime` class for subscriptions, ensuring full type compatibility with v25.

## Scope

### In-Scope
- **Account API**: Refactor 6 calls in `auth.service.ts`.
- **Databases API**: Refactor calls in `room.service.ts`, `member.service.ts`, and `ketal-session.service.ts`.
- **Realtime API**: Upgrade the subscription model from functional to object-based via `Realtime` class.
- **Unit Tests**: Update all corresponding `.spec.ts` files (Auth, Room, Member, KetalSession) with updated mocks/assertions.

### Out-of-Scope
- Storage, Teams, Functions, Avatars, Locale, Messaging, TablesDB.
- Channel helper refactoring.
- Permission/Role helpers.

## Success Criteria
- Zero TypeScript errors in the application following the upgrade.
- All unit tests for impacted services pass using updated mocking patterns.
- Realtime subscriptions function without deprecation warnings.
