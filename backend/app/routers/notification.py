from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session
from typing import List, Dict

from app.dependencies import get_db # Assuming you have a central dependency file

# A simple manager to keep track of active connections
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[int, WebSocket] = {}

    async def connect(self, student_id: int, websocket: WebSocket):
        await websocket.accept()
        self.active_connections[student_id] = websocket

    def disconnect(self, student_id: int):
        if student_id in self.active_connections:
            del self.active_connections[student_id]

    async def send_notification(self, student_id: int, message: str):
        if student_id in self.active_connections:
            websocket = self.active_connections[student_id]
            await websocket.send_text(message)

# Create a single instance of the manager to be used across the app
manager = ConnectionManager()

router = APIRouter(tags=["Notifications"])

@router.websocket("/ws/{student_id}")
async def websocket_endpoint(websocket: WebSocket, student_id: int):
    await manager.connect(student_id, websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(student_id)