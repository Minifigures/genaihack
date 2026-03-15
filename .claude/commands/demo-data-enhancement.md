---
name: demo-data-enhancement
description: Workflow command scaffold for demo-data-enhancement in genaihack.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /demo-data-enhancement

Use this workflow when working on **demo-data-enhancement** in `genaihack`.

## Goal

Add or update demo data files and test scenarios

## Common Files

- `agents/perception/ocr_agent.py`
- `data/demo_receipts/*.pdf`
- `data/*.json`
- `README.md`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Create demo data files
- Update OCR agent with new scenarios
- Add corresponding test files
- Update documentation with examples

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.