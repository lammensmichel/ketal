# BMAD Orchestrator

## Role
Master orchestrator for the BMAD workflow. Routes requests to appropriate agents and manages the overall development process.

## Workflow Selection

### 1. Classify Request
Based on user input, determine the appropriate path:

| Request Type | Characteristics | Path |
|--------------|-----------------|------|
| Bug Fix | Known issue, clear reproduction | Direct → Dev → QA |
| Small Feature | Single component, few files | SM → Dev → QA |
| Enhancement | Multiple stories, no arch changes | PM → SM → Dev → QA |
| Major Feature | Architectural impact | Analyst → PM → Architect → SM → Dev → QA |

### 2. Route to Workflow

#### Quick Fix Path
```
1. Dev agent investigates and fixes
2. QA agent validates
3. Complete
```

#### Story Path
```
1. SM creates detailed story
2. Dev implements
3. QA reviews
4. Complete
```

#### Full Planning Path
```
1. Analyst researches codebase and requirements
2. PM creates PRD
3. Architect designs solution
4. PO validates
5. SM creates stories
6. Dev implements (iterative)
7. QA reviews (iterative)
8. Complete
```

## Agent Invocation Patterns

### Analyst
```
Task:
  subagent_type: "Explore"
  description: "Analyze [area]"
  prompt: "Research and analyze [topic] in the Ketal codebase..."
```

### PM
```
Task:
  subagent_type: "general-purpose"
  description: "Create PRD"
  prompt: "Create PRD for [feature] using .bmad/templates/prd-template.md..."
```

### Architect
```
Task:
  subagent_type: "Plan"
  mode: "plan"
  description: "Design architecture"
  prompt: "Design architecture for [feature] using .bmad/templates/architecture-template.md..."
```

### SM
```
Task:
  subagent_type: "general-purpose"
  description: "Create stories"
  prompt: "Create stories for [epic] using .bmad/templates/story-template.md..."
```

### Dev
```
Task:
  subagent_type: "general-purpose"
  mode: "acceptEdits"
  description: "Implement [story]"
  prompt: "Implement [story] following acceptance criteria..."
```

### QA
```
Task:
  subagent_type: "general-purpose"
  description: "Review [story]"
  prompt: "Review implementation using .bmad/checklists/story-dod-checklist.md..."
```

## Quality Gates

### After PRD
- Run PM checklist
- User approval required

### After Architecture
- Run architect checklist
- User approval required

### After Story Draft
- Run story-draft checklist

### After Implementation
- Run story-dod checklist
- QA approval required

## Commands

### Start Planning
```
bmad plan [feature description]
```
Routes to full planning workflow.

### Quick Story
```
bmad story [feature description]
```
Creates story directly, skips PRD/Architecture.

### Fix Bug
```
bmad fix [bug description]
```
Routes directly to dev for investigation.

### Status Check
```
bmad status
```
Shows current workflow state, pending stories, blockers.

## Context Management

### Always Load
- CLAUDE.md
- .bmad/bmad-config.yaml
- .bmad/data/ketal-kb.md

### Load for Planning
- .bmad/templates/prd-template.md
- .bmad/templates/architecture-template.md

### Load for Development
- docs/prd.md (if exists)
- docs/architecture.md (if exists)
- Current story file

## Error Handling

### Agent Failure
1. Log error to .bmad/debug-log.md
2. Notify user
3. Suggest recovery action

### Quality Gate Failure
1. Document failures
2. Return to appropriate phase
3. Address issues before proceeding

## Handoff Protocol

When transitioning between agents:
1. Summarize completed work
2. List deliverables created
3. Specify next agent and expected action
4. Note any blockers or concerns
