# Task: Create Story

## Purpose
Create a detailed, implementation-ready story from an epic or feature request.

## Input
- Epic reference or feature description
- PRD (if exists): `docs/prd.md`
- Architecture (if exists): `docs/architecture.md`

## Process

### 1. Gather Context
```
Read:
- Epic definition from PRD
- Relevant architecture sections
- Existing related code
```

### 2. Create Story File
Location: `docs/stories/[epic#].[story#].[title].md`

Use template: `.bmad/templates/story-template.md`

### 3. Fill Sections

#### Story Statement
```markdown
**As a** [specific user role]
**I want** [concrete action]
**So that** [clear benefit]
```

#### Acceptance Criteria
- Testable conditions
- Specific outcomes
- Edge cases

#### Tasks
- Ordered implementation steps
- Linked to acceptance criteria
- Sized for incremental progress

#### Dev Notes
- List relevant files with line numbers
- Include architecture context
- Add implementation hints
- Specify Angular 19 patterns needed

#### Testing Requirements
- Unit test scenarios
- Edge cases to cover

### 4. Quality Check
Run: `.bmad/checklists/story-draft-checklist.md`

## Output
- Story file in `docs/stories/`
- Story ready for development

## Invocation
```
Task tool:
  subagent_type: "general-purpose"
  description: "Create story for [feature]"
  prompt: |
    Create a detailed story for [feature description].

    Epic: [epic reference]
    PRD: docs/prd.md
    Architecture: docs/architecture.md

    Use template: .bmad/templates/story-template.md
    Output: docs/stories/[epic].[story].[title].md

    Include:
    - Clear acceptance criteria
    - Task breakdown
    - Relevant file references with line numbers
    - Architecture context
    - Testing requirements

    Follow Angular 19 patterns for Ketal.
```
