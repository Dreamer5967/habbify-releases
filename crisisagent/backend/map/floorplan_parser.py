from pydantic import BaseModel, Field, field_validator, model_validator
from typing import Optional
import json


class Zone(BaseModel):
    id: str
    name: str
    type: str  # room | corridor | stair | exit
    centroid_x: float = Field(ge=0, le=1)
    centroid_y: float = Field(ge=0, le=1)

    @field_validator('type')
    @classmethod
    def validate_type(cls, v):
        valid_types = ('room', 'corridor', 'stair', 'exit')
        if v not in valid_types:
            raise ValueError(f'Invalid type: {v}. Must be one of {valid_types}')
        return v


class Connection(BaseModel):
    from_zone: str = Field(alias='from')
    to_zone: str = Field(alias='to')
    type: str  # door | open | stairwell

    model_config = {"populate_by_name": True}


class ParsedBuilding(BaseModel):
    zones: list[Zone]
    connections: list[Connection]

    @model_validator(mode='after')
    def validate_connections_reference_valid_zones(self):
        valid_ids = {z.id for z in self.zones}
        for conn in self.connections:
            if conn.from_zone not in valid_ids:
                raise ValueError(f"Connection references unknown zone: {conn.from_zone}")
            if conn.to_zone not in valid_ids:
                raise ValueError(f"Connection references unknown zone: {conn.to_zone}")
        return self


FLOORPLAN_PROMPT = """You are analyzing an architectural floor plan image. Identify every distinct
navigable zone and how they connect. Return ONLY valid JSON matching this
exact schema, nothing else:

{
  "zones": [
    {"id": "string, e.g. R1", "name": "string", "type": "room|corridor|stair|exit",
     "centroid_x": float (0-1, fraction of image width),
     "centroid_y": float (0-1, fraction of image height)}
  ],
  "connections": [
    {"from": "zone id", "to": "zone id", "type": "door|open|stairwell"}
  ]
}

Rules:
- Every stair and exit must be its own zone.
- A connection means people can physically walk between the two zones.
- Do not invent zones that aren't visibly labeled or clearly delineated.
- If uncertain about a connection, include it anyway with type "open" —
  a false connection is safer to include than a missing one."""


def _clean_json_response(text: str) -> str:
    """Strip markdown code fences and other wrapper text from LLM response."""
    text = text.strip()
    if text.startswith("```json"):
        text = text[7:]
    elif text.startswith("```"):
        text = text[3:]
    if text.endswith("```"):
        text = text[:-3]
    return text.strip()


async def parse_floorplan(vision_backend, image_bytes: bytes, max_retries: int = 3) -> Optional['ParsedBuilding']:
    """Parse a floor plan image into a structured building representation.

    Uses a vision LLM with self-repair: on validation failure, feeds the error
    back to the model for correction. Falls back to None after max_retries,
    allowing the caller to use proximity-based adjacency.
    """
    error_msg = ""
    for attempt in range(max_retries):
        prompt = FLOORPLAN_PROMPT
        if error_msg:
            prompt += f"\n\nYour previous response was invalid: {error_msg}. Fix it and return only valid JSON."

        try:
            raw = await vision_backend.parse_floorplan(image_bytes, prompt)

            # If the backend already returned a dict, use it directly
            if isinstance(raw, dict):
                return ParsedBuilding(**raw)

            # Otherwise it's a string — clean and parse
            cleaned = _clean_json_response(str(raw))
            data = json.loads(cleaned)
            return ParsedBuilding(**data)
        except Exception as e:
            error_msg = str(e)

    return None
