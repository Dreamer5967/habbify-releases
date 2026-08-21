AGENT_SYSTEM_PROMPT = """You are CrisisAgent, an autonomous emergency response coordinator.
You monitor a building's sensor network and coordinate evacuations during emergencies.

Your responsibilities:
1. Monitor all zones for hazards (fire, smoke, temperature spikes)
2. Mark dangerous zones as unsafe
3. Compute safe evacuation routes for all occupied zones
4. Activate alarms in affected areas
5. Replan routes when conditions change
6. Track sensor health and treat failed sensors as DANGEROUS, not safe

CRITICAL RULES (you CANNOT violate these):
- Never route people through CRITICAL or UNOBSERVABLE zones
- A zone with failed sensors is UNOBSERVABLE, not NORMAL
- Always provide a reason for every decision
- If no safe route exists, say so explicitly — do NOT invent one
- When in doubt, treat a zone as dangerous

You have tools available. Call them as needed. Always explain your reasoning."""

TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "get_building_state",
            "description": "Get the complete current state of all zones in the building",
            "parameters": {"type": "object", "properties": {}, "required": []}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_sensor_health",
            "description": "Check the health of sensors in a specific zone",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string", "description": "The ID of the zone"}
                },
                "required": ["zone_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_occupancy",
            "description": "Check how many people are in a zone",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string", "description": "The ID of the zone"}
                },
                "required": ["zone_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "find_safe_route",
            "description": "Find a safe evacuation route from a start zone to a destination (or nearest exit)",
            "parameters": {
                "type": "object",
                "properties": {
                    "start_zone": {"type": "string", "description": "Starting zone ID"},
                    "destination_zone": {"type": "string", "description": "Optional destination zone ID. If omitted, finds nearest exit."}
                },
                "required": ["start_zone"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "mark_zone_unsafe",
            "description": "Mark a zone as unsafe/hazardous",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string", "description": "Zone ID to mark unsafe"},
                    "reason": {"type": "string", "description": "Reason for marking unsafe"}
                },
                "required": ["zone_id", "reason"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "mark_zone_uncertain",
            "description": "Mark a zone as having uncertain conditions (e.g. sensor failure)",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string", "description": "Zone ID to mark uncertain"},
                    "reason": {"type": "string", "description": "Reason for uncertainty"}
                },
                "required": ["zone_id", "reason"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_alert",
            "description": "Send an alert message to a specific zone",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_zone": {"type": "string", "description": "Zone ID to send alert to"},
                    "message": {"type": "string", "description": "Alert message content"}
                },
                "required": ["target_zone", "message"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "activate_alarm",
            "description": "Activate physical alarms in a zone",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string", "description": "Zone ID to activate alarm"}
                },
                "required": ["zone_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_evacuation_route",
            "description": "Update the official evacuation route for a zone",
            "parameters": {
                "type": "object",
                "properties": {
                    "zone_id": {"type": "string", "description": "Zone ID to update"},
                    "route": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "List of zone IDs representing the route"
                    }
                },
                "required": ["zone_id", "route"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "replan",
            "description": "Recompute all evacuation routes for all occupied zones",
            "parameters": {"type": "object", "properties": {}, "required": []}
        }
    }
]
