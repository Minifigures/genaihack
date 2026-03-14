import sys
from pathlib import Path

# Add project root to path so imports work
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import structlog

from backend.config.settings import Settings
from backend.config.logging import setup_logging
from backend.websocket.trace import manager

settings = Settings()
setup_logging(settings.log_level)
logger = structlog.get_logger()

app = FastAPI(title="VIGIL API", version="0.1.0")

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
from backend.routes import claims, cases, benefits, providers, audit, metrics as metrics_router

app.include_router(claims.router, prefix="/api")
app.include_router(cases.router, prefix="/api")
app.include_router(benefits.router, prefix="/api")
app.include_router(providers.router, prefix="/api")
app.include_router(audit.router, prefix="/api")
app.include_router(metrics_router.router, prefix="/api")
