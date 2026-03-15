---
name: perception-agent-upgrade
description: Workflow command scaffold for perception-agent-upgrade in genaihack.
allowed_tools: ["Bash", "Read", "Write", "Grep", "Glob"]
---

# /perception-agent-upgrade

Use this workflow when working on **perception-agent-upgrade** in `genaihack`.

## Goal

Enhance perception layer agents with new capabilities and testing

## Common Files

- `agents/perception/ocr_agent.py`
- `agents/perception/normalizer.py`
- `agents/perception/history_enricher.py`
- `agents/perception/persister.py`
- `backend/models/claim.py`
- `tests/test_perception.py`

## Suggested Sequence

1. Understand the current state and failure mode before editing.
2. Make the smallest coherent change that satisfies the workflow goal.
3. Run the most relevant verification for touched files.
4. Summarize what changed and what still needs review.

## Typical Commit Signals

- Update perception agents (OCR, normalizer, history enricher, persister)
- Modify claim models
- Add comprehensive tests

## Notes

- Treat this as a scaffold, not a hard-coded script.
- Update the command if the workflow evolves materially.