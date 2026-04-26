from fastapi import APIRouter, Header, HTTPException, Request
from uuid import UUID

from app.repositories import task_repo, grupo_repo
from app.schemas.task_schema import TaskInbound, TaskUpdateInbound
from app.helpers import require_security_headers, serialize

router = APIRouter(prefix="/tasks", tags=["Tasks"])


@router.get("", status_code=200)
async def list_tasks(request: Request):
    """Lista todas as tarefas ativas (is_deleted=False)."""
    tasks = await task_repo.list_tasks(request.app.state.pool)
    return {"tasks": [serialize(t) for t in tasks]}


@router.get("/{task_id}", status_code=200)
async def get_task(task_id: UUID, request: Request):
    """Retorna uma tarefa pelo ID."""
    task = await task_repo.get_task(request.app.state.pool, task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return serialize(task)


@router.post("", status_code=201)
async def create_task(
    payload: TaskInbound,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Cria uma nova tarefa."""
    require_security_headers(idempotency_key, x_nonce)
    task = await task_repo.create_task(
        request.app.state.pool,
        titulo=payload.titulo,
        descricao=payload.descricao,
        status=payload.status.value,
    )
    return serialize(task)


@router.put("/{task_id}", status_code=200)
async def update_task(
    task_id: UUID,
    payload: TaskUpdateInbound,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Atualiza título, descrição ou status de uma tarefa existente."""
    require_security_headers(idempotency_key, x_nonce)
    task = await task_repo.update_task(
        request.app.state.pool,
        task_id=task_id,
        titulo=payload.titulo,
        descricao=payload.descricao,
        status=payload.status.value if payload.status else None,
    )
    if not task:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return serialize(task)


@router.delete("/{task_id}", status_code=200)
async def delete_task(
    task_id: UUID,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Soft-delete: marca is_deleted=True. Não executa DELETE físico."""
    require_security_headers(idempotency_key, x_nonce)
    deleted = await task_repo.soft_delete_task(request.app.state.pool, task_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Tarefa não encontrada")
    return {"status": "soft_deleted", "id": str(task_id), "is_deleted": True}
