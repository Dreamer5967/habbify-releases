import asyncio
import random

async def sensor_simulation_loop(world_model, interval=1.5):
    """Background task applying small random-walk noise to simulated sensors."""
    while True:
        await asyncio.sleep(interval)
        for zone_id, zone in world_model._zones.items():
            # Skip hardware-bound sensors (this is checked via source in manifest typically, but here we check status)
            if zone.get('sensor_status', {}).get('temperature') != 'ONLINE':
                continue
            
            # Skip temperature drift for zones with active hazard (propagator controls these)
            if zone.get('hazard_probability', 0.0) > 0.0:
                continue
                
            temp = zone.get('temperature', 22.0)
            new_temp = temp + random.gauss(0, 0.2)
            
            occupancy = zone.get('occupancy', 0)
            if random.random() < 0.1:
                occupancy = max(0, occupancy + random.choice([-1, 1]))
                
            smoke = zone.get('smoke', 0.0)
            if zone.get('hazard_probability', 0.0) == 0.0 and zone.get('state') == 'NORMAL':
                # Only reset smoke to 0 if zone is fully NORMAL and has no hazard
                smoke = max(0.0, smoke - 0.5)  # Gradual decay instead of instant reset
                
            world_model.update_sensor(zone_id, 'temperature', new_temp)
            world_model.update_sensor(zone_id, 'occupancy', occupancy)
            world_model.update_sensor(zone_id, 'smoke', smoke)
