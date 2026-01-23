# Task: Implement Story

## Purpose
Implement a story following its specifications and acceptance criteria.

## Input
- Story file: `docs/stories/[story].md`
- Architecture: `docs/architecture.md` (if relevant)

## Process

### 1. Read and Understand
```
Read story file completely:
- Story statement
- All acceptance criteria
- Tasks
- Dev notes
- Referenced files
```

### 2. Plan Implementation
- Order tasks by dependencies
- Identify files to modify/create
- Note testing approach

### 3. Implement
For each task:

#### a. Make Changes
- Follow existing patterns
- Use Angular 19 features:
  - Signals for state
  - Standalone components
  - OnPush change detection
  - New control flow
  - inject() for DI

#### b. Verify
- Check acceptance criteria
- Test manually
- Ensure no regressions

### 4. Write Tests
```bash
# Create/update .spec.ts files
# Run tests
npm test
```

### 5. Self Review
Run: `.bmad/checklists/story-dod-checklist.md`

### 6. Update Story Record
```markdown
## Dev Agent Record

### Implementation Notes
[What was done, decisions made]

### Files Changed
- path/to/file.ts - description of changes

### Completion Status
- [x] All acceptance criteria met
- [x] Tests passing
- [x] Ready for QA
```

## Output
- Implemented feature
- Unit tests
- Updated story record

## Invocation
```
Task tool:
  subagent_type: "general-purpose"
  mode: "acceptEdits"
  description: "Implement [story title]"
  prompt: |
    Implement story: docs/stories/[story].md

    Requirements:
    1. Read the full story file
    2. Follow all acceptance criteria
    3. Use Angular 19 patterns (signals, standalone, OnPush)
    4. Write unit tests
    5. Update the Dev Agent Record section

    Reference: .bmad/data/ketal-kb.md for project patterns
    Checklist: .bmad/checklists/story-dod-checklist.md
```
