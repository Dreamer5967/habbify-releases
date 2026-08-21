import random
from datetime import datetime, timezone

def generate_sensor_manifest(graph) -> dict:
    """Called once right after graph is built. Creates virtual sensor bundle for every zone."""
    manifest = {}
    for zone_id, data in graph.nodes(data=True):
        zone_type = data.get('type', 'room')
        manifest[zone_id] = {
            'zone_id': zone_id,
            'temperature': {'value': 22.0 + random.uniform(-1, 1), 'unit': 'C', 'status': 'ONLINE', 'source': 'simulated'},
            'smoke': {'value': 0.0, 'unit': '%', 'status': 'ONLINE', 'source': 'simulated'},
            'occupancy': {'value': random.randint(2, 8) if zone_type == 'room' else (random.randint(0, 3) if zone_type == 'corridor' else 0), 'status': 'ONLINE', 'source': 'simulated'},
            'last_update': datetime.now(timezone.utc).isoformat(),
            'confidence': 1.0,
        }
    return manifest

def bind_hardware(manifest: dict, esp32_device_id: str, zone_id: str) -> None:
    if zone_id in manifest:
        manifest[zone_id]['_hardware_binding'] = esp32_device_id
        for sensor_type in ('temperature', 'smoke', 'occupancy'):
            if sensor_type in manifest[zone_id] and isinstance(manifest[zone_id][sensor_type], dict):
                manifest[zone_id][sensor_type]['source'] = 'hardware'

def unbind_hardware(manifest: dict, zone_id: str) -> None:
    if zone_id in manifest:
        manifest[zone_id].pop('_hardware_binding', None)
        for sensor_type in ('temperature', 'smoke', 'occupancy'):
            if sensor_type in manifest[zone_id] and isinstance(manifest[zone_id][sensor_type], dict):
                manifest[zone_id][sensor_type]['source'] = 'simulated'
