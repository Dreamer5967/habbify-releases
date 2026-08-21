class RouteRejected(Exception):
    pass


def get_zone_risk_level(zone_state: dict) -> str:
    """Returns 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL' based on zone state."""
    state = zone_state.get('state', 'NORMAL')
    if state == 'CRITICAL':
        return 'CRITICAL'
    if state == 'UNOBSERVABLE':
        return 'CRITICAL'

    hazard_prob = zone_state.get('hazard_probability', 0.0)
    temp = zone_state.get('temperature', 20.0)
    smoke = zone_state.get('smoke', 0.0)

    if hazard_prob > 0.7 or temp > 60.0 or smoke > 50.0:
        return 'CRITICAL'
    if hazard_prob > 0.3 or temp > 40.0 or smoke > 20.0:
        return 'HIGH'
    if hazard_prob > 0.1 or temp > 30.0 or smoke > 5.0 or state == 'ALERT':
        return 'MEDIUM'

    return 'LOW'


def is_zone_safe(zone_state: dict) -> bool:
    """Returns True if zone is safe for routing."""
    return get_zone_risk_level(zone_state) not in ('CRITICAL',)


def validate_route(route: list[str], world_model) -> bool:
    """Validates a route against hard safety rules.
    - CRITICAL zones forbidden
    - UNOBSERVABLE zones forbidden (missing data != safe)
    - Route must end at an exit zone in NORMAL/ALERT state
    Raises RouteRejected with detailed reason on failure.
    Returns True if valid.

    Accepts either a WorldModel instance or a dict with '_zones' key.
    """
    if not route:
        raise RouteRejected("Route is empty.")

    # Support both WorldModel instances and raw dicts
    if hasattr(world_model, 'get_zone'):
        # It's a WorldModel instance
        get_zone = world_model.get_zone
    elif isinstance(world_model, dict):
        zones = world_model.get('_zones', world_model.get('zones', {}))
        get_zone = lambda zid: zones.get(zid, {})
    else:
        raise RouteRejected("Invalid world model format")

    for i, zone_id in enumerate(route):
        zone_state = get_zone(zone_id)
        if not zone_state:
            raise RouteRejected(f"Zone {zone_id} does not exist in world model.")

        state = zone_state.get('state', 'NORMAL')

        if state == 'CRITICAL':
            raise RouteRejected(f"Route passes through CRITICAL zone {zone_id}.")

        if state == 'UNOBSERVABLE':
            raise RouteRejected(f"Route passes through UNOBSERVABLE zone {zone_id} — missing data is not safe.")

        # Check the destination
        if i == len(route) - 1:
            if zone_state.get('zone_type') != 'exit':
                raise RouteRejected(f"Route destination {zone_id} is not an exit.")
            risk = get_zone_risk_level(zone_state)
            if risk == 'CRITICAL':
                raise RouteRejected(f"Route ends at an unsafe exit {zone_id}.")

    return True
