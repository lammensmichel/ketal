# AGENTS.md — Ketal Project Agent Instructions

## Starting Angular in Dev Container

We are developing inside a **dev container**. To make Angular accessible from the host Mac, the dev server MUST be bound to `0.0.0.0` (not localhost) and run in the background with `nohup`.

> **[Docker file watching]** Docker does not pass inotify events to containers. Use `--poll 2000` so Angular polls for file changes every 2s instead of relying on filesystem events. Otherwise **hot reload will not work** and the dev server must be restarted after each code change.

### Recommended way (with script)

```bash
# Start (kills existing if present)
bash start-angular.sh

# Reload the browser to see changes
```

### Manual start

```bash
# Kill any existing server first
pkill -f "ng serve"

# Start with polling enabled
nohup npx ng serve --host 0.0.0.0 --port 4200 --disable-host-check --poll 2000 > /tmp/ng-serve.log 2>&1 &
sleep 15
tail /tmp/ng-serve.log
```

### Flag reference

| Flag | Purpose |
|---|---|
| `--host 0.0.0.0` | Binds to all interfaces so the Mac host can reach the dev server |
| `--port 4200` | Standard Angular dev server port |
| `--disable-host-check` | Bypasses webpack host validation for remote access |
| `--poll 2000` | Polls for file changes every 2s (required in Docker, inotify events don't work) |
| `nohup ... &` | Keeps the process running after the shell session ends |
| `> /tmp/ng-serve.log 2>&1` | Captures all output (stdout + stderr) for debugging |

### Access URL

From the Mac host browser: `http://localhost:4200`

VS Code automatically handles port forwarding when connected to the dev container. No manual port mapping is needed — the dev server binds to `0.0.0.0:4200` inside the container and VS Code forwards it to `localhost:4200` on the host.

### Verify it's running

```bash
# Check the process
ps aux | grep "ng serve"

# Check the logs
tail -f /tmp/ng-serve.log

# Check the port
lsof -i :4200
```

### Stop the server

```bash
pkill -f "ng serve"
```

### Hot reload

With `--poll 2000` the dev server detects code changes automatically. Just refresh your browser — no need to restart the server.

## Project Context
- Angular 19 application
- Backend: Appwrite
- Card game "La Grosse Quinze"

## Code Standards
- TypeScript strict mode
- Angular standalone components preferred
- SCSS for styling
- Follow existing component patterns and naming conventions

## Project Structure
- `src/app/_components/` — Feature components
- `src/app/_shared/` — Shared components, helpers, models
- `src/app/services/` — Application services
- `src/environments/` — Environment configs

## Testing

### Dedicated Test User for Appwrite Integration Tests

All integration specs (files ending in `.integration.spec.ts`) **MUST** authenticate as the dedicated test user before performing any Appwrite database operations. Anonymous sessions lack permissions on game-related collections and will cause 401 failures during teardown.

```typescript
const TEST_USER_EMAIL = 'test+integration@fug.app';
const TEST_USER_PASSWORD = 'K3tal-Test!2026';

// In beforeAll():
await appwriteService.account.createEmailPasswordSession({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD });

// In afterAll() (optional cleanup):
appwriteService.account.deleteSession({ sessionId: 'current' });
```

This user is provisioned by fug-backend migration `040_create_test_user.js` with full CRUD permissions on all collections. It is **persistent** — do not create ephemeral users in individual specs unless required.

### Unit Tests (Jasmine + Karma)

```bash
# Run all tests
npm test

# With explicit Chromium binary inside the dev container
CHROME_BIN=/usr/bin/chromium npm test -- --no-progress --browsers=ChromeHeadlessNoSandbox

# Watch mode (with --poll equivalent — file changes are polled by Angular dev server)
npx ng test --watch=true --browsers=ChromeHeadlessNoSandbox
```

> **[Chromium binary name]** The container has `chromium` (not `chrome`). Karma looks for a binary named `chrome` by default. Set `CHROME_BIN=/usr/bin/chromium` if tests fail with "No binary for Chrome browser".
>
> **[headless no-sandbox]** Tests in Docker **must** use `--no-sandbox --disable-dev-shm-usage --headless=new`. A custom launcher `ChromeHeadlessNoSandbox` is defined in `karma.conf.js`. Never use `browsers: ['Chrome']` — it overrides the custom launcher with the default Chrome (which crashes as root). Make sure only one `browsers:` key exists in `karma.conf.js` (a duplicate `['Chrome']` would silently override).

### E2E Tests
Use Chrome MCP tools for automated browser automation. The host Mac Chrome (debugged on port `9225`) is used — see `AGENTS.md` section "Chrome Remote Debug".

## Linting & Formatting
- ESLint + Prettier
- `npm run lint:fix` — fix lint issues
- `npm run format` — format code
