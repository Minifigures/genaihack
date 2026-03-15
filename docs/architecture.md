# VIGIL Architecture

## System Overview

VIGIL is a multi-agent healthcare billing fraud detection system built for the GenAI Genesis 2026 hackathon. It processes dental/pharmacy receipts through a 5-layer, 14-agent pipeline.

## Architecture Layers

### Layer 1: Perception
Extracts structured data from receipt images.
- **OCR Agent**: Gemini 2.5 Pro multimodal vision
- **Normalizer**: Pure Python validation + CDA code mapping
- **History Enricher**: Moorcheh episodic memory + PostgreSQL queries
- **Persister**: PostgreSQL write

### Layer 2: Reasoning
Scores fraud risk and extracts health signals.
- **Fraud Analyst**: ODA fee guide comparison + Gemini reasoning (parallel)
- **Health Extractor**: Treatment signal extraction (parallel)
- **Scoring Engine**: Pure Python fraud scoring formula (NO LLM)

### Layer 3: Planning
Generates and ranks response actions.
- **Benefits Navigator**: Moorcheh semantic search for UTSU plan coverage
- **Action Generator**: Reads action_library.yaml, generates candidate plans
- **Optimization Engine**: Pure Python plan ranking (NO LLM)

### Layer 4: Action
Presents results with human approval gate.
- **Report Drafter**: Generates human-readable fraud alert + benefits summary
- **Compliance Gate**: IBM watsonx.ai validation with local fallback
- **Audit Logger**: PostgreSQL audit_log write

### Layer 5: Reflection (Stretch Goal)
- **Outcome Evaluator**: Compare predicted vs actual dispute outcomes
- **Lesson Extractor**: Update provider risk scores

## Data Flow

```
Receipt Image -> OCR -> Normalize -> Enrich -> Persist
                                                  |
                                    +--------------+---------------+
                                    |                              |
                              Fraud Analyst               Health Extractor
                                    |                              |
                                    +--------------+---------------+
                                                   |
                                            Scoring Engine
                                                   |
                                         Benefits Navigator
                                                   |
                                          Action Generator
                                                   |
                                       Optimization Engine
                                                   |
                                          Report Drafter
                                                   |
                                         Compliance Gate
                                                   |
                                           Audit Logger
```

## Tech Stack
- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS + Recharts
- **Backend**: FastAPI + WebSocket
- **Orchestration**: LangGraph StateGraph
- **AI**: Gemini 2.5 Pro, IBM watsonx.ai
- **Database**: Supabase PostgreSQL + Moorcheh SDK
- **Config**: pydantic-settings, YAML policy files
