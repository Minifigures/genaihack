import structlog
from backend.config.settings import Settings

logger = structlog.get_logger()
settings = Settings()

_connection = None


def get_snowflake_connection():
    global _connection
    if _connection is not None:
        return _connection

    if settings.demo_mode and not settings.snowflake_account:
        logger.info("snowflake_demo_mode", message="No Snowflake connection in demo mode")
        return None

    try:
        import snowflake.connector
        _connection = snowflake.connector.connect(
            account=settings.snowflake_account,
            user=settings.snowflake_user,
            password=settings.snowflake_password,
            database=settings.snowflake_database,
            schema=settings.snowflake_schema,
            warehouse=settings.snowflake_warehouse,
            role=settings.snowflake_role,
        )
        logger.info("snowflake_connected")
        return _connection
    except Exception as e:
        logger.error("snowflake_connection_error", error=str(e))
        return None


def execute_query(query: str, params: dict | None = None) -> list[dict]:
    conn = get_snowflake_connection()
    if conn is None:
        return []

    try:
        cursor = conn.cursor()
        cursor.execute(query, params or {})
        columns = [desc[0].lower() for desc in cursor.description] if cursor.description else []
        rows = cursor.fetchall()
        return [dict(zip(columns, row)) for row in rows]
    except Exception as e:
        logger.error("snowflake_query_error", error=str(e))
        return []
