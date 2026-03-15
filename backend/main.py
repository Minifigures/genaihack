import sys
from pathlib import Path
from contextlib import asynccontextmanager

# Add project root to path so imports work
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import structlog

from slowapi.errors import RateLimitExceeded

from backend.config.settings import Settings
from backend.config.logging import setup_logging
from backend.websocket.trace import manager
from backend.store import store
from backend.rate_limit import limiter

settings = Settings()
setup_logging(settings.log_level)
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize store on startup, close on shutdown."""
    # Startup: Initialize db connection and create tables
    await store.initialize()
    logger.info("app_started", backend=store.backend)
    yield
    # Shutdown: Close connections
    await store.close()
    logger.info("app_shutdown")


app = FastAPI(title="VIGIL API", version="0.1.0", lifespan=lifespan)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"error": "Rate limit exceeded. Please try again later."},
    )


app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "vigil-backend"}


@app.websocket("/ws/trace")
async def websocket_trace(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            logger.debug("ws_message", data=data)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# Include route modules
from backend.routes import claims, cases, benefits, providers, audit, metrics as metrics_router, clinics, health as health_router, chat

app.include_router(claims.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(benefits.router, prefix="/api")
app.include_router(providers.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(metrics_router.router, prefix="/api")
app.include_router(clinics.router, prefix="/api")
app.include_router(health_router.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
