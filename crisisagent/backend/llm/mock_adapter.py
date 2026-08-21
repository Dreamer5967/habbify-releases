import json
from backend.llm.base import VisionBackend, ReasoningBackend


class MockVisionBackend(VisionBackend):
    """Deterministic mock that returns structured architectural layouts.
    Supports Building A (Corporate HQ) and Building B (Medical Center).
    Works with zero API keys for 100% reliable end-to-end demos.
    """

    async def parse_floorplan(self, image_bytes: bytes, prompt: str) -> dict:
        prompt_lower = (prompt or "").lower()

        # If Building B / Medical Center requested
        if 'demo_b' in prompt_lower or 'medical' in prompt_lower or 'hospital' in prompt_lower or 'clinic' in prompt_lower:
            return {
                "zones": [
                    {"id": "P1", "name": "Patient Room 1 (ICU)", "type": "room", "centroid_x": 0.15, "centroid_y": 0.20},
                    {"id": "P2", "name": "Patient Room 2", "type": "room", "centroid_x": 0.15, "centroid_y": 0.40},
                    {"id": "P3", "name": "Patient Room 3", "type": "room", "centroid_x": 0.15, "centroid_y": 0.60},
                    {"id": "P4", "name": "Patient Room 4", "type": "room", "centroid_x": 0.15, "centroid_y": 0.80},
                    {"id": "C2", "name": "West Patient Concourse", "type": "corridor", "centroid_x": 0.30, "centroid_y": 0.50},
                    {"id": "W1", "name": "Triage & Waiting Area", "type": "room", "centroid_x": 0.50, "centroid_y": 0.30},
                    {"id": "N1", "name": "Central Nurse Station", "type": "room", "centroid_x": 0.50, "centroid_y": 0.70},
                    {"id": "C1", "name": "Main Atrium Corridor", "type": "corridor", "centroid_x": 0.50, "centroid_y": 0.50},
                    {"id": "C3", "name": "East Surgical Wing", "type": "corridor", "centroid_x": 0.70, "centroid_y": 0.50},
                    {"id": "OR1", "name": "Operating Room 1", "type": "room", "centroid_x": 0.85, "centroid_y": 0.25},
                    {"id": "OR2", "name": "Operating Room 2", "type": "room", "centroid_x": 0.85, "centroid_y": 0.50},
                    {"id": "ISO1", "name": "Isolation Ward", "type": "room", "centroid_x": 0.85, "centroid_y": 0.75},
                    {"id": "S1", "name": "Stairwell West", "type": "stair", "centroid_x": 0.05, "centroid_y": 0.50},
                    {"id": "S2", "name": "Stairwell North", "type": "stair", "centroid_x": 0.50, "centroid_y": 0.08},
                    {"id": "S3", "name": "Stairwell East", "type": "stair", "centroid_x": 0.95, "centroid_y": 0.50},
                    {"id": "E1", "name": "Emergency Exit West", "type": "exit", "centroid_x": 0.02, "centroid_y": 0.50},
                    {"id": "E2", "name": "Main Hospital Entrance", "type": "exit", "centroid_x": 0.50, "centroid_y": 0.95},
                    {"id": "E3", "name": "Surgical Exit East", "type": "exit", "centroid_x": 0.98, "centroid_y": 0.50},
                ],
                "connections": [
                    {"from": "P1", "to": "C2", "type": "door"},
                    {"from": "P2", "to": "C2", "type": "door"},
                    {"from": "P3", "to": "C2", "type": "door"},
                    {"from": "P4", "to": "C2", "type": "door"},
                    {"from": "C2", "to": "S1", "type": "open"},
                    {"from": "S1", "to": "E1", "type": "stairwell"},
                    {"from": "C2", "to": "C1", "type": "open"},
                    {"from": "W1", "to": "C1", "type": "door"},
                    {"from": "N1", "to": "C1", "type": "door"},
                    {"from": "C1", "to": "S2", "type": "open"},
                    {"from": "C1", "to": "E2", "type": "open"},
                    {"from": "C1", "to": "C3", "type": "open"},
                    {"from": "OR1", "to": "C3", "type": "door"},
                    {"from": "OR2", "to": "C3", "type": "door"},
                    {"from": "ISO1", "to": "C3", "type": "door"},
                    {"from": "C3", "to": "S3", "type": "open"},
                    {"from": "S3", "to": "E3", "type": "stairwell"},
                ]
            }

        # Default Building A (Corporate HQ)
        return {
            "zones": [
                {"id": "R1", "name": "Executive Boardroom", "type": "room", "centroid_x": 0.15, "centroid_y": 0.22},
                {"id": "R2", "name": "Engineering Lab", "type": "room", "centroid_x": 0.38, "centroid_y": 0.22},
                {"id": "R3", "name": "Operations Center", "type": "room", "centroid_x": 0.62, "centroid_y": 0.22},
                {"id": "R4", "name": "Design Studio", "type": "room", "centroid_x": 0.15, "centroid_y": 0.72},
                {"id": "R5", "name": "Conference Hall", "type": "room", "centroid_x": 0.38, "centroid_y": 0.72},
                {"id": "R6", "name": "Server Room", "type": "room", "centroid_x": 0.62, "centroid_y": 0.72},
                {"id": "C1", "name": "North Concourse", "type": "corridor", "centroid_x": 0.40, "centroid_y": 0.40},
                {"id": "C2", "name": "South Concourse", "type": "corridor", "centroid_x": 0.40, "centroid_y": 0.56},
                {"id": "S1", "name": "Stairwell West", "type": "stair", "centroid_x": 0.06, "centroid_y": 0.48},
                {"id": "S2", "name": "Stairwell East", "type": "stair", "centroid_x": 0.82, "centroid_y": 0.48},
                {"id": "E1", "name": "Emergency Exit West", "type": "exit", "centroid_x": 0.02, "centroid_y": 0.48},
                {"id": "E2", "name": "Emergency Exit East", "type": "exit", "centroid_x": 0.96, "centroid_y": 0.48},
            ],
            "connections": [
                {"from": "R1", "to": "C1", "type": "door"},
                {"from": "R2", "to": "C1", "type": "door"},
                {"from": "R3", "to": "C1", "type": "door"},
                {"from": "R4", "to": "C2", "type": "door"},
                {"from": "R5", "to": "C2", "type": "door"},
                {"from": "R6", "to": "C2", "type": "door"},
                {"from": "C1", "to": "C2", "type": "open"},
                {"from": "C1", "to": "S1", "type": "open"},
                {"from": "C1", "to": "S2", "type": "open"},
                {"from": "C2", "to": "S1", "type": "open"},
                {"from": "C2", "to": "S2", "type": "open"},
                {"from": "S1", "to": "E1", "type": "stairwell"},
                {"from": "S2", "to": "E2", "type": "stairwell"},
            ]
        }


class MockReasoningBackend(ReasoningBackend):
    """Rule-based deterministic agent for zero-API-key testing.
    Examines world state and returns appropriate tool calls.
    """

    async def agent_turn(self, messages: list[dict], tools: list[dict]) -> dict:
        last_msg = messages[-1]["content"] if messages else ""
        tool_calls = []

        # Parse the world state from the message
        state = {}
        try:
            if "Current building state:" in last_msg:
                json_start = last_msg.index("{")
                depth = 0
                json_end = json_start
                for i in range(json_start, len(last_msg)):
                    if last_msg[i] == '{':
                        depth += 1
                    elif last_msg[i] == '}':
                        depth -= 1
                        if depth == 0:
                            json_end = i + 1
                            break
                state = json.loads(last_msg[json_start:json_end])
        except Exception:
            pass

        zones = state.get("zones", {})
        incidents = state.get("incidents", [])
        evac_routes = state.get("evacuation_routes", {})

        if not zones or not incidents:
            return {"content": "Monitoring — all zones normal.", "tool_calls": []}

        has_critical = False
        needs_replan = False
        critical_zones = []
        occupied_without_route = []

        for zone_id, zone_data in zones.items():
            zone_state = zone_data.get("state", "NORMAL")

            # Identify CRITICAL zones that need marking
            if zone_state == "CRITICAL":
                has_critical = True
                critical_zones.append(zone_id)

            # Check for ALERT zones with high smoke
            if zone_data.get("smoke", 0) > 50:
                tool_calls.append({
                    "name": "activate_alarm",
                    "arguments": {"zone_id": zone_id}
                })

            # Check occupied zones without evacuation routes
            occ = zone_data.get("occupancy", 0)
            if occ > 0 and zone_data.get("zone_type") != "exit":
                if zone_id not in evac_routes:
                    occupied_without_route.append(zone_id)

            # Check if existing evacuation routes pass through CRITICAL or UNOBSERVABLE zones
            if zone_id in evac_routes:
                for hop in evac_routes[zone_id]:
                    hop_zone = zones.get(hop, {})
                    if hop_zone.get("state") in ("CRITICAL", "UNOBSERVABLE"):
                        needs_replan = True
                        break

        # Mark critical zones as unsafe
        for zid in critical_zones:
            zone = zones[zid]
            if zone.get("hazard_probability", 0) > 0.5:
                tool_calls.append({
                    "name": "mark_zone_unsafe",
                    "arguments": {
                        "zone_id": zid,
                        "reason": f"Hazard probability {zone.get('hazard_probability', 0):.0%}, "
                                  f"temperature {zone.get('temperature', 0):.0f}°C, "
                                  f"smoke {zone.get('smoke', 0):.0f}%"
                    }
                })

        # Replan if routes are compromised, or compute initial routes
        if needs_replan or (has_critical and occupied_without_route):
            tool_calls.append({
                "name": "replan",
                "arguments": {}
            })
        elif occupied_without_route:
            for zid in occupied_without_route[:5]:
                tool_calls.append({
                    "name": "find_safe_route",
                    "arguments": {"start_zone": zid}
                })

        # Issue evacuation directives / alert messages for occupied rooms
        for zid, zdata in zones.items():
            if zdata.get("occupancy", 0) > 0 and zdata.get("zone_type") != "exit":
                zname = zdata.get("name", zid)
                occ = zdata.get("occupancy", 0)
                if zid in evac_routes:
                    path_str = " ➔ ".join(evac_routes[zid])
                    tool_calls.append({
                        "name": "send_alert",
                        "arguments": {
                            "target_zone": zid,
                            "message": f"EVACUATION DIRECTIVE for {zname}: {occ} occupants proceed via {path_str} immediately. Do not use elevators."
                        }
                    })

        # Deduplicate tool calls
        seen = set()
        deduped = []
        for tc in tool_calls:
            key = (tc["name"], json.dumps(tc["arguments"], sort_keys=True))
            if key not in seen:
                seen.add(key)
                deduped.append(tc)

        content = self._generate_reasoning(critical_zones, occupied_without_route, needs_replan, zones)

        return {"content": content, "tool_calls": deduped}

    def _generate_reasoning(self, critical_zones, occupied_without_route, needs_replan, zones):
        """Generate human-readable reasoning for the decision."""
        parts = []
        if critical_zones:
            parts.append(f"CRITICAL hazard detected in zone(s): {', '.join(critical_zones)}.")
            for zid in critical_zones:
                z = zones.get(zid, {})
                parts.append(
                    f"  {zid}: temp={z.get('temperature', 0):.0f}°C, "
                    f"smoke={z.get('smoke', 0):.0f}%, "
                    f"hazard={z.get('hazard_probability', 0):.0%}"
                )
        if needs_replan:
            parts.append("Existing evacuation routes compromised — initiating replan.")
        if occupied_without_route:
            parts.append(f"Occupied zones without routes: {', '.join(occupied_without_route)}.")
        if not parts:
            return "Monitoring — situation evolving, no immediate action required."
        return " ".join(parts)
