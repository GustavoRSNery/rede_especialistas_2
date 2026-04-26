import pytest
from unittest.mock import Mock
from uuid import uuid4

from backend.app.core.use_cases import TaskUseCase
from backend.app.core.entities.task import TaskEntity
from backend.app.core.enums import TaskStatus

def test_usecase_create_task_applies_domain_rules():
    """Testa se o caso de uso chama o repositório corretamente após validar regras do domínio."""
    mock_repo = Mock()
    use_case = TaskUseCase(mock_repo)
    
    result = use_case.handle_create_new_task({"titulo": "Nova", "descricao": "Desc"})
    
    assert mock_repo.create_task_in_db.called
    assert result.titulo == "Nova"
    assert result.is_deleted is False

def test_usecase_soft_delete_prevents_hard_delete():
    """Testa se o caso de uso de deleção apenas muda a flag e dispara o UPDATE, nunca DELETE."""
    mock_repo = Mock()
    use_case = TaskUseCase(mock_repo)
    task_id = uuid4()
    
    use_case.handle_soft_delete(task_id)
    
    assert mock_repo.update_task_flag_in_db.called
    assert getattr(mock_repo, 'delete_task_in_db', None) is None # Garante que não existe hard delete no contrato

