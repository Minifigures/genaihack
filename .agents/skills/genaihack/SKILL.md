# genaihack Development Patterns

> Auto-generated skill from repository analysis

## Overview

This codebase implements a GenAI-powered system with agent-based architecture for processing claims and cases. The system features a Python backend with LangGraph-based agent workflows, frontend components for user interaction, and a sophisticated perception layer for OCR and data processing. The architecture follows a multi-agent pattern with perception, reasoning, planning, and action agents working in concert.

## Coding Conventions

### File Naming
- Use `snake_case` for all Python files
- Example: `ocr_agent.py`, `fraud_analyst.py`, `history_enricher.py`

### Import Style
- Use aliases for common imports
- Group imports: standard library, third-party, local imports

```python
import os
from typing import Dict, List
import pandas as pd
from langchain import LLMChain
from .models.state import AgentState
```

### Export Style
- Mixed pattern: explicit exports for agents, implicit for utilities
- Use `__all__` in agent modules for clarity

### Commit Conventions
- Use conventional commit prefixes: `fix:`, `feat:`, `refactor:`
- Keep messages concise (~45 characters average)
- Examples: `fix: auth state sync in nav component`, `feat: add OCR model upgrade`

## Workflows

### Authentication Integration
**Trigger:** When adding or fixing authentication functionality across frontend and backend
**Command:** `/auth-sync`

1. **Update backend auth logic** - Modify `backend/auth.py` with new authentication methods
2. **Update route protection** - Add auth checks to `backend/routes/cases.py` and `backend/routes/claims.py`
3. **Sync frontend auth components** - Update `AuthButton.tsx` and `AuthGuard.tsx` for state consistency
4. **Update navigation state** - Ensure `Nav.tsx` reflects current auth status
5. **Verify Supabase integration** - Check `frontend/lib/supabase.ts` configuration

```python
# Example auth route protection
@require_auth
def get_cases():
    user = get_current_user()
    return filter_cases_by_user(user)
```

### Perception Agent Upgrade
**Trigger:** When improving OCR, normalization, or data enrichment capabilities
**Command:** `/upgrade-perception`

1. **Update OCR agent models** - Enhance `agents/perception/ocr_agent.py` with new vision models
2. **Improve normalizer validation** - Add validation rules in `agents/perception/normalizer.py`
3. **Enhance history enricher** - Update context gathering in `agents/perception/history_enricher.py`
4. **Update persister logic** - Modify `agents/perception/persister.py` for new data formats
5. **Update claim models** - Adjust `backend/models/claim.py` schema if needed
6. **Add comprehensive tests** - Update `tests/test_perception.py` with new test cases

```python
# Example OCR agent upgrade
class OCRAgent:
    def __init__(self):
        self.model = "gpt-4-vision-preview"  # Upgraded model
    
    def process_document(self, image_data):
        # New processing logic
        return extracted_text
```

### Frontend Component Sync
**Trigger:** When updating UI components to match backend API changes
**Command:** `/sync-frontend`

1. **Update page components** - Modify `upload/page.tsx`, `login/page.tsx` for new API
2. **Sync authentication components** - Update auth flow in components
3. **Update dashboard** - Refresh `Dashboard.tsx` with new data structures
4. **Modify API client** - Update `frontend/lib/api.ts` endpoints and types
5. **Update dependencies** - Refresh `package-lock.json` if new packages needed

```typescript
// Example API client update
export const uploadClaim = async (formData: FormData) => {
  const response = await fetch('/api/claims/upload', {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### Data Pipeline Wiring
**Trigger:** When wiring mock data to real data sources or fixing data flow
**Command:** `/wire-data`

1. **Update metrics calculation** - Connect `backend/routes/metrics.py` to live data sources
2. **Wire cases to live data** - Replace mocks in `backend/routes/cases.py`
3. **Update claims processing** - Connect real claim data in `backend/routes/claims.py`
4. **Add audit logging** - Implement tracking in `agents/action/audit_logger.py`

```python
# Example live data connection
def get_live_metrics():
    # Replace mock data
    return {
        'total_claims': query_claims_db().count(),
        'fraud_rate': calculate_fraud_percentage(),
        'processing_time': get_avg_processing_time()
    }
```

### Agent State Management Fix
**Trigger:** When resolving concurrent graph updates or state accumulation issues in LangGraph
**Command:** `/fix-agent-state`

1. **Update state models with reducers** - Add proper reducers in `backend/models/state.py`
2. **Fix agent return patterns** - Ensure consistent state updates in perception agents
3. **Update reasoning agents** - Fix state handling in `agents/reasoning/fraud_analyst.py`
4. **Update action agents** - Correct state management in `agents/action/audit_logger.py`
5. **Fix planning agents** - Resolve state issues in `agents/planning/action_generator.py`

```python
# Example state reducer implementation
class AgentState:
    def add_ocr_result(self, current: List, new_result: dict) -> List:
        """Reducer to prevent duplicate accumulation"""
        return current + [new_result] if new_result not in current else current
```

## Testing Patterns

- Test files follow `*.test.*` naming pattern
- Focus on agent state transitions and API endpoint validation
- Mock external services (OCR models, databases) for consistent testing
- Test authentication flows end-to-end

```python
# Example test structure
def test_perception_pipeline():
    agent = OCRAgent()
    result = agent.process_document(mock_image)
    assert result['confidence'] > 0.8
    assert 'extracted_text' in result
```

## Commands

| Command | Purpose |
|---------|---------|
| `/auth-sync` | Integrate authentication across frontend and backend |
| `/upgrade-perception` | Upgrade OCR and perception agent capabilities |
| `/sync-frontend` | Synchronize frontend components with backend changes |
| `/wire-data` | Connect backend routes to live data sources |
| `/fix-agent-state` | Resolve LangGraph state management issues |