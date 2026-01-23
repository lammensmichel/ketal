# Task: Review Implementation

## Purpose
QA review of a completed story implementation.

## Input
- Story file: `docs/stories/[story].md`
- Changed files (from Dev Agent Record)

## Process

### 1. Read Story
```
Understand:
- Original requirements
- Acceptance criteria
- Expected behavior
```

### 2. Review Code

#### Code Quality
- [ ] Clean and readable
- [ ] Follows existing patterns
- [ ] No code duplication
- [ ] Proper error handling
- [ ] No hardcoded values

#### Angular 19 Compliance
- [ ] Signals used correctly
- [ ] Standalone component
- [ ] OnPush change detection
- [ ] New control flow (@if, @for)
- [ ] inject() for DI
- [ ] Proper typing (no `any`)

#### Security
- [ ] Input validation
- [ ] No XSS vulnerabilities
- [ ] No sensitive data exposure

### 3. Verify Tests

```bash
npm test
npm run test:coverage
```

- [ ] Tests exist
- [ ] Tests pass
- [ ] Coverage adequate (80%+)
- [ ] Edge cases covered

### 4. Validate Acceptance Criteria

For each AC:
- [ ] Criterion met
- [ ] Behavior verified

### 5. Document Results

Update story file QA Results section:

```markdown
## QA Results

### Review Status
APPROVED | NEEDS_REVISION

### Code Quality
PASS | FAIL
- Notes: [specific observations]

### Test Coverage
PASS | FAIL
- Coverage: X%
- Notes: [missing scenarios]

### Acceptance Criteria
- AC1: PASS | FAIL
- AC2: PASS | FAIL

### Issues Found
1. [Issue description]
   - Severity: HIGH | MEDIUM | LOW
   - File: path/to/file.ts:line
   - Recommendation: [fix suggestion]

### Sign-off
Date: YYYY-MM-DD
Reviewer: QA Agent
```

## Output
- QA report in story file
- APPROVED or NEEDS_REVISION status

## Invocation
```
Task tool:
  subagent_type: "general-purpose"
  description: "QA review [story]"
  prompt: |
    Review implementation for: docs/stories/[story].md

    Process:
    1. Read story requirements and acceptance criteria
    2. Review changed files from Dev Agent Record
    3. Verify code quality and Angular 19 compliance
    4. Run tests and check coverage
    5. Validate each acceptance criterion
    6. Document results in QA Results section

    Use checklist: .bmad/checklists/story-dod-checklist.md
    Reference: .bmad/data/technical-preferences.md
```
