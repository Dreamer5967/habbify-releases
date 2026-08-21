import asyncio
import json
import logging
from datetime import datetime, timezone
from backend.agent.prompts import AGENT_SYSTEM_PROMPT, TOOL_SCHEMAS
from backend.agent.tools import ToolExecutor
from backend.db import log_action

logger = logging.getLogger(__name__)


class AgentLoop:
    def __init__(self, world_model, graph, reasoning_backend, db_path, broadcast_fn=None, poll_interval=2.0):
        self.world_model = world_model
        self.graph = graph
        self.reasoning = reasoning_backend
        self.db_path = db_path
        self.broadcast = broadcast_fn
        self.poll_interval = poll_interval
        self.executor = ToolExecutor(world_model, graph, db_path)
        self._running = False
        self._last_action_time = None
        self._incident_active = False

    async def start(self):
        self._running = True
        logger.info('Agent loop started')
        while self._running:
            await asyncio.sleep(self.poll_interval)
            try:
                await self._tick()
            except Exception as e:
                logger.error(f'Agent loop error: {e}', exc_info=True)

    def stop(self):
        self._running = False

    async def _tick(self):
        # Check if incident is active
        incidents = self.world_model.get_active_incidents()
        self._incident_active = len(incidents) > 0

        if not self._incident_active:
            return

        # Check for significant change
        if not self.world_model.significant_change():
            # Heartbeat: still replan every 30s during active incident
            if self._last_action_time and (datetime.now(timezone.utc) - self._last_action_time).seconds < 30:
                return

        # REASON: Ask LLM what to do
        snapshot = self.world_model.snapshot()
        messages = [
            {'role': 'system', 'content': AGENT_SYSTEM_PROMPT},
            {
                'role': 'user',
                'content': (
                    f"Current building state:\n{json.dumps(snapshot, indent=2)}\n\n"
                    f"Active incidents: {json.dumps(incidents)}\n\n"
                    f"Analyze the situation and decide what actions to take."
                )
            },
        ]

        turn = await self.reasoning.agent_turn(messages, TOOL_SCHEMAS)
        self._last_action_time = datetime.now(timezone.utc)

        # Execute tool calls
        if turn.get('tool_calls'):
            for call in turn['tool_calls']:
                tool_name = call['name']
                args = call.get('arguments', {})
                try:
                    result = await self.executor.execute(tool_name, args)
                    reason = turn.get('content', '') or f'Agent called {tool_name}'
                    incident_id = incidents[0].get('id') if incidents else None
                    await log_action(self.db_path, incident_id, tool_name, args, reason, 'sensor_delta')

                    # Broadcast to frontend
                    if self.broadcast:
                        await self.broadcast({
                            'type': 'agent_action',
                            'action': tool_name,
                            'args': args,
                            'reason': reason,
                            'result': result,
                            'timestamp': datetime.now(timezone.utc).isoformat(),
                        })
                except Exception as e:
                    logger.error(f'Tool execution error: {tool_name}: {e}')
                    if self.broadcast:
                        await self.broadcast({
                            'type': 'agent_error',
                            'tool': tool_name,
                            'error': str(e),
                        })
        elif turn.get('content'):
            if self.broadcast:
                await self.broadcast({
                    'type': 'agent_analysis',
                    'content': turn['content'],
                    'timestamp': datetime.now(timezone.utc).isoformat(),
                })
