from fastapi import APIRouter
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.get("/metrics")
async def get_metrics():
    from backend.routes.claims import _claims_store

    total_runs = len(_claims_store)

    if total_runs == 0:
        return {
            "agents": {"total_runs": 0, "avg_duration_ms": 0},
            "pipeline": {"total_runs": 0, "avg_fraud_score": 0, "total_flags": 0},
        }

    # Fraud scores across all claims
    scores = [
        c["fraud_score"]["score"]
        for c in _claims_store
        if c.get("fraud_score") and c["fraud_score"].get("score") is not None
    ]
    avg_score = round(sum(scores) / len(scores), 1) if scores else 0

    # Total fraud flags across all claims
    total_flags = sum(len(c.get("fraud_flags", [])) for c in _claims_store)

    # Average agent duration from traces
    all_durations = [
        t["duration_ms"]
        for c in _claims_store
        for t in c.get("agent_traces", [])
        if t.get("duration_ms") is not None
    ]
    avg_duration = int(sum(all_durations) / len(all_durations)) if all_durations else 0

    return {
        "agents": {
            "total_runs": total_runs,
            "avg_duration_ms": avg_duration,
        },
        "pipeline": {
            "total_runs": total_runs,
            "avg_fraud_score": avg_score,
            "total_flags": total_flags,
        },
    }
