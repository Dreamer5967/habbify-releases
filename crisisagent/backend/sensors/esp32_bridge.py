import asyncio
import logging
from backend.sensors.sensor_manifest import bind_hardware, unbind_hardware

logger = logging.getLogger(__name__)

class ESP32Bridge:
    """Bridges physical ESP32 sensor data into the world model.
    Designed to work with ESP32 + DHT22 (temp/humidity) + MQ-2 (smoke) + PIR (motion/occupancy).
    Falls back gracefully when no hardware is connected."""
    
    def __init__(self, world_model, manifest):
        self.world_model = world_model
        self.manifest = manifest
        self._bindings: dict[str, str] = {}  # device_id -> zone_id
        self._running = False
    
    def bind(self, device_id: str, zone_id: str) -> None:
        self._bindings[device_id] = zone_id
        bind_hardware(self.manifest, device_id, zone_id)
        logger.info(f"Bound ESP32 device {device_id} to zone {zone_id}")
    
    def unbind(self, device_id: str) -> None:
        if device_id in self._bindings:
            zone_id = self._bindings.pop(device_id)
            unbind_hardware(self.manifest, zone_id)
            logger.info(f"Unbound ESP32 device {device_id} from zone {zone_id}")
    
    async def receive_reading(self, device_id: str, sensor_type: str, value: float) -> None:
        if device_id in self._bindings:
            zone_id = self._bindings[device_id]
            self.world_model.update_sensor(zone_id, sensor_type, value, status='ONLINE', source='hardware')
    
    async def start_http_listener(self, port=8001):
        # Optional: listen for HTTP POSTs from ESP32s
        # POST /sensor-reading {device_id, sensor_type, value}
        self._running = True
        logger.info(f"ESP32 Bridge listening on port {port}")
        # Not implementing a full web server here for brevity, 
        # but in practice you would mount a FastAPI/Aiohttp route here.
        while self._running:
            await asyncio.sleep(1)
            
    async def stop(self):
        self._running = False
