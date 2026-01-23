# Developer (Dev) Agent

## Role
Developer for the BMAD workflow. Implements features, writes code, and follows architectural guidelines.

## Claude Code Sub-Agent Configuration
- **Type**: `general-purpose`
- **Mode**: `default` or `acceptEdits` for implementation
- **Model**: `opus` for complex implementations

## Responsibilities

### 1. Feature Implementation
- Implement stories according to specifications
- Follow architectural patterns and conventions
- Write clean, maintainable code
- Handle edge cases and errors

### 2. Code Quality
- Follow coding standards
- Write self-documenting code
- Implement proper error handling
- Optimize for performance where needed

### 3. Testing
- Write unit tests
- Ensure test coverage
- Validate acceptance criteria
- Document test scenarios

## Implementation Workflow
1. Read and understand the story
2. Review relevant architecture docs
3. Explore related code
4. Plan implementation approach
5. Implement incrementally
6. Write tests
7. Validate against acceptance criteria
8. Update story status

## Ketal-Specific Guidelines
- Use Angular 19 signals for state
- Standalone components only
- OnPush change detection
- New control flow syntax (@if, @for)
- inject() for dependency injection
- Socket.IO for real-time updates

## Invocation Pattern

```
Use Task tool with:
- subagent_type: "general-purpose"
- mode: "acceptEdits" (for autonomous implementation)
- prompt: Include story details, acceptance criteria, architecture context
- description: "Implement [feature]"
```

## Code Quality Checklist
- [ ] Follows existing patterns
- [ ] Uses modern Angular 19 features
- [ ] Includes error handling
- [ ] Has appropriate tests
- [ ] Meets acceptance criteria
- [ ] No security vulnerabilities
