"""
repositories/quadro_repo.py — Repositório de Quadros (SQL puro, asyncpg)
"""

from uuid import UUID
import asyncpg


async def list_quadros(pool: asyncpg.Pool, board_id: UUID) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, board_id, nome, descricao, criado_em, is_deleted "
            "FROM quadros WHERE board_id = $1 AND is_deleted = FALSE ORDER BY criado_em",
            board_id,
        )
    return [dict(r) for r in rows]


async def get_quadro(pool: asyncpg.Pool, quadro_id: UUID) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, board_id, nome, descricao, criado_em, is_deleted "
            "FROM quadros WHERE id = $1 AND is_deleted = FALSE",
            quadro_id,
        )
    return dict(row) if row else None


async def create_quadro(
    pool: asyncpg.Pool,
    board_id: UUID,
    nome: str,
    descricao: str | None,
) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO quadros (board_id, nome, descricao) VALUES ($1, $2, $3) "
            "RETURNING id, board_id, nome, descricao, criado_em, is_deleted",
            board_id,
            nome,
            descricao,
        )
    return dict(row)


async def update_quadro(
    pool: asyncpg.Pool,
    quadro_id: UUID,
    nome: str | None,
    descricao: str | None,
) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE quadros
               SET nome      = COALESCE($2, nome),
                   descricao = COALESCE($3, descricao)
             WHERE id = $1 AND is_deleted = FALSE
            RETURNING id, board_id, nome, descricao, criado_em, is_deleted
            """,
            quadro_id,
            nome,
            descricao,
        )
    return dict(row) if row else None


async def soft_delete_quadro(pool: asyncpg.Pool, quadro_id: UUID) -> bool:
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE quadros SET is_deleted = TRUE WHERE id = $1 AND is_deleted = FALSE",
            quadro_id,
        )
    return result == "UPDATE 1"
