"""
repositories/grupo_repo.py — Repositório de Grupos (SQL puro, asyncpg)
"""

from uuid import UUID
import asyncpg


async def list_grupos(pool: asyncpg.Pool, quadro_id: UUID) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, quadro_id, nome, cor, ordem, criado_em, is_deleted "
            "FROM grupos WHERE quadro_id = $1 AND is_deleted = FALSE ORDER BY ordem, criado_em",
            quadro_id,
        )
    return [dict(r) for r in rows]


async def get_grupo(pool: asyncpg.Pool, grupo_id: UUID) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, quadro_id, nome, cor, ordem, criado_em, is_deleted "
            "FROM grupos WHERE id = $1 AND is_deleted = FALSE",
            grupo_id,
        )
    return dict(row) if row else None


async def create_grupo(
    pool: asyncpg.Pool,
    quadro_id: UUID,
    nome: str,
    cor: str,
    ordem: int,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO grupos (quadro_id, nome, cor, ordem) VALUES ($1, $2, $3, $4) "
            "RETURNING id, quadro_id, nome, cor, ordem, criado_em, is_deleted",
            quadro_id,
            nome,
            cor,
            ordem,
        )
    return dict(row)


async def update_grupo(
    pool: asyncpg.Pool,
    grupo_id: UUID,
    nome: str | None,
    cor: str | None,
    ordem: int | None,
) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE grupos
               SET nome  = COALESCE($2, nome),
                   cor   = COALESCE($3, cor),
                   ordem = COALESCE($4, ordem)
             WHERE id = $1 AND is_deleted = FALSE
            RETURNING id, quadro_id, nome, cor, ordem, criado_em, is_deleted
            """,
            grupo_id,
            nome,
            cor,
            ordem,
        )
    return dict(row) if row else None


async def soft_delete_grupo(pool: asyncpg.Pool, grupo_id: UUID) -> bool:
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE grupos SET is_deleted = TRUE WHERE id = $1 AND is_deleted = FALSE",
            grupo_id,
        )
    return result == "UPDATE 1"
