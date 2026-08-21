import os
import json
import httpx
from typing import Dict, Any, List

from backend.llm.base import ReasoningBackend

class GroqReasoningBackend(ReasoningBackend):
    def __init__(self, model_name: str = "llama-3.3-70b-versatile"):
        self.model_name = model_name

    async def agent_turn(self, messages: List[Dict[str, Any]], tools: List[Dict[str, Any]]) -> Dict[str, Any]:
        api_key = os.environ.get("GROQ_API_KEY")
        if not api_key:
            raise ValueError("GROQ_API_KEY not found in environment.")
            
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model_name,
            "messages": messages,
            "tools": tools,
            "tool_choice": "auto"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=60.0)
            response.raise_for_status()
            data = response.json()
            
            choice = data["choices"][0]["message"]
            content = choice.get("content")
            
            tool_calls = []
            if "tool_calls" in choice:
                for tc in choice["tool_calls"]:
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
