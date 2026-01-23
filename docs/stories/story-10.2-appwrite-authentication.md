# Story 10.2: Appwrite Authentication

## Status
Draft

## Architecture Overview

### Backend Separation
Ketal uses **fug-backend** as its shared backend infrastructure:

```
┌─────────────────┐     ┌─────────────────┐
│      FUG        │     │     KETAL       │
│  (Flutter app)  │     │  (Angular app)  │
└────────┬────────┘     └────────┬────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │     fug-backend       │
         │  (Appwrite + Docker)  │
         ├───────────────────────┤
         │ • Authentication      │
         │ • Database (MariaDB)  │
         │ • Realtime (WS)       │
         │ • Storage             │
         └───────────────────────┘
```

### Key Points
- **fug-backend** is a separate Git repository (`github.com/knabo6/fug-backend`)
- Contains Docker Compose stack with Appwrite self-hosted
- Shared database between FUG and Ketal apps
- Ketal users authenticate against the same Appwrite project
- Collections for Ketal: `games`, `game_rooms`, `game_members`, `ketal_sessions`

### Prerequisites
Before running Ketal in development:
1. Clone fug-backend: `git clone git@github.com:knabo6/fug-backend.git`
2. Start backend: `cd fug-backend && make dev`
3. Verify Appwrite is running: http://localhost

### Environment Configuration
```typescript
// src/environments/environment.ts
export const environment = {
  appwrite: {
    endpoint: 'http://localhost/v1',  // fug-backend Appwrite
    projectId: 'fug',                  // Shared project
  }
};
```

## Story
**As a** Ketal user,
**I want** to log in with multiple authentication options,
**so that** my game progress is saved and I can play across devices

## Acceptance Criteria
1. User can log in with email/password
2. User can register with email/password
3. User can log in with Google OAuth
4. User can play as guest (anonymous session)
5. User can recover password via email
6. Login page shows FUG branding ("Un jeu de l'univers FUG")
7. Session persists across browser refresh
8. Error messages displayed in French
9. Loading states during authentication

## UI/UX Design

### Login Page Layout
```
+----------------------------------------+
|              🎴 KETAL                   |
|        Un jeu de l'univers FUG         |
|                                        |
|  +----------------------------------+  |
|  |  📧 Email                        |  |
|  +----------------------------------+  |
|  +----------------------------------+  |
|  |  🔒 Mot de passe                 |  |
|  +----------------------------------+  |
|                                        |
|            Mot de passe oublié?        |
|                                        |
|  +----------------------------------+  |
|  |        SE CONNECTER              |  |
|  +----------------------------------+  |
|                                        |
|              ─── ou ───                |
|                                        |
|  +----------------------------------+  |
|  |  G  Continuer avec Google        |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |  👤  Jouer en tant qu'invité     |  |
|  +----------------------------------+  |
|                                        |
|     Pas encore de compte? S'inscrire   |
+----------------------------------------+
```

### Register Page Layout
```
+----------------------------------------+
|              🎴 KETAL                   |
|           Créer un compte              |
|                                        |
|  +----------------------------------+  |
|  |  👤 Nom complet                  |  |
|  +----------------------------------+  |
|  +----------------------------------+  |
|  |  📧 Email                        |  |
|  +----------------------------------+  |
|  +----------------------------------+  |
|  |  🔒 Mot de passe                 |  |
|  +----------------------------------+  |
|  +----------------------------------+  |
|  |  🔒 Confirmer le mot de passe    |  |
|  +----------------------------------+  |
|                                        |
|  +----------------------------------+  |
|  |        CRÉER MON COMPTE          |  |
|  +----------------------------------+  |
|                                        |
|              ─── ou ───                |
|                                        |
|  +----------------------------------+  |
|  |  G  Continuer avec Google        |  |
|  +----------------------------------+  |
|                                        |
|     Déjà un compte? Se connecter       |
+----------------------------------------+
```

## Technical Design

### File Structure
```
src/app/
├── services/
│   ├── appwrite/
│   │   └── appwrite.service.ts      # Already created
│   └── auth/
│       └── auth.service.ts          # NEW
├── _components/
│   └── auth/
│       ├── login/
│       │   ├── login.component.ts   # NEW
│       │   ├── login.component.html
│       │   └── login.component.scss
│       └── register/
│           ├── register.component.ts # NEW
│           ├── register.component.html
│           └── register.component.scss
└── app-routing.module.ts            # Add auth routes
```

### AuthService Interface
```typescript
@Injectable({ providedIn: 'root' })
export class AuthService {
  // Signals
  currentUser = signal<Models.User | null>(null);
  currentSession = signal<Models.Session | null>(null);
  isLoading = signal(false);
  error = signal<string | null>(null);

  // Computed
  isLoggedIn = computed(() => this.currentUser() !== null);
  isAnonymous = computed(() =>
    this.currentSession()?.provider === 'anonymous'
  );

  // Methods
  async signInWithEmail(email: string, password: string): Promise<void>;
  async signUp(email: string, password: string, name: string): Promise<void>;
  async signInWithGoogle(): Promise<void>;
  async signInAnonymously(): Promise<void>;
  async sendPasswordRecovery(email: string): Promise<void>;
  async signOut(): Promise<void>;
  async checkSession(): Promise<void>;
}
```

### Routes
```typescript
const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  // ... existing routes
];
```

### i18n Keys (French)
```json
{
  "auth": {
    "login": "Se connecter",
    "register": "S'inscrire",
    "logout": "Se déconnecter",
    "email": "Email",
    "password": "Mot de passe",
    "confirmPassword": "Confirmer le mot de passe",
    "fullName": "Nom complet",
    "forgotPassword": "Mot de passe oublié?",
    "continueWithGoogle": "Continuer avec Google",
    "playAsGuest": "Jouer en tant qu'invité",
    "noAccount": "Pas encore de compte?",
    "hasAccount": "Déjà un compte?",
    "createAccount": "Créer mon compte",
    "partOfFug": "Un jeu de l'univers FUG",
    "or": "ou",
    "errors": {
      "invalidEmail": "Adresse email invalide",
      "passwordTooShort": "Le mot de passe doit contenir au moins 8 caractères",
      "passwordMismatch": "Les mots de passe ne correspondent pas",
      "emailRequired": "Veuillez entrer votre email",
      "passwordRequired": "Veuillez entrer votre mot de passe",
      "nameRequired": "Veuillez entrer votre nom",
      "invalidCredentials": "Email ou mot de passe incorrect",
      "emailExists": "Un compte existe déjà avec cet email",
      "genericError": "Une erreur est survenue"
    },
    "success": {
      "accountCreated": "Compte créé avec succès",
      "passwordRecoverySent": "Email de récupération envoyé"
    }
  }
}
```

## Tasks / Subtasks

### Phase 1: AuthService
- [ ] **T1**: Create AuthService
  - [ ] Create `src/app/services/auth/auth.service.ts`
  - [ ] Implement signInWithEmail
  - [ ] Implement signUp
  - [ ] Implement signOut
  - [ ] Implement checkSession (on app init)
- [ ] **T2**: Add Google OAuth
  - [ ] Implement signInWithGoogle
  - [ ] Configure OAuth redirect URLs
- [ ] **T3**: Add anonymous session
  - [ ] Implement signInAnonymously
- [ ] **T4**: Add password recovery
  - [ ] Implement sendPasswordRecovery

### Phase 2: Login Component
- [ ] **T5**: Create LoginComponent
  - [ ] Create component files
  - [ ] Email/password form with validation
  - [ ] Error display
  - [ ] Loading states
- [ ] **T6**: Add OAuth buttons
  - [ ] Google sign-in button
  - [ ] Guest play button
- [ ] **T7**: Add i18n translations
  - [ ] Add French translations
  - [ ] Add English translations

### Phase 3: Register Component
- [ ] **T8**: Create RegisterComponent
  - [ ] Create component files
  - [ ] Registration form with validation
  - [ ] Password confirmation
  - [ ] Error display
- [ ] **T9**: Add routing
  - [ ] Add /login route
  - [ ] Add /register route
  - [ ] Add route guards if needed

### Phase 4: Integration
- [ ] **T10**: Initialize auth on app start
  - [ ] Check session in app.component.ts
  - [ ] Restore user state
- [ ] **T11**: Handle OAuth callbacks
  - [ ] Configure Appwrite OAuth settings
  - [ ] Handle redirect after OAuth

## Dev Notes

### Angular 19 Patterns
- Signals for all reactive state
- Standalone components
- inject() for DI
- @if / @for control flow
- OnPush change detection

### Appwrite OAuth Setup
For Google OAuth to work:
1. Configure OAuth provider in Appwrite Console
2. Set redirect URLs:
   - Dev: `http://localhost:4200/`
   - Prod: `https://ketal.fug.app/`

### Session Persistence
Appwrite SDK handles session persistence automatically via cookies/localStorage.
On app init, call `checkSession()` to restore user state.

### Error Handling
Map Appwrite error codes to French messages:
- 401 → "Email ou mot de passe incorrect"
- 409 → "Un compte existe déjà avec cet email"
- 429 → "Trop de tentatives, veuillez patienter"

## Dependencies
- Requires: AppwriteService (already created)
- Blocked by: None
- Blocks: Story 10.1 (User Menu Component)

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
