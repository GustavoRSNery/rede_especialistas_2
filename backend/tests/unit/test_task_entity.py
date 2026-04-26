import pytest
from uuid import uuid4
from datetime import datetime

from backend.app.core.entities.task import TaskEntity
from backend.app.core.enums import TaskStatus

def test_task_creation_entity_validations():
    """Testa se a entidade raiz do Core da aplicação está garantindo a saúde dos dados."""
    task = TaskEntity(titulo="Tarefa TDD", descricao="Descrição", status=TaskStatus.PENDENTE)
    
    assert task.id is not None
    assert getattr(task, 'is_deleted') is False
    assert task.criado_em is not None
    assert task.update_at is not None

def test_task_soft_delete_preserves_object_but_flags():
    """Garante a regra vital: As tarefas não vão apagar, apenas receber flag is_deleted."""
    task = TaskEntity(titulo="A apagar", descricao="...")
    task.soft_delete()
    
    assert getattr(task, 'is_deleted') is True
    assert getattr(task, 'status') == TaskStatus.PENDENTE # Não pode mudar status geral

