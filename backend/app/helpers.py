from uuid import UUID
from fastapi import HTTPException


def require_security_headers(idempotency_key: str, x_nonce: str) -> None:
    """Garante que toda mutação traga os headers obrigatórios (Idempotência + Nonce)."""
    if not idempotency_key or not x_nonce:
        raise HTTPException(
            status_code=400,
            detail="Headers Idempotency-Key e X-Nonce são obrigatórios",
        )


def serialize(obj: dict) -> dict:
    """Converte UUID e datetime para tipos JSON-safe."""
    result = {}
    for k, v in obj.items():
        if hasattr(v, "isoformat"):
            result[k] = v.isoformat()
        elif isinstance(v, UUID):
            result[k] = str(v)
        else:
            result[k] = v
    return result
