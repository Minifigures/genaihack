# Antigravity Setup Instructions for Marco

## What's in this folder

```
.gemini/
├── GEMINI.md                              ← REPLACE your current one with this
├── settings.json                          ← Already correct, included for reference
└── antigravity/
    ├── skills/                            ← NEW: Copy entire folder
    │   ├── nextjs-patterns/SKILL.md       ← Auto-loads when working on Next.js
    │   ├── code-review/SKILL.md           ← Auto-loads when reviewing code
    │   ├── fastapi-patterns/SKILL.md      ← Auto-loads when working on FastAPI
    │   └── testing/SKILL.md               ← Auto-loads when writing tests
    └── global_workflows/                  ← NEW: Copy entire folder
        ├── ship.md                        ← Type /ship in agent chat
        ├── plan-feature.md                ← Type /plan-feature in agent chat
        └── review-code.md                 ← Type /review-code in agent chat
```

## Step-by-step setup

### 1. Replace GEMINI.md
Copy `.gemini/GEMINI.md` from this folder to:
```
C:\Users\minif\.gemini\GEMINI.md
```
This REPLACES the old file (which was a copy of your Claude Code config).

### 2. Copy skills into your antigravity folder
Copy the entire `skills` folder to:
```
C:\Users\minif\.gemini\antigravity\skills\
```
So you end up with:
```
C:\Users\minif\.gemini\antigravity\skills\nextjs-patterns\SKILL.md
C:\Users\minif\.gemini\antigravity\skills\code-review\SKILL.md
C:\Users\minif\.gemini\antigravity\skills\fastapi-patterns\SKILL.md
C:\Users\minif\.gemini\antigravity\skills\testing\SKILL.md
```

### 3. Copy workflows into your antigravity folder
Copy the entire `global_workflows` folder to:
```
C:\Users\minif\.gemini\antigravity\global_workflows\
```

### 4. Settings (already done)
Your settings.json at `C:\Users\minif\.gemini\settings.json` is already correct.

### 5. MCP config (already done)
Your mcp_config.json at `C:\Users\minif\.gemini\antigravity\mcp_config.json`
already has GitHub, GDrive, and Docker MCPs configured.

### 6. Install auto-approve fix
Run in PowerShell:
```powershell
npx better-antigravity auto-run
```
Then restart Antigravity.

### 7. Antigravity Settings UI (verify these)
Open Settings (Ctrl+,) and confirm:
- Terminal Command Auto Execution: "Always Proceed"
- Agent Review Policy: "Always Proceed"
- Browser JS Execution: "Always Proceed"
- Allow List: * (wildcard)
- Deny List: empty

## How to use model switching

Antigravity supports multiple models. Switch mid-conversation based on task:

| Task | Model | Why |
|------|-------|-----|
| Quick edits, boilerplate | Gemini 3 Flash | Fast, free |
| General coding | Gemini 3 Pro | Good balance |
| Complex architecture | Claude Opus 4.5 | Deepest reasoning |
| Balanced coding | Claude Sonnet 4.5 | Strong code quality |
| Planning mode tasks | Gemini 3 Pro (High) | Best for plans |

Switch in the agent conversation dropdown or model selector.

## How skills work

Skills auto-load when relevant. You don't invoke them manually.
- Ask about Next.js → nextjs-patterns loads automatically
- Ask to review code → code-review loads automatically
- Work on FastAPI → fastapi-patterns loads automatically
- Write tests → testing loads automatically

## How workflows work

Type the workflow name in agent chat with / prefix:
- `/ship` — Pre-push checklist (lint, type check, test, build, commit)
- `/plan-feature` — Plan before implementing
- `/review-code` — Review recent changes

## Per-project setup

For each project, also create:
```
your-project/
├── GEMINI.md              ← Project-specific context (architecture, commands)
├── .agents/
│   ├── skills/            ← Project-specific skills
│   └── workflows/         ← Project-specific workflows
└── tasks/
    └── todo.md
```

The project-level GEMINI.md only needs project-specific info:
```markdown
# Project: Marco Portfolio Site

## Architecture
Next.js 14 App Router with React Three Fiber for 3D elements.
Tailwind CSS for styling. Framer Motion for animations.
Deploy target: Netlify.

## Commands
- npm run dev — start dev server (port 3000)
- npm run build — production build
- npm run lint — ESLint check
```
