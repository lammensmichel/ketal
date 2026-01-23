# Technical Preferences for Ketal

This document captures technical preferences and standards for AI agents working on the Ketal project.

## Frontend Preferences

### Angular 19
- **Always use signals** for reactive state management
- **Standalone components only** - no NgModules for components
- **OnPush change detection** on all components
- **New control flow syntax**: `@if`, `@for`, `@switch` with `track`
- **inject() function** instead of constructor injection
- **Lazy loading** with `loadComponent` for routes

### State Management
- Use `signal()` for local component state
- Use `computed()` for derived values
- Use services with signals for shared state
- Avoid BehaviorSubject when signals suffice

### Styling
- Use existing Bootstrap SCSS patterns
- Component-scoped styles preferred
- Mobile-first responsive design
- Follow existing color scheme

### i18n
- All user-facing text via ngx-translate
- Translation keys in `src/assets/i18n/`
- French is the primary language

## Backend Preferences

### Node.js
- Express for HTTP endpoints
- Socket.IO for real-time communication
- Async/await over callbacks
- Proper error handling with try/catch

### Socket.IO
- Namespace events by feature
- Emit acknowledgments for critical events
- Handle disconnection gracefully
- Room-based game state

## Code Style

### TypeScript
- Strict typing - avoid `any`
- Interface over type for objects
- Enum for fixed sets of values
- Proper null checking

### Naming Conventions
- PascalCase for classes/interfaces/enums
- camelCase for variables/functions
- kebab-case for file names
- Descriptive names over abbreviations

### File Organization
- One component per file
- Related files in same directory
- Shared code in `_shared/`
- Services in `services/`

## Testing Preferences

### Unit Tests
- Karma/Jasmine framework
- 80% coverage minimum
- Test behavior, not implementation
- Mock external dependencies

### Test Organization
- `.spec.ts` files alongside source
- Describe blocks for organization
- Clear test names

## Documentation Preferences

### Code Comments
- Self-documenting code preferred
- Comments for complex logic only
- JSDoc for public APIs
- No commented-out code

### Markdown
- Use for documentation files
- Mermaid for diagrams
- Keep concise and current

## Performance Preferences

### Frontend
- OnPush to minimize change detection
- TrackBy for ngFor/\@for
- Lazy load routes
- Optimize images

### Backend
- Efficient Socket.IO broadcasts
- Room-based messaging
- Minimal payload sizes

## Security Preferences

### General
- Input validation on all inputs
- No hardcoded secrets
- Sanitize user-generated content
- HTTPS in production

### Frontend
- No sensitive data in localStorage
- XSS prevention
- CSRF tokens if needed

## Git Preferences

### Commits
- Descriptive commit messages
- No Claude mentions or co-author tags
- Atomic commits
- Reference issues when applicable

### Branches
- Feature branches from develop
- PRs to develop, then main
- Clean branch names
