---
name: auth-integration-fixes
description: Workflow command scaffold for auth-integration-fixes in genaihack.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /auth-integration-fixes

Use this workflow when working on **auth-integration-fixes** in `genaihack`.

## Goal

Fixing authentication issues across backend routes and auth systems

## Common Files

- `backend/auth.py`
- `backend/routes/claims.py`
- `backend/routes/cases.py`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update backend/auth.py with new auth logic
- Modify route files to add/fix auth dependencies
- Update claims.py and cases.py with proper auth checks

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.