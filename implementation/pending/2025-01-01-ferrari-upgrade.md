# Upgrade Clio → Ferrari

## Demande initiale
Transformer le codebase en projet de qualité professionnelle avec optimisations, tests, et bonnes pratiques Angular.

---

## Plan d'action détaillé

### Phase 1: Optimisation du Bundle (958KB → <500KB)

#### 1.1 Analyser le bundle
- [ ] Installer webpack-bundle-analyzer
- [ ] Générer rapport de taille des modules
- [ ] Identifier les dépendances les plus lourdes

#### 1.2 Lazy Loading des modules
- [ ] Créer `GameModule` (lazy loaded)
- [ ] Créer `PlayersModule` (lazy loaded)
- [ ] Créer `SharedModule` pour composants partagés
- [ ] Configurer routes avec loadChildren

#### 1.3 Optimiser les imports
- [ ] Remplacer imports FontAwesome complets par imports spécifiques
- [ ] Tree-shake Bootstrap (utiliser uniquement les composants nécessaires)
- [ ] Vérifier imports RxJS (utiliser imports spécifiques)

#### 1.4 Remplacer dépendances CommonJS
- [ ] `typescript-string-operations` → méthodes natives ou alternative ES module

---

### Phase 2: Architecture & Typage Strict

#### 2.1 Activer strict mode TypeScript
- [ ] `tsconfig.json`: strict: true
- [ ] Corriger toutes les erreurs de typage
- [ ] Supprimer tous les `any` explicites et implicites

#### 2.2 Refactoring Services
- [ ] GameService: séparer en services plus petits (GameStateService, SipsService)
- [ ] Utiliser readonly pour les BehaviorSubject
- [ ] Ajouter interfaces strictes pour tous les états

#### 2.3 State Management
- [ ] Évaluer si NgRx/ngrx-component-store est nécessaire
- [ ] Sinon, documenter le pattern actuel avec BehaviorSubject

---

### Phase 3: Tests Unitaires

#### 3.1 Configuration
- [ ] Vérifier configuration Karma/Jasmine
- [ ] Configurer couverture de code minimum (80%)
- [ ] Ajouter script npm pour coverage

#### 3.2 Tests Services (priorité haute)
- [ ] GameService: tests game state, sips calculation
- [ ] PlayerHelperService: tests CRUD, sip counting
- [ ] CardDeckHelperService: tests deck construction, random card
- [ ] CardService: tests card value, color checks

#### 3.3 Tests Components (priorité moyenne)
- [ ] PlayerCardComponent
- [ ] PlayersListComponent
- [ ] MainGameComponent
- [ ] HeaderComponent

#### 3.4 Tests E2E (priorité basse)
- [ ] Setup Cypress ou Playwright
- [ ] Test flow complet: créer joueurs → jouer → fin de partie

---

### Phase 4: Qualité de Code

#### 4.1 Linting & Formatting
- [ ] Ajouter ESLint avec règles Angular
- [ ] Ajouter Prettier
- [ ] Configurer pre-commit hooks (husky + lint-staged)

#### 4.2 Documentation
- [ ] JSDoc sur toutes les méthodes publiques des services
- [ ] README avec screenshots et instructions détaillées

#### 4.3 Cleanup
- [ ] Supprimer code mort
- [ ] Uniformiser langue (tout en anglais ou tout en français)
- [ ] Corriger typo "onpenPlayerGivenSipsSelectionModal" → "openPlayerGivenSipsSelectionModal"

---

### Phase 5: Performance & UX

#### 5.1 Change Detection
- [ ] Ajouter OnPush sur tous les composants possibles
- [ ] Utiliser trackBy sur tous les *ngFor

#### 5.2 Optimisations
- [ ] Lazy load images avatars
- [ ] Ajouter loading states
- [ ] Cacher données dans localStorage avec expiration

---

## Ordre d'exécution recommandé

| # | Phase | Priorité | Impact |
|---|-------|----------|--------|
| 1 | 4.1 Linting & Formatting | Haute | Base pour la suite |
| 2 | 2.1 Strict TypeScript | Haute | Détecte bugs cachés |
| 3 | 1.2 Lazy Loading | Haute | -40% bundle size |
| 4 | 1.4 CommonJS → ES | Moyenne | Warnings résolus |
| 5 | 3.2 Tests Services | Haute | Fiabilité |
| 6 | 5.1 Change Detection | Moyenne | Performance |
| 7 | 3.3 Tests Components | Moyenne | Fiabilité |
| 8 | 1.3 Optimiser imports | Basse | Bundle size |

---

## Implémentation

### Étape actuelle: Non démarrée

---

## Summary

*À compléter une fois terminé*
