import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_tasks_requires_security_headers():
    """Testa a integração entre o middleware HTTP e as rotas, exigindo Idempotency-Key e Nonce."""
    response = client.post("/tasks", json={"titulo": "Ação"})
    assert response.status_code == 400 # Faltam headers
    
    response_valid = client.post(
        "/tasks", 
        json={"titulo": "Ação", "descricao": "Segura"},
        headers={"Idempotency-Key": "chave-123", "X-Nonce": "uuid-v4"}
    )
    assert response_valid.status_code == 201

def test_api_webhook_returns_202_accepted():
    """Testa se a rota de webhook assíncrono retorna imediatamente 202 Accepted sem prender o front."""
    response = client.post("/webhook/process-reports")
    assert response.status_code == 202
    assert "job_id" in response.json()

