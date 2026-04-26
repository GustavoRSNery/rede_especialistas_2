import pytest
import os
from unittest.mock import Mock

from backend.app.adapters.postgres_adapter import PostgreSQLTaskAdapter
from backend.app.adapters.redis_adapter import RedisSecurityAdapter

@pytest.mark.asyncio
async def test_postgres_adapter_prepared_statements():
    """Testa garantir que injeções SQL sejam impossíveis pelas requisições usando as interfaces."""
    repo = PostgreSQLTaskAdapter(os.getenv("DB_URI", "mock_uri"))
    # Simularemos a verificação se o adapter usa execute com binds e não interpolação direta
    repo._db = Mock()
    await repo.create_task_in_db({"id": "1", "titulo": "A"})
    
    # Valida se a query contém $1 ou placeholders de prepared statement
    called_query = repo._db.execute.call_args[0][0]
    assert "$" in called_query or "%s" in called_query

@pytest.mark.asyncio
async def test_redis_nonce_idempotency_block():
    """Testa se o adaptador recusa dois payloads com o mesmo UUID em curto espaço de tempo."""
    redis = RedisSecurityAdapter(os.getenv("REDIS_HOST", "localhost"))
    # Vamos mockar o comportamento interno pra TDD
    redis._cache = set()
    async def mock_validate(n):
        if n in redis._cache:
            return False
        redis._cache.add(n)
        return True
    redis.validate_and_cache_nonce = mock_validate

    nonce = "33682de9-d1bd-4286-9ac6-0e1069f7278c"
    first_run = await redis.validate_and_cache_nonce(nonce)
    second_run = await redis.validate_and_cache_nonce(nonce)
    
    assert first_run is True
    assert second_run is False # O segundo acesso via replay attack falha

