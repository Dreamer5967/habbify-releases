import asyncio
import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.db import init_db
from backend.llm.factory import create_vision_backend, create_reasoning_backend
from backend.api.routes import router, init_routes
from backend.api.ws import ConnectionManager
from backend.world.world_model import WorldModel
from backend.agent.loop import AgentLoop
from backend.sensors.simulator import sensor_simulation_loop

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(name)s] %(levelname)s: %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

DB_PATH = os.getenv('DB_PATH', 'crisisagent.db')

ws_manager = ConnectionManager()
world_model = WorldModel()
graph_ref = {'graph': None, 'parsed': None}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await init_db(DB_PATH)
    vision_backend = create_vision_backend()
    reasoning_backend = create_reasoning_backend()

    agent_loop_instance = AgentLoop(
        world_model=world_model,
        graph=None,
        reasoning_backend=reasoning_backend,
        db_path=DB_PATH,
        broadcast_fn=ws_manager.broadcast,
    )

    init_routes(world_model, graph_ref, vision_backend, {'manifest': {}}, DB_PATH, ws_manager, agent_loop_instance)

    # Background tasks — sensor sim and WS broadcast don't need the graph
    # Propagation loop watches for active incidents internally
    tasks = [
        asyncio.create_task(ws_manager.state_broadcast_loop(world_model)),
        asyncio.create_task(sensor_simulation_loop(world_model)),
        asyncio.create_task(_propagation_wrapper()),
    ]

    logger.info('CrisisAgent backend started')
    logger.info(f'  Vision backend: {os.getenv("LLM_VISION_BACKEND", "mock")}')
    logger.info(f'  Reasoning backend: {os.getenv("LLM_REASONING_BACKEND", "mock")}')
    yield

    # Shutdown
    agent_loop_instance.stop()
    for t in tasks:
        t.cancel()
    logger.info('CrisisAgent backend stopped')


async def _propagation_wrapper():
    """Propagation loop that waits for a graph to be loaded before running."""
    while True:
        await asyncio.sleep(1.5)
        graph = graph_ref.get('graph')
        if graph is not None and world_model.get_active_incidents():
            from backend.world.hazard_propagator import propagate_hazard
            propagate_hazard(graph, world_model, dt=1.5)


app = FastAPI(title='CrisisAgent', version='1.0.0', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

app.include_router(router, prefix='/api')


@app.websocket('/ws')
async def websocket_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming WebSocket messages if needed
    except WebSocketDisconnect:
        await ws_manager.disconnect(websocket)


if __name__ == '__main__':
    import uvicorn
    host = os.getenv('HOST', '0.0.0.0')
    port = int(os.getenv('PORT', '8000'))
    uvicorn.run('backend.main:app', host=host, port=port, reload=True)
