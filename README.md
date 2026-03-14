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
- **Backend**: FastAPI (Python 3.11–3.14), WebSocket for real-time agent tracing
- **Orchestration**: LangGraph (StateGraph with parallel branching)
- **AI**: Gemini 2.0 Flash (OCR + reasoning), IBM watsonx.ai (compliance, optional)
- **Memory**: Moorcheh SDK (episodic, semantic, provider namespaces)
- **Database**: Snowflake (structured data)
- **Config**: pydantic-settings, YAML policy files (fraud_policy.yaml, action_library.yaml)

## Quick Start (One Command)

**Windows (PowerShell):**
```powershell
git clone https://github.com/Minifigures/genaihack.git
cd genaihack
.\start.ps1
```

**macOS / Linux:**
```bash
git clone https://github.com/Minifigures/genaihack.git
cd genaihack
chmod +x start.sh && ./start.sh
```

The scripts will:
- Copy `.env.example` → `.env` if it doesn't exist yet
- Create a Python virtual environment and install dependencies
- Install Node dependencies
- Launch backend (port 8000) + frontend (port 3000)

Open **http://localhost:3000** in your browser.

To stop both servers (Windows): `.\kill_servers.ps1`

---

## Manual Setup

### Prerequisites

- Python 3.11–3.14
- Node.js 18+
- npm

### 1. Clone the repository

```bash
git clone https://github.com/Minifigures/genaihack.git
cd genaihack
```

### 2. Backend setup

```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\Activate.ps1    # Windows PowerShell

# Install dependencies
pip install -r requirements.txt

# Create your environment file from the template
cp .env.example .env
# Edit .env with your API keys — demo mode works without them
```

### 3. Frontend setup

```bash
cd frontend
npm install
```

### 4. Run the application

Open two terminals from the repo root:

**Terminal 1 — Backend:**
```bash
source .venv/bin/activate        # macOS / Linux
# .venv\Scripts\Activate.ps1    # Windows
uvicorn backend.main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Open **http://localhost:3000** in your browser.

### 5. Run tests

```bash
pytest -v
```

### 6. Docker (alternative)

```bash
cp .env.example .env
docker compose up --build
```

---

## Demo Mode

`DEMO_MODE=true` is set by default in `.env.example`. In demo mode:

- **No API keys required** — the full 14-agent pipeline runs on synthetic data
- All three demo receipts return distinct, realistic results

### Demo receipts

Test receipts are in `data/demo_receipts/`. Upload them on the `/upload` page:

| File | Scenario | Expected Result |
|------|----------|-----------------|
| `clean_dental.pdf` | Routine checkup — all fees within ODA guide | Score: 0 / LOW — no flags |
| `upcoded_dental.pdf` | Root planing upcoded from scaling, fees 40–60% above guide | Score: ~54 / HIGH — 3 flags |
| `unbundled_dental.pdf` | Same composite billed twice on same tooth + 3× scaling units | Score: ~56 / HIGH — 6 flags |

To use real AI services, fill in the relevant keys in `.env`:

| Variable | Service | Required for |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | Gemini 2.0 Flash | Real OCR + fraud reasoning |
| `MOORCHEH_API_KEY` | Moorcheh SDK | Memory/RAG retrieval |
| `WATSONX_API_KEY` | IBM watsonx.ai | Compliance validation (optional) |
| `SNOWFLAKE_*` | Snowflake | Persistent data storage (optional) |

---

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

---

## Project Structure

```
genaihack/
├── start.ps1          # One-command startup (Windows)
├── start.sh           # One-command startup (macOS/Linux)
├── kill_servers.ps1   # Stop both servers (Windows)
├── requirements.txt   # Python dependencies (compatible with Python 3.11–3.14)
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
├── data/
│   ├── demo_receipts/ # Test PDFs: clean, upcoded, unbundled
│   ├── student_profiles.json
│   ├── provider_profiles.json
│   └── utsu_plan.json
├── database/          # Snowflake schema, seed data, fee guide
├── tests/             # pytest test suite
└── docs/              # Architecture + API documentation
```

---

## Security Notes

- **Never commit `.env` files** (blocked by .gitignore)
- All secrets are loaded via `pydantic-settings` from environment variables
- No hardcoded API keys, passwords, or tokens in source code
- Compliance gate validates fraud flags for bias and explainability
- Audit logger tracks every pipeline decision for accountability

---

## Team

Built for GenAI Genesis 2026 Hackathon, University of Toronto (March 13–15, 2026).
