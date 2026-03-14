# VIGIL - Healthcare Billing Fraud Detection

Multi-agent system that detects billing fraud, discovers unused insurance benefits, and extracts health signals from healthcare receipts. Built for GenAI Genesis 2026 Hackathon, University of Toronto.

## Overview & Objectives

Students upload photos of healthcare receipts (dental bills, pharmacy receipts). VIGIL simultaneously:

1. **Detects billing fraud** (upcoding, unbundling, phantom billing) by comparing against the Ontario Dental Association fee guide
2. **Discovers unused insurance benefits** (UTSU Health & Dental Plan coverage the student hasn't claimed)
3. **Extracts health signals** (treatment patterns, preventive care gaps)

## Architecture

5-layer, 14-agent pipeline orchestrated by LangGraph with parallel branching:

```
Receipt Image -> OCR Agent -> Normalizer -> History Enricher -> Persister
                                                                    |
                                                  +-----------------+------------------+
                                                  |                                    |
                                            Fraud Analyst                     Health Extractor
                                                  |                                    |
                                                  +-----------------+------------------+
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

| Layer | Agents | Purpose |
|-------|--------|---------|
| Perception | OCR Agent, Normalizer, History Enricher, Persister | Extract structured data from receipt images |
| Reasoning | Fraud Analyst, Health Extractor, Scoring Engine | Score fraud risk and extract health signals |
| Planning | Benefits Navigator, Action Generator, Optimization Engine | Generate and rank response actions |
| Action | Report Drafter, Compliance Gate, Audit Logger | Present results with human approval gate |
| Reflection | Outcome Evaluator, Lesson Extractor | Learn from outcomes (stretch goal) |

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Recharts
- **Backend**: FastAPI (Python 3.11+), WebSocket for real-time agent tracing
- **Orchestration**: LangGraph (StateGraph with parallel branching)
- **AI**: Gemini 2.5 Pro (OCR + reasoning), IBM watsonx.ai (compliance)
- **Memory**: Moorcheh SDK (episodic, semantic, provider namespaces)
- **Database**: Snowflake (structured data)
- **Config**: pydantic-settings, YAML policy files (fraud_policy.yaml, action_library.yaml)

## Local Development Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/Minifigures/genaihack.git
cd genaihack/vigil
```

### 2. Backend setup

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # Linux/macOS
# .venv\Scripts\Activate.ps1    # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Create your environment file from the template
cp .env.example .env
# Edit .env with your API keys (optional, demo mode works without them)
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

### 4. Run the application

Open two terminals:

**Terminal 1 (Backend):**
```bash
cd vigil
source .venv/bin/activate
uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd vigil/frontend
npm run dev
```

Open http://localhost:3000 in your browser.

### 5. Run tests

```bash
cd vigil
pytest -v
```

### 6. Docker (alternative)

```bash
cd vigil
cp .env.example .env
docker compose up --build
```

## Demo Mode

By default, `DEMO_MODE=true` in `.env`. This means:

- **No API keys required** to run the full pipeline
- OCR returns realistic demo data (Dr. Smith Dental Clinic with upcoded procedures)
- History enrichment uses synthetic student claim history
- All 14 agents run with mock data where external services would be called

To use real AI services, set the relevant API keys in `.env`:

| Variable | Service | Required for |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | Gemini 2.5 Pro | Real OCR + fraud reasoning |
| `MOORCHEH_API_KEY` | Moorcheh SDK | Memory/RAG retrieval |
| `WATSONX_API_KEY` | IBM watsonx.ai | Compliance validation |
| `SNOWFLAKE_*` | Snowflake | Persistent data storage |

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/claims/upload` | Upload receipt image for analysis |
| `GET` | `/api/claims` | List all analyzed claims |
| `GET` | `/api/claims/{id}` | Get claim detail with full results |
| `GET` | `/api/cases` | List fraud cases |
| `POST` | `/api/cases/{id}/approve` | Approve a fraud case |
| `POST` | `/api/cases/{id}/dismiss` | Dismiss a fraud case |
| `GET` | `/api/benefits/{student_id}` | Get student benefits report |
| `GET` | `/api/providers` | List provider risk profiles |
| `GET` | `/api/audit` | View audit log |
| `GET` | `/api/health` | Health check |
| `WS` | `/ws/trace` | Real-time agent trace stream |

## Project Structure

```
vigil/
├── frontend/          # Next.js 14 app (TypeScript + Tailwind)
├── backend/           # FastAPI server
│   ├── models/        # Pydantic data models
│   ├── routes/        # API endpoints
│   ├── config/        # Settings + logging
│   └── websocket/     # WebSocket connection manager
├── agents/            # LangGraph agent implementations
│   ├── graph.py       # StateGraph with all nodes + edges
│   ├── perception/    # OCR, normalizer, enricher, persister
│   ├── reasoning/     # Fraud analyst, health extractor, scoring engine
│   ├── planning/      # Benefits nav, action gen, optimization
│   ├── action/        # Report drafter, compliance gate, audit logger
│   ├── reflection/    # Stretch goal agents
│   └── memory/        # Moorcheh SDK wrapper
├── database/          # Snowflake schema, seed data, fee guide
├── data/              # Demo data (student profiles, provider profiles, UTSU plan)
├── tests/             # pytest test suite (37 tests)
└── docs/              # Architecture + API documentation
```

## Security Notes

- **Never commit `.env` files** (blocked by .gitignore)
- All secrets are loaded via `pydantic-settings` from environment variables
- No hardcoded API keys, passwords, or tokens in source code
- Compliance gate validates fraud flags for bias and explainability
- Audit logger tracks every pipeline decision for accountability

## Team

Built for GenAI Genesis 2026 Hackathon, University of Toronto (March 13-15, 2026).
