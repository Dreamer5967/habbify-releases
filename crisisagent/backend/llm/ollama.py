import json
import httpx
import base64
from typing import Dict, Any, List

from backend.llm.base import VisionBackend, ReasoningBackend

class OllamaVisionBackend(VisionBackend):
    def __init__(self, model_name: str = "qwen3-vl", host: str = "http://localhost:11434"):
        self.model_name = model_name
        self.host = host

    async def parse_floorplan(self, image_bytes: bytes, prompt: str) -> dict:
        b64_image = base64.b64encode(image_bytes).decode('utf-8')
        url = f"{self.host}/api/generate"
        payload = {
            "model": self.model_name,
            "prompt": prompt,
            "images": [b64_image],
            "stream": False,
            "format": "json"
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=60.0)
                response.raise_for_status()
                data = response.json()
                return json.loads(data.get("response", "{}"))
            except httpx.RequestError as e:
                raise RuntimeError(f"Failed to connect to Ollama: {e}")
            except json.JSONDecodeError as e:
                raise RuntimeError(f"Failed to parse JSON from Ollama: {e}")

class OllamaReasoningBackend(ReasoningBackend):
    def __init__(self, model_name: str = "llama3.1", host: str = "http://localhost:11434"):
        self.model_name = model_name
        self.host = host

    async def agent_turn(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]]) -> Dict[str, Any]:
        url = f"{self.host}/api/chat"
        payload = {
            "model": self.model_name,
            "messages": messages,
            "tools": tools,
            "stream": False
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(url, json=payload, timeout=60.0)
                response.raise_for_status()
                data = response.json()
                
                msg = data["message"]
                content = msg.get("content")
                
                tool_calls = []
                if "tool_calls" in msg:
                    for tc in msg["tool_calls"]:
                        try:
                            args = json.loads(tc["function"]["arguments"])
                        except json.JSONDecodeError:
                            args = tc["function"]["arguments"]
                        
                        tool_calls.append({
                            "name": tc["function"]["name"],
                            "arguments": args
                        })
                        
                return {
                    "content": content,
                    "tool_calls": tool_calls
                }
            except httpx.RequestError as e:
                raise RuntimeError(f"Failed to connect to Ollama: {e}")
