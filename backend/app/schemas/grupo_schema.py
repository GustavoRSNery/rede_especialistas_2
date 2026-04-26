from pydantic import BaseModel
from typing import Optional


class GrupoInbound(BaseModel):
    nome:  str
    cor:   Optional[str] = "default"
    ordem: Optional[int] = 0


class GrupoUpdateInbound(BaseModel):
    nome:  Optional[str] = None
    cor:   Optional[str] = None
    ordem: Optional[int] = None
