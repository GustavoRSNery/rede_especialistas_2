from fastapi import APIRouter, Header, HTTPException, Request
from uuid import UUID

from app.repositories import quadro_repo, grupo_repo, task_repo
from app.schemas.grupo_schema import GrupoInbound, GrupoUpdateInbound
from app.schemas.task_schema import TaskInbound
from app.helpers import require_security_headers, serialize

router = APIRouter(tags=["Grupos"])


# Nested: /quadros/{quadro_id}/grupos
@router.get("/quadros/{quadro_id}/grupos", status_code=200)
async def list_grupos(quadro_id: UUID, request: Request):
    """Lista grupos de atividades de um quadro."""
    grupos = await grupo_repo.list_grupos(request.app.state.pool, quadro_id)
    return {"grupos": [serialize(g) for g in grupos]}


@router.post("/quadros/{quadro_id}/grupos", status_code=201)
async def create_grupo(
    quadro_id: UUID,
    payload: GrupoInbound,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Cria um novo grupo de atividades."""
    require_security_headers(idempotency_key, x_nonce)
    quadro = await quadro_repo.get_quadro(request.app.state.pool, quadro_id)
    if not quadro:
        raise HTTPException(status_code=404, detail="Quadro não encontrado")
    grupo = await grupo_repo.create_grupo(
        request.app.state.pool,
        quadro_id=quadro_id,
        nome=payload.nome,
        cor=payload.cor or "default",
        ordem=payload.ordem or 0,
    )
    return serialize(grupo)


# Direct: /grupos/{grupo_id}
@router.get("/grupos/{grupo_id}", status_code=200)
async def get_grupo(grupo_id: UUID, request: Request):
    """Retorna um grupo pelo ID."""
    grupo = await grupo_repo.get_grupo(request.app.state.pool, grupo_id)
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    return serialize(grupo)


@router.put("/grupos/{grupo_id}", status_code=200)
async def update_grupo(
    grupo_id: UUID,
    payload: GrupoUpdateInbound,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Atualiza nome, cor ou ordem do grupo."""
    require_security_headers(idempotency_key, x_nonce)
    grupo = await grupo_repo.update_grupo(
        request.app.state.pool,
        grupo_id=grupo_id,
        nome=payload.nome,
        cor=payload.cor,
        ordem=payload.ordem,
    )
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    return serialize(grupo)


@router.delete("/grupos/{grupo_id}", status_code=200)
async def delete_grupo(
    grupo_id: UUID,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Soft-delete de um grupo."""
    require_security_headers(idempotency_key, x_nonce)
    deleted = await grupo_repo.soft_delete_grupo(request.app.state.pool, grupo_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    return {"status": "soft_deleted", "id": str(grupo_id), "is_deleted": True}


# Tasks por grupo: /grupos/{grupo_id}/tasks
@router.get("/grupos/{grupo_id}/tasks", status_code=200)
async def list_tasks_by_grupo(grupo_id: UUID, request: Request):
    """Lista tarefas de um grupo específico."""
    tasks = await task_repo.list_tasks_by_grupo(request.app.state.pool, grupo_id)
    return {"tasks": [serialize(t) for t in tasks]}


@router.post("/grupos/{grupo_id}/tasks", status_code=201)
async def create_task_in_grupo(
    grupo_id: UUID,
    payload: TaskInbound,
    request: Request,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str         = Header(..., alias="X-Nonce"),
):
    """Cria tarefa vinculada a um grupo."""
    require_security_headers(idempotency_key, x_nonce)
    grupo = await grupo_repo.get_grupo(request.app.state.pool, grupo_id)
    if not grupo:
        raise HTTPException(status_code=404, detail="Grupo não encontrado")
    task = await task_repo.create_task(
        request.app.state.pool,
        titulo=payload.titulo,
        descricao=payload.descricao,
        status=payload.status.value,
        grupo_id=grupo_id,
    )
    return serialize(task)
