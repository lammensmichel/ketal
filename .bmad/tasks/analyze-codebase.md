# Task: Analyze Codebase

## Purpose
Analyze the Ketal codebase for a specific feature or area to inform planning decisions.

## Input
- Feature description or area to analyze
- Specific questions to answer

## Process

### 1. Explore Structure
```
Glob patterns:
- src/app/**/*.ts
- src/app/**/*.html
- nodejs/**/*.js
```

### 2. Search for Relevant Code
```
Grep for:
- Related keywords
- Similar patterns
- Existing implementations
```

### 3. Read Key Files
Based on search results, read:
- Service files
- Component files
- Model definitions
- Related tests

### 4. Document Findings

#### Current State
- Existing implementation
- Patterns used
- Data flow

#### Technical Options
- Option A: [approach]
  - Pros:
  - Cons:
- Option B: [approach]
  - Pros:
  - Cons:

#### Recommendations
- Recommended approach
- Rationale
- Risks

#### Relevant Files
| File | Purpose | Notes |
|------|---------|-------|
| path/to/file.ts:line | description | |

## Output
- Analysis report
- Recommendations for architecture/PM

## Invocation
```
Task tool:
  subagent_type: "Explore"
  thoroughness: "very thorough"
  description: "Analyze [area] in codebase"
  prompt: |
    Analyze the Ketal codebase for [feature/area].

    Questions to answer:
    1. What existing code is relevant?
    2. What patterns are currently used?
    3. How does data flow through the system?
    4. What constraints exist?
    5. What are the technical options?

    Output structured analysis with:
    - Current state summary
    - Relevant file list with line numbers
    - Technical options with pros/cons
    - Recommended approach
    - Risks and considerations

    Reference: .bmad/data/ketal-kb.md
```

## Examples

### Analyze Game State Management
```
Questions:
- How is game state currently managed?
- Where are signals used?
- How does Socket.IO sync state?
```

### Analyze Player System
```
Questions:
- How are players tracked?
- What player operations exist?
- How do sip calculations work?
```

### Analyze Card System
```
Questions:
- How is the deck constructed?
- How are cards randomized?
- How do predictions work?
```
