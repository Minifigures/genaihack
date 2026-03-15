"""
Unified data store for VIGIL via Supabase PostgreSQL.
"""
import json
import uuid
from typing import Optional

import structlog
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, AsyncEngine
from sqlalchemy.orm import sessionmaker

from backend.config.settings import Settings
from backend.data import (
    DEMO_PROVIDERS,
    DEMO_STUDENT_BENEFITS,
    DEMO_FRAUD_CASES,
    get_demo_case,
    get_demo_provider,
    get_demo_providers,
    get_demo_benefits,
)
from backend.models.claim import EnrichedClaim
from backend.models.fraud import FraudCase

logger = structlog.get_logger()


class VigilStore:
    """Singleton store managing persistence.

    Backends:
    - PostgreSQL: When DATABASE_URL is set (e.g., Supabase)
    """

    _instance: Optional["VigilStore"] = None

    def __new__(cls) -> "VigilStore":
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if self._initialized:
            return
        self.settings = Settings()
        self._engine: Optional[AsyncEngine] = None
        self._session_factory: Optional[sessionmaker] = None
        self._ready = False
        self._initialized = True

    @property
    def backend(self) -> str:
        """Determine which backend to use.
        """
        if self.settings.demo_mode:
            return "demo"
        if self.settings.database_url:
            return "postgres"
        return "demo"  # Fallback to demo mode

    async def initialize(self) -> None:
        """Initialize database connection and create tables."""
        if self._ready:
            logger.info("store_already_initialized")
            return

        # Demo mode: no database needed
        if self.settings.demo_mode:
            self._ready = True
            logger.info("store_initialized", backend="demo")
            return

        # PostgreSQL (Supabase)
        database_url = self.settings.database_url
        if not database_url:
            raise RuntimeError(
                "DATABASE_URL not set. Add it to .env with your Supabase connection string:\n"
                "DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
            )

        # Ensure asyncpg URL format
        if database_url.startswith("postgres://"):
            database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif database_url.startswith("postgresql://"):
            database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)

        try:
            # Disable prepared statements for Supabase pooler compatibility
            self._engine = create_async_engine(
                database_url,
                echo=False,
                connect_args={"statement_cache_size": 0}  # Required for pgbouncer
            )
            self._session_factory = sessionmaker(
                self._engine, class_=AsyncSession, expire_on_commit=False
            )
            await self._create_tables()
            await self._seed_demo_data()
            self._ready = True
            logger.info("store_initialized", backend="postgres")
        except Exception as e:
            logger.error("store_init_failed", error=str(e))
            raise

    async def _create_tables(self) -> None:
        """Create PostgreSQL tables if they don't exist."""
        if self._engine is None:
            raise RuntimeError("Engine not initialized")

        async with self._engine.begin() as conn:  # type: ignore[misc]
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS claims (
                    claim_id TEXT PRIMARY KEY,
                    tenant_id TEXT,
                    created_by TEXT,
                    session_id TEXT,
                    student_id TEXT NOT NULL,
                    provider_id TEXT,
                    claim_date DATE NOT NULL,
                    procedures JSONB,
                    total FLOAT NOT NULL,
                    ocr_confidence FLOAT,
                    category_codes JSONB,
                    raw_text TEXT,
                    created_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))

            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS fraud_cases (
                    case_id TEXT PRIMARY KEY,
                    tenant_id TEXT,
                    created_by TEXT,
                    session_id TEXT,
                    claim_id TEXT,
                    student_id TEXT NOT NULL,
                    provider_id TEXT,
                    fraud_score FLOAT NOT NULL,
                    risk_level TEXT NOT NULL,
                    score_breakdown JSONB,
                    flags JSONB,
                    status TEXT DEFAULT 'open',
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))

            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    log_id TEXT PRIMARY KEY,
                    tenant_id TEXT,
                    session_id TEXT,
                    case_id TEXT,
                    claim_id TEXT,
                    student_id TEXT,
                    user_id TEXT,
                    action TEXT NOT NULL,
                    agent TEXT,
                    details JSONB,
                    timestamp TIMESTAMPTZ DEFAULT NOW()
                )
            """))

            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS providers (
                    provider_id TEXT PRIMARY KEY,
                    tenant_id TEXT,
                    provider_name TEXT NOT NULL,
                    address TEXT,
                    total_claims INTEGER DEFAULT 0,
                    flagged_claims INTEGER DEFAULT 0,
                    avg_fee_deviation FLOAT DEFAULT 0,
                    risk_tier TEXT DEFAULT 'clean',
                    common_fraud_types JSONB,
                    last_claim_date DATE,
                    updated_at TIMESTAMPTZ DEFAULT NOW()
                )
            """))

            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS student_benefits (
                    student_id TEXT NOT NULL,
                    tenant_id TEXT,
                    plan_year TEXT NOT NULL,
                    category TEXT NOT NULL,
                    annual_limit FLOAT NOT NULL,
                    used_ytd FLOAT DEFAULT 0,
                    remaining FLOAT,
                    last_updated TIMESTAMPTZ DEFAULT NOW(),
                    PRIMARY KEY (student_id, plan_year, category)
                )
            """))

            # Create indexes
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_claims_student_id ON claims(student_id)"
            ))
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_claims_tenant_id ON claims(tenant_id)"
            ))
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_cases_status ON fraud_cases(status)"
            ))
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_cases_claim_id ON fraud_cases(claim_id)"
            ))
            await conn.execute(text(
                "CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp)"
            ))

    async def _seed_demo_data(self) -> None:
        """Seed demo data if tables are empty."""
        if self._session_factory is None:
            raise RuntimeError("Session factory not initialized")

        async with self._session_factory() as session:
            result = await session.execute(text("SELECT COUNT(*) FROM providers"))
            count = result.scalar()

            if count == 0:
                # Seed providers from demo data
                for p in DEMO_PROVIDERS:
                    await session.execute(text("""
                        INSERT INTO providers (provider_id, provider_name, address,
                                               total_claims, flagged_claims, avg_fee_deviation,
                                               risk_tier, common_fraud_types)
                        VALUES (:id, :name, :address, :total, :flagged, :deviation,
                                :tier, CAST(:fraud_types AS jsonb))
                    """), {
                        "id": p["provider_id"],
                        "name": p["provider_name"],
                        "address": p["address"],
                        "total": p["total_claims"],
                        "flagged": p["flagged_claims"],
                        "deviation": p["avg_fee_deviation"],
                        "tier": p["risk_tier"],
                        "fraud_types": json.dumps(p["common_fraud_types"]),
                    })

                # Seed student benefits from demo data
                for b in DEMO_STUDENT_BENEFITS:
                    await session.execute(text("""
                        INSERT INTO student_benefits
                        (student_id, plan_year, category, annual_limit, used_ytd, remaining)
                        VALUES (:student_id, :plan_year, :category, :limit, :used, :remaining)
                    """), {
                        "student_id": b["student_id"],
                        "plan_year": b["plan_year"],
                        "category": b["category"],
                        "limit": b["annual_limit"],
                        "used": b["used_ytd"],
                        "remaining": b["remaining"],
                    })

                await session.commit()
                logger.info("store_seeded_demo_data")

    async def close(self) -> None:
        """Close database connections."""
        if self._engine:
            await self._engine.dispose()
            self._engine = None
            self._session_factory = None
            self._ready = False
            logger.info("store_closed")

    async def _ensure_session(self) -> sessionmaker:
        """Ensure session factory is ready."""
        if not self._ready:
            await self.initialize()
        if self._session_factory is None:
            raise RuntimeError("Database session factory not initialized.")
        return self._session_factory

    # ==================== WRITE OPERATIONS ====================

    async def save_claim(
        self,
        claim: EnrichedClaim,
        raw_text: Optional[str] = None,
        tenant_id: Optional[str] = None,
        created_by: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> str:
        """Save a claim to the store. Returns claim_id."""
        if self.backend == "demo":
            logger.info("store_claim_saved", claim_id=claim.claim_id, backend="demo")
            return claim.claim_id

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            procedures_json = json.dumps([p.model_dump() for p in claim.procedures])
            category_codes_json = json.dumps(claim.category_codes)

            await session.execute(text("""
                INSERT INTO claims (claim_id, tenant_id, created_by, session_id, student_id,
                                   provider_id, claim_date, procedures, total, ocr_confidence,
                                   category_codes, raw_text)
                VALUES (:claim_id, :tenant_id, :created_by, :session_id, :student_id,
                        :provider_id, :claim_date, CAST(:procedures AS jsonb), :total, :ocr_confidence,
                        CAST(:category_codes AS jsonb), :raw_text)
            """), {
                "claim_id": claim.claim_id,
                "tenant_id": tenant_id,
                "created_by": created_by,
                "session_id": session_id,
                "student_id": claim.student_id,
                "provider_id": claim.provider_id,
                "claim_date": claim.claim_date,
                "procedures": procedures_json,
                "total": claim.total,
                "ocr_confidence": claim.ocr_confidence,
                "category_codes": category_codes_json,
                "raw_text": raw_text,
            })
            await session.commit()

        logger.info("store_claim_saved", claim_id=claim.claim_id, backend=self.backend)
        return claim.claim_id

    async def save_fraud_case(
        self,
        case: FraudCase,
        tenant_id: Optional[str] = None,
        created_by: Optional[str] = None,
        session_id: Optional[str] = None,
    ) -> str:
        """Save a fraud case to the store. Returns case_id."""
        if self.backend == "demo":
            logger.info("store_case_saved", case_id=case.case_id, backend="demo")
            return case.case_id

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            breakdown_json = case.fraud_score.breakdown.model_dump_json()
            flags_json = json.dumps([f.model_dump() for f in case.flags])

            await session.execute(text("""
                INSERT INTO fraud_cases (case_id, tenant_id, created_by, session_id, claim_id,
                                        student_id, provider_id, fraud_score, risk_level,
                                        score_breakdown, flags, status)
                VALUES (:case_id, :tenant_id, :created_by, :session_id, :claim_id,
                        :student_id, :provider_id, :fraud_score, :risk_level,
                        CAST(:score_breakdown AS jsonb), CAST(:flags AS jsonb), :status)
            """), {
                "case_id": case.case_id,
                "tenant_id": tenant_id,
                "created_by": created_by,
                "session_id": session_id,
                "claim_id": case.claim_id,
                "student_id": case.student_id,
                "provider_id": case.provider_id,
                "fraud_score": case.fraud_score.score,
                "risk_level": case.fraud_score.level.value,
                "score_breakdown": breakdown_json,
                "flags": flags_json,
                "status": case.status,
            })
            await session.commit()

        logger.info("store_case_saved", case_id=case.case_id, backend=self.backend)
        return case.case_id

    async def save_audit_entry(
        self,
        action: str,
        agent: str = "api",
        case_id: Optional[str] = None,
        claim_id: Optional[str] = None,
        student_id: Optional[str] = None,
        user_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        session_id: Optional[str] = None,
        details: Optional[dict] = None,
    ) -> str:
        """Save an audit log entry. Returns log_id."""
        log_id = str(uuid.uuid4())

        if self.backend == "demo":
            logger.debug("store_audit_entry_saved", log_id=log_id, action=action, backend="demo")
            return log_id

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            details_json = json.dumps(details or {})

            await session.execute(text("""
                INSERT INTO audit_log (log_id, tenant_id, session_id, case_id, claim_id,
                                       student_id, user_id, action, agent, details)
                VALUES (:log_id, :tenant_id, :session_id, :case_id, :claim_id,
                        :student_id, :user_id, :action, :agent, CAST(:details AS jsonb))
            """), {
                "log_id": log_id,
                "tenant_id": tenant_id,
                "session_id": session_id,
                "case_id": case_id,
                "claim_id": claim_id,
                "student_id": student_id,
                "user_id": user_id,
                "action": action,
                "agent": agent,
                "details": details_json,
            })
            await session.commit()

        logger.debug("store_audit_entry_saved", log_id=log_id, action=action)
        return log_id

    async def update_case_status(
        self,
        case_id: str,
        status: str,
        user_id: Optional[str] = None,
        reason: Optional[str] = None,
    ) -> bool:
        """Update case status (approved/dismissed). Returns True if updated."""
        if self.backend == "demo":
            logger.info("store_case_status_updated", case_id=case_id, status=status, backend="demo")
            await self.save_audit_entry(
                action=f"case_{status}",
                agent="api",
                case_id=case_id,
                user_id=user_id,
                details={"reason": reason} if reason else None,
            )
            return True

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            result = await session.execute(text("""
                UPDATE fraud_cases
                SET status = :status, updated_at = NOW()
                WHERE case_id = :case_id
            """), {"case_id": case_id, "status": status})

            if result.rowcount > 0:
                await session.commit()
                await self.save_audit_entry(
                    action=f"case_{status}",
                    agent="api",
                    case_id=case_id,
                    user_id=user_id,
                    details={"reason": reason} if reason else None,
                )
                return True
            return False

    # ==================== READ OPERATIONS ====================

    async def get_claims(
        self,
        student_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
        limit: int = 50,
    ) -> list[dict]:
        """Get claims, optionally filtered."""
        if self.backend == "demo":
            # Return empty list for demo - claims are created dynamically
            return []

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            query = "SELECT * FROM claims"
            conditions = []
            params: dict = {}

            if student_id:
                conditions.append("student_id = :student_id")
                params["student_id"] = student_id
            if tenant_id:
                conditions.append("tenant_id = :tenant_id")
                params["tenant_id"] = tenant_id

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += " ORDER BY created_at DESC LIMIT :limit"
            params["limit"] = limit

            result = await session.execute(text(query), params)
            rows = result.fetchall()
            return [self._row_to_dict(row._mapping) for row in rows]  # type: ignore[union-attr,protected-access]

    async def get_claim(self, claim_id: str) -> Optional[dict]:
        """Get a single claim by ID."""
        if self.backend == "demo":
            # Return None for demo - claims are created dynamically
            return None

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            result = await session.execute(
                text("SELECT * FROM claims WHERE claim_id = :claim_id"),
                {"claim_id": claim_id}
            )
            row = result.fetchone()
            if row:
                return self._row_to_dict(row._mapping)  # type: ignore[union-attr,protected-access]
            return None

    async def get_cases(
        self,
        status: Optional[str] = None,
        tenant_id: Optional[str] = None,
        limit: int = 50,
    ) -> list[dict]:
        """Get fraud cases, optionally filtered."""
        if self.backend == "demo":
            cases = [c.copy() for c in DEMO_FRAUD_CASES]
            if status:
                cases = [c for c in cases if c["status"] == status]
            return cases[:limit]

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            query = "SELECT * FROM fraud_cases"
            conditions = []
            params: dict = {}

            if status:
                conditions.append("status = :status")
                params["status"] = status
            if tenant_id:
                conditions.append("tenant_id = :tenant_id")
                params["tenant_id"] = tenant_id

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += " ORDER BY created_at DESC LIMIT :limit"
            params["limit"] = limit

            result = await session.execute(text(query), params)
            rows = result.fetchall()
            return [self._row_to_dict(row._mapping) for row in rows]  # type: ignore[union-attr,protected-access]

    async def get_case(self, case_id: str) -> Optional[dict]:
        """Get a single fraud case by ID."""
        if self.backend == "demo":
            return get_demo_case(case_id)

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            result = await session.execute(
                text("SELECT * FROM fraud_cases WHERE case_id = :case_id"),
                {"case_id": case_id}
            )
            row = result.fetchone()
            if row:
                return self._row_to_dict(row._mapping)  # type: ignore[union-attr,protected-access]
            return None

    async def get_providers(self, tenant_id: Optional[str] = None) -> list[dict]:
        """Get all provider stats."""
        if self.backend == "demo":
            return get_demo_providers()

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            query = "SELECT * FROM providers"
            params: dict = {}

            if tenant_id:
                query += " WHERE tenant_id = :tenant_id OR tenant_id IS NULL"
                params["tenant_id"] = tenant_id

            query += " ORDER BY provider_id"

            result = await session.execute(text(query), params)
            rows = result.fetchall()
            return [self._row_to_dict(row._mapping) for row in rows]  # type: ignore[union-attr,protected-access]

    async def get_provider(self, provider_id: str) -> Optional[dict]:
        """Get a single provider by ID."""
        if self.backend == "demo":
            return get_demo_provider(provider_id)

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            result = await session.execute(
                text("SELECT * FROM providers WHERE provider_id = :provider_id"),
                {"provider_id": provider_id}
            )
            row = result.fetchone()
            if row:
                return self._row_to_dict(row._mapping)  # type: ignore[union-attr,protected-access]
            return None

    async def get_audit_log(
        self,
        limit: int = 50,
        offset: int = 0,
        case_id: Optional[str] = None,
        claim_id: Optional[str] = None,
        tenant_id: Optional[str] = None,
    ) -> list[dict]:
        """Get audit log entries with pagination."""
        if self.backend == "demo":
            return []

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            query = "SELECT * FROM audit_log"
            conditions = []
            params: dict = {"limit": limit, "offset": offset}

            if case_id:
                conditions.append("case_id = :case_id")
                params["case_id"] = case_id
            if claim_id:
                conditions.append("claim_id = :claim_id")
                params["claim_id"] = claim_id
            if tenant_id:
                conditions.append("tenant_id = :tenant_id")
                params["tenant_id"] = tenant_id

            if conditions:
                query += " WHERE " + " AND ".join(conditions)

            query += " ORDER BY timestamp DESC LIMIT :limit OFFSET :offset"

            result = await session.execute(text(query), params)
            rows = result.fetchall()
            return [self._row_to_dict(row._mapping) for row in rows]  # type: ignore[union-attr,protected-access]

    async def get_student_benefits(
        self,
        student_id: str,
        tenant_id: Optional[str] = None,
    ) -> list[dict]:
        """Get benefits for a student."""
        if self.backend == "demo":
            return get_demo_benefits(student_id)

        session_factory = await self._ensure_session()
        async with session_factory() as session:
            query = "SELECT * FROM student_benefits WHERE student_id = :student_id"
            params: dict = {"student_id": student_id}

            if tenant_id:
                query += " AND (tenant_id = :tenant_id OR tenant_id IS NULL)"
                params["tenant_id"] = tenant_id

            result = await session.execute(text(query), params)
            rows = result.fetchall()
            return [self._row_to_dict(row._mapping) for row in rows]  # type: ignore[protected-access]

    # ==================== HELPERS ====================

    @staticmethod
    def _row_to_dict(row: dict) -> dict:
        """Convert database row to dict, parsing JSON fields."""
        result = dict(row)
        for key in ['procedures', 'category_codes', 'score_breakdown', 'flags',
                    'common_fraud_types', 'details']:
            if key in result and isinstance(result[key], str):
                try:
                    result[key] = json.loads(result[key])
                except (json.JSONDecodeError, TypeError):
                    pass
        return result


# Module-level singleton
store = VigilStore()
