from fastapi import APIRouter, Header, HTTPException, Request
from uuid import UUID

from app.repositories import board_repo
from app.schemas.board_schema import BoardInbound, BoardUpdateInbound
from app.helpers import require_security_headers, serialize

router = APIRouter(prefix="/boards", tags=["Boards"])


@router.get("", status_code=200)
async def list_boards(request: Request):
    """Lista todos os boards ativos."""
    boards = await board_repo.list_boards(request.app.state.pool)
    return {"boards": [serialize(b) for b in boards]}


@router.post("", status_code=201)
async def create_board(
    payload: BoardInbound,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Cria um novo board."""
    require_security_headers(idempotency_key, x_nonce)
    board = await board_repo.create_board(
        request.app.state.pool,
        nome=payload.nome,
        descricao=payload.descricao,
    )
    return serialize(board)


@router.get("/{board_id}", status_code=200)
async def get_board(board_id: UUID, request: Request):
    """Retorna um board pelo ID."""
    board = await board_repo.get_board(request.app.state.pool, board_id)
    if not board:
        raise HTTPException(status_code=404, detail="Board não encontrado")
    return serialize(board)


@router.put("/{board_id}", status_code=200)
async def update_board(
    board_id: UUID,
    payload: BoardUpdateInbound,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Atualiza nome ou descrição do board."""
    require_security_headers(idempotency_key, x_nonce)
    board = await board_repo.update_board(
        request.app.state.pool,
        board_id=board_id,
        nome=payload.nome,
        descricao=payload.descricao,
    )
    if not board:
        raise HTTPException(status_code=404, detail="Board não encontrado")
    return serialize(board)


@router.delete("/{board_id}", status_code=200)
async def delete_board(
    board_id: UUID,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Soft-delete de um board."""
    require_security_headers(idempotency_key, x_nonce)
    deleted = await board_repo.soft_delete_board(request.app.state.pool, board_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Board não encontrado")
    return {"status": "soft_deleted", "id": str(board_id), "is_deleted": True}
