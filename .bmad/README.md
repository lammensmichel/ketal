# BMAD Method for Ketal

**B**MAD = **A**gentic **A**gile **D**riven **D**evelopment

This folder contains the BMAD methodology implementation adapted for Claude Code sub-agents.

## Quick Start

### For Major Features
```
1. Request feature analysis
2. Review PRD (docs/prd.md)
3. Review architecture (docs/architecture.md)
4. Approve stories
5. Development begins
```

### For Small Features
```
1. Request story creation
2. Review story (docs/stories/*.md)
3. Approve for development
```

### For Bug Fixes
```
1. Describe the bug
2. Dev investigates and fixes
3. QA validates
```

## Folder Structure

```
.bmad/
├── bmad-config.yaml     # Configuration
├── agents/              # Agent definitions
├── templates/           # Document templates
├── checklists/          # Quality checklists
├── workflows/           # Process workflows
├── tasks/               # Task definitions
└── data/                # Knowledge base
```

## Agents

| Agent | Purpose | Claude Code Subagent |
|-------|---------|---------------------|
| Analyst | Research & analysis | `Explore` |
| Architect | System design | `Plan` |
| PM | PRD creation | `general-purpose` |
| PO | Validation | `general-purpose` |
| SM | Story creation | `general-purpose` |
| Dev | Implementation | `general-purpose` |
| QA | Code review | `general-purpose` |

## Templates

- `prd-template.md` - Product Requirements Document
- `architecture-template.md` - Architecture documentation
- `story-template.md` - User story with full context
- `project-brief-template.md` - Project overview

## Checklists

- `architect-checklist.md` - Architecture review
- `pm-checklist.md` - PRD quality
- `story-draft-checklist.md` - Story readiness
- `story-dod-checklist.md` - Definition of done
- `change-checklist.md` - Change requests

## Workflows

- `brownfield-fullstack.md` - Main enhancement workflow
- `development-cycle.md` - Story implementation cycle

## Key Files

- `data/ketal-kb.md` - Project knowledge base
- `data/technical-preferences.md` - Tech standards

## Integration with CLAUDE.md

The BMAD methodology complements the existing CLAUDE.md guidelines:
- All features tracked in `implementation/` folder
- Angular 19 patterns enforced
- Quality gates before development

## Documentation Output

Generated docs go to:
- `docs/prd.md` - Product requirements
- `docs/architecture.md` - Architecture
- `docs/stories/` - Story files
