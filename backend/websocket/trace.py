import json
import structlog
from fastapi import WebSocket, WebSocketDisconnect

logger = structlog.get_logger()


class ConnectionManager:
    def __init__(self) -> None:
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info("ws_connect", total=len(self.active_connections))

    def disconnect(self, websocket: WebSocket) -> None:
        self.active_connections.remove(websocket)
        logger.info("ws_disconnect", total=len(self.active_connections))

    async def broadcast(self, message: dict) -> None:
        disconnected: list[WebSocket] = []
        for connection in self.active_connections:
            try:
                await connection.send_text(json.dumps(message))
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.active_connections.remove(conn)

    async def send_agent_event(
        self,
        agent: str,
        event: str,
        message: str,
        duration_ms: int | None = None,
    ) -> None:
        await self.broadcast({
            "event": event,
            "agent": agent,
            "message": message,
            "duration_ms": duration_ms,
        })


manager = ConnectionManager()
