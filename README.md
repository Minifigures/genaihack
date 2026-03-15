# VIGIL - Student Healthcare Benefits & Fraud Protection

AI-powered platform that protects student health benefits from billing fraud, discovers unused insurance coverage, and connects students with trusted clinics. Built for GenAI Genesis 2026 Hackathon, University of Toronto.

## What It Does

Students upload photos of healthcare receipts (dental bills, pharmacy receipts). VIGIL simultaneously:

1. **Detects billing fraud** (upcoding, unbundling, phantom billing) by comparing against the Ontario Dental Association fee guide
2. **Discovers unused insurance benefits** (UTSU Health & Dental Plan coverage the student hasn't claimed)
3. **Finds eligible clinics** near campus with OHIP/UHIP coverage
4. **Extracts health signals** (treatment patterns, preventive care gaps)

## Key Features

| Feature | Description |
|---------|-------------|
| **Fraud Score Gauge** | Animated circular gauge with color-coded risk levels (Low/Elevated/High/Critical) |
| **"What You Should Have Paid"** | Visual comparison bars showing overcharges vs ODA guide fees |
| **Benefit Alerts** | Notifications for underutilized coverage ("$580 unused dental benefits") |
| **Clinic Finder** | OHIP/UHIP eligible healthcare providers near UofT with filters |
| **Fee Guide Explorer** | Searchable ODA procedure code lookup with high-risk code warnings |
| **Agent Trace Panel** | Real-time visualization of the 14-agent AI pipeline with layer progress |
| **Human Review Layer** | Approve/dismiss fraud cases with confirmation dialogs |
| **Savings Counter** | Running total of overcharges detected across all claims |

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

All scoring weights, thresholds, and tolerances are centralized in `agents/reasoning/fraud_policy.yaml`. Agents read from this single source of truth at runtime.

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, ShadCN UI, Magic UI
- **Backend**: FastAPI (Python 3.11+), WebSocket for real-time agent tracing
- **Orchestration**: LangGraph (StateGraph with parallel branching)
- **AI**: Gemini 2.0 Flash (OCR + reasoning), IBM watsonx.ai (compliance, optional)
- **Memory**: Moorcheh SDK (episodic, semantic, provider namespaces)
- **Database**: Supabase PostgreSQL (operational database)
- **Auth**: Supabase Auth (JWT)
- **Testing**: Playwright (26 E2E tests), pytest
- **Config**: pydantic-settings, YAML policy files

## Quick Start

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

Open **http://localhost:3000** in your browser.

### Manual Setup

```bash
# Backend (Terminal 1)
pip install -r requirements.txt
cp .env.example .env
uvicorn backend.main:app --reload --port 8000

# Frontend (Terminal 2)
cd frontend
npm install
npm run dev
```

### Run Tests

```bash
# Backend
pytest -v

# Frontend E2E (requires servers running)
cd frontend
node node_modules/@playwright/test/cli.js test
```

## Demo Mode

`DEMO_MODE=true` is set by default. No API keys required.

### Demo Receipts

Upload these from `data/demo_receipts/` on the `/upload` page:

| File | Scenario | Expected Result |
|------|----------|-----------------|
| `clean_dental.pdf` | Routine checkup, all fees within ODA guide | Score: 0 / LOW, no flags |
| `upcoded_dental.pdf` | Root planing upcoded from scaling, fees 40-60% above guide | Score: ~54 / HIGH, 3 flags |
| `unbundled_dental.pdf` | Same composite billed twice + 3x scaling units | Score: ~56 / HIGH, 6 flags |

### Environment Variables

| Variable | Service | Required for |
|----------|---------|-------------|
| `GOOGLE_API_KEY` | Gemini 2.0 Flash | Real OCR + fraud reasoning |
| `MOORCHEH_API_KEY` | Moorcheh SDK | Memory/RAG retrieval |
| `WATSONX_API_KEY` | IBM watsonx.ai | Compliance validation (optional) |
| `DATABASE_URL` | PostgreSQL | Supabase connection string |
| `SUPABASE_URL` | Supabase | Auth + database |
| `SUPABASE_KEY` | Supabase | Anon key for client auth |

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
| `GET` | `/api/metrics` | System metrics |
| `GET` | `/api/health` | Health check |
| `WS` | `/ws/trace` | Real-time agent trace stream |

## Frontend Pages

| Route | Page | Description |
|-------|------|-------------|
| `/` | Dashboard | Benefits overview, alerts, quick actions, recent submissions |
| `/upload` | Upload | Drag-drop receipt upload with real-time agent pipeline trace |
| `/benefits` | Benefits | Coverage breakdown with progress bars and recommendations |
| `/clinics` | Clinic Finder | OHIP/UHIP eligible providers near UofT with search/filter |
| `/fee-guide` | Fee Guide | Searchable ODA procedure code lookup |
| `/cases` | Fraud Cases | Approve/dismiss cases with confirmation dialogs |
| `/logs` | Audit Log | Full audit trail of all system actions |
| `/login` | Sign In | Supabase email/password auth |
| `/signup` | Sign Up | Account creation |

## Project Structure

```
genaihack/
├── frontend/                # Next.js 14 (TypeScript + Tailwind + ShadCN)
│   ├── app/                 # App Router pages
│   │   ├── benefits/        # Benefits explorer
│   │   ├── cases/           # Fraud cases + detail pages
│   │   ├── clinics/         # Clinic finder
│   │   ├── fee-guide/       # ODA fee guide explorer
│   │   ├── login/           # Auth pages
│   │   ├── signup/
│   │   ├── upload/          # Receipt upload + analysis
│   │   └── logs/            # Audit log
│   ├── components/          # React components
│   │   ├── ui/              # ShadCN + Magic UI components
│   │   ├── Dashboard.tsx    # Student health dashboard
│   │   ├── FraudCaseCard.tsx # Animated fraud gauge + comparison bars
│   │   ├── AgentTracePanel.tsx # Pipeline visualization
│   │   └── ...
│   ├── e2e/                 # Playwright E2E tests (26 tests)
│   └── lib/                 # API client + utilities
├── backend/                 # FastAPI server
│   ├── models/              # Pydantic data models
│   ├── routes/              # API endpoints
│   ├── store.py             # VigilStore (Supabase PostgreSQL)
│   ├── auth.py              # Supabase JWT auth
│   └── config/              # Settings + logging
├── agents/                  # LangGraph agent implementations
│   ├── graph.py             # StateGraph with all nodes + edges
│   ├── perception/          # OCR, normalizer, enricher, persister
│   ├── reasoning/           # Fraud analyst, health extractor, scoring engine
│   │   └── fraud_policy.yaml # Single source of truth for all scoring config
│   ├── planning/            # Benefits nav, action gen, optimization
│   ├── action/              # Report drafter, compliance gate, audit logger
│   └── reflection/          # Outcome evaluator, lesson extractor
├── data/
│   ├── demo_receipts/       # Test PDFs: clean, upcoded, unbundled
│   └── *.json               # Student/provider/plan profiles
├── tests/                   # pytest test suite
└── docs/                    # Architecture + API documentation
```

## Security

- **Never commit `.env` files** (blocked by .gitignore)
- All secrets loaded via `pydantic-settings` from environment variables
- Supabase JWT auth on all protected endpoints
- Compliance gate validates fraud flags for bias and explainability
- Audit logger tracks every pipeline decision for accountability

## Team

Built for GenAI Genesis 2026 Hackathon, University of Toronto (March 14-15, 2026).

- Marco Ayuste
- Peter Lee
- Kasem Okah (Perakasem)
- Aahiro
