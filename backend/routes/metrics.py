from fastapi import APIRouter
import structlog

logger = structlog.get_logger()
router = APIRouter()


@router.get("/metrics")
async def get_metrics():
    return {
        "agents": {
            "total_runs": 0,
            "avg_duration_ms": 0,
        },
        "pipeline": {
            "total_runs": 0,
            "avg_fraud_score": 0,
            "total_flags": 0,
        },
    }
