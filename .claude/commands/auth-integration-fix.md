---
name: auth-integration-fix
description: Workflow command scaffold for auth-integration-fix in genaihack.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /auth-integration-fix

Use this workflow when working on **auth-integration-fix** in `genaihack`.

## Goal

Fixes authentication issues across backend routes and auth module

## Common Files

- `backend/auth.py`
- `backend/routes/cases.py`
- `backend/routes/claims.py`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update auth.py with new auth logic
- Modify route files to use/bypass auth
- Update claims.py and cases.py endpoints

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.