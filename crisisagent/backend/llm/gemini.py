import os
import json
import httpx
import base64
import logging
from backend.llm.base import VisionBackend
from backend.llm.mock_adapter import MockVisionBackend

logger = logging.getLogger(__name__)


class GeminiVisionBackend(VisionBackend):
    def __init__(self):
        self.mock_fallback = MockVisionBackend()

    async def parse_floorplan(self, image_bytes: bytes, prompt: str) -> dict:
        api_key = os.environ.get("GEMINI_API_KEY")
        if not api_key:
            logger.warning("GEMINI_API_KEY not found in environment — falling back to deterministic vision parser.")
            return await self.mock_fallback.parse_floorplan(image_bytes, prompt)

        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
        b64_image = base64.b64encode(image_bytes).decode('utf-8')

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt},
                        {
                            "inlineData": {
                                "mimeType": "image/png",
                                "data": b64_image
                            }
                        }
                    ]
                }
            ],
            "generationConfig": {
                "responseMimeType": "application/json"
            }
        }

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                if response.status_code != 200:
                    logger.error(f"Gemini API returned status {response.status_code}: {response.text} — falling back to mock")
                    return await self.mock_fallback.parse_floorplan(image_bytes, prompt)

                data = response.json()
                text = data["candidates"][0]["content"]["parts"][0]["text"]
                cleaned = text.strip()
                if cleaned.startswith("```json"):
                    cleaned = cleaned[7:]
                elif cleaned.startswith("```"):
                    cleaned = cleaned[3:]
                if cleaned.endswith("```"):
                    cleaned = cleaned[:-3]
                return json.loads(cleaned.strip())
        except Exception as e:
            logger.error(f"Gemini vision call failed: {e} — using mock fallback")
            return await self.mock_fallback.parse_floorplan(image_bytes, prompt)
