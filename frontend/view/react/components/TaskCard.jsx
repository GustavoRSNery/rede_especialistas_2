import React from 'react';

/**
 * TaskCard — Componente de cartão de tarefa (Board e Quadro)
 * Responsabilidade única: exibir os dados de uma task e expor ações.
 */
export function TaskCard({ task, onToggleStatus, onDelete }) {
  const isConcluida = task.status === 'concluida';
  const createdAt = task.criado_em
    ? new Date(task.criado_em).toLocaleDateString('pt-BR')
    : '—';

  return (
    <div className="task-card">
      <div className="task-card__body">
        <h3 className={`task-card__title${isConcluida ? ' task-card__title--concluida' : ''}`}>
          {task.titulo}
        </h3>
        <p className="task-card__description">{task.descricao}</p>
        <div className="task-card__meta">
          <span className={`badge badge--${task.status}`}>
            <span className={`status-dot status-dot--${task.status}`} />
            {isConcluida ? 'Concluída' : 'Pendente'}
          </span>
          <span>Criada em {createdAt}</span>
        </div>
      </div>

      <div className="task-card__actions">
        <button
          className={`btn btn--secondary`}
          onClick={() => onToggleStatus(task)}
          title={isConcluida ? 'Marcar como pendente' : 'Marcar como concluída'}
        >
          {isConcluida ? '↩ Reabrir' : '✓ Concluir'}
        </button>
        <button
          className="btn btn--danger"
          onClick={() => onDelete(task.id)}
          title="Remover tarefa"
        >
          Excluir
        </button>
      </div>
    </div>
  );
}
