import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../css/quadro.css';
import { useTasks } from '../hooks/useTasks';
import { TaskModal } from '../components/TaskModal';

/**
 * QuadroPage — Visão Kanban com colunas por status.
 * Lazy loaded: só é baixado quando o usuário navega para /quadro.
 */
export default function QuadroPage() {
  const { tasks, loading, error, createTask, toggleStatus, removeTask } = useTasks();
  const [modalOpen, setModalOpen]       = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  async function handleCreateTask(dto) {
    setModalLoading(true);
    try { await createTask(dto); setModalOpen(false); }
    finally { setModalLoading(false); }
  }

  const pendentes = tasks.filter((t) => t.status === 'pendente');
  const concluidas = tasks.filter((t) => t.status === 'concluida');

  if (loading) {
    return <div className="spinner-wrapper"><div className="spinner" /></div>;
  }

  if (error) {
    return <p style={{ color: 'var(--color-danger)', padding: 32 }}>Erro: {error}</p>;
  }

  return (
    <div>
      <header className="quadro-header">
        <h1>Kanban</h1>
        <nav>
          <Link to="/quadro">Ver Quadro</Link>
          <button className="btn btn--primary" onClick={() => setModalOpen(true)}>+ Nova Tarefa</button>
        </nav>
      </header>

      <div className="quadro-board">
        {/* Coluna Pendente */}
        <div className="quadro-column quadro-column--pendente">
          <h2 className="quadro-column__title">
            <span className="status-dot status-dot--pendente" />
            Pendente
            <span className="quadro-column__count">{pendentes.length}</span>
          </h2>
          <div className="quadro-column__cards">
            {pendentes.length === 0
              ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Nenhuma tarefa pendente.</p>
              : pendentes.map((task) => (
                <div key={task.id} className="quadro-card">
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', letterSpacing: 0 }}>#{task.id.slice(0, 8)}</span>
                  <h3 className="quadro-card__title">{task.titulo}</h3>
                  <p className="quadro-card__meta">{new Date(task.criado_em).toLocaleDateString('pt-BR')}</p>
                  <div className="quadro-card__actions">
                    <button className="btn btn--secondary" style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                      onClick={() => toggleStatus(task)}>✓ Concluir</button>
                    <button className="btn btn--danger" style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                      onClick={() => removeTask(task.id)}>Excluir</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>

        {/* Coluna Concluída */}
        <div className="quadro-column quadro-column--concluida">
          <h2 className="quadro-column__title">
            <span className="status-dot status-dot--concluida" />
            Concluída
            <span className="quadro-column__count">{concluidas.length}</span>
          </h2>
          <div className="quadro-column__cards">
            {concluidas.length === 0
              ? <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>Nenhuma tarefa concluída.</p>
              : concluidas.map((task) => (
                <div key={task.id} className="quadro-card">
                  <span style={{ fontSize: '0.68rem', color: 'var(--color-text-muted)', fontFamily: 'monospace', letterSpacing: 0 }}>#{task.id.slice(0, 8)}</span>
                  <h3 className="quadro-card__title" style={{ textDecoration: 'line-through', opacity: 0.6 }}>{task.titulo}</h3>
                  <p className="quadro-card__meta">{new Date(task.criado_em).toLocaleDateString('pt-BR')}</p>
                  <div className="quadro-card__actions">
                    <button className="btn btn--secondary" style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                      onClick={() => toggleStatus(task)}>↩ Reabrir</button>
                    <button className="btn btn--danger" style={{ fontSize: '0.78rem', padding: '5px 12px' }}
                      onClick={() => removeTask(task.id)}>Excluir</button>
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      <TaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreateTask}
        loading={modalLoading}
      />
    </div>
  );
}
