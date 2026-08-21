import asyncio
import logging

logger = logging.getLogger(__name__)

# Simulation configuration
SIMULATION_CONFIG = {
    'spread_rate': 0.015,  # Realistic gradual burn rate (was 0.08 which was 5x too fast!)
    'speed_mode': 'normal',  # 'slow', 'normal', 'fast', 'paused'
    'door_transmissivity': 0.15,  # Closed doors provide significant thermal insulation
    'stairwell_transmissivity': 0.10,  # Fire-rated stairwells insulate against smoke/heat
    'corridor_transmissivity': 0.45,  # Open hallways allow convection
}

def set_simulation_speed(speed: str) -> dict:
    """Adjust fire propagation speed mode."""
    speed = speed.lower()
    if speed == 'slow':
        SIMULATION_CONFIG['spread_rate'] = 0.006
        SIMULATION_CONFIG['speed_mode'] = 'slow'
    elif speed == 'fast':
        SIMULATION_CONFIG['spread_rate'] = 0.04
        SIMULATION_CONFIG['speed_mode'] = 'fast'
    elif speed == 'paused':
        SIMULATION_CONFIG['spread_rate'] = 0.0
        SIMULATION_CONFIG['speed_mode'] = 'paused'
    else:  # normal
        SIMULATION_CONFIG['spread_rate'] = 0.015
        SIMULATION_CONFIG['speed_mode'] = 'normal'
        
    logger.info(f"Simulation speed set to {SIMULATION_CONFIG['speed_mode']} (rate={SIMULATION_CONFIG['spread_rate']})")
    return SIMULATION_CONFIG

def edge_transmissivity(graph, u, v) -> float:
    edge_data = graph[u][v]
    ctype = edge_data.get('type', 'open')
    if ctype == 'door':
        return SIMULATION_CONFIG['door_transmissivity']
    elif ctype == 'stairwell':
        return SIMULATION_CONFIG['stairwell_transmissivity']
    return SIMULATION_CONFIG['corridor_transmissivity']

def propagate_hazard(graph, world_model, dt=1.5):
    """Gradually propagate fire, heat, and smoke across connected zones based on physical barrier transmissivity."""
    if SIMULATION_CONFIG['speed_mode'] == 'paused' or SIMULATION_CONFIG['spread_rate'] <= 0:
        return

    spread_rate = SIMULATION_CONFIG['spread_rate']
    updates = {}
    
    for node in graph.nodes():
        zone = world_model.get_zone(node)
        if not zone:
            continue
            
        current_hazard = zone.get('hazard_probability', 0.0)
        
        # Calculate incoming thermal/smoke pressure from neighboring zones
        pressure = 0.0
        for neighbor in graph.neighbors(node):
            n_zone = world_model.get_zone(neighbor)
            if n_zone:
                n_hazard = n_zone.get('hazard_probability', 0.0)
                # Only neighbors with significant heat/fire exert pressure
                if n_hazard > 0.15:
                    transmissivity = edge_transmissivity(graph, node, neighbor)
                    pressure += (n_hazard - 0.15) * transmissivity
                    
        # Apply gradual thermal propagation
        delta = spread_rate * pressure * dt
        new_hazard = min(1.0, max(0.0, current_hazard + delta))
        
        # Determine updated zone state
        new_state = zone.get('state', 'NORMAL')
        if new_hazard > 0.65:
            new_state = 'CRITICAL'
        elif new_hazard > 0.25:
            new_state = 'ALERT'
            
        # Realistic temperature and smoke curve
        new_temp = 22.0 + (new_hazard * 750.0)
        new_smoke = min(100.0, new_hazard * 100.0)
        
        # If this zone is being affected by fire, update it
        if delta > 0 or current_hazard > 0:
            updates[node] = {
                'hazard_probability': new_hazard,
                'hazard': 'fire' if new_hazard > 0.1 else zone.get('hazard'),
                'state': new_state if zone.get('state') != 'UNOBSERVABLE' else 'UNOBSERVABLE',
                'temperature': new_temp,
                'smoke': new_smoke
            }
            
    for node, update in updates.items():
        world_model.update_zone_state(node, **update)

async def propagation_loop(graph, world_model, interval=1.5):
    while True:
        await asyncio.sleep(interval)
        if world_model.get_active_incidents():
            propagate_hazard(graph, world_model, dt=interval)

