# Story 10.1: User Menu Component

## Status
Completed

## Story
**As a** Ketal user,
**I want** a user menu accessible from a profile icon in the header,
**so that** I can log in, manage my preferences, and see my profile

## Acceptance Criteria
1. Profile icon visible in header (top-right corner)
2. Clicking icon opens a dropdown menu
3. Menu shows "Se connecter" option when not logged in
4. Menu shows user info (avatar, name) when logged in
5. Menu includes language selector
6. Menu includes "Se déconnecter" option when logged in
7. Menu integrates with Appwrite AuthService
8. Responsive design (mobile-friendly)

## Architecture Decision

### Option A: Enhance Existing Header (Recommended)
Modify the current `HeaderComponent` to include a user menu dropdown.

**Pros:**
- Minimal changes to existing structure
- Reuses existing language selector logic
- Single component to maintain

**Cons:**
- Header component grows in complexity

### Option B: Separate UserMenuComponent
Create a new `UserMenuComponent` that the header includes.

**Pros:**
- Better separation of concerns
- Reusable in other contexts (embedded mode)
- Easier to test independently

**Cons:**
- Additional component to maintain
- Need to coordinate state between components

### Recommendation: Option B
Create a standalone `UserMenuComponent` for better modularity and reusability, especially for embedded mode scenarios.

## UI/UX Design

### Desktop Layout
```
+--------------------------------------------------+
|  KETAL                           [🌐 FR ▼] [👤] |
|  Jeu de carte à boire                            |
+--------------------------------------------------+

When profile icon clicked (not logged in):
+------------------+
| Se connecter     |
| ──────────────── |
| 🌐 Français    ▼ |
+------------------+

When profile icon clicked (logged in):
+------------------+
| 👤 Jean Dupont   |
| jean@email.com   |
| ──────────────── |
| Mon profil       |
| 🌐 Français    ▼ |
| ──────────────── |
| Se déconnecter   |
+------------------+
```

### Mobile Layout
- Same dropdown but full-width on small screens
- Touch-friendly tap targets (min 44px)

## Technical Design

### Components
```
src/app/_shared/_components/
├── header/
│   ├── header.component.ts       # Modified - includes UserMenu
│   └── header.component.html
└── user-menu/
    ├── user-menu.component.ts    # NEW - standalone component
    ├── user-menu.component.html
    ├── user-menu.component.scss
    └── user-menu.component.spec.ts
```

### UserMenuComponent Interface
```typescript
@Component({
  selector: 'app-user-menu',
  standalone: true,
  // ...
})
export class UserMenuComponent {
  // Injected services
  private authService = inject(AuthService);
  private translateService = inject(TranslateService);

  // Signals
  isOpen = signal(false);
  currentUser = this.authService.currentUser; // Signal from AuthService
  isLoggedIn = computed(() => this.currentUser() !== null);

  // Actions
  login(): void;
  logout(): void;
  changeLanguage(lang: string): void;
  toggleMenu(): void;
}
```

### Dependencies
- Requires: Story 8.2 (AuthService from Appwrite integration)
- Uses: Angular Material Menu or custom dropdown
- i18n keys needed

### i18n Keys (French)
```json
{
  "userMenu": {
    "login": "Se connecter",
    "logout": "Se déconnecter",
    "myProfile": "Mon profil",
    "language": "Langue",
    "guest": "Invité"
  }
}
```

## Tasks / Subtasks

### Phase 1: Component Structure
- [ ] **T1**: Create UserMenuComponent skeleton
  - [ ] Create component files
  - [ ] Add to shared module exports
- [ ] **T2**: Design dropdown UI
  - [ ] Create HTML template
  - [ ] Add SCSS styles
  - [ ] Implement open/close logic

### Phase 2: Integration
- [ ] **T3**: Integrate with AuthService
  - [ ] Display user info when logged in
  - [ ] Show login button when not logged in
  - [ ] Implement logout action
- [ ] **T4**: Move language selector
  - [ ] Move language logic from header
  - [ ] Update header to use UserMenuComponent
- [ ] **T5**: Add navigation to login
  - [ ] Route to login page or open modal

### Phase 3: Polish
- [ ] **T6**: Add animations
  - [ ] Dropdown open/close animation
  - [ ] Hover states
- [ ] **T7**: Mobile responsiveness
  - [ ] Full-width menu on mobile
  - [ ] Touch-friendly interactions
- [ ] **T8**: Tests
  - [ ] Unit tests for component
  - [ ] Integration tests with auth

## Dev Notes

### Angular 19 Patterns
- Use `signal()` for menu state
- Use `computed()` for derived state
- Use `@if` / `@for` control flow
- Standalone component with imports

### Accessibility
- Use `aria-expanded` for menu state
- Use `aria-haspopup="menu"` on trigger
- Keyboard navigation (Escape to close)
- Focus trap when menu is open

## Dependencies
- Blocked by: Story 8.2 (Appwrite integration - AuthService)

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-01-23 | 1.0 | Initial story creation | Architect |

## Dev Agent Record

### Agent Model Used

### Debug Log References

### Completion Notes List

### File List

## QA Results
