from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel
from typing import Optional
from uuid import UUID, uuid4
from enum import Enum

router = APIRouter()


# =========================================================
# Pydantic Schemas (Inbound contracts)
# =========================================================

class TaskStatus(str, Enum):
    pendente = "pendente"
    concluida = "concluida"


class TaskInbound(BaseModel):
    titulo: str
    descricao: str
    status: TaskStatus = TaskStatus.pendente


class TaskUpdateInbound(BaseModel):
    titulo: Optional[str] = None
    descricao: Optional[str] = None
    status: Optional[TaskStatus] = None


class BoardInbound(BaseModel):
    nome: str
    descricao: Optional[str] = None


class BoardUpdateInbound(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None


class QuadroInbound(BaseModel):
    nome: str
    descricao: Optional[str] = None


class QuadroUpdateInbound(BaseModel):
    nome: Optional[str] = None
    descricao: Optional[str] = None


class GrupoInbound(BaseModel):
    nome: str
    cor: Optional[str] = "default"
    ordem: Optional[int] = 0


class GrupoUpdateInbound(BaseModel):
    nome: Optional[str] = None
    cor: Optional[str] = None
    ordem: Optional[int] = None


# =========================================================
# Helper de Segurança
# =========================================================

def _require_security_headers(idempotency_key: str, x_nonce: str):
    """Garante que toda mutação traga os headers de segurança obrigatórios (Idempotência + Nonce)."""
    if not idempotency_key or not x_nonce:
        raise HTTPException(status_code=400, detail="Headers Idempotency-Key e X-Nonce são obrigatórios")


# =========================================================
# CRUD Routes
# =========================================================

@router.get("/tasks", status_code=200)
async def list_tasks():
    """
    SEND to Frontend (via resposta HTTP síncrona):
    Lista todas as tarefas ativas (is_deleted=False).
    Futuro: delega ao UseCase Hexagonal que chama PostgreSQLTaskAdapter.
    """
    # TODO: return await task_use_case.handle_list_tasks()
    return {"tasks": []}


@router.get("/tasks/{task_id}", status_code=200)
async def get_task(task_id: UUID):
    """
    SEND to Frontend: Retorna dados de uma tarefa específica.
    404 se não existir ou já tiver is_deleted=True.
    """
    # TODO: return await task_use_case.handle_get_task(task_id)
    raise HTTPException(status_code=404, detail="Tarefa não encontrada")


@router.post("/tasks", status_code=201)
async def create_task(
    payload: TaskInbound,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """
    RECEIVE from Frontend: Cria uma nova tarefa.
    Valida segurança via Idempotency-Key (evita duplicatas) e X-Nonce (evita replay attack).
    Futuro: delega ao UseCase que persiste via Raw SQL no PostgreSQL.
    """
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await task_use_case.handle_create_new_task(payload, idempotency_key, x_nonce)
    return {"status": "created", "id": str(uuid4()), "titulo": payload.titulo}


@router.put("/tasks/{task_id}", status_code=200)
async def update_task(
    task_id: UUID,
    payload: TaskUpdateInbound,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """
    RECEIVE from Frontend: Atualiza título, descrição ou status de uma tarefa existente.
    404 se a tarefa não existir ou estiver soft-deleted.
    """
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await task_use_case.handle_update_task(task_id, payload, idempotency_key, x_nonce)
    return {"status": "updated", "id": str(task_id)}


@router.delete("/tasks/{task_id}", status_code=200)
async def delete_task(
    task_id: UUID,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """
    RECEIVE from Frontend: Soft-Delete.
    NÃO executa DELETE SQL. Apenas sinaliza is_deleted=True + atualiza update_at.
    O frontend oculta registros com is_deleted=True na listagem.
    """
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await task_use_case.handle_soft_delete(task_id, idempotency_key, x_nonce)
    return {"status": "soft_deleted", "id": str(task_id), "is_deleted": True}


# =========================================================
# Board Routes — /boards
# =========================================================

@router.get("/boards", status_code=200)
async def list_boards():
    """SEND to Frontend: Lista todos os boards ativos."""
    # TODO: return await board_use_case.handle_list_boards()
    return {"boards": []}


@router.post("/boards", status_code=201)
async def create_board(
    payload: BoardInbound,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Cria um novo board."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await board_use_case.handle_create_board(payload)
    return {"id": str(uuid4()), "nome": payload.nome, "descricao": payload.descricao, "is_deleted": False}


@router.get("/boards/{board_id}", status_code=200)
async def get_board(board_id: UUID):
    """SEND to Frontend: Retorna um board pelo ID."""
    # TODO: return await board_use_case.handle_get_board(board_id)
    raise HTTPException(status_code=404, detail="Board não encontrado")


@router.put("/boards/{board_id}", status_code=200)
async def update_board(
    board_id: UUID,
    payload: BoardUpdateInbound,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Atualiza nome ou descrição do board."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await board_use_case.handle_update_board(board_id, payload)
    return {"status": "updated", "id": str(board_id)}


@router.delete("/boards/{board_id}", status_code=200)
async def delete_board(
    board_id: UUID,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Soft-delete de um board."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await board_use_case.handle_soft_delete_board(board_id)
    return {"status": "soft_deleted", "id": str(board_id), "is_deleted": True}


# =========================================================
# Quadro Routes — /boards/{board_id}/quadros  +  /quadros/{id}
# =========================================================

@router.get("/boards/{board_id}/quadros", status_code=200)
async def list_quadros(board_id: UUID):
    """SEND to Frontend: Lista quadros de um board."""
    # TODO: return await quadro_use_case.handle_list_quadros(board_id)
    return {"quadros": []}


@router.post("/boards/{board_id}/quadros", status_code=201)
async def create_quadro(
    board_id: UUID,
    payload: QuadroInbound,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Cria um novo quadro dentro de um board."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await quadro_use_case.handle_create_quadro(board_id, payload)
    return {
        "id": str(uuid4()),
        "board_id": str(board_id),
        "nome": payload.nome,
        "descricao": payload.descricao,
        "is_deleted": False,
    }


@router.get("/quadros/{quadro_id}", status_code=200)
async def get_quadro(quadro_id: UUID):
    """SEND to Frontend: Retorna um quadro pelo ID."""
    # TODO: return await quadro_use_case.handle_get_quadro(quadro_id)
    raise HTTPException(status_code=404, detail="Quadro não encontrado")


@router.put("/quadros/{quadro_id}", status_code=200)
async def update_quadro(
    quadro_id: UUID,
    payload: QuadroUpdateInbound,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Atualiza nome ou descrição do quadro."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await quadro_use_case.handle_update_quadro(quadro_id, payload)
    return {"status": "updated", "id": str(quadro_id)}


@router.delete("/quadros/{quadro_id}", status_code=200)
async def delete_quadro(
    quadro_id: UUID,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Soft-delete de um quadro."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await quadro_use_case.handle_soft_delete_quadro(quadro_id)
    return {"status": "soft_deleted", "id": str(quadro_id), "is_deleted": True}


# =========================================================
# Grupo Routes — /quadros/{quadro_id}/grupos  +  /grupos/{id}
# =========================================================

@router.get("/quadros/{quadro_id}/grupos", status_code=200)
async def list_grupos(quadro_id: UUID):
    """SEND to Frontend: Lista grupos de atividades de um quadro."""
    # TODO: return await grupo_use_case.handle_list_grupos(quadro_id)
    return {"grupos": []}


@router.post("/quadros/{quadro_id}/grupos", status_code=201)
async def create_grupo(
    quadro_id: UUID,
    payload: GrupoInbound,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Cria um novo grupo de atividades."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await grupo_use_case.handle_create_grupo(quadro_id, payload)
    return {
        "id": str(uuid4()),
        "quadro_id": str(quadro_id),
        "nome": payload.nome,
        "cor": payload.cor,
        "ordem": payload.ordem,
        "is_deleted": False,
    }


@router.get("/grupos/{grupo_id}", status_code=200)
async def get_grupo(grupo_id: UUID):
    """SEND to Frontend: Retorna um grupo pelo ID."""
    # TODO: return await grupo_use_case.handle_get_grupo(grupo_id)
    raise HTTPException(status_code=404, detail="Grupo não encontrado")


@router.put("/grupos/{grupo_id}", status_code=200)
async def update_grupo(
    grupo_id: UUID,
    payload: GrupoUpdateInbound,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Atualiza nome, cor ou ordem do grupo."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await grupo_use_case.handle_update_grupo(grupo_id, payload)
    return {"status": "updated", "id": str(grupo_id)}


@router.delete("/grupos/{grupo_id}", status_code=200)
async def delete_grupo(
    grupo_id: UUID,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Soft-delete de um grupo."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await grupo_use_case.handle_soft_delete_grupo(grupo_id)
    return {"status": "soft_deleted", "id": str(grupo_id), "is_deleted": True}


# =========================================================
# Tasks por Grupo — /grupos/{grupo_id}/tasks
# =========================================================

@router.get("/grupos/{grupo_id}/tasks", status_code=200)
async def list_tasks_by_grupo(grupo_id: UUID):
    """SEND to Frontend: Lista tarefas de um grupo específico."""
    # TODO: return await task_use_case.handle_list_tasks_by_grupo(grupo_id)
    return {"tasks": []}


@router.post("/grupos/{grupo_id}/tasks", status_code=201)
async def create_task_in_grupo(
    grupo_id: UUID,
    payload: TaskInbound,
    idempotency_key: str = Header(..., alias="Idempotency-Key"),
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """RECEIVE from Frontend: Cria tarefa vinculada a um grupo."""
    _require_security_headers(idempotency_key, x_nonce)
    # TODO: return await task_use_case.handle_create_task_in_grupo(grupo_id, payload)
    return {
        "id": str(uuid4()),
        "grupo_id": str(grupo_id),
        "titulo": payload.titulo,
        "descricao": payload.descricao,
        "status": payload.status.value,
        "is_deleted": False,
    }
