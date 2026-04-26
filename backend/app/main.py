from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import api, webhook

app = FastAPI(title="Backend Central - Gerenciador de Tarefas")

# CORS: Aceita origem apenas do Nginx Gateway. Nunca origens externas diretas.
# O frontend acessa via Nginx (/backend/api/), e não diretamente na porta 8000.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost", "http://nginx"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Idempotency-Key", "X-Nonce", "Content-Type"],
)

# Rotas do microsserviço: CRUD Síncrono + Webhooks Assíncronos
app.include_router(api.router, prefix="/api", tags=["API Síncrona - CRUD Tarefas"])
app.include_router(webhook.router, prefix="/webhook", tags=["Webhooks - Processos Assíncronos"])

@app.get("/health")
async def health_check():
    """Health check para Docker e Nginx confirmarem que o container está vivo."""
    return {"status": "ok", "service": "backend"}
