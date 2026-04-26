"""
db.py — Pool de conexões asyncpg

Ciclo de vida gerenciado pelo lifespan do FastAPI (main.py).
O pool é armazenado no app.state para ser acessado pelos repositórios
via `request.app.state.pool`.

Variáveis de ambiente lidas:
  DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
"""

import os
import asyncpg


async def create_pool() -> asyncpg.Pool:
    """Cria e retorna o pool de conexões PostgreSQL."""
    return await asyncpg.create_pool(
        host=os.getenv("DB_HOST", "postgres"),
        port=int(os.getenv("DB_PORT", 5432)),
        database=os.getenv("DB_NAME", "taskmanager"),
        user=os.getenv("DB_USER", "taskuser"),
        password=os.getenv("DB_PASSWORD", "changeme"),
        min_size=2,
        max_size=10,
        command_timeout=30,
    )


async def close_pool(pool: asyncpg.Pool) -> None:
    """Fecha o pool graciosamente no shutdown."""
    await pool.close()
