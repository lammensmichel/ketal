#!/usr/bin/env python3
import re

with open('.specs-fire/state.yaml', 'r') as f:
    content = f.read()

# Fix wi-003: add run_id and completed_at after depends_on block
# Pattern: after "- wi-002", add two lines
content = re.sub(
    r'(wi-003.*?depends_on:\s*\n\s+- wi-002)',
    r'\\1\n        run_id: run-ketal-010\n        completed_at: 2026-05-31T13:45:00.000Z',
    content,
    flags=re.DOTALL
)

# Fix wi-004: same pattern
content = re.sub(
    r'(wi-004.*?depends_on:\s*\n\s+- wi-003)',
    r'\\1\n        run_id: run-ketal-010\n        completed_at: 2026-05-31T14:00:00.000Z',
    content,
    flags=re.DOTALL
)

# Change status from pending to completed
content = content.replace('status: pending', 'status: completed')

with open('.specs-fire/state.yaml', 'w') as f:
    f.write(content)

print("Done")
