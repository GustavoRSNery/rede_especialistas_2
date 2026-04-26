from fastapi import APIRouter, Header, HTTPException, Request
from uuid import UUID

from app.repositories import board_repo, quadro_repo
from app.schemas.quadro_schema import QuadroInbound, QuadroUpdateInbound
from app.helpers import require_security_headers, serialize

router = APIRouter(tags=["Quadros"])


# Nested: /boards/{board_id}/quadros
@router.get("/boards/{board_id}/quadros", status_code=200)
async def list_quadros(board_id: UUID, request: Request):
    """Lista quadros de um board."""
    quadros = await quadro_repo.list_quadros(request.app.state.pool, board_id)
    return {"quadros": [serialize(q) for q in quadros]}


@router.post("/boards/{board_id}/quadros", status_code=201)
async def create_quadro(
    board_id: UUID,
    payload: QuadroInbound,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Cria um novo quadro dentro de um board."""
    require_security_headers(idempotency_key, x_nonce)
    board = await board_repo.get_board(request.app.state.pool, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board não encontrado")
    quadro = await quadro_repo.create_quadro(
        request.app.state.pool,
        board_id=board_id,
        nome=payload.nome,
        descricao=payload.descricao,
    )
    return serialize(quadro)


# Direct: /quadros/{quadro_id}
@router.get("/quadros/{quadro_id}", status_code=200)
async def get_quadro(quadro_id: UUID, request: Request):
    """Retorna um quadro pelo ID."""
    quadro = await quadro_repo.get_quadro(request.app.state.pool, quadro_id)
    if not quadro:
        raise HTTPException(status_code=404, detail="Quadro não encontrado")
    return serialize(quadro)


@router.put("/quadros/{quadro_id}", status_code=200)
async def update_quadro(
    quadro_id: UUID,
    payload: QuadroUpdateInbound,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Atualiza nome ou descrição do quadro."""
    require_security_headers(idempotency_key, x_nonce)
    quadro = await quadro_repo.update_quadro(
        request.app.state.pool,
        quadro_id=quadro_id,
        nome=payload.nome,
        descricao=payload.descricao,
    )
    if not quadro:
        raise HTTPException(status_code=404, detail="Quadro não encontrado")
    return serialize(quadro)


@router.delete("/quadros/{quadro_id}", status_code=200)
async def delete_quadro(
    quadro_id: UUID,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Soft-delete de um quadro."""
    require_security_headers(idempotency_key, x_nonce)
    deleted = await quadro_repo.soft_delete_quadro(request.app.state.pool, quadro_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Quadro não encontrado")
    return {"status": "soft_deleted", "id": str(quadro_id), "is_deleted": True}
