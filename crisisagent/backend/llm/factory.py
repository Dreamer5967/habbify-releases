import os
from .base import VisionBackend, ReasoningBackend
from .gemini import GeminiVisionBackend
from .groq import GroqReasoningBackend
from .ollama import OllamaVisionBackend, OllamaReasoningBackend
from .mock_adapter import MockVisionBackend, MockReasoningBackend

def create_vision_backend() -> VisionBackend:
    backend_type = os.getenv('LLM_VISION_BACKEND', 'mock').lower()
    if backend_type == 'gemini':
        return GeminiVisionBackend()
    elif backend_type == 'ollama':
        return OllamaVisionBackend()
    else:
        return MockVisionBackend()

def create_reasoning_backend() -> ReasoningBackend:
    backend_type = os.getenv('LLM_REASONING_BACKEND', 'mock').lower()
    if backend_type == 'groq':
        return GroqReasoningBackend()
    elif backend_type == 'ollama':
        return OllamaReasoningBackend()
    else:
        return MockReasoningBackend()
