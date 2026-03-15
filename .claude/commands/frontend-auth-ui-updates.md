---
name: frontend-auth-ui-updates
description: Workflow command scaffold for frontend-auth-ui-updates in genaihack.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /frontend-auth-ui-updates

Use this workflow when working on **frontend-auth-ui-updates** in `genaihack`.

## Goal

Adding or updating authentication UI components and pages

## Common Files

- `frontend/app/layout.tsx`
- `frontend/app/login/page.tsx`
- `frontend/app/signup/page.tsx`
- `frontend/components/AuthButton.tsx`
- `frontend/components/AuthGuard.tsx`
- `frontend/components/Nav.tsx`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update auth components (AuthButton, AuthGuard)
- Modify login/signup pages
- Update layout and navigation with auth state
- Add/update Supabase integration

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.