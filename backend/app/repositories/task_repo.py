"""
repositories/task_repo.py — Repositório de Tasks (SQL puro, asyncpg)

Soft-delete: UPDATE is_deleted = TRUE + atualiza update_at via trigger no banco.
"""

from uuid import UUID
import asyncpg


async def list_tasks(pool: asyncpg.Pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, grupo_id, titulo, descricao, status, criado_em, update_at, is_deleted "
            "FROM tasks WHERE is_deleted = FALSE ORDER BY criado_em DESC"
        )
    return [dict(r) for r in rows]


async def list_tasks_by_grupo(pool: asyncpg.Pool, grupo_id: UUID) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, grupo_id, titulo, descricao, status, criado_em, update_at, is_deleted "
            "FROM tasks WHERE grupo_id = $1 AND is_deleted = FALSE ORDER BY criado_em DESC",
            grupo_id,
        )
    return [dict(r) for r in rows]


async def get_task(pool: asyncpg.Pool, task_id: UUID) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, grupo_id, titulo, descricao, status, criado_em, update_at, is_deleted "
            "FROM tasks WHERE id = $1 AND is_deleted = FALSE",
            task_id,
        )
    return dict(row) if row else None


async def create_task(
    pool: asyncpg.Pool,
    titulo: str,
    descricao: str,
    status: str,
    grupo_id: UUID | None = None,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO tasks (grupo_id, titulo, descricao, status) VALUES ($1, $2, $3, $4) "
            "RETURNING id, grupo_id, titulo, descricao, status, criado_em, update_at, is_deleted",
            grupo_id,
            titulo,
            descricao,
            status,
        )
    return dict(row)


async def update_task(
    pool: asyncpg.Pool,
    task_id: UUID,
    titulo: str | None,
    descricao: str | None,
    status: str | None,
) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE tasks
               SET titulo    = COALESCE($2, titulo),
                   descricao = COALESCE($3, descricao),
                   status    = COALESCE($4, status)
             WHERE id = $1 AND is_deleted = FALSE
            RETURNING id, grupo_id, titulo, descricao, status, criado_em, update_at, is_deleted
            """,
            task_id,
            titulo,
            descricao,
            status,
        )
    return dict(row) if row else None


async def soft_delete_task(pool: asyncpg.Pool, task_id: UUID) -> dict | None:
    """Soft-delete: seta is_deleted = TRUE. O trigger atualiza update_at automaticamente."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "UPDATE tasks SET is_deleted = TRUE WHERE id = $1 AND is_deleted = FALSE "
            "RETURNING id, is_deleted",
            task_id,
        )
    return dict(row) if row else None
