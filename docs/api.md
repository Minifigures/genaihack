# VIGIL API Reference

Base URL: `http://localhost:8000`

## Health Check

```
GET /api/health
```

Response: `{"status": "ok", "service": "vigil-backend"}`

## Claims

### Upload Receipt
```
POST /api/claims/upload
Content-Type: multipart/form-data

Fields:
  - file: Receipt image (PNG, JPG, PDF)
  - student_id: Student identifier (default: "STU-001")
```

Response: Full pipeline result including fraud score, flags, benefits report, and agent traces.

### List Claims
```
GET /api/claims
```

### Get Claim Detail
```
GET /api/claims/{claim_id}
```

## Cases

### List Fraud Cases
```
GET /api/cases
```

### Get Case Detail
```
GET /api/cases/{case_id}
```

### Approve Case
```
POST /api/cases/{case_id}/approve
```

### Dismiss Case
```
POST /api/cases/{case_id}/dismiss
```

## Benefits

### Get Student Benefits
```
GET /api/benefits/{student_id}
```

## Providers

### List Providers
```
GET /api/providers
```

### Get Provider Detail
```
GET /api/providers/{provider_id}
```

## Audit Log

### List Audit Entries
```
GET /api/audit?limit=50&offset=0
```

## Metrics

### Get System Metrics
```
GET /api/metrics
```

## WebSocket

### Agent Trace Stream
```
WS /ws/trace
```

Events:
```json
{
  "event": "agent_start" | "complete" | "error",
  "agent": "ocr_agent",
  "message": "Processing receipt...",
  "duration_ms": 1200
}
```
