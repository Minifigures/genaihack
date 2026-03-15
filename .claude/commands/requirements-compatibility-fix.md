---
name: requirements-compatibility-fix
description: Workflow command scaffold for requirements-compatibility-fix in genaihack.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /requirements-compatibility-fix

Use this workflow when working on **requirements-compatibility-fix** in `genaihack`.

## Goal

Update Python package requirements to fix version compatibility issues

## Common Files

- `requirements.txt`
- `requirements_compat.txt`
- `requirements_no_ibm.txt`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Identify problematic package versions
- Unpin strict version requirements
- Create alternative requirements files
- Test compatibility across Python versions

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.