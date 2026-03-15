---
name: auth-backend-frontend-fix
description: Workflow command scaffold for auth-backend-frontend-fix in genaihack.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /auth-backend-frontend-fix

Use this workflow when working on **auth-backend-frontend-fix** in `genaihack`.

## Goal

Fix authentication issues across backend routes and frontend components

## Common Files

- `backend/auth.py`
- `backend/routes/claims.py`
- `backend/routes/cases.py`
- `frontend/components/AuthButton.tsx`
- `frontend/components/AuthGuard.tsx`
- `frontend/app/login/page.tsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update backend auth.py
- Modify claims and cases routes
- Update frontend auth components
- Fix navigation and pages

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.