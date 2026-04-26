import os
import httpx
from uuid import uuid4
from fastapi import APIRouter, Header
from fastapi.responses import JSONResponse

router = APIRouter()

# Endereço do webhook listener do Frontend, roteado via Nginx (private_net)
# Configurado via .env no docker-compose. O back conhece apenas essa URL.
FRONTEND_WEBHOOK_URL = os.getenv(
    "FRONTEND_WEBHOOK_URL",
    "http://nginx/frontend/webhook/notifications"
)


# =========================================================
# INBOUND: Receive FROM Frontend
# =========================================================

@router.post("/tasks/process", status_code=202)
async def process_task_async(
    payload: dict,
    x_nonce: str = Header(..., alias="X-Nonce"),
):
    """
    RECEIVE from Frontend: Dispara operações pesadas de forma assíncrona (batch, relatórios).
    Retorna 202 Accepted imediatamente — não prende o front aguardando processamento.
    O job_id é usado pelo frontend para rastrear o estado via webhook de notificação.
    """
    job_id = str(uuid4())
    # TODO: Enfileirar job_id em Redis Queue para processamento em background
    # await redis_service.enqueue(job_id, payload)
    return JSONResponse(
        status_code=202,
        content={"message": "Job aceito. Processamento em background iniciado.", "job_id": job_id},
    )


# =========================================================
# OUTBOUND: Send TO Frontend (chamada interna server-to-server)
# =========================================================

async def notify_frontend_job_completed(job_id: str, result: dict):
    """
    SEND to Frontend: Backend notifica o microsserviço Frontend que um job assíncrono foi concluído.
    Chama o webhook listener do NodeJS via Nginx (FRONTEND_WEBHOOK_URL).
    Nunca é exposta ao cliente final — é uma chamada interna entre microsserviços.
    """
    async with httpx.AsyncClient() as client:
        await client.post(
            FRONTEND_WEBHOOK_URL,
            json={"job_id": job_id, "result": result},
            headers={"X-Internal-Source": "backend-service"},
            timeout=10.0,
        )


async def push_tasks_to_frontend(tasks: list):
    """
    SEND to Frontend: Backend envia dados de tarefas atualizados para o frontend sincronizar cache.
    Chama o endpoint /api/sync-cache do NodeJS via Nginx.
    """
    frontend_api_url = os.getenv("FRONTEND_API_URL", "http://nginx/frontend/api/sync-cache")
    async with httpx.AsyncClient() as client:
        await client.post(
            frontend_api_url,
            json={"message": "tasks_updated", "tasks": tasks},
            headers={"X-Internal-Source": "backend-service"},
            timeout=10.0,
        )
