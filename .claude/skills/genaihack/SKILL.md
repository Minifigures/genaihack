```markdown
# genaihack Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill covers development patterns for the genaihack repository, a full-stack application with a Python backend and frontend that appears to be focused on fraud detection and claim processing. The codebase uses a multi-agent architecture with perception, reasoning, planning, action, and reflection layers for processing insurance claims and cases.

## Coding Conventions

**File Naming:** Use snake_case for Python files
```python
# Good
ocr_agent.py
history_enricher.py
normalizer.py

# Avoid
OCRAgent.py
historyEnricher.py
```

**Import Style:** Use aliases for common imports
```python
# Preferred pattern
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
```

**Export Style:** Mixed patterns - follow existing conventions in each module

**Commit Messages:** Use conventional commit prefixes with ~45 character average length
```
fix: auth token validation in backend routes
feat: add OCR confidence scoring to perception layer
refactor: consolidate claim model validation
merge: combine frontend auth improvements
```

## Workflows

### Authentication Backend-Frontend Fix

**Trigger:** When authentication is broken or needs updates
**Command:** `/fix-auth`

1. Update backend authentication logic in `backend/auth.py`
2. Modify claims and cases routes to handle new auth patterns
3. Update frontend auth components (`AuthButton.tsx`, `AuthGuard.tsx`)
4. Fix navigation and login pages
5. Update Supabase integration in `frontend/lib/supabase.ts`

```python
# Common auth.py pattern
def verify_token(token: str) -> Optional[Dict]:
    # Token validation logic
    pass

def get_user_claims(user_id: str) -> List[Dict]:
    # User permission checking
    pass
```

### Perception Agent Upgrade

**Trigger:** When improving OCR, normalization, or data processing capabilities
**Command:** `/upgrade-perception`

1. Update OCR agent with new capabilities in `agents/perception/ocr_agent.py`
2. Enhance normalizer for better data cleaning in `agents/perception/normalizer.py`
3. Improve history enrichment logic in `agents/perception/history_enricher.py`
4. Update data persistence patterns in `agents/perception/persister.py`
5. Modify claim models to support new data structures
6. Add comprehensive tests in `tests/test_perception.py`

```python
# Agent pattern example
class OCRAgent:
    def process(self, state: State) -> StateDelta:
        # Process input and return state changes
        return StateDelta(
            ocr_results=extracted_text,
            confidence_score=score
        )
```

### Full-Stack Frontend Fix

**Trigger:** When frontend needs major fixes or new features
**Command:** `/fix-frontend`

1. Update core layout and routing in `frontend/app/layout.tsx`
2. Fix main dashboard page in `frontend/app/page.tsx`
3. Enhance upload functionality in `frontend/app/upload/page.tsx`
4. Update navigation component in `frontend/components/Nav.tsx`
5. Improve dashboard components in `frontend/components/Dashboard.tsx`
6. Sync backend routes in `backend/routes/claims.py`
7. Update dependencies in `frontend/package.json`
8. Fix API integration in `frontend/lib/api.ts`

### Multi-Agent State Fix

**Trigger:** When agents crash or return incorrect state
**Command:** `/fix-agents`

1. Update state models with proper reducers in `backend/models/state.py`
2. Fix all perception agents to return proper deltas
3. Update reasoning agents in `agents/reasoning/`
4. Fix planning agents in `agents/planning/`
5. Update action agents in `agents/action/`
6. Fix reflection agents in `agents/reflection/`
7. Update pipeline state handling
8. Sync backend routes with new state patterns

```python
# State delta pattern
from dataclasses import dataclass
from typing import Optional, Dict, List

@dataclass
class StateDelta:
    claims: Optional[List[Dict]] = None
    metrics: Optional[Dict] = None
    errors: Optional[List[str]] = None
    
    def apply_to(self, state: State) -> State:
        # Apply delta to existing state
        pass
```

### Cases Claims Metrics Wiring

**Trigger:** When dashboard or case management needs real data
**Command:** `/wire-data`

1. Update metrics with real computations in `backend/routes/metrics.py`
2. Wire cases to live fraud data in `backend/routes/cases.py`
3. Connect claims processing to real data sources
4. Implement audit logging in `agents/action/audit_logger.py`
5. Ensure data consistency across all endpoints

```python
# Metrics computation pattern
def calculate_fraud_metrics(cases: List[Case]) -> Dict:
    return {
        'total_cases': len(cases),
        'fraud_detected': len([c for c in cases if c.is_fraud]),
        'accuracy_rate': compute_accuracy(cases),
        'processing_time': compute_avg_time(cases)
    }
```

## Testing Patterns

Tests follow the pattern `*.test.*` and should cover:

- Agent state transitions and delta applications
- Authentication flows end-to-end
- Data processing pipeline integrity
- Frontend component rendering and interactions

```python
# Test pattern example
def test_ocr_agent_processing():
    agent = OCRAgent()
    initial_state = State(document=sample_doc)
    delta = agent.process(initial_state)
    
    assert delta.ocr_results is not None
    assert delta.confidence_score > 0.8
```

## Commands

| Command | Purpose |
|---------|---------|
| `/fix-auth` | Fix authentication issues across backend routes and frontend components |
| `/upgrade-perception` | Enhance perception layer agents with new capabilities and testing |
| `/fix-frontend` | Comprehensive frontend fixes with backend route updates |
| `/fix-agents` | Fix agent state management and data flow issues across all agent layers |
| `/wire-data` | Wire live data to cases, claims, and metrics endpoints |
```