import asyncio
import json
import logging
from fastapi import WebSocket
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []
        self._lock = asyncio.Lock()
    
    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self._lock:
            self.active_connections.append(websocket)
        logger.info(f'WebSocket connected. Total: {len(self.active_connections)}')
    
    async def disconnect(self, websocket: WebSocket):
        async with self._lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
        logger.info(f'WebSocket disconnected. Total: {len(self.active_connections)}')
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients."""
        if not self.active_connections:
            return
        data = json.dumps(message, default=str)
        async with self._lock:
            dead = []
            for connection in self.active_connections:
                try:
                    await connection.send_text(data)
                except Exception:
                    dead.append(connection)
            for d in dead:
                self.active_connections.remove(d)
    
    async def state_broadcast_loop(self, world_model, interval=1.0):
        """Background task that broadcasts world state at regular intervals."""
        while True:
            await asyncio.sleep(interval)
            if self.active_connections:
                try:
                    snapshot = world_model.snapshot()
                    await self.broadcast({
                        'type': 'world_state',
                        'data': snapshot,
                        'timestamp': datetime.now(timezone.utc).isoformat()
                    })
                except Exception as e:
                    logger.error(f'Broadcast error: {e}')
