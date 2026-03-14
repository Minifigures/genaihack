# VIGIL: Healthcare Financial Guardian

**VIGIL** is a multi-agent AI system that protects Canadian students from healthcare billing fraud, surfaces thousands in unused insurance benefits, and extracts health signals from every claim — because every receipt is both a financial transaction and a medical record.

**VIGIL is built for [GenAI Genesis 2026](https://genai-genesis-2026.devpost.com/), Canada's Largest AI Hackathon.**

> [Slides]() · [Demo Video]() · [Devpost]()

---

## Table of Contents

- [Overview & Objectives](#overview--objectives)
- [Features at a Glance](#features-at-a-glance)
- [System Architecture](#system-architecture)
- [Agent Architecture by Layer](#agent-architecture-by-layer)
- [Memory Architecture](#memory-architecture)
- [Non-LLM Scoring Engines](#non-llm-scoring-engines)
- [Tech Stack](#tech-stack)
- [Running the Application](#running-the-application)
- [Demo Scenarios](#demo-scenarios)
- [Track Eligibility](#track-eligibility)
- [Further Documentation](#further-documentation)

---

## Overview & Objectives

Canadian students, especially international students, are disproportionately vulnerable to healthcare billing fraud. Dental fraud alone represented $7.2B out of $26.6B in Canadian insurance benefits. Simultaneously, most students leave thousands of dollars in insurance benefits unclaimed because their plans are buried in PDFs they have never read.

VIGIL is designed to:

- **Detect billing fraud** — upcoding, unbundling, phantom billing, fee guide deviations — from uploaded dental and medical receipts
- **Surface unused benefits** — map student insurance coverage (UTSU Health & Dental, UHIP, provincial plans) against actual claims to reveal unclaimed coverage
- **Extract health signals** — pull treatment patterns, medication history, and preventive care gaps from every claim
- **Score risk deterministically** — a pure Python fraud scoring engine with configurable YAML policy (no LLM in the scoring loop)
- **Validate with governance** — IBM watsonx.ai compliance gate ensures fraud flags are explainable and unbiased before reaching the student
- **Learn from outcomes** — reflection layer updates provider risk scores when disputes resolve

The system is implemented as a **5-layer multi-agent pipeline** using LangGraph, with 14 distinct agents/components: **Perception → Reasoning → Planning → Action → Reflection**, plus a **Memory Layer** (Moorcheh) and a **Governance Layer** (IBM watsonx.ai).

---

## Features at a Glance

### Frontend (Next.js / React / Tailwind / TypeScript)

| Route | Purpose |
|-------|---------|
| Dashboard (`/`) | KPI cards (active fraud cases, total savings, claims analysed, unused benefits), recent claims timeline, system status. |
| Upload (`/upload`) | Drag-and-drop receipt upload (photo/PDF). Triggers full pipeline. Real-time agent trace panel streams via WebSocket. |
| Fraud Cases (`/cases`) | Table of all fraud cases: date, provider, fraud score (colour-coded), status. Expand for full flags, evidence, score breakdown. Approve/dismiss. |
| Benefits (`/benefits`) | Coverage cards per category (dental, vision, paramedical, psychology). Progress bars for utilization. "How to claim" instructions. |
| Providers (`/providers`) | Provider risk table: risk score, avg fee deviation, flag count. Expand for claim history comparison against ODA guide. |
| Activity Log (`/logs`) | Immutable audit trail. Every agent action, decision, timestamp. Filterable by case, agent, event type. |
| Agent Trace (`/trace`) | Real-time view of which agents are active, streaming reasoning, layer progression, per-agent latency. |

### Backend (Python / FastAPI)

| Route | Purpose |
|-------|---------|
| `POST /api/claims/upload` | Upload receipt image/PDF. Triggers the full 5-layer pipeline. Returns case_id. |
| `GET /api/claims` | List all claims for a student. |
| `GET /api/cases` | List fraud cases (filterable by status, risk level). |
| `GET /api/cases/{case_id}` | Full fraud case detail with flags, score breakdown, action plans. |
| `POST /api/cases/{case_id}/approve` | Approve dispute filing. Updates status, writes audit log. |
| `POST /api/cases/{case_id}/dismiss` | Dismiss fraud flag. Logs to audit trail. |
| `GET /api/benefits/{student_id}` | Benefits report: coverage used YTD, remaining, recommendations. |
| `GET /api/providers` | Provider risk scores and aggregate statistics. |
| `GET /api/audit` | Audit log entries. |
| `GET /api/metrics` | Agent invocation counts, average latencies, error rates. |
| `GET /api/health` | Health check. |
| `WS /ws/trace` | WebSocket stream of real-time agent trace events. |

### Database (Snowflake)

**Schema:** `database/schema.sql` — `students`, `claims`, `providers`, `fee_guide`, `fraud_cases`, `action_plans`, `benefits_reports`, `plan_coverage`, `audit_log`.

**Seed:** `database/seed.sql` — Demo student profiles, provider profiles, ODA fee guide data (~200 procedure codes), UTSU plan coverage details.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VIGIL SYSTEM ARCHITECTURE                 │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LAYER 1: PERCEPTION                                  │   │
│  │  OCR Agent → Normalizer → History Enricher → Persister│   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LAYER 2: REASONING                                   │   │
│  │  Fraud Analyst ──┐                                    │   │
│  │  Health Extractor─┼→ Scoring Engine → Risk Classifier │   │
│  │  (parallel)      ─┘   (pure Python)   (fraud_policy)  │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LAYER 3: PLANNING                                    │   │
│  │  Benefits Navigator → Action Generator → Optimizer    │   │
│  │                                          (pure Python)│   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LAYER 4: ACTION                                      │   │
│  │  Report Drafter → Compliance Gate → Human Approval    │   │
│  │                    (watsonx.ai)     → Audit Logger     │   │
│  └──────────────────┬───────────────────────────────────┘   │
│                     ▼                                        │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  LAYER 5: REFLECTION                                  │   │
│  │  Outcome Evaluator → Lesson Extractor                 │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  MEMORY (Moorcheh): Episodic │ Semantic │ Providers    │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  GOVERNANCE (IBM watsonx.ai): Bias │ Explain │ Audit   │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  PRODUCTION: Docker │ Logging │ Metrics │ Tests        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Flow

```
Student ──upload──→ Frontend (Next.js)
                        │
                   POST /api/claims/upload
                        │
                        ▼
                    Backend (FastAPI)
                        │
                  ┌─────┴──────┐
                  │  LangGraph │──── tool calls ──→ Snowflake
                  │  Pipeline  │──── memory ops ──→ Moorcheh
                  │            │──── reasoning ───→ Gemini 2.5 Pro
                  │            │──── compliance ──→ watsonx.ai
                  └─────┬──────┘
                        │
                   WS /ws/trace (streaming agent events)
                        │
                        ▼
                    Frontend (live results)
```

---

## Agent Architecture by Layer

The pipeline is **Perception → Reasoning → Planning → Action → Reflection**. Each layer is implemented in `agents/`. The LangGraph StateGraph (`agents/graph.py`) chains all layers.

### Layer 1 — Perception

**Purpose:** Turn a raw receipt image into structured, enriched claim data.

| Agent | Type | Description |
|-------|------|-------------|
| **OCR Agent** | LLM (Gemini Vision) | Sends receipt image to Gemini 2.5 Pro multimodal. Returns structured JSON: provider, date, procedures (code, description, fee), total. |
| **Normalizer** | Rule-based | Validates OCR output. Maps CDA 5-digit procedure codes to categories. Flags low-confidence extractions. |
| **History Enricher** | Hybrid | Queries Moorcheh episodic memory for student's past claims. Queries Snowflake for provider aggregate stats. Appends historical context. |
| **Persister** | Rule-based | Writes normalized claim to Snowflake `claims` table. Updates provider aggregate counters. |

### Layer 2 — Reasoning

**Purpose:** Score fraud risk and extract health signals. Fraud Analyst and Health Extractor run **in parallel**.

| Agent | Type | Description |
|-------|------|-------------|
| **Fraud Analyst** | Hybrid | Queries ODA fee guide in Snowflake. Compares billed fees against suggested fees. Uses Gemini to reason about code plausibility (e.g., is root planing realistic for this patient?). Outputs fraud flags with evidence. |
| **Health Extractor** | Hybrid | Uses Gemini to interpret treatment signals from procedure codes. Writes health signals to Moorcheh episodic memory. Detects preventive care gaps ("no annual X-rays in 18 months"). |
| **Scoring Engine** | **Pure Python (NO LLM)** | Computes `fraud_score` (0-100) using a deterministic formula: `fee_deviation + code_risk + provider_history + pattern_bonus`, adjusted by confidence. Reads thresholds from `fraud_policy.yaml`. |

**Config:** `agents/reasoning/fraud_policy.yaml` — thresholds (low/elevated/high/critical), code risk weights, fee deviation tolerances, provider history multipliers.

### Layer 3 — Planning

**Purpose:** Generate and rank response actions. Surface unused benefits.

| Agent | Type | Description |
|-------|------|-------------|
| **Benefits Navigator** | Hybrid | Queries Moorcheh semantic memory for UTSU plan coverage details. Calculates coverage used YTD vs. remaining. Surfaces unused benefits. |
| **Action Generator** | Hybrid | Reads `action_library.yaml`. Generates 2-3 candidate response plans (dispute claim, report provider, switch provider, book preventive visit). |
| **Optimization Engine** | **Pure Python (NO LLM)** | Ranks candidate plans by `priority_score = (savings * fraud_severity * confidence) / (effort + 1)`. Selects recommended plan. |

**Config:** `agents/planning/action_library.yaml` — available actions with category, effort level, prerequisites, descriptions.

### Layer 4 — Action

**Purpose:** Present results to user. Validate through compliance. Gate on human approval.

| Agent | Type | Description |
|-------|------|-------------|
| **Report Drafter** | LLM (Gemini) | Generates human-readable fraud alert and benefits summary. Plain language, no jargon. |
| **Compliance Gate** | LLM (watsonx.ai) | Validates fraud flags for explainability and bias. Generates audit-ready compliance report. Fallback: local keyword safety filter. |
| **Audit Logger** | Rule-based | Records every decision immutably to Snowflake `audit_log`. Full evidence chain from upload to flag to approval/dismissal. |

**Human-in-the-loop:** Student reviews fraud flags in the UI. Can approve (file dispute) or dismiss (false positive). No automated action without human consent.

### Layer 5 — Reflection

**Purpose:** Compare predicted vs actual outcomes. Update provider memory.

| Agent | Type | Description |
|-------|------|-------------|
| **Outcome Evaluator** | Hybrid | When a dispute resolves, compares predicted fraud vs actual outcome. |
| **Lesson Extractor** | Hybrid | Extracts generalized lessons. Updates provider risk scores in Moorcheh provider patterns namespace. |

---

## Memory Architecture

VIGIL uses **Moorcheh** as its memory backbone with 3 distinct namespaces.

| Namespace | Name Pattern | Purpose | Read By | Written By |
|-----------|-------------|---------|---------|------------|
| **Episodic** | `vigil-episodic-{student_id}` | Chronological claim history per student | History Enricher, Benefits Navigator | Health Extractor, Persister |
| **Semantic** | `vigil-knowledge` | ODA fee guide + UTSU plan docs for RAG retrieval | Fraud Analyst, Benefits Navigator, Report Drafter | Seeded at startup |
| **Provider Patterns** | `vigil-providers` | Aggregated risk stats per provider | History Enricher, Fraud Analyst | Persister, Lesson Extractor |

**Cross-agent coordination:** All agents read/write the same Moorcheh namespaces, enabling genuine multi-agent memory sharing. When the Fraud Analyst flags a provider, the History Enricher incorporates that flag into future analyses of the same provider, even for different students.

---

## Non-LLM Scoring Engines

### Fraud Scoring Engine

Pure Python. No LLM in the scoring loop.

```
fraud_score = fee_deviation_component     (0-40 pts)
            + code_risk_component         (0-25 pts)
            + provider_history_component  (0-25 pts)
            + pattern_bonus               (0-10 pts)
            × confidence_adjustment       (0.0-1.0)
```

**Thresholds (configurable via `fraud_policy.yaml`):**
- Low: 0-25
- Elevated: 26-50
- High: 51-75
- Critical: 76-100

### Optimization Engine

Pure Python. Ranks action plans by priority.

```
priority_score = (savings_potential × fraud_severity × confidence) / (effort_required + 1)
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js 14, React, TypeScript, Tailwind CSS | Dashboard, upload, trace panel |
| Backend | FastAPI (Python 3.11+) | REST API, WebSocket streaming |
| Orchestration | LangGraph (StateGraph) | Multi-agent pipeline with parallel branching |
| LLM (Reasoning) | Google Gemini 2.5 Pro | Multimodal OCR, agent reasoning |
| LLM (Governance) | IBM watsonx.ai | Compliance validation, bias detection |
| Memory / RAG | Moorcheh Python SDK | 3-namespace memory (episodic, semantic, provider) |
| Database | Snowflake | Structured data warehouse (claims, providers, fee guide, audit) |
| Logging | structlog | Structured JSON logging |
| Testing | pytest | Scoring engine + anomaly detection tests |
| Containerisation | Docker Compose | One-command boot |
| Real-Time | WebSocket (FastAPI) | Live agent trace streaming |

---

## Running the Application

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker (optional, for containerised boot)

### Option A: Docker Compose (recommended)

```bash
# Copy environment template and fill in API keys
cp .env.example .env

# Boot everything
docker compose up
```

Frontend: `http://localhost:3000`
Backend: `http://localhost:8000`
API Docs: `http://localhost:8000/docs`

### Option B: Manual (two terminals)

**Backend (Terminal 1):**

```bash
cd vigil
python -m venv venv
source venv/bin/activate       # macOS/Linux
# .\venv\Scripts\activate      # Windows
pip install -r backend/requirements.txt
python -m uvicorn backend.main:app --reload --port 8000
```

**Frontend (Terminal 2):**

```bash
cd vigil/frontend
npm install
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

| Variable | Required | Description |
|----------|----------|-------------|
| `GOOGLE_API_KEY` | Yes | Gemini 2.5 Pro API key |
| `MOORCHEH_API_KEY` | Yes | Moorcheh SDK API key |
| `SNOWFLAKE_ACCOUNT` | Yes | Snowflake account identifier |
| `SNOWFLAKE_USER` | Yes | Snowflake username |
| `SNOWFLAKE_PASSWORD` | Yes | Snowflake password |
| `WATSONX_API_KEY` | Optional | IBM watsonx.ai (falls back to local filter) |
| `WATSONX_PROJECT_ID` | Optional | IBM watsonx.ai project ID |
| `DEMO_MODE` | Optional | `true` to use synthetic data |

---

## Demo Scenarios

VIGIL ships with 3 synthetic demo receipts in `data/demo_receipts/`:

| Receipt | What It Demonstrates |
|---------|---------------------|
| `clean_dental.pdf` | Standard cleaning billed at ODA guide rates. No fraud flags. Benefits discovery still surfaces unused coverage. |
| `upcoded_dental.pdf` | Provider billed root planing (code 43421, $385) when only scaling was performed ($120). Fraud score: ~87 (critical). |
| `unbundled_dental.pdf` | Provider broke a bundled service into separate charges to inflate total. Fraud score: ~62 (high). |

**Demo student profiles** in `data/student_profiles.json`:

| Profile | Details |
|---------|---------|
| **Priya** | 2nd-year international CS student, UTSU plan, 3 past dental claims at the same provider. |
| **Alex** | 4th-year domestic student, ongoing orthodontic work, high plan utilization. |

---

## Track Eligibility

| Track | Status | Key Feature |
|-------|--------|-------------|
| **TD: Financial Fraud Detection** | **YES** | Core feature. Fraud Analyst + Scoring Engine detect upcoding, unbundling, phantom billing. |
| **Sun Life: Healthcare Agentic AI** | **YES** | Health Extractor monitors dental/physical health. Benefits Navigator surfaces preventive care gaps. |
| **Bitdeer: Production-Ready AI** | **YES** | Docker, typed APIs, structured logging, /metrics, graceful degradation, pytest tests. |
| **Moorcheh: Efficient Memory** | **YES** | 3-namespace Moorcheh memory: episodic, semantic, provider patterns. |
| **Google: Community Impact** | **YES** | Protects international students from billing fraud. Surfaces unused insurance benefits. |
| **IBM: IBM Technology** | **YES** | watsonx.ai Compliance Gate: bias detection, explainability, audit trails. |
| **Top 2 Teams** | **YES** | 14 agents, 5 layers, multi-agent coordination, production-grade. |
| **Education** | **PARTIAL** | Benefits Navigator educates students about their coverage. System translates billing codes to plain language. |

---

## Further Documentation

- **Architecture:** `docs/architecture.md` — full layered architecture, agent responsibilities, data flow
- **API Reference:** `docs/api.md` — endpoint list, request/response schemas, WebSocket events
- **Agents:** `docs/agents.md` — detailed agent definitions, inputs/outputs, error handling
