from pydantic import BaseModel
from typing import Optional


class BoardInbound(BaseModel):
    nome:      str
    descricao: Optional[str] = None


class BoardUpdateInbound(BaseModel):
    nome:      Optional[str] = None
    descricao: Optional[str] = None
