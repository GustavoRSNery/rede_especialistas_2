import os
import httpx
from uuid import uuid4
from fastapi import APIRouter, BackgroundTasks, Header
from fastapi.responses import JSONResponse

router = APIRouter()

# =========================================================
# HTTP client singleton — criado uma vez, reutilizado durante toda a vida do processo.
# Fechado explicitamente no lifespan do main.py (app.state._http_client.aclose()).
# =========================================================
_http_client = httpx.AsyncClient(timeout=10.0)

FRONTEND_WEBHOOK_URL = os.getenv(
    "FRONTEND_WEBHOOK_URL",
    "http://nginx/frontend/webhook/notifications"
)
FRONTEND_SYNC_URL = os.getenv(
    "FRONTEND_API_URL",
    "http://nginx/frontend/api/sync-cache"
)


# =========================================================
# Background job — executa após o 202 ser devolvido ao cliente
# =========================================================

async def _process_job(job_id: str, payload: dict):
    """Processa um job assíncrono e notifica o frontend ao concluir."""
    try:
        # Ponto de extensão: payload["command"] pode direcionar para handlers
        # específicos (batch import, relatório PDF, sync externo, etc.).
        result = {"status": "concluido", "job_id": job_id}
        await notify_frontend_job_completed(job_id, result)
    except Exception as exc:
        await notify_frontend_job_completed(job_id, {"status": "erro", "detail": str(exc)})


# =========================================================
# INBOUND: Receive FROM Frontend
# =========================================================

@router.post("/tasks/process", status_code=202)
async def process_task_async(
    payload: dict,
    background_tasks: BackgroundTasks,
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """
    RECEIVE from Frontend: Dispara operações pesadas de forma assíncrona (batch, relatórios).
    Retorna 202 Accepted imediatamente — o processamento ocorre em background via FastAPI BackgroundTasks.
    O job_id é usado pelo frontend para rastrear o estado via webhook de notificação.
    """
    job_id = str(uuid4())
    background_tasks.add_task(_process_job, job_id, payload)
    return JSONResponse(
        status_code=202,
        content={"message": "Job aceito. Processamento em background iniciado.", "job_id": job_id},
    )


# =========================================================
# OUTBOUND: Send TO Frontend (chamada interna server-to-server)
# =========================================================

async def notify_frontend_job_completed(job_id: str, result: dict):
    """
    SEND to Frontend: Notifica o NodeJS que um job assíncrono foi concluído.
    Chamada interna entre microsserviços via Nginx — nunca exposta ao cliente final.
    """
    await _http_client.post(
        FRONTEND_WEBHOOK_URL,
        json={"job_id": job_id, "result": result},
        headers={"X-Internal-Source": "backend-service"},
    )


async def push_tasks_to_frontend(tasks: list):
    """
    SEND to Frontend: Envia tarefas atualizadas para o frontend sincronizar cache Redis.
    """
    await _http_client.post(
        FRONTEND_SYNC_URL,
        json={"message": "tasks_updated", "tasks": tasks},
        headers={"X-Internal-Source": "backend-service"},
    )
