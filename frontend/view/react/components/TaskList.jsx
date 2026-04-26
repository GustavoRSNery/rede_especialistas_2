import React from 'react';
import { TaskCard } from './TaskCard';

/**
 * TaskList — Componente de lista de tarefas
 * Responsabilidade única: iterar e renderizar TaskCards ou estado vazio.
 */
export function TaskList({ tasks, loading, error, onToggleStatus, onDelete }) {
  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="board-list" style={{ color: 'var(--color-danger)', padding: '16px 32px' }}>
        Erro ao carregar tarefas: {error}
      </div>
    );
  }

  if (!tasks || tasks.length === 0) {
    return (
      <div className="board-list" style={{ color: 'var(--color-text-muted)', padding: '32px' }}>
        Nenhuma tarefa encontrada.
      </div>
    );
  }

  return (
    <section className="board-list">
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onToggleStatus={onToggleStatus}
          onDelete={onDelete}
        />
      ))}
    </section>
  );
}
