"""
repositories/board_repo.py — Repositório de Boards (SQL puro, asyncpg)

Padrão: SQL parametrizado com $1, $2... para prevenir SQL Injection (OWASP A03).
Retorna dicts prontos para serialização nos handlers.
Soft-delete: nunca executa DELETE físico — apenas seta is_deleted = TRUE.
"""

from uuid import UUID
import asyncpg


async def list_boards(pool: asyncpg.Pool) -> list[dict]:
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            "SELECT id, nome, descricao, criado_em, is_deleted "
            "FROM boards WHERE is_deleted = FALSE ORDER BY criado_em DESC"
        )
    return [dict(r) for r in rows]


async def get_board(pool: asyncpg.Pool, board_id: UUID) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "SELECT id, nome, descricao, criado_em, is_deleted "
            "FROM boards WHERE id = $1 AND is_deleted = FALSE",
            board_id,
        )
    return dict(row) if row else None


async def create_board(pool: asyncpg.Pool, nome: str, descricao: str | None) -> dict:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            "INSERT INTO boards (nome, descricao) VALUES ($1, $2) "
            "RETURNING id, nome, descricao, criado_em, is_deleted",
            nome,
            descricao,
        )
    return dict(row)


async def update_board(
    pool: asyncpg.Pool,
    board_id: UUID,
    nome: str | None,
    descricao: str | None,
) -> dict | None:
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            UPDATE boards
               SET nome      = COALESCE($2, nome),
                   descricao = COALESCE($3, descricao)
             WHERE id = $1 AND is_deleted = FALSE
            RETURNING id, nome, descricao, criado_em, is_deleted
            """,
            board_id,
            nome,
            descricao,
        )
    return dict(row) if row else None


async def soft_delete_board(pool: asyncpg.Pool, board_id: UUID) -> bool:
    async with pool.acquire() as conn:
        result = await conn.execute(
            "UPDATE boards SET is_deleted = TRUE WHERE id = $1 AND is_deleted = FALSE",
            board_id,
        )
    return result == "UPDATE 1"
