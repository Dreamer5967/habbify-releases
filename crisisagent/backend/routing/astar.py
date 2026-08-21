import networkx as nx
from backend.safety.engine import validate_route, RouteRejected, get_zone_risk_level


def edge_cost(graph, u, v, world_model):
    """Calculate dynamic edge cost based on hazard conditions.

    Cost = base_dist + 4*smoke + 3*max(0, temp-30) + 0.5*occupancy
           + 500 if UNOBSERVABLE + 10000 if CRITICAL
    """
    base_dist = graph[u][v].get('weight', 1.0)

    # Support both WorldModel instances and raw dicts
    if hasattr(world_model, 'get_zone'):
        v_state = world_model.get_zone(v)
    elif isinstance(world_model, dict):
        zones = world_model.get('_zones', world_model.get('zones', {}))
        v_state = zones.get(v, {})
    else:
        v_state = {}

    state = v_state.get('state', 'NORMAL')

    # Hard penalties for dangerous zones
    if state == 'UNOBSERVABLE':
        return base_dist + 500
    if state == 'CRITICAL':
        return base_dist + 10_000

    cost = base_dist

    # Smoke penalty: 4x per percentage point
    smoke = v_state.get('smoke', 0.0)
    cost += smoke * 4.0

    # Temperature penalty: 3x per degree above 30C
    temp = v_state.get('temperature', 20.0)
    cost += max(0, temp - 30.0) * 3.0

    # Crowd penalty: 0.5x per person
    occupancy = v_state.get('occupancy', 0)
    cost += occupancy * 0.5

    return cost


def find_safe_route(graph, world_model, start, goal):
    """Find the shortest safe route from start to goal using A*.
    Returns list of zone IDs, or empty list if no safe route exists.
    """
    try:
        def weight_func(u, v, d):
            return edge_cost(graph, u, v, world_model)

        route = nx.astar_path(graph, start, goal, weight=weight_func)
        try:
            validate_route(route, world_model)
            return route
        except RouteRejected:
            return []
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        return []


def find_nearest_exit(graph, world_model, start):
    """Find the nearest safe exit from a starting zone.
    Returns list of zone IDs, or empty list if no safe exit exists.
    """
    exits = [n for n, d in graph.nodes(data=True) if d.get('type') == 'exit']
    best_route = []
    best_cost = float('inf')

    for ex in exits:
        try:
            def weight_func(u, v, d):
                return edge_cost(graph, u, v, world_model)

            route = nx.astar_path(graph, start, ex, weight=weight_func)

            # Calculate total cost
            total_cost = sum(
                edge_cost(graph, route[i], route[i+1], world_model)
                for i in range(len(route) - 1)
            )

            try:
                validate_route(route, world_model)
                if total_cost < best_cost:
                    best_cost = total_cost
                    best_route = route
            except RouteRejected:
                continue
        except (nx.NetworkXNoPath, nx.NodeNotFound):
            continue

    return best_route


def generate_turn_by_turn_instructions(graph, world_model, start_zone: str, route: list[str]) -> dict:
    """Generate detailed human turn-by-turn evacuation instructions for a given zone and route."""
    def _get_zone(zid):
        if hasattr(world_model, 'get_zone'):
            return world_model.get_zone(zid)
        elif isinstance(world_model, dict):
            zones = world_model.get('_zones', world_model.get('zones', {}))
            return zones.get(zid, {})
        return {}

    start_info = _get_zone(start_zone)
    start_name = start_info.get('name', start_zone)
    occupancy = start_info.get('occupancy', 0)

    if not route:
        # Check if zone is trapped or surrounded by hazards
        blocking_reasons = []
        if graph and graph.has_node(start_zone):
            for neighbor in graph.neighbors(start_zone):
                n_info = _get_zone(neighbor)
                if n_info.get('state') == 'CRITICAL':
                    blocking_reasons.append(f"{n_info.get('name', neighbor)} ({neighbor}) has active fire ({n_info.get('temperature', 0):.0f}°C)")
                elif n_info.get('state') == 'UNOBSERVABLE':
                    blocking_reasons.append(f"{n_info.get('name', neighbor)} ({neighbor}) is unobservable (sensor offline)")

        return {
            "zone_id": start_zone,
            "zone_name": start_name,
            "occupancy": occupancy,
            "status": "TRAPPED_SHELTER_IN_PLACE",
            "target_exit_id": None,
            "target_exit_name": None,
            "estimated_time_seconds": 0,
            "path": [],
            "headline": "⚠️ NO SAFE EXIT PATH: SHELTER IN PLACE IMMEDIATELY",
            "voice_announcement": f"URGENT SHELTER IN PLACE ORDER for {start_name}. All surrounding hallways are impassable. DO NOT enter the corridor. Seal all door gaps. Emergency dispatch is alerted.",
            "steps": [
                {
                    "step_num": 1,
                    "action": "SEAL_DOORS",
                    "instruction": "Close all doors immediately. Stuff wet clothing, jackets, or rugs under the door cracks to prevent smoke entry.",
                    "warning": "Do not open doors if the handle or surface feels hot."
                },
                {
                    "step_num": 2,
                    "action": "DROP_LOW",
                    "instruction": "Stay beneath the smoke layer (air is cleanest 12-24 inches from the floor). Move towards exterior windows if present.",
                    "warning": None
                },
                {
                    "step_num": 3,
                    "action": "AWAIT_EXTRACTION",
                    "instruction": f"Stay together. {occupancy} occupants are registered for priority firefighter rescue extraction.",
                    "warning": None
                }
            ],
            "hazard_warnings": blocking_reasons or ["Surrounding exit corridors are blocked by heat or smoke."]
        }

    # We have a valid route
    dest_zone = route[-1]
    dest_info = _get_zone(dest_zone)
    dest_name = dest_info.get('name', dest_zone)

    steps = []
    hazard_warnings = []

    for i in range(len(route) - 1):
        curr_id = route[i]
        next_id = route[i+1]

        curr_info = _get_zone(curr_id)
        next_info = _get_zone(next_id)

        curr_name = curr_info.get('name', curr_id)
        next_name = next_info.get('name', next_id)
        next_type = next_info.get('zone_type', 'room')

        edge_data = graph.get_edge_data(curr_id, next_id, default={}) if graph else {}
        conn_type = edge_data.get('type', 'door')

        # Check conditions in next zone
        next_temp = next_info.get('temperature', 22.0)
        next_smoke = next_info.get('smoke', 0.0)

        step_warning = None
        if next_smoke > 15:
            step_warning = f"Light smoke ({next_smoke:.0f}%) in {next_name}. Stay low while moving."
            hazard_warnings.append(step_warning)
        elif next_temp > 35:
            step_warning = f"Elevated temperature ({next_temp:.0f}°C) in {next_name}."
            hazard_warnings.append(step_warning)

        step_num = i + 1
        if i == 0:
            # First step leaving origin zone
            if next_type == 'corridor':
                action = "EXIT_TO_CORRIDOR"
                instr = f"Exit {curr_name} ({curr_id}) through the door into {next_name} ({next_id})."
            elif next_type == 'stair':
                action = "ENTER_STAIRWELL"
                instr = f"Exit {curr_name} ({curr_id}) directly into {next_name} ({next_id})."
            else:
                action = "PROCEED"
                instr = f"Move from {curr_name} ({curr_id}) into {next_name} ({next_id})."
        elif i == len(route) - 2:
            # Final step reaching exit
            action = "EVACUATE_BUILDING"
            instr = f"Proceed through {curr_name} directly to {next_name} ({next_id}) and push exit doors to leave the building."
        else:
            # Intermediate transit step
            if next_type == 'stair':
                action = "DESCEND_STAIRS"
                instr = f"Enter {next_name} ({next_id}) fire stairwell and descend toward ground level exit."
            elif next_type == 'corridor':
                action = "FOLLOW_CORRIDOR"
                instr = f"Continue along {next_name} ({next_id}) following green illuminated emergency markers."
            else:
                action = "TRANSIT_ZONE"
                instr = f"Pass through {next_name} ({next_id}) towards the evacuation exit."

        steps.append({
            "step_num": step_num,
            "from_zone": curr_id,
            "from_name": curr_name,
            "to_zone": next_id,
            "to_name": next_name,
            "action": action,
            "instruction": instr,
            "warning": step_warning,
            "connection_type": conn_type
        })

    # Estimate clearing time (~10s per hop + crowd delay)
    est_seconds = len(steps) * 12 + max(0, int(occupancy * 1.5))

    # Concise voice announcement text for PA speech
    hops_str = " then ".join([_get_zone(zid).get('name', zid) for zid in route[1:]])
    voice_msg = (
        f"Evacuation directive for {start_name}: "
        f"All {occupancy} occupants evacuate immediately via {hops_str} to {dest_name}. "
        f"Do not use elevators. Assist those who need help."
    )

    path_str = " ➔ ".join(route)
    headline = f"EVACUATE via {path_str}"

    return {
        "zone_id": start_zone,
        "zone_name": start_name,
        "occupancy": occupancy,
        "status": "CRITICAL_EVACUATION" if len(hazard_warnings) > 0 else "SAFE",
        "target_exit_id": dest_zone,
        "target_exit_name": dest_name,
        "estimated_time_seconds": est_seconds,
        "path": route,
        "headline": headline,
        "voice_announcement": voice_msg,
        "steps": steps,
        "hazard_warnings": hazard_warnings
    }


def compute_all_evacuation_routes(graph, world_model):
    """Compute evacuation routes and turn-by-turn directives for all occupied, non-exit zones.
    Returns dict mapping zone_id -> route (list of zone IDs).
    """
    routes = {}
    directives = {}

    # Support both WorldModel instances and raw dicts
    if hasattr(world_model, 'get_all_zones'):
        zones = world_model.get_all_zones()
    elif hasattr(world_model, '_zones'):
        zones = world_model._zones
    elif isinstance(world_model, dict):
        zones = world_model.get('_zones', world_model.get('zones', {}))
    else:
        zones = {}

    for zone_id, state in zones.items():
        if state.get('occupancy', 0) > 0 and state.get('zone_type') != 'exit':
            route = find_nearest_exit(graph, world_model, zone_id)
            directive = generate_turn_by_turn_instructions(graph, world_model, zone_id, route)
            directives[zone_id] = directive
            if route:
                routes[zone_id] = route
                if hasattr(world_model, 'set_evacuation_route'):
                    world_model.set_evacuation_route(zone_id, route)

    if hasattr(world_model, 'set_evacuation_directives'):
        world_model.set_evacuation_directives(directives)

    return routes

