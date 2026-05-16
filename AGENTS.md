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
- Jasmine + Karma
- `npm test` for unit tests
- `npm run test:coverage` for coverage

## Linting & Formatting
- ESLint + Prettier
- `npm run lint:fix` — fix lint issues
- `npm run format` — format code
