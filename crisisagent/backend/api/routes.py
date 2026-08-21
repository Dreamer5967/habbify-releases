import asyncio
import io
import logging
from typing import Optional

from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel
from PIL import Image

from backend.map.floorplan_parser import ParsedBuilding
from backend.map.graph_builder import build_graph, check_reachability, process_floorplan
from backend.sensors.sensor_manifest import generate_sensor_manifest
from backend.db import get_actions

logger = logging.getLogger(__name__)
router = APIRouter()

# Global app state references
_app_state: dict = {}


def init_routes(world_model, graph_ref, vision_backend, sensor_manifest, db_path, ws_manager, agent_loop):
    """Initialize route handlers with application state references."""
    _app_state['world_model'] = world_model
    _app_state['graph'] = graph_ref
    _app_state['vision'] = vision_backend
    _app_state['sensors'] = sensor_manifest
    _app_state['db_path'] = db_path
    _app_state['ws'] = ws_manager
    _app_state['agent'] = agent_loop


class IncidentRequest(BaseModel):
    zone_id: str
    hazard_type: str = 'fire'
    severity: float = 0.9


class SensorFailRequest(BaseModel):
    zone_id: str
    sensor_type: str


class OccupancyUpdate(BaseModel):
    zone_id: str
    delta: int


class BackendSwitchRequest(BaseModel):
    vision: Optional[str] = None
    reasoning: Optional[str] = None


class SensorReading(BaseModel):
    device_id: str
    sensor_type: str
    value: float
    zone_id: Optional[str] = None


async def _setup_building(parsed_building, graph):
    """Common setup after parsing a building."""
    reachability = check_reachability(graph)
    manifest = generate_sensor_manifest(graph)

    _app_state['graph']['parsed'] = parsed_building
    _app_state['graph']['graph'] = graph
    _app_state['sensors']['manifest'] = manifest

    world_model = _app_state['world_model']
    world_model.initialize_from_graph(graph)

    # Apply sensor manifest occupancy values to world model
    for zone_id, sensor_data in manifest.items():
        occ = sensor_data.get('occupancy', {})
        if isinstance(occ, dict):
            world_model.update_sensor(zone_id, 'occupancy', occ.get('value', 0))
        temp = sensor_data.get('temperature', {})
        if isinstance(temp, dict):
            world_model.update_sensor(zone_id, 'temperature', temp.get('value', 22.0))

    agent_loop = _app_state['agent']
    agent_loop.graph = graph
    agent_loop.executor.graph = graph
    if not agent_loop._running:
        asyncio.create_task(agent_loop.start())

    return reachability, manifest


@router.post('/buildings/upload')
async def upload_building(file: UploadFile = File(...)):
    """Upload a floor plan image and parse it into a building graph."""
    contents = await file.read()

    # Preprocess: resize if too large
    try:
        image = Image.open(io.BytesIO(contents))
        max_dim = 2000
        if max(image.size) > max_dim:
            image.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)
            buf = io.BytesIO()
            image.save(buf, format='PNG')
            contents = buf.getvalue()
    except Exception as e:
        logger.warning(f"Could not open image via PIL: {e}")

    try:
        graph, parsed_building, _ = await process_floorplan(
            _app_state['vision'], contents
        )
        reachability, manifest = await _setup_building(parsed_building, graph)
        world_model = _app_state['world_model']
        current_state = world_model.snapshot()

        await _app_state['ws'].broadcast({
            'type': 'building_loaded',
            'data': {
                'zones': [z.model_dump() for z in parsed_building.zones],
                'connections': [c.model_dump(by_alias=True) for c in parsed_building.connections],
                'reachability': reachability,
            }
        })
        await _app_state['ws'].broadcast({
            'type': 'world_state',
            'data': current_state,
        })

        return {
            'status': 'success',
            'building': {
                'zones': [z.model_dump() for z in parsed_building.zones],
                'connections': [c.model_dump(by_alias=True) for c in parsed_building.connections],
            },
            'reachability': reachability,
            'sensor_count': len(manifest),
            'world_state': current_state,
        }
    except Exception as e:
        logger.error(f"Error processing building: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/buildings/demo/{building_id}')
async def load_demo_building(building_id: str):
    """Load a pre-configured demo building using the mock adapter."""
    from backend.llm.mock_adapter import MockVisionBackend
    mock_vision = MockVisionBackend()

    try:
        raw = await mock_vision.parse_floorplan(b'', f'demo_{building_id}')
        parsed_building = ParsedBuilding(**raw)
        graph = build_graph(parsed_building)
        reachability, manifest = await _setup_building(parsed_building, graph)
        world_model = _app_state['world_model']
        current_state = world_model.snapshot()

        await _app_state['ws'].broadcast({
            'type': 'building_loaded',
            'data': {
                'zones': [z.model_dump() for z in parsed_building.zones],
                'connections': [c.model_dump(by_alias=True) for c in parsed_building.connections],
                'reachability': reachability,
            }
        })
        await _app_state['ws'].broadcast({
            'type': 'world_state',
            'data': current_state,
        })

        return {
            'status': 'success',
            'building': {
                'zones': [z.model_dump() for z in parsed_building.zones],
                'connections': [c.model_dump(by_alias=True) for c in parsed_building.connections],
            },
            'reachability': reachability,
            'sensor_count': len(manifest),
            'world_state': current_state,
        }
    except Exception as e:
        logger.error(f"Error loading demo building: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/buildings/current')
async def get_current_building():
    """Get the currently loaded building graph and state."""
    parsed = _app_state['graph'].get('parsed')
    world_model = _app_state.get('world_model')
    state = world_model.snapshot() if world_model else {}

    if not parsed:
        return {
            'building': None,
            'state': state
        }

    return {
        'building': {
            'zones': [z.model_dump() for z in parsed.zones],
            'connections': [c.model_dump(by_alias=True) for c in parsed.connections],
        },
        'state': state,
    }


class SimulationSpeedRequest(BaseModel):
    speed: str  # 'slow', 'normal', 'fast', 'paused'


class BroadcastRequest(BaseModel):
    zone_id: str
    headline: str
    instruction: str
    level: str = 'URGENT'


@router.post('/simulation/speed')
async def update_simulation_speed(req: SimulationSpeedRequest):
    """Adjust fire propagation speed mode (slow, normal, fast, paused)."""
    from backend.world.hazard_propagator import set_simulation_speed
    config = set_simulation_speed(req.speed)
    await _app_state['ws'].broadcast({
        'type': 'simulation_speed_changed',
        'data': config
    })
    return {'status': 'success', 'config': config}


@router.get('/evacuation/directives')
async def get_all_directives():
    """Get all current zone evacuation directives."""
    world_model = _app_state.get('world_model')
    if not world_model:
        return {'directives': {}}
    return {'directives': world_model.get_evacuation_directives()}


@router.get('/evacuation/directives/{zone_id}')
async def get_zone_directive(zone_id: str):
    """Get turn-by-turn evacuation directive for a specific zone."""
    world_model = _app_state.get('world_model')
    graph = _app_state.get('graph', {}).get('graph')
    if not world_model or not graph:
        raise HTTPException(status_code=400, detail="No building loaded")

    from backend.routing.astar import find_nearest_exit, generate_turn_by_turn_instructions
    route = find_nearest_exit(graph, world_model, zone_id)
    directive = generate_turn_by_turn_instructions(graph, world_model, zone_id, route)
    return {'directive': directive}


@router.post('/evacuation/broadcast')
async def create_broadcast(req: BroadcastRequest):
    """Send an emergency PA voice / broadcast message to building occupants."""
    world_model = _app_state['world_model']
    broadcast = world_model.add_broadcast(req.zone_id, req.headline, req.instruction, req.level)

    await _app_state['ws'].broadcast({
        'type': 'emergency_broadcast',
        'data': broadcast
    })
    await _app_state['ws'].broadcast({'type': 'world_state', 'data': world_model.snapshot()})
    return {'status': 'success', 'broadcast': broadcast}


@router.post('/incidents')
async def start_incident(req: IncidentRequest):
    """Operator triggers a fire/hazard in a specific zone."""
    world_model = _app_state['world_model']
    graph = _app_state['graph'].get('graph')
    zone = world_model.get_zone(req.zone_id)
    if not zone:
        raise HTTPException(status_code=400, detail=f"Zone {req.zone_id} not found")

    incident = world_model.start_incident(req.zone_id, req.hazard_type, req.severity)

    # Immediately compute initial evacuation routes & turn-by-turn directives
    if graph:
        from backend.routing.astar import compute_all_evacuation_routes
        compute_all_evacuation_routes(graph, world_model)
        # Add an emergency public address announcement
        zone_name = zone.get('name', req.zone_id)
        world_model.add_broadcast(
            req.zone_id,
            f"🔥 FIRE DETECTED IN {zone_name.upper()} ({req.zone_id})",
            f"Active fire reported in {zone_name}. Evacuate immediately following green designated exit paths.",
            level="CRITICAL"
        )

    await _app_state['ws'].broadcast({
        'type': 'incident_started',
        'data': {
            'zone_id': req.zone_id,
            'hazard_type': req.hazard_type,
            'severity': req.severity,
            'incident': incident,
        }
    })
    await _app_state['ws'].broadcast({
        'type': 'world_state',
        'data': world_model.snapshot(),
    })

    return {'status': 'success', 'incident': incident}



@router.delete('/incidents')
async def clear_incidents():
    """Clear all active incidents and reset to normal."""
    world_model = _app_state['world_model']
    world_model.clear_incidents()

    await _app_state['ws'].broadcast({'type': 'incidents_cleared', 'data': {}})
    await _app_state['ws'].broadcast({'type': 'world_state', 'data': world_model.snapshot()})
    return {'status': 'success'}


@router.get('/incidents')
async def get_incidents():
    """Get all active incidents."""
    return {'incidents': _app_state['world_model'].get_active_incidents()}


@router.post('/sensors/fail')
async def fail_sensor(req: SensorFailRequest):
    """Simulate a sensor failure."""
    world_model = _app_state['world_model']
    zone = world_model.get_zone(req.zone_id)
    if not zone:
        raise HTTPException(status_code=400, detail=f"Zone {req.zone_id} not found")
    world_model.fail_sensor(req.zone_id, req.sensor_type)

    await _app_state['ws'].broadcast({
        'type': 'sensor_failed',
        'data': {'zone_id': req.zone_id, 'sensor_type': req.sensor_type}
    })
    await _app_state['ws'].broadcast({'type': 'world_state', 'data': world_model.snapshot()})
    return {'status': 'success', 'zone_id': req.zone_id, 'sensor_type': req.sensor_type}


@router.post('/sensors/restore')
async def restore_sensor(req: SensorFailRequest):
    """Restore a failed sensor."""
    world_model = _app_state['world_model']
    zone = world_model.get_zone(req.zone_id)
    if not zone:
        raise HTTPException(status_code=400, detail=f"Zone {req.zone_id} not found")
    world_model.restore_sensor(req.zone_id, req.sensor_type)

    await _app_state['ws'].broadcast({
        'type': 'sensor_restored',
        'data': {'zone_id': req.zone_id, 'sensor_type': req.sensor_type}
    })
    await _app_state['ws'].broadcast({'type': 'world_state', 'data': world_model.snapshot()})
    return {'status': 'success', 'zone_id': req.zone_id, 'sensor_type': req.sensor_type}


@router.post('/sensors/reading')
async def receive_sensor_reading(req: SensorReading):
    """Receive a sensor reading from an ESP32 device."""
    world_model = _app_state['world_model']
    zone_id = req.zone_id
    if not zone_id:
        return {'status': 'error', 'detail': 'No zone_id provided'}

    zone = world_model.get_zone(zone_id)
    if not zone:
        raise HTTPException(status_code=400, detail=f"Zone {zone_id} not found")

    world_model.update_sensor(zone_id, req.sensor_type, req.value, status='ONLINE', source='hardware')
    await _app_state['ws'].broadcast({'type': 'world_state', 'data': world_model.snapshot()})
    return {'status': 'success'}


@router.post('/occupancy/update')
async def update_occupancy(req: OccupancyUpdate):
    """Manually adjust zone occupancy."""
    world_model = _app_state['world_model']
    zone = world_model.get_zone(req.zone_id)
    if not zone:
        raise HTTPException(status_code=400, detail=f"Zone {req.zone_id} not found")

    current = zone.get('occupancy', 0)
    new_val = max(0, current + req.delta)
    world_model.update_sensor(req.zone_id, 'occupancy', new_val)
    await _app_state['ws'].broadcast({'type': 'world_state', 'data': world_model.snapshot()})
    return {'status': 'success', 'zone_id': req.zone_id, 'occupancy': new_val}


@router.get('/agent/actions')
async def get_agent_actions(incident_id: int = None, limit: int = 50):
    """Get agent decision log."""
    db_path = _app_state['db_path']
    try:
        actions = await get_actions(db_path, incident_id=incident_id, limit=limit)
        return {'actions': actions}
    except Exception as e:
        logger.error(f"Error fetching agent actions: {e}")
        raise HTTPException(status_code=500, detail="Database error")


@router.get('/health')
async def health_check():
    return {
        'status': 'ok',
        'building_loaded': _app_state.get('graph', {}).get('graph') is not None,
    }


@router.post('/config/backend')
async def switch_backend(req: BackendSwitchRequest):
    """Hot-swap AI backends without restart."""
    from backend.llm.factory import create_vision_backend, create_reasoning_backend

    try:
        if req.vision:
            import os
            os.environ['LLM_VISION_BACKEND'] = req.vision
            _app_state['vision'] = create_vision_backend()

        if req.reasoning:
            import os
            os.environ['LLM_REASONING_BACKEND'] = req.reasoning
            backend = create_reasoning_backend()
            _app_state['agent'].reasoning = backend

        return {'status': 'success'}
    except Exception as e:
        logger.error(f"Error switching backend: {e}")
        raise HTTPException(status_code=400, detail=str(e))
