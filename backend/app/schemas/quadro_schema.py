from pydantic import BaseModel
from typing import Optional


class QuadroInbound(BaseModel):
    nome:      str
    descricao: Optional[str] = None


class QuadroUpdateInbound(BaseModel):
    nome:      Optional[str] = None
    descricao: Optional[str] = None
