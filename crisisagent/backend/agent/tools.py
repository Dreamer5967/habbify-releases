from backend.safety.engine import validate_route, RouteRejected
from backend.routing.astar import find_safe_route, find_nearest_exit, compute_all_evacuation_routes


class ToolExecutor:
    def __init__(self, world_model, graph, db_path):
        self.world_model = world_model
        self.graph = graph
        self.db_path = db_path
        self._alerts: list[dict] = []
        self._alarms: set[str] = set()

    async def execute(self, tool_name: str, arguments: dict) -> dict:
        handler = getattr(self, f'_tool_{tool_name}', None)
        if not handler:
            return {'error': f'Unknown tool: {tool_name}'}
        return await handler(**arguments)

    async def _tool_get_building_state(self) -> dict:
        return self.world_model.snapshot()

    async def _tool_get_sensor_health(self, zone_id: str) -> dict:
        zone = self.world_model.get_zone(zone_id)
        if not zone:
            return {"error": f"Zone {zone_id} not found"}
        return {
            'zone_id': zone_id,
            'sensor_status': zone.get('sensor_status', {}),
            'confidence': zone.get('confidence', 0),
        }

    async def _tool_get_occupancy(self, zone_id: str) -> dict:
        zone = self.world_model.get_zone(zone_id)
        if not zone:
            return {"error": f"Zone {zone_id} not found"}
        return {'zone_id': zone_id, 'occupancy': zone.get('occupancy', 0)}

    async def _tool_find_safe_route(self, start_zone: str, destination_zone: str = None) -> dict:
        if not self.graph:
            return {"error": "No building graph loaded"}
        try:
            if destination_zone:
                route = find_safe_route(self.graph, self.world_model, start_zone, destination_zone)
            else:
                route = find_nearest_exit(self.graph, self.world_model, start_zone)

            from backend.routing.astar import generate_turn_by_turn_instructions
            directive = generate_turn_by_turn_instructions(self.graph, self.world_model, start_zone, route)

            if route:
                self.world_model.set_evacuation_route(start_zone, route)
            self.world_model.set_evacuation_directive(start_zone, directive)

            if route:
                self.world_model.add_broadcast(
                    start_zone,
                    directive.get('headline', 'EVACUATION DIRECTIVE'),
                    directive.get('voice_announcement', '')
                )
                return {"route": route, "start": start_zone, "destination": route[-1], "directive": directive}
            else:
                self.world_model.add_broadcast(
                    start_zone,
                    "⚠️ SHELTER IN PLACE",
                    directive.get('voice_announcement', 'No safe route found.'),
                    level="CRITICAL"
                )
                return {"error": f"No safe route found from {start_zone}", "directive": directive}
        except RouteRejected as e:
            return {"error": f"Route rejected: {e}"}
        except Exception as e:
            return {"error": str(e)}

    async def _tool_mark_zone_unsafe(self, zone_id: str, reason: str) -> dict:
        zone = self.world_model.get_zone(zone_id)
        if not zone:
            return {"error": f"Zone {zone_id} not found"}
        self.world_model.update_zone_state(zone_id, state="CRITICAL", hazard="fire")
        self.world_model.add_broadcast(
            zone_id,
            f"HAZARD IN {zone_id}",
            f"Zone {zone.get('name', zone_id)} marked UNSAFE. Reason: {reason}",
            level="CRITICAL"
        )
        return {"success": True, "zone_id": zone_id, "state": "CRITICAL", "reason": reason}

    async def _tool_mark_zone_uncertain(self, zone_id: str, reason: str) -> dict:
        zone = self.world_model.get_zone(zone_id)
        if not zone:
            return {"error": f"Zone {zone_id} not found"}
        self.world_model.update_zone_state(zone_id, state="UNOBSERVABLE")
        self.world_model.add_broadcast(
            zone_id,
            f"SENSOR FAILURE IN {zone_id}",
            f"Zone {zone.get('name', zone_id)} telemetry lost. Avoid this zone.",
            level="WARNING"
        )
        return {"success": True, "zone_id": zone_id, "state": "UNOBSERVABLE", "reason": reason}

    async def _tool_send_alert(self, target_zone: str, message: str) -> dict:
        alert = {"target_zone": target_zone, "message": message}
        self._alerts.append(alert)
        self.world_model.add_broadcast(target_zone, "EMERGENCY BROADCAST", message, level="URGENT")
        return {"success": True, "alert": alert}

    async def _tool_activate_alarm(self, zone_id: str) -> dict:
        self._alarms.add(zone_id)
        zone = self.world_model.get_zone(zone_id)
        self.world_model.add_broadcast(
            zone_id,
            "PHYSICAL ALARM ACTIVATED",
            f"Emergency sirens active in {zone.get('name', zone_id)} ({zone_id}). Evacuate immediately.",
            level="CRITICAL"
        )
        return {"success": True, "zone_id": zone_id, "alarm_active": True}

    async def _tool_update_evacuation_route(self, zone_id: str, route: list) -> dict:
        zone = self.world_model.get_zone(zone_id)
        if not zone:
            return {"error": f"Zone {zone_id} not found"}
        self.world_model.set_evacuation_route(zone_id, route)
        from backend.routing.astar import generate_turn_by_turn_instructions
        directive = generate_turn_by_turn_instructions(self.graph, self.world_model, zone_id, route)
        self.world_model.set_evacuation_directive(zone_id, directive)
        return {"success": True, "zone_id": zone_id, "route": route, "directive": directive}

    async def _tool_replan(self) -> dict:
        if not self.graph:
            return {"error": "No building graph loaded"}
        try:
            routes = compute_all_evacuation_routes(self.graph, self.world_model)
            directives = self.world_model.get_evacuation_directives()
            return {
                "success": True,
                "routes_updated": len(routes),
                "routes": {k: v for k, v in routes.items()},
                "directives_count": len(directives)
            }
        except Exception as e:
            return {"error": f"Replan failed: {str(e)}"}
