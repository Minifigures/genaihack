import json
import uuid
import structlog
from datetime import datetime
from backend.models.state import VigilState
from backend.config.settings import Settings
from database.connection import get_snowflake_connection

logger = structlog.get_logger()
settings = Settings()


def _serialize_procedures(procedures: list) -> str:
    """Serialize procedure list to JSON string for Snowflake VARIANT column."""
    return json.dumps([p.model_dump() for p in procedures])


def _serialize_dict(data: dict | None) -> str | None:
    """Serialize dict to JSON string for Snowflake VARIANT column."""
    if data is None:
        return None
    return json.dumps(data)


def _claim_exists(conn, claim_id: str) -> bool:
    """Check if a claim already exists (idempotency guard)."""
    try:
        cursor = conn.cursor()
        cursor.execute(
            "SELECT 1 FROM claims WHERE claim_id = %s",
            (claim_id,),
        )
        return cursor.fetchone() is not None
    except Exception as e:
        logger.warning("claim_exists_check_error", claim_id=claim_id, error=str(e))
        return False


def _insert_claim(conn, enriched) -> None:
    """Insert the enriched claim into the Snowflake claims table."""
    cursor = conn.cursor()
    cursor.execute(
        """
        INSERT INTO claims (
            claim_id, student_id, provider_id, claim_date,
            procedures, total, ocr_confidence, category_codes, raw_text
        ) VALUES (%s, %s, %s, %s, PARSE_JSON(%s), %s, %s, PARSE_JSON(%s), %s)
        """,
        (
            enriched.claim_id,
            enriched.student_id,
            enriched.provider_id,
            str(enriched.claim_date),
            _serialize_procedures(enriched.procedures),
            enriched.total,
            enriched.ocr_confidence,
            _serialize_dict(enriched.category_codes),
            None,  # raw_text stored at OCR level, not on enriched
        ),
    )


def _insert_audit_log(conn, enriched) -> None:
    """Write an audit log entry for the persisted claim."""
    cursor = conn.cursor()
    log_id = str(uuid.uuid4())
    details = json.dumps({
        "procedure_count": len(enriched.procedures),
        "total": enriched.total,
        "ocr_confidence": enriched.ocr_confidence,
        "warnings": getattr(enriched, "warnings", []),
    })
    cursor.execute(
        """
        INSERT INTO audit_log (log_id, claim_id, student_id, action, agent, details)
        VALUES (%s, %s, %s, %s, %s, PARSE_JSON(%s))
        """,
        (
            log_id,
            enriched.claim_id,
            enriched.student_id,
            "claim_persisted",
            "persister",
            details,
        ),
    )


async def run_persister(state: VigilState) -> dict:
    start = datetime.utcnow()
    logger.info("agent_start", agent="persister")

    try:
        enriched = state.get("enriched_claim")
        if enriched is None:
            logger.warning("persister_skip", reason="no enriched claim")
            return {
                "agent_traces": [{
                    "agent": "persister",
                    "event": "skip",
                    "message": "No enriched claim to persist",
                    "duration_ms": 0,
                    "timestamp": datetime.utcnow().isoformat(),
                }],
            }

        if settings.demo_mode:
            logger.info("persister_demo", claim_id=enriched.claim_id)
        else:
            conn = get_snowflake_connection()
            if conn is None:
                logger.warning("persister_no_connection", claim_id=enriched.claim_id)
            else:
                # Idempotency: skip if claim already exists
                if _claim_exists(conn, enriched.claim_id):
                    logger.info("persister_skip_duplicate", claim_id=enriched.claim_id)
                else:
                    _insert_claim(conn, enriched)
                    _insert_audit_log(conn, enriched)
                    logger.info("persister_wrote", claim_id=enriched.claim_id)

        duration = int((datetime.utcnow() - start).total_seconds() * 1000)
        logger.info("agent_complete", agent="persister", duration_ms=duration)

        return {
            "agent_traces": [{
                "agent": "persister",
                "event": "complete",
                "message": f"Persisted claim {enriched.claim_id[:8]} to database",
                "duration_ms": duration,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }

    except Exception as e:
        logger.error("agent_error", agent="persister", error=str(e))
        return {
            "errors": [f"persister: {str(e)}"],
            "agent_traces": [{
                "agent": "persister",
                "event": "error",
                "message": str(e),
                "duration_ms": None,
                "timestamp": datetime.utcnow().isoformat(),
            }],
        }
