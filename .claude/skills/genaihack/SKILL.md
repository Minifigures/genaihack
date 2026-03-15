# genaihack Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill teaches development patterns for the genaihack repository - an AI-powered application with a multi-agent architecture for document processing and claim management. The codebase features a Python backend with agent-based perception and action modules, a React/TypeScript frontend, and integration with authentication and database systems.

## Coding Conventions

### File Naming
- Use `snake_case` for Python files: `ocr_agent.py`, `audit_logger.py`
- Use `PascalCase` for React components: `AuthButton.tsx`, `AuthGuard.tsx`

### Import Style
```python
# Use aliases for common imports
import pandas as pd
import numpy as np
from typing import Dict, List, Optional

# Group imports: stdlib, third-party, local
import os
import sys
import requests
from .models import Claim
```

### Commit Conventions
- Use conventional commit prefixes: `feat:`, `fix:`, `refactor:`, `merge:`
- Keep messages concise (~45 characters average)
- Examples: `fix: auth integration with routes`, `feat: enhance OCR agent capabilities`

### Testing Patterns
- Test files follow pattern: `*.test.*`
- Framework detection needed - likely pytest or unittest

## Workflows

### Authentication Integration Fix
**Trigger:** When authentication is broken or needs to be bypassed/integrated across the application
**Command:** `/fix-auth`

1. **Update authentication core logic**
   ```python
   # Update backend/auth.py
   def authenticate_user(token: str) -> Dict:
       # Add new auth logic or bypass
       pass
   ```

2. **Modify route authentication**
   ```python
   # Update backend/routes/cases.py and backend/routes/claims.py
   from ..auth import authenticate_user
   
   @app.route('/api/cases')
   def get_cases():
       # Integrate or bypass auth
       pass
   ```

3. **Test authentication flow**
   - Verify routes work with new auth
   - Test both authenticated and unauthenticated scenarios

### Database Migration and Refactor
**Trigger:** When switching database providers or implementing major schema changes
**Command:** `/migrate-db`

1. **Update database connection**
   ```python
   # Modify database/connection.py
   def get_db_connection():
       # New database provider logic
       pass
   ```

2. **Update data store layer**
   ```python
   # Update backend/store.py
   class DataStore:
       def __init__(self):
           # Update for new database
           pass
   ```

3. **Modify agent persistence**
   - Update `agents/action/audit_logger.py`
   - Update `agents/perception/persister.py`

4. **Update configuration**
   - Modify `backend/config/settings.py`
   - Update `requirements.txt` with new database dependencies

5. **Update all route handlers**
   - Modify all files in `backend/routes/`
   - Ensure database calls use new connection pattern

### Perception Agent Enhancement
**Trigger:** When improving document processing and OCR capabilities
**Command:** `/upgrade-perception`

1. **Enhance OCR capabilities**
   ```python
   # Update agents/perception/ocr_agent.py
   class OCRAgent:
       def process_document(self, doc_path: str) -> Dict:
           # Enhanced OCR logic with new models
           pass
   ```

2. **Improve data normalization**
   ```python
   # Update agents/perception/normalizer.py
   class Normalizer:
       def normalize_data(self, raw_data: Dict) -> Dict:
           # Add validation and enhanced normalization
           pass
   ```

3. **Update history enrichment**
   - Modify `agents/perception/history_enricher.py`
   - Add contextual data enhancement

4. **Update persistence layer**
   - Modify `agents/perception/persister.py`
   - Ensure new data structures are properly stored

5. **Update claim models**
   ```python
   # Update backend/models/claim.py
   class Claim:
       # Add new fields from enhanced perception
       pass
   ```

6. **Write comprehensive tests**
   - Create/update `tests/test_perception.py`
   - Test entire perception pipeline

### Frontend Authentication UI Integration
**Trigger:** When adding or fixing frontend authentication components and user interface
**Command:** `/integrate-auth-ui`

1. **Create authentication components**
   ```typescript
   // Create frontend/components/AuthButton.tsx
   export const AuthButton = () => {
     // Auth button logic
   };
   
   // Create frontend/components/AuthGuard.tsx
   export const AuthGuard = ({ children }) => {
     // Route protection logic
   };
   ```

2. **Add authentication pages**
   ```typescript
   // Create frontend/app/login/page.tsx
   export default function LoginPage() {
     // Login form and logic
   }
   
   // Create frontend/app/signup/page.tsx
   export default function SignupPage() {
     // Signup form and logic
   }
   ```

3. **Update navigation**
   ```typescript
   // Update frontend/components/Nav.tsx
   import { AuthButton } from './AuthButton';
   // Add auth state and logout functionality
   ```

4. **Setup Supabase integration**
   ```typescript
   // Update frontend/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js';
   // Configure auth client
   ```

5. **Update dependencies**
   - Modify `frontend/package.json`
   - Run `npm install` to update `frontend/package-lock.json`

### Agent Pipeline Critical Fixes
**Trigger:** When the agent pipeline has errors or state management issues
**Command:** `/fix-pipeline`

1. **Fix audit logging issues**
   ```python
   # Update agents/action/audit_logger.py
   class AuditLogger:
       def log_action(self, action: Dict) -> bool:
           # Fix logging errors and state issues
           pass
   ```

2. **Resolve OCR agent problems**
   - Debug and fix `agents/perception/ocr_agent.py`
   - Handle edge cases and error states

3. **Fix perception agent chain**
   - Update `agents/perception/history_enricher.py`
   - Ensure proper data flow between agents

4. **Repair route endpoints**
   - Fix issues in `backend/routes/claims.py`
   - Fix issues in `backend/routes/cases.py`
   - Ensure proper error handling

5. **Test complete pipeline**
   - Verify document upload → OCR → normalization → persistence flow
   - Test error handling at each stage

## Commands

| Command | Purpose |
|---------|---------|
| `/fix-auth` | Fix authentication integration across backend and frontend |
| `/migrate-db` | Migrate database backend and update all dependent modules |
| `/upgrade-perception` | Enhance OCR and perception pipeline capabilities |
| `/integrate-auth-ui` | Add/fix frontend authentication UI components |
| `/fix-pipeline` | Fix critical bugs across agent pipeline modules |