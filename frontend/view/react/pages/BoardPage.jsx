import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import '../../css/board.css';
import { useQuadro } from '../hooks/useQuadro';
import { TaskModal } from '../components/TaskModal';
import { GrupoDTO } from '../dto/GrupoDTO';
import { TaskDTO } from '../dto/TaskDTO';

/**
 * BoardPage — Quadro com grupos de atividades (tabela estilo Monday.com).
 * Rota: /quadro/:quadroId
 * Lazy loaded: só é baixado quando o usuário navega para o quadro.
 */

const COR_OPTIONS = [
  { value: 'pendente',  label: 'Azul'     },
  { value: 'concluida', label: 'Verde'    },
  { value: 'danger',    label: 'Vermelho' },
  { value: 'warning',   label: 'Amarelo'  },
  { value: 'default',   label: 'Cinza'    },
];

function StatusBadge({ status }) {
  const map = {
    pendente:  { label: 'Pendente',  cls: 'badge badge--warning' },
    concluida: { label: 'Concluída', cls: 'badge badge--success' },
  };
  const b = map[status] || { label: status, cls: 'badge' };
  return <span className={b.cls}>{b.label}</span>;
}

export default function BoardPage() {
  const { quadroId } = useParams();

  const {
    grupos, tasksByGrupo, loading, error,
    createGrupo, removeGrupo,
    createTask, toggleTask, removeTask,
  } = useQuadro(quadroId);

  // --- Modal de tarefa ---
  const [modalOpen, setModalOpen]         = useState(false);
  const [modalLoading, setModalLoading]   = useState(false);
  const [activeGrupoId, setActiveGrupoId] = useState(null);

  // --- Expansão dos grupos ---
  const [expanded, setExpanded] = useState({});
  useEffect(() => {
    if (grupos.length > 0) {
      setExpanded((prev) => {
        const next = { ...prev };
        grupos.forEach((g) => { if (next[g.id] === undefined) next[g.id] = true; });
        return next;
      });
    }
  }, [grupos]);

  // --- Inline: criar novo grupo ---
  const [addingGroup, setAddingGroup]   = useState(false);
  const [groupName, setGroupName]       = useState('');
  const [groupCor, setGroupCor]         = useState('default');
  const [groupLoading, setGroupLoading] = useState(false);
  const groupInputRef = useRef(null);
  useEffect(() => { if (addingGroup) groupInputRef.current?.focus(); }, [addingGroup]);

  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!groupName.trim()) return;
    setGroupLoading(true);
    try {
      await createGrupo(new GrupoDTO({ nome: groupName.trim(), cor: groupCor, ordem: grupos.length }));
      setGroupName('');
      setGroupCor('default');
      setAddingGroup(false);
    } finally {
      setGroupLoading(false);
    }
  }

  function openModal(grupoId) {
    setActiveGrupoId(grupoId);
    setModalOpen(true);
  }

  async function handleCreateTask(dto) {
    setModalLoading(true);
    try {
      await createTask(activeGrupoId, new TaskDTO({ ...dto, grupo_id: activeGrupoId }));
      setModalOpen(false);
    } finally {
      setModalLoading(false);
    }
  }

  if (!quadroId) {
    return (
      <div style={{ padding: 48, color: 'var(--color-text-muted)', textAlign: 'center' }}>
        <p style={{ marginBottom: 12 }}>Nenhum quadro selecionado.</p>
        <p>Use o menu lateral para selecionar ou criar um quadro.</p>
      </div>
    );
  }

  if (loading) return <div className="spinner-wrapper"><div className="spinner" /></div>;
  if (error)   return <p style={{ color: 'var(--color-danger)', padding: 32 }}>Erro: {error}</p>;

  return (
    <div>
      <header className="board-header">
        <h1>Quadro</h1>
        <button className="btn btn--primary" onClick={() => setAddingGroup(true)}>+ Novo grupo</button>
      </header>

      <div className="board-table-wrapper">
        {grupos.length === 0 && !addingGroup && (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
            <p style={{ marginBottom: 16 }}>Nenhum grupo de atividades ainda.</p>
            <button className="btn btn--primary" onClick={() => setAddingGroup(true)}>
              + Criar primeiro grupo
            </button>
          </div>
        )}

        {grupos.map((grupo) => {
          const groupTasks = tasksByGrupo[grupo.id] || [];
          const isOpen = expanded[grupo.id] ?? true;

          return (
            <section key={grupo.id} className="board-section">
              <div
                className="board-section__header"
                onClick={() => setExpanded((prev) => ({ ...prev, [grupo.id]: !isOpen }))}
                role="button"
                aria-expanded={isOpen}
              >
                <span className={`board-section__color-bar board-section__color-bar--${grupo.cor}`} />
                <span className="board-section__chevron">{isOpen ? '▾' : '▸'}</span>
                <span className="board-section__title">{grupo.nome}</span>
                <span className="board-section__count">{groupTasks.length}</span>
                <button
                  className="btn btn--ghost"
                  style={{ marginLeft: 'auto', fontSize: '0.75rem', padding: '2px 8px', opacity: 0.6 }}
                  onClick={(e) => { e.stopPropagation(); removeGrupo(grupo.id); }}
                  aria-label="Remover grupo"
                >
                  ✕
                </button>
              </div>

              {isOpen && (
                <table className="board-table">
                  <thead className="board-table__head">
                    <tr>
                      <th style={{ width: 32 }} />
                      <th>Tarefa</th>
                      <th style={{ width: 130 }}>Status</th>
                      <th style={{ width: 120 }}>Criado em</th>
                      <th style={{ width: 80 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {groupTasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ padding: '10px 16px', color: 'var(--color-text-muted)', fontSize: '0.84rem' }}>
                          Nenhuma tarefa neste grupo.
                        </td>
                      </tr>
                    ) : (
                      groupTasks.map((task) => (
                        <tr key={task.id} className="board-table__row">
                          <td>
                            <input
                              type="checkbox"
                              className="monday-checkbox"
                              checked={task.status === 'concluida'}
                              onChange={() => toggleTask(grupo.id, task)}
                              aria-label="Marcar como concluída"
                            />
                          </td>
                          <td>
                            <span className="task-row__title">
                              <span className="task-row__title-icon">&#9654;</span>
                              <span className={task.status === 'concluida' ? 'task-row__name--concluida' : ''}>
                                {task.titulo}
                              </span>
                            </span>
                          </td>
                          <td><StatusBadge status={task.status} /></td>
                          <td style={{ color: 'var(--color-text-muted)', fontSize: '0.82rem' }}>
                            {task.criado_em ? new Date(task.criado_em).toLocaleDateString('pt-BR') : '—'}
                          </td>
                          <td>
                            <div className="task-row__actions">
                              <button
                                className="btn btn--ghost"
                                style={{ fontSize: '0.78rem', padding: '3px 8px' }}
                                onClick={() => removeTask(grupo.id, task.id)}
                                aria-label="Excluir tarefa"
                              >
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                    <tr
                      className="board-table__add-row"
                      onClick={() => openModal(grupo.id)}
                      role="button"
                    >
                      <td colSpan={5}>+ Adicionar tarefa</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </section>
          );
        })}

        {/* Formulário inline para novo grupo */}
        {addingGroup && (
          <form
            className="board-section"
            onSubmit={handleCreateGroup}
            style={{ padding: '12px 16px', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}
          >
            <input
              ref={groupInputRef}
              className="form-input"
              placeholder="Nome do grupo"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              style={{ flex: '1 1 180px', minWidth: 0 }}
              disabled={groupLoading}
            />
            <select
              className="form-input form-input--select"
              value={groupCor}
              onChange={(e) => setGroupCor(e.target.value)}
              style={{ width: 130 }}
              disabled={groupLoading}
            >
              {COR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button type="submit" className="btn btn--primary" disabled={groupLoading || !groupName.trim()}>
              {groupLoading ? '...' : 'Criar'}
            </button>
            <button
              type="button"
              className="btn btn--ghost"
              onClick={() => { setAddingGroup(false); setGroupName(''); }}
              disabled={groupLoading}
            >
              Cancelar
            </button>
          </form>
        )}
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
