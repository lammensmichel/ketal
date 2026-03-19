# Story 15.1: Design System & Thème

**Status**: Draft
**Epic**: Epic 15: UI/UX Redesign 2026
**Priority**: Critical (Blocker for all Epic 15 stories)
**Depends On**: None

---

## Story

**As a** developer working on the Ketal UI redesign
**I want** a comprehensive design system with CSS custom properties, color palette, typography, animation tokens, and theme support
**So that** all Epic 15 stories share a consistent visual language and can be developed in parallel without style conflicts

---

## Context

Ketal currently relies heavily on Bootstrap for styling (via `src/custom-bootstrap.scss`) with no custom design tokens. Individual components use ad-hoc colors, font sizes, and spacing values. This makes visual consistency difficult and theme switching impossible.

### Current State

| Aspect | Current | Target |
|--------|---------|--------|
| Colors | Bootstrap defaults, ad-hoc hex values in components | CSS custom properties with semantic naming |
| Typography | Bootstrap type defaults | Custom font stack, modular scale |
| Spacing | Bootstrap utilities (p-2, m-3, etc.) | CSS variable spacing scale |
| Animations | None or inline values | Shared animation timing tokens |
| Theme | None (light only) | Dark mode primary, light mode support |
| Breakpoints | Bootstrap grid breakpoints | Custom mobile-first breakpoints (375, 768, 1024, 1440) |

### Migration Strategy

This story introduces design tokens **alongside** Bootstrap, not as a replacement. The approach is progressive:
1. Create the design tokens file with CSS custom properties
2. Components adopt tokens progressively (one pilot component in this story)
3. Stories 15.2-15.8 use tokens for all new styling
4. Bootstrap dependencies are reduced over time, not removed in one shot

---

## Acceptance Criteria

1. **AC1**: A CSS variables file (`src/_design-tokens.scss`) exists with a complete color palette including: dark theme primary colors, card suit colors (red for hearts/diamonds, black for spades/clubs), drinking semantic color (red tint), giving semantic color (green tint), and gold accents
2. **AC2**: Dark and light theme switching works — dark theme applied by default via `[data-theme="dark"]` on the root element, light theme via `[data-theme="light"]`, with `prefers-color-scheme` media query as fallback
3. **AC3**: Animation timing tokens are defined as CSS custom properties: `--animation-fast` (150ms), `--animation-normal` (300ms), `--animation-slow` (500ms), plus standard easing functions
4. **AC4**: Typography scale is applied consistently — a font stack is selected, and a modular scale of font sizes is defined from `--font-size-xs` to `--font-size-3xl`
5. **AC5**: All existing components still render correctly with no visual regression after importing the design tokens (Bootstrap remains functional)
6. **AC6**: Responsive breakpoints are defined as SCSS variables and documented: mobile (375px), tablet (768px), desktop (1024px), wide (1440px), with corresponding SCSS mixins
7. **AC7**: At least one component (playing-card) is migrated to use design tokens for its colors, spacing, and border-radius

---

## Tasks / Subtasks

- [ ] **T1** (AC: 1, 8): Create design tokens file
  - [ ] Create `src/_design-tokens.scss` with CSS custom properties
  - [ ] Define `:root` (light) and `[data-theme="dark"]` variable sets
  - [ ] Import the file in `src/styles.scss` before other imports

- [ ] **T2** (AC: 1): Define color palette
  - [ ] Primary colors: dark backgrounds (`--color-bg-primary`, `--color-bg-secondary`), surface colors, elevated surfaces
  - [ ] Card suit colors: `--color-suit-red` (hearts, diamonds), `--color-suit-black` (spades, clubs)
  - [ ] Semantic game colors: `--color-drink` (red tint for "Tu bois"), `--color-give` (green tint for "Tu donnes")
  - [ ] Accent colors: `--color-accent-gold`, `--color-accent-primary` (neon/vibrant)
  - [ ] Text colors: `--color-text-primary`, `--color-text-secondary`, `--color-text-muted`
  - [ ] Border and divider colors
  - [ ] Feedback colors: `--color-success`, `--color-warning`, `--color-error`, `--color-info`

- [ ] **T3** (AC: 4): Define typography scale
  - [ ] Select font stack (system fonts or Google Font — e.g., Inter, Poppins)
  - [ ] Define size scale: `--font-size-xs` (0.75rem) through `--font-size-3xl` (2.5rem)
  - [ ] Define weight tokens: `--font-weight-regular` (400), `--font-weight-medium` (500), `--font-weight-semibold` (600), `--font-weight-bold` (700)
  - [ ] Define line-height tokens: `--line-height-tight`, `--line-height-normal`, `--line-height-relaxed`

- [ ] **T4** (AC: 6): Define spacing scale and breakpoints
  - [ ] Spacing scale: `--space-1` (0.25rem) through `--space-12` (3rem), following 4px base grid
  - [ ] Border radius tokens: `--radius-sm`, `--radius-md`, `--radius-lg`, `--radius-full`
  - [ ] Shadow tokens: `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-glow`
  - [ ] SCSS breakpoint variables: `$bp-mobile: 375px`, `$bp-tablet: 768px`, `$bp-desktop: 1024px`, `$bp-wide: 1440px`
  - [ ] SCSS responsive mixins: `@mixin mobile`, `@mixin tablet`, `@mixin desktop`, `@mixin wide`

- [ ] **T5** (AC: 3): Define animation tokens
  - [ ] Duration tokens: `--animation-fast: 150ms`, `--animation-normal: 300ms`, `--animation-slow: 500ms`
  - [ ] Easing functions: `--ease-in-out`, `--ease-bounce`, `--ease-spring`
  - [ ] `prefers-reduced-motion` media query that disables animations globally
  - [ ] Utility class `.animate-none` for opt-out

- [ ] **T6** (AC: 2): Implement dark/light mode support
  - [ ] Default to dark theme (`[data-theme="dark"]` on `<html>`)
  - [ ] Light theme variant with all variables overridden
  - [ ] `prefers-color-scheme` media query as automatic fallback
  - [ ] Optional: Add theme toggle method in a service or utility (not required for this story, can defer to Story 15.7)

- [ ] **T7** (AC: 7): Migrate playing-card component to design tokens
  - [ ] Replace hardcoded colors with `var(--color-*)` references
  - [ ] Use spacing tokens for padding/margin
  - [ ] Use border-radius tokens
  - [ ] Use card suit color tokens for red/black card display
  - [ ] Verify component looks correct in both dark and light themes

- [ ] **T8** (AC: 5): Update styles.scss and verify no regression
  - [ ] Import `_design-tokens.scss` in `src/styles.scss`
  - [ ] Verify Bootstrap still works alongside design tokens
  - [ ] Run existing tests to confirm no breakage
  - [ ] Visual check on key pages: home, players, game

---

## Dev Notes

### File structure

```
src/
├── _design-tokens.scss        ← NEW: all CSS custom properties
├── custom-bootstrap.scss      ← EXISTING: kept, no changes
├── styles.scss                ← MODIFIED: imports _design-tokens.scss
```

### CSS Custom Properties structure

```scss
// _design-tokens.scss

// ===== Color Palette =====
:root,
[data-theme="light"] {
  --color-bg-primary: #f8f9fa;
  --color-bg-secondary: #ffffff;
  // ... light theme values
}

[data-theme="dark"] {
  --color-bg-primary: #0a0a0f;
  --color-bg-secondary: #12121a;
  --color-bg-surface: #1a1a2e;
  --color-bg-elevated: #242440;

  --color-suit-red: #ef4444;
  --color-suit-black: #e2e8f0;
  --color-drink: #dc2626;
  --color-drink-bg: rgba(220, 38, 38, 0.15);
  --color-give: #22c55e;
  --color-give-bg: rgba(34, 197, 94, 0.15);
  --color-accent-gold: #f59e0b;
  --color-accent-primary: #6366f1;

  --color-text-primary: #f1f5f9;
  --color-text-secondary: #94a3b8;
  --color-text-muted: #64748b;
  // ...
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    // same as [data-theme="dark"]
  }
}

// ===== Typography =====
:root {
  --font-family: 'Inter', system-ui, -apple-system, sans-serif;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.75rem;
  --font-size-3xl: 2.5rem;
  // ...
}

// ===== Spacing =====
:root {
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-10: 2.5rem;
  --space-12: 3rem;
  // ...
}

// ===== Animation =====
:root {
  --animation-fast: 150ms;
  --animation-normal: 300ms;
  --animation-slow: 500ms;
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-spring: cubic-bezier(0.22, 1.0, 0.36, 1.0);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --animation-fast: 0ms;
    --animation-normal: 0ms;
    --animation-slow: 0ms;
  }
}

// ===== Breakpoints (SCSS only) =====
$bp-mobile: 375px;
$bp-tablet: 768px;
$bp-desktop: 1024px;
$bp-wide: 1440px;

@mixin mobile { @media (min-width: $bp-mobile) { @content; } }
@mixin tablet { @media (min-width: $bp-tablet) { @content; } }
@mixin desktop { @media (min-width: $bp-desktop) { @content; } }
@mixin wide { @media (min-width: $bp-wide) { @content; } }
```

### Playing-card migration example

```scss
// Before
.playing-card {
  background: #fff;
  border-radius: 8px;
  padding: 8px;
  color: red; // for hearts/diamonds
}

// After
.playing-card {
  background: var(--color-bg-elevated);
  border-radius: var(--radius-md);
  padding: var(--space-2);

  &.suit-red { color: var(--color-suit-red); }
  &.suit-black { color: var(--color-suit-black); }
}
```

### Fichiers concernés

- `src/_design-tokens.scss` (NEW)
- `src/styles.scss` (MODIFIED — add import)
- `src/app/_shared/_components/playing-card/playing-card.component.ts` (MODIFIED — adopt tokens)
- Inline styles in playing-card template if any

### Important constraints

- Do NOT remove Bootstrap imports — coexistence is required
- CSS custom properties must be used (not SCSS variables alone) so they can be overridden at runtime for theming
- SCSS variables are only for breakpoints (which cannot be CSS custom properties in media queries)
- All token names must use kebab-case with `--` prefix

---

## Testing

### Unit Tests
- [ ] Test: Design tokens file is imported and variables are available in DOM
- [ ] Test: Playing-card component renders correctly with design tokens
- [ ] Test: Theme switching changes CSS variable values

### Visual Tests (MCP)
- [ ] Test: Dark theme renders correctly on home page
- [ ] Test: Light theme renders correctly on home page
- [ ] Test: Playing-card displays correct suit colors (red/black) in dark mode
- [ ] Test: Playing-card displays correct suit colors (red/black) in light mode
- [ ] Test: No visual regression on players list page
- [ ] Test: No visual regression on game page

### Manual Tests
- [ ] Toggle between dark and light theme and verify all colors switch
- [ ] Check `prefers-reduced-motion: reduce` disables animation tokens
- [ ] Verify Bootstrap components (buttons, cards, forms) still work
- [ ] Test on mobile (375px), tablet (768px), and desktop (1024px+)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-03-19 | 1.0 | Story created | Dev |
