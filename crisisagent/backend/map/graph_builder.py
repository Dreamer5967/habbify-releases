import networkx as nx
import math
import hashlib
from backend.map.floorplan_parser import ParsedBuilding, Connection, Zone, parse_floorplan

_graph_cache: dict[str, tuple[nx.Graph, ParsedBuilding]] = {}

def image_hash(image_bytes: bytes) -> str:
    return hashlib.sha256(image_bytes).hexdigest()

def build_graph(parsed: ParsedBuilding) -> nx.Graph:
    G = nx.Graph()
    zone_dict = {}
    
    for z in parsed.zones:
        G.add_node(z.id, type=z.type, name=z.name, x=z.centroid_x, y=z.centroid_y)
        zone_dict[z.id] = z
        
    for c in parsed.connections:
        z1 = zone_dict.get(c.from_zone)
        z2 = zone_dict.get(c.to_zone)
        if z1 and z2:
            dist = math.sqrt((z1.centroid_x - z2.centroid_x)**2 + (z1.centroid_y - z2.centroid_y)**2)
            G.add_edge(c.from_zone, c.to_zone, type=c.type, weight=dist)
            
    return G

def proximity_fallback(parsed: ParsedBuilding, threshold=0.15) -> list[Connection]:
    new_conns = []
    for i, z1 in enumerate(parsed.zones):
        for j, z2 in enumerate(parsed.zones):
            if i < j:
                dist = math.sqrt((z1.centroid_x - z2.centroid_x)**2 + (z1.centroid_y - z2.centroid_y)**2)
                if dist < threshold:
                    new_conns.append(Connection(**{"from": z1.id, "to": z2.id, "type": "open"}))
    return new_conns

def check_reachability(graph: nx.Graph) -> dict:
    exits = [n for n, d in graph.nodes(data=True) if d.get('type') == 'exit']
    reachable = set()
    
    for ex in exits:
        reachable.update(nx.node_connected_component(graph, ex))
        
    all_nodes = set(graph.nodes())
    isolated = all_nodes - reachable
    
    return {
        "reachable": list(reachable),
        "isolated": list(isolated),
        "exits": exits
    }

async def process_floorplan(vision_backend, image_bytes: bytes) -> tuple[nx.Graph, ParsedBuilding, dict]:
    ihash = image_hash(image_bytes)
    if ihash in _graph_cache:
        g, p = _graph_cache[ihash]
        return g, p, check_reachability(g)
        
    parsed = await parse_floorplan(vision_backend, image_bytes)
    if not parsed:
        raise ValueError("Failed to parse floorplan")
        
    if not parsed.connections:
        parsed.connections = proximity_fallback(parsed)
        
    g = build_graph(parsed)
    report = check_reachability(g)
    
    _graph_cache[ihash] = (g, parsed)
    return g, parsed, report
