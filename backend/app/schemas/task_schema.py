from pydantic import BaseModel
from typing import Optional
from enum import Enum


class TaskStatus(str, Enum):
    pendente  = "pendente"
    concluida = "concluida"


class TaskInbound(BaseModel):
    titulo:   str
    descricao: str
    status:   TaskStatus = TaskStatus.pendente


class TaskUpdateInbound(BaseModel):
    titulo:    Optional[str]        = None
    descricao: Optional[str]        = None
    status:    Optional[TaskStatus] = None
