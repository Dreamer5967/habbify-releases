from abc import ABC, abstractmethod

class VisionBackend(ABC):
    @abstractmethod
    async def parse_floorplan(self, image_bytes: bytes, prompt: str) -> dict:
        """Send image + prompt to vision model, return parsed JSON dict."""
        pass

class ReasoningBackend(ABC):
    @abstractmethod
    async def agent_turn(self, messages: list[dict], tools: list[dict]) -> dict:
        """Send conversation + tools, return {"content": str|None, "tool_calls": [{"name": str, "arguments": dict}]}."""
        pass
