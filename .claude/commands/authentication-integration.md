---
name: authentication-integration
description: Workflow command scaffold for authentication-integration in genaihack.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /authentication-integration

Use this workflow when working on **authentication-integration** in `genaihack`.

## Goal

Integrates authentication system across frontend and backend components

## Common Files

- `backend/auth.py`
- `backend/routes/cases.py`
- `backend/routes/claims.py`
- `frontend/components/AuthButton.tsx`
- `frontend/components/AuthGuard.tsx`
- `frontend/components/Nav.tsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update auth backend logic
- Modify frontend auth components
- Update route protection
- Sync navigation state

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.