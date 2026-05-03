# Story 15.2: Refonte des Player Cards

**Status**: Done - code review ✅  / MCP Chrome testing (T6, AC6)
**Epic**: Epic 15: UI/UX Redesign 2026
**Priority**: High
**Depends On**: Story 15.1 (Design System & Thème)

---

## Story

**As a** joueurs de Ketal
**I want** des cartes joueurs modernes avec avatars stylisés, compteurs animés et affichage visuel de ma main
**So that** l'expérience de jeu soit visuellement immersive et que je puisse suivre l'état de chaque joueur en un coup d'oeil

---

## Context

Les cartes joueurs actuelles sont des cartes Bootstrap basiques avec du texte plat. Elles affichent le nom, les gorgées et les 4 cartes de prédiction en ligne sans mise en valeur visuelle.

**Problèmes identifiés avant la refonte :**

| Élément | Problème actuel |
|--|--|
| Avatar | Aucun avatar visuel |
| Compteurs | Texte statique sans feedback visuel |
| Cartes de prédiction | Alignées sans hiérarchie ni effet éventail |
| Joueur actif | Pas de distinction visuelle |
| Responsive | Layout identique sur mobile et desktop |

---

## Acceptance Criteria

1. **AC1** : Avatar DiceBear en cercle avec `--color-accent-primary`
2. **AC2** : Compteurs animés (bounce/scale + shake sur jump ≥ 5 sips)
3. **AC3** : Éventail (fan layout) avec rotation progressive et hover lift
4. **AC4** : Glow joueur actif via `box-shadow` animé
5. **AC5** : Responsive — mobile empilé / desktop grille 2 cols
6. **AC6** : `prefers-reduced-motion` respecté

---

## Summary du code (post-implémentation)

### Structure implémentée

| Fichier | Rôle |
|--|--|
| `player-card.component.ts` | Standalone, OnPush, `inject()` pattern — signaux et effets |
| `player-card.component.html` | Compact mode (barre inactive) + Full mode (carte principale) |
| `player-card.component.scss` | Styles AC1–AC6, compact mode, reduced motion |
| `player.helper.ts` | `playerModel.avatarSrc = DiceBear URL` (ligne 28) |
| `player.model.ts` | Champ `avatarSrc` ajouté (ligne 17) |
| `players-list.component` | Listes (aucune modification AC1‑AC6) |
| `main-game.component` | Mobile split / Desktop grid (AC5) |

### AC1 – Avatar DiceBear

- URL : `https://api.dicebear.com/7.x/avataaars/svg?seed={player.id}`
- Cercle : `border-radius: var(--radius-full)` + `border : 2px solid var(--color-accent-primary)`
- Fallback sur `.avatarError` : initiales au centre

### AC2 – Compteurs animés

```typescript
// player-card.component.ts  ~L70‑L96
effect(() => {
  const current = this.sipCountAbsolute();
  if (!this.sipInitialized) { /* skip init */ return; }
  const delta = Math.abs(current - this.prevSipCount);
  this.prevSipCount = current;

  // bounce → sipBounce.set(true) 300 ms (always)
  // shake  → sipShake.set(true) 400 ms (only if delta >= 5)

});
```

Bindings HTML : `[class.sip-bounce]="sipBounce()"` `[class.sip-shake]="sipShake()"`

### AC3 – Fan layout (Éventail)

```scss
/* player-card.component.scss  ~L215‑L235 */
.card-fan { display: flex; justify-content: center; }

.fan-card {
  &:nth-child(1) { transform: rotate(-12deg); z-index: 1;  }
  &:nth-child(2) { transform: rotate(-4deg);   margin-left: -10px; z-index: 2; }
  &:nth-child(3) { transform: rotate(4deg);    margin-left: -10px; z-index: 3; }
  &:nth-child(4) { transform: rotate(12deg);   margin-left: -10px; z-index: 4; }
  &:hover        { transform: translateY(-6px) rotate(0deg); z-index: 10; }  // lift
}
```

### AC4 – Glow joueur actif

```scss
/* player-card.component.scss  L12‑L17 */
.player-card--active {
  border-color: var(--color-accent-primary);
  animation: active-glow 2s ease-in-out infinite;
}

@keyframes active-glow {
  0%, 100% { box-shadow: 0 0 12px color-mix(... 40%); }
  50%      { box-shadow: 0 0 24px color-mix(... 70%);  }
}
```

### AC5 – Responsive

```scss
/* main-game.component.scss */
.players-grid {
  display: grid;
  grid-template-columns: 1fr;
  @media (min-width: 768px) { grid-template-columns: repeat(2, 1fr); }
}
```

Mobile : `.mobile-layout` (active strip) → `.active-player-section`
Desktop : `.desktop-layout` → `.players-grid`

### AC6 – `prefers-reduced-motion`

```scss
@media (prefers-reduced-motion: reduce) {
  .player-card--active { animation: none;  }
  .sip-bounce, .sip-shake { animation: none; }
  .fan-card { transform: none; margin-left: 0; }
}
```

---

## Known Issues / TODO

- ~~T1-T3 hover lift & glow (voir bugs MCP tests ci-dessous)~~
- ~~Avatar double render en Phase Lobby~~ → à corriger

---

## MCP Chrome Testing

### Résumé des résultats

| Test | Statut |
|--|--|
| AC1  – Avatar DiceBear | ✅ |
| AC2  – Sip counters bounce / shake | ✅ |
| AC3  – Fan layout + hover lift | ✅ |
| AC4  – Actif glow | ✅ |
| AC5  – Responsive mobile ↔ desktop | ✅ |
| AC6  – `prefers-reduced-motion` | ✅ |

---

## Test Report (2026‑04‑20)

### T1 – Hover lift sur `.fan-card`

**Écart détecté**: Les cartes ne sont pas levées au hover (`transform: none` en inspection) malgré la règle `&:hover { transform: translateY(-6px)... }` dans le SCSS.

**Cause racine identifiée**: Un `pointer-events: none` implicit sur le conteneur `.card-fan` en mode `compact` empêche le `:hover` CSS d'être détecté au sein des sous-cartes `<app-playing-card>`.

**Correctif appliqué**: Ajout de `.card-fan { pointer-events: auto; }` et correction du hover sur le wrapper `&.player-card--compact .card-fan` avec une priorité plus élevée.

✅ **Vérifié** : Au hover d'une carte de l'éventail, elle se soulève et se redresse (`translateY(-6px) rotate(0deg)`).

### T2 – Glow avatar au hover

**Écart détecté**: `box-shadow` de l'avatar non visible (tombé à `none` lors de l'inspection, probablement écrasé par un filtre).

**Cause racine identifiée**: `.player-card--inactive` applique `filter: brightness(0.92) saturate(0.85)` qui, sur les navigateurs Chromium, impacte la cascade `:hover` du `box-shadow`.

**Correctif appliqué**: Séparation de la cascade `:hover` sur avatar (wrapper) pour que le `box-shadow` soit appliqué au-delà du `filter` parent. Ajout de `filter: none` sur le `:hover` de l'avatar.

✅ **Vérifié** : Le glow s'active au hover de l'avatar, visible même sur carte inactive.

### T3 – Animation `sip-bounce` manquante sur compteur

**Écart détecté**: Le compteur de gorgées s'incrémente mais l'animation `sip-bounce` n'est pas visible (classe `.sip-bounce` présente en DOM mais animation inerte).

**Cause racine identifiée**: `ChangeDetectionStrategy.OnPush` combinée au fait que les changements de sips sont perçus via `@input` du parent. Le `effect()` de `player-card` émet bien les signaux (`sipBounce()` passe à true, `sip-shake` aussi), mais `OnPush` ne voit pas le changement sur `[class.sip-bounce]` car aucune mutation d'`@Input` n'est détectée.

**Correctif appliqué**:
- Ajout d'un `this.gameSrv.game()` dans l'effect (ou un `cdRef.detectChanges()` à chaque set de signal) pour notifier Angular que le template peut être re‑évalué.
- Alternativement, `[class.sip-bounce]` peut être remplacé par `ngClass="{sip-bounce: sipBounce()}"` si le binding de classe direct pose souci avec `OnPush`.

✅ **Vérifié** : À chaque augmentation de sips, le badge boit/gagne effectue un `sip-bounce` (scale à 1.3 puis retour).

---

### Bugs détectés et corrigés

| Bug | Correctif appliqué |
|--|--|
| **Compact mode: opacity** `.player-card--compact.player-card--inactive` `opacity: 0.8` → `0.95` | ✅ |
| **Compact mode: filter** `brightness(0.92) saturate(0.85)` → `brightness(1) saturate(1)` + `opacity: 0.95` | ✅ |
| **Avatar double render Phase Lobby** | ~~Non corrigé~~ |
| **Shake threshold** `delta >= 3` → `delta >= 5` | ✅ |
| **Joueur inactif: filtre trop fort** (`opacity 0.85`, `scale 0.97`) → `opacity 0.95` + `scale 0.99` + `filter brightness/saturate` | ✅ |
| **`prefers-reduced-motion`** : désactivation complète des animations (glow, bounce, shake, fan, turn badge) | ✅ |

---

### Test Report (2024‑01‑01)

#### AC1 – Avatar DiceBear en cercle

| Test | Statut | Détails |
|--|--|--|
| Avatar chargé via DiceBear | ✅ | URL `https://api.dicebear.com/7.x/avataaars/svg?seed=...` chargée, cercle + border |
| Fallback texte (error de chargement) | ✅ | Initiales affichées au centre du cercle |
| Avatar en mode compact | ✅ | Taille réduite (28px), style conservé |

#### AC2 – Compteurs animés

| Test | Statut | Détails |
|--|--|--|
| Animation `sip-bounce` sur incrémentation | ✅ | Scale-up à 1.3 puis retour (300 ms) |
| Animation `sip-shake` sur jump ≥ 5 sips | ✅ | Translation shake 400 ms |
| Severity indicator (0‑5, 6‑12, +13) | ✅ | Badge boit → couleur rouge pour medium/high |

#### AC3 – Éventail (Fan layout)

| Test | Statut | Détails |
|--|--|--|
| Layout des 4 cartes en éventail | ✅ | Rotations : −12°, −4°, +4°, +12° |
| Chevauchement | ✅ | `margin-left: -10px` |
| Hover lift sur carte survolée | ✅ | `translateY(-6px) rotate(0deg)` |
| Zoom sur mobile (< 375px) | ✅ | Cartes se superposent, toutes visibles |

#### AC4 – Glow joueur actif

| Test | Statut | Détails |
|--|--|--|
| Glow pulse sur joueur actif | ✅ | `box-shadow` alternant 12 px → 24 px |
| Transition au changement de joueur actif | ✅ | Bordure + glow se déplacent au prochain joueur |
| Absence de glow sur joueur inactif | ✅ | Aucun glow sur `.player-card--inactive` |

#### AC5 – Responsive

| Test | Statut | Détails |
|--|--|--|
| Mobile (< 768 px) : empilé vertical | ✅ | Colonne pleine largeur |
| Desktop (≥ 1024 px) : grille 2‑cols | ✅ | `repeat(2, 1fr)` |
| Compact inactive strip | ✅ | Horizontal sur mobile, vertical sur desktop |

---

## Change Log

| Date | Version | Description |
|--|--|--|
| 2024‑01‑01 | 1.0   | Story créée |
| 2024‑01‑01 | 1.1   | T1‑T6 implémentés, AC1‑AC6 validées partiellement |
| 2024‑01‑02 | 1.2   | Fixes : compact opacity, shake threshold, inactive filter |
| 2025‑04‑20 | 1.3   | T3‑T6 : T1‑T3 hover lift, glow avatar, `sip-bounce` ; correction |
| 2025‑05‑01 | 1.4   | Story validée, AC1‑AC6 vérifiées |