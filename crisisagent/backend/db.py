import aiosqlite
import json

async def init_db(db_path: str):
    async with aiosqlite.connect(db_path) as db:
        await db.execute('''
            CREATE TABLE IF NOT EXISTS agent_actions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                incident_id INTEGER,
                action TEXT,
                args TEXT,
                reason TEXT,
                triggered_by TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        ''')
        await db.execute('''
            CREATE TABLE IF NOT EXISTS world_model_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                zone_id TEXT,
                state TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            )
        ''')
        await db.commit()

async def log_action(db_path: str, incident_id: int, action: str, args: dict, reason: str, triggered_by: str):
    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            'INSERT INTO agent_actions (incident_id, action, args, reason, triggered_by) VALUES (?, ?, ?, ?, ?)',
            (incident_id, action, json.dumps(args), reason, triggered_by)
        )
        await db.commit()

async def get_actions(db_path: str, incident_id: int = None, limit: int = 50):
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        if incident_id is not None:
            cursor = await db.execute(
                'SELECT * FROM agent_actions WHERE incident_id = ? ORDER BY id DESC LIMIT ?',
                (incident_id, limit)
            )
        else:
            cursor = await db.execute(
                'SELECT * FROM agent_actions ORDER BY id DESC LIMIT ?',
                (limit,)
            )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]

async def log_world_state(db_path: str, zone_id: str, state_snapshot: dict):
    async with aiosqlite.connect(db_path) as db:
        await db.execute(
            'INSERT INTO world_model_history (zone_id, state) VALUES (?, ?)',
            (zone_id, json.dumps(state_snapshot))
        )
        await db.commit()

async def get_world_history(db_path: str, zone_id: str, limit: int = 100):
    async with aiosqlite.connect(db_path) as db:
        db.row_factory = aiosqlite.Row
        cursor = await db.execute(
            'SELECT * FROM world_model_history WHERE zone_id = ? ORDER BY id DESC LIMIT ?',
            (zone_id, limit)
        )
        rows = await cursor.fetchall()
        return [dict(row) for row in rows]
