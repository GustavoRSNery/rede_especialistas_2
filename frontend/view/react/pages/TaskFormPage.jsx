import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../../css/form.css';
import { useTasks } from '../hooks/useTasks';
import { TaskForm } from '../components/TaskForm';

/**
 * TaskFormPage — Página de criação de nova tarefa.
 * Lazy loaded: só é baixado quando o usuário navega para /tasks/new.
 */
export default function TaskFormPage() {
  const { createTask, loading } = useTasks();
  const navigate = useNavigate();

  async function handleSubmit(dto) {
    await createTask(dto);
    navigate('/board');
  }

  return (
    <div>
      <header className="form-header">
        <nav className="breadcrumb">
          <a href="/">Início</a>
          <span>/</span>
          <a href="/board">Board</a>
          <span>/</span>
          <span>Nova Tarefa</span>
        </nav>
        <h1>Criar Nova Tarefa</h1>
      </header>

      <TaskForm
        onSubmit={handleSubmit}
        onCancel={() => navigate('/board')}
        loading={loading}
      />
    </div>
  );
}
