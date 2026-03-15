# genaihack Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill covers development patterns for the genaihack repository, a Python-based AI hackathon project focused on agent-based processing pipelines. The codebase features perception agents (OCR), state management, and cross-platform development tooling. The project emphasizes compatibility across different Python environments and provides comprehensive demo data for testing AI workflows.

## Coding Conventions

### File Naming
- Use `snake_case` for all Python files and directories
- Test files follow pattern: `*.test.*`
- Demo data organized in structured directories: `data/demo_receipts/`

### Import Style
```python
# Use aliases for common imports
import pandas as pd
import numpy as np
from pathlib import Path as PathLib
```

### Export Style
- Mixed export patterns used throughout codebase
- Agent modules typically export main agent classes
- Utility modules may use `__all__` declarations

### Commit Conventions
- Use conventional commit prefixes: `fix:`, `feat:`, `refactor:`
- Keep commit messages concise (~48 characters average)
- Focus on clear, actionable descriptions

## Workflows

### Requirements Compatibility Fix
**Trigger:** When there are Python version compatibility issues or package conflicts
**Command:** `/fix-requirements`

1. Identify problematic package versions in `requirements.txt`
2. Unpin strict version requirements that cause conflicts
3. Create alternative requirements files (e.g., `requirements_compat.txt`, `requirements_no_ibm.txt`)
4. Test compatibility across target Python versions
5. Update documentation with compatibility notes

```python
# Example: Unpinning strict versions
# Before: pandas==1.5.0
# After: pandas>=1.4.0,<2.0.0
```

### Demo Data Enhancement
**Trigger:** When adding new test cases or demo scenarios for the application
**Command:** `/add-demo-data`

1. Create new demo data files in appropriate directories (`data/demo_receipts/`)
2. Update OCR agent (`agents/perception/ocr_agent.py`) with new scenario handling
3. Add corresponding test files following `*.test.*` pattern
4. Update `README.md` with new examples and usage instructions
5. Validate data flows through the agent pipeline

```python
# Example: Adding new OCR test case
def test_new_receipt_format():
    agent = OCRAgent()
    result = agent.process("data/demo_receipts/new_format.pdf")
    assert result.confidence > 0.8
```

### Startup Script Creation
**Trigger:** When improving developer experience with automated setup and server management
**Command:** `/add-startup-scripts`

1. Create PowerShell scripts for Windows (`start.ps1`, `kill_servers.ps1`)
2. Create bash scripts for Unix/Linux (`start.sh`)
3. Add batch files for specific components (`start_backend.bat`, `start_frontend.bat`)
4. Include cleanup and kill scripts for development workflow
5. Update `README.md` with cross-platform usage instructions

```powershell
# Example PowerShell startup script
# start.ps1
Write-Host "Starting genaihack development environment..."
Start-Process -FilePath "python" -ArgumentList "backend/app.py"
Start-Process -FilePath "npm" -ArgumentList "start" -WorkingDirectory "frontend"
```

### Agent State Model Fix
**Trigger:** When there are state synchronization or data passing issues between agents
**Command:** `/fix-agent-state`

1. Update state models in `backend/models/state.py` with proper reducers
2. Fix agent return values to return deltas instead of accumulations
3. Update pipeline state capture mechanisms
4. Test agent communication and data flow
5. Validate state consistency across the processing pipeline

```python
# Example: Proper state delta return
class OCRAgent:
    def process(self, input_data, current_state):
        # Process input
        ocr_results = self.extract_text(input_data)
        
        # Return delta, not full state
        return {
            'ocr_data': ocr_results,
            'confidence': self.calculate_confidence(),
            'timestamp': datetime.now()
        }
```

## Testing Patterns

- Test files use pattern: `*.test.*` (e.g., `ocr_agent.test.py`)
- Framework appears to be custom or minimal setup
- Focus on agent pipeline testing and integration scenarios
- Demo data extensively used for realistic test cases

```python
# Example test structure
def test_agent_pipeline():
    # Setup demo data
    demo_file = "data/demo_receipts/sample.pdf"
    
    # Process through agents
    ocr_result = ocr_agent.process(demo_file)
    final_state = pipeline.process(ocr_result)
    
    # Validate results
    assert final_state.is_valid()
```

## Commands

| Command | Purpose |
|---------|---------|
| `/fix-requirements` | Update Python package requirements to fix version compatibility issues |
| `/add-demo-data` | Add or update demo data files and test scenarios |
| `/add-startup-scripts` | Create cross-platform startup and management scripts for development |
| `/fix-agent-state` | Fix agent state management and data flow issues across the pipeline |