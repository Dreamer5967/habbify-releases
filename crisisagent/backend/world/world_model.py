import copy
import datetime


class WorldModel:
    def __init__(self):
        self._zones: dict[str, dict] = {}
        self._previous_snapshot: dict | None = None
        self._incidents: list[dict] = []
        self._evacuation_routes: dict[str, list[str]] = {}
        self._evacuation_directives: dict[str, dict] = {}
        self._active_broadcasts: list[dict] = []
        self._graph = None

    def initialize_from_graph(self, graph) -> None:
        """Create zone entry for every node with default NORMAL state."""
        self._zones.clear()
        self._incidents.clear()
        self._evacuation_routes.clear()
        self._evacuation_directives.clear()
        self._active_broadcasts.clear()
        self._graph = graph
        for node, data in graph.nodes(data=True):
            self._zones[node] = {
                "zone_id": node,
                "zone_type": data.get("type", "room"),
                "name": data.get("name", node),
                "hazard": None,
                "hazard_probability": 0.0,
                "temperature": 22.0,
                "smoke": 0.0,
                "occupancy": 0,
                "sensor_status": {
                    "temperature": "ONLINE",
                    "smoke": "ONLINE",
                    "occupancy": "ONLINE"
                },
                "confidence": 1.0,
                "state": "NORMAL",
                "routes_available": [],
                "routes_blocked": [],
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            }
        self._previous_snapshot = self.snapshot()

    def update_sensor(self, zone_id, sensor_type, value, status='ONLINE', source='simulated') -> None:
        if zone_id in self._zones:
            if sensor_type in ("temperature", "smoke", "occupancy"):
                self._zones[zone_id][sensor_type] = value
                if self._zones[zone_id]["sensor_status"].get(sensor_type) != "FAILED":
                    self._zones[zone_id]["sensor_status"][sensor_type] = status
            self._zones[zone_id]["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    def update_zone_state(self, zone_id, **kwargs) -> None:
        if zone_id in self._zones:
            for k, v in kwargs.items():
                if k in self._zones[zone_id]:
                    self._zones[zone_id][k] = v
            self._zones[zone_id]["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    def get_zone(self, zone_id) -> dict:
        return self._zones.get(zone_id, {})

    def get_all_zones(self) -> dict[str, dict]:
        return self._zones

    def snapshot(self) -> dict:
        return {
            "zones": copy.deepcopy(self._zones),
            "incidents": copy.deepcopy(self._incidents),
            "evacuation_routes": copy.deepcopy(self._evacuation_routes),
            "evacuation_directives": copy.deepcopy(self._evacuation_directives),
            "active_broadcasts": copy.deepcopy(self._active_broadcasts)
        }

    def significant_change(self) -> bool:
        if not self._previous_snapshot:
            self._previous_snapshot = self.snapshot()
            return True

        current = self.snapshot()
        prev = self._previous_snapshot

        for zone_id, zone in current["zones"].items():
            prev_zone = prev["zones"].get(zone_id, {})

            # Hazard probability changed significantly
            if abs(zone.get("hazard_probability", 0) - prev_zone.get("hazard_probability", 0)) > 0.1:
                self._previous_snapshot = current
                return True

            # State changed
            if zone.get("state") != prev_zone.get("state"):
                self._previous_snapshot = current
                return True

            # Sensor went offline
            for sensor, status in zone.get("sensor_status", {}).items():
                prev_status = prev_zone.get("sensor_status", {}).get(sensor, "ONLINE")
                if status == "FAILED" and prev_status != "FAILED":
                    self._previous_snapshot = current
                    return True

            # Temperature crossed thresholds
            temp = zone.get("temperature", 20.0)
            prev_temp = prev_zone.get("temperature", 20.0)
            for threshold in [45.0, 60.0, 80.0]:
                if (temp >= threshold and prev_temp < threshold) or (temp < threshold and prev_temp >= threshold):
                    self._previous_snapshot = current
                    return True

            # Smoke crossed thresholds
            smoke = zone.get("smoke", 0.0)
            prev_smoke = prev_zone.get("smoke", 0.0)
            for threshold in [20.0, 50.0, 80.0]:
                if (smoke >= threshold and prev_smoke < threshold) or (smoke < threshold and prev_smoke >= threshold):
                    self._previous_snapshot = current
                    return True

        return False

    def start_incident(self, zone_id, hazard_type='fire', severity=0.9) -> dict:
        if zone_id not in self._zones:
            raise ValueError(f"Zone {zone_id} not found")
        incident = {
            "id": len(self._incidents) + 1,
            "zone_id": zone_id,
            "hazard_type": hazard_type,
            "severity": severity,
            "started_at": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "active": True,
        }
        self._incidents.append(incident)
        self.update_zone_state(
            zone_id,
            hazard=hazard_type,
            hazard_probability=severity,
            state="CRITICAL",
            temperature=22.0 + severity * 750.0,
            smoke=severity * 100.0,
        )
        return incident

    def get_active_incidents(self) -> list[dict]:
        return [i for i in self._incidents if i.get('active', True)]

    def clear_incidents(self) -> None:
        """Clear all incidents, directives, and reset all zones to normal."""
        self._incidents.clear()
        self._evacuation_routes.clear()
        self._evacuation_directives.clear()
        self._active_broadcasts.clear()
        for zone_id in self._zones:
            self._zones[zone_id].update({
                "hazard": None,
                "hazard_probability": 0.0,
                "temperature": 22.0,
                "smoke": 0.0,
                "state": "NORMAL",
                "routes_available": [],
                "routes_blocked": [],
                "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
            })
            # Restore any non-failed sensors
            for sensor_type in ("temperature", "smoke", "occupancy"):
                if self._zones[zone_id]["sensor_status"][sensor_type] != "FAILED":
                    self._zones[zone_id]["sensor_status"][sensor_type] = "ONLINE"
        self._previous_snapshot = self.snapshot()

    def fail_sensor(self, zone_id, sensor_type) -> None:
        if zone_id not in self._zones:
            raise ValueError(f"Zone {zone_id} not found")
        zone = self._zones[zone_id]
        zone["sensor_status"][sensor_type] = "FAILED"
        # Recalculate confidence
        statuses = zone["sensor_status"].values()
        online_count = sum(1 for s in statuses if s == "ONLINE")
        zone["confidence"] = online_count / max(len(list(zone["sensor_status"])), 1)
        # If all sensors fail -> UNOBSERVABLE
        all_failed = all(status == "FAILED" for status in zone["sensor_status"].values())
        if all_failed:
            zone["state"] = "UNOBSERVABLE"
            zone["confidence"] = 0.0
        zone["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    def restore_sensor(self, zone_id, sensor_type) -> None:
        if zone_id not in self._zones:
            raise ValueError(f"Zone {zone_id} not found")
        zone = self._zones[zone_id]
        zone["sensor_status"][sensor_type] = "ONLINE"
        # Recalculate confidence
        statuses = zone["sensor_status"].values()
        online_count = sum(1 for s in statuses if s == "ONLINE")
        zone["confidence"] = online_count / max(len(list(zone["sensor_status"])), 1)
        # If was UNOBSERVABLE and now has at least one sensor, check state
        if zone["state"] == "UNOBSERVABLE":
            if zone["hazard_probability"] > 0.7:
                zone["state"] = "CRITICAL"
            elif zone["hazard_probability"] > 0.3:
                zone["state"] = "ALERT"
            else:
                zone["state"] = "NORMAL"
        zone["updated_at"] = datetime.datetime.now(datetime.timezone.utc).isoformat()

    def set_evacuation_route(self, zone_id: str, route: list[str]) -> None:
        """Set the evacuation route for a zone."""
        self._evacuation_routes[zone_id] = route
        if zone_id in self._zones:
            self._zones[zone_id]["routes_available"] = route

    def get_evacuation_routes(self) -> dict[str, list[str]]:
        return copy.deepcopy(self._evacuation_routes)

    def set_evacuation_directive(self, zone_id: str, directive: dict) -> None:
        """Store turn-by-turn human evacuation directive."""
        self._evacuation_directives[zone_id] = directive

    def set_evacuation_directives(self, directives: dict[str, dict]) -> None:
        """Store full set of zone evacuation directives."""
        self._evacuation_directives = copy.deepcopy(directives)

    def get_evacuation_directives(self) -> dict[str, dict]:
        return copy.deepcopy(self._evacuation_directives)

    def add_broadcast(self, zone_id: str, headline: str, instruction: str, level: str = 'URGENT') -> dict:
        """Add an emergency voice/PA broadcast announcement."""
        broadcast = {
            "id": len(self._active_broadcasts) + 1,
            "zone_id": zone_id,
            "headline": headline,
            "instruction": instruction,
            "level": level,
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
        }
        self._active_broadcasts.insert(0, broadcast)
        self._active_broadcasts = self._active_broadcasts[:20]  # Keep latest 20
        return broadcast

    def get_active_broadcasts(self) -> list[dict]:
        return copy.deepcopy(self._active_broadcasts)

