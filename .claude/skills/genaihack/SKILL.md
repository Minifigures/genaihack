# genaihack Development Patterns

> Auto-generated skill from repository analysis

## Overview

The genaihack codebase is a Python-based AI application with a multi-agent architecture for document processing and claims management. It features a perception-reasoning pipeline with OCR, normalization, and history enrichment capabilities, backed by a FastAPI-style backend with authentication and a modern frontend interface.

## Coding Conventions

### File Naming
- Use `snake_case` for all Python files
- Examples: `ocr_agent.py`, `history_enricher.py`, `auth.py`

### Import Style
- Use aliases for common imports
```python
import pandas as pd
import numpy as np
from fastapi import FastAPI, Depends
from typing import Optional, List
```

### Export Style
- Mixed patterns for different modules
- Agent classes typically exported as default
- Route handlers exported as named functions

### Commit Messages
- Use conventional commit prefixes: `fix:`, `feat:`, `refactor:`, `merge:`
- Keep messages concise (average 45 characters)
- Examples:
  - `fix: auth integration across backend routes`
  - `feat: add OCR agent with new model support`

## Workflows

### Authentication Integration Fixes
**Trigger:** When authentication is broken or needs to be updated across the system
**Command:** `/fix-auth`

1. Update `backend/auth.py` with new authentication logic and token validation
2. Modify route files (`claims.py`, `cases.py`) to add or fix auth dependencies
3. Update authentication checks in business logic modules
4. Test auth flow end-to-end across all protected endpoints

```python
# Example auth dependency pattern
from fastapi import Depends
from backend.auth import get_current_user

async def protected_route(current_user = Depends(get_current_user)):
    # Route logic here
    pass
```

### Frontend Auth UI Updates
**Trigger:** When implementing new auth features or fixing auth-related UI
**Command:** `/update-auth-ui`

1. Update authentication components (`AuthButton.tsx`, `AuthGuard.tsx`)
2. Modify login and signup pages with new UI patterns
3. Update layout and navigation components to reflect auth state
4. Integrate with Supabase authentication service
5. Test user flows across login, signup, and protected routes

```typescript
// Example auth guard pattern
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginPrompt />;
  
  return <>{children}</>;
}
```

### Agent Pipeline Fixes
**Trigger:** When agent execution fails or needs refactoring across multiple components
**Command:** `/fix-agents`

1. Update perception agents starting with OCR agent for document processing
2. Fix normalizer agent for data validation and cleaning
3. Update history enricher for context enhancement
4. Fix audit logger and action agents for proper execution tracking
5. Verify state management and data flow between agents

```python
# Example agent pattern
class OCRAgent:
    def __init__(self, model_config):
        self.model = load_ocr_model(model_config)
    
    async def process(self, document):
        extracted_text = await self.model.extract(document)
        return self.normalize_output(extracted_text)
```

### Backend Route Updates
**Trigger:** When adding new features or fixing data flow in the API endpoints
**Command:** `/update-routes`

1. Update `claims.py` with new claim processing logic and validation
2. Modify `cases.py` with enhanced case management features
3. Add or update metrics endpoints for monitoring
4. Update related data models to support new functionality
5. Add proper error handling and response formatting

```python
# Example route pattern
@router.post("/claims", response_model=ClaimResponse)
async def create_claim(
    claim_data: ClaimCreate,
    current_user = Depends(get_current_user)
):
    # Validate and process claim
    claim = await claim_service.create(claim_data, current_user.id)
    return ClaimResponse.from_orm(claim)
```

### Perception Layer Upgrades
**Trigger:** When enhancing OCR, normalization, or data processing capabilities
**Command:** `/upgrade-perception`

1. Upgrade OCR agent with new models, preprocessing, or accuracy improvements
2. Enhance normalizer with advanced validation logic and data cleaning
3. Update history enricher with live data connections and context retrieval
4. Modify persister for new storage patterns and data formats
5. Update claim models to support new data structures
6. Add comprehensive tests for the entire perception pipeline

```python
# Example perception pipeline
async def perception_pipeline(document):
    # OCR processing
    raw_text = await ocr_agent.extract(document)
    
    # Normalization
    clean_data = await normalizer.process(raw_text)
    
    # History enrichment
    enriched_data = await history_enricher.enrich(clean_data)
    
    # Persistence
    return await persister.save(enriched_data)
```

## Testing Patterns

### Test File Structure
- Test files follow `*.test.*` pattern
- Unknown testing framework detected - likely pytest or unittest
- Organize tests by module/agent type

### Testing Approach
```python
# Example test structure
def test_ocr_agent_processing():
    agent = OCRAgent(test_config)
    result = agent.process(sample_document)
    assert result.confidence > 0.8
    assert len(result.extracted_text) > 0

def test_auth_integration():
    # Test auth flow across routes
    pass
```

## Commands

| Command | Purpose |
|---------|---------|
| `/fix-auth` | Fix authentication issues across backend routes and auth systems |
| `/update-auth-ui` | Update authentication UI components and pages |
| `/fix-agents` | Fix bugs across multiple agents in the perception/reasoning pipeline |
| `/update-routes` | Update backend API routes for claims and cases with new functionality |
| `/upgrade-perception` | Upgrade the entire perception layer with new capabilities |