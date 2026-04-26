import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../../css/layout.css';
import { useBoards } from '../hooks/useBoards';
import { useQuadros } from '../hooks/useQuadros';
import { BoardDTO } from '../dto/BoardDTO';
import { QuadroDTO } from '../dto/QuadroDTO';

/**
 * SidebarBoards — Seção de boards e quadros no sidebar.
 * Exibe a lista de quadros do primeiro board e permite criar novos.
 */
function SidebarBoards() {
  const navigate = useNavigate();

  const { boards, createBoard }             = useBoards();
  const activeBoard                         = boards[0] ?? null;
  const { quadros, createQuadro }           = useQuadros(activeBoard?.id);

  const [addingBoard, setAddingBoard]       = useState(false);
  const [boardName, setBoardName]           = useState('');
  const [addingQuadro, setAddingQuadro]     = useState(false);
  const [quadroName, setQuadroName]         = useState('');

  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!boardName.trim()) return;
    await createBoard(new BoardDTO({ nome: boardName.trim() }));
    setBoardName('');
    setAddingBoard(false);
  }

  async function handleCreateQuadro(e) {
    e.preventDefault();
    if (!quadroName.trim()) return;
    const created = await createQuadro(new QuadroDTO({ nome: quadroName.trim() }));
    setQuadroName('');
    setAddingQuadro(false);
    if (created?.id) navigate(`/quadro/${created.id}`);
  }

  return (
    <div className="sidebar__section">
      <p className="sidebar__section-label">
        BOARD
        {activeBoard && (
          <button
            className="btn btn--ghost"
            style={{ fontSize: '0.7rem', padding: '1px 5px', marginLeft: 'auto', opacity: 0.7 }}
            onClick={() => setAddingQuadro((v) => !v)}
            title="Novo quadro"
          >
            +
          </button>
        )}
      </p>

      {/* Nenhum board ainda */}
      {boards.length === 0 && !addingBoard && (
        <button
          className="sidebar__nav-item"
          style={{ width: '100%', textAlign: 'left', cursor: 'pointer', opacity: 0.7, fontSize: '0.8rem' }}
          onClick={() => setAddingBoard(true)}
        >
          <span className="sidebar__nav-icon">+</span>
          Criar board
        </button>
      )}

      {addingBoard && (
        <form onSubmit={handleCreateBoard} style={{ padding: '4px 8px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <input
            autoFocus
            className="form-input"
            placeholder="Nome do board"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            style={{ fontSize: '0.8rem', padding: '4px 8px' }}
          />
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="submit" className="btn btn--primary" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>Criar</button>
            <button type="button" className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => setAddingBoard(false)}>✕</button>
          </div>
        </form>
      )}

      {/* Lista de quadros do board ativo */}
      <nav className="sidebar__nav">
        {quadros.map((q) => (
          <NavLink
            key={q.id}
            to={`/quadro/${q.id}`}
            className={({ isActive }) =>
              isActive ? 'sidebar__nav-item sidebar__nav-item--active' : 'sidebar__nav-item'
            }
          >
            <span className="sidebar__nav-icon">&#9776;</span>
            {q.nome}
          </NavLink>
        ))}

        {addingQuadro && (
          <form onSubmit={handleCreateQuadro} style={{ padding: '4px 4px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <input
              autoFocus
              className="form-input"
              placeholder="Nome do quadro"
              value={quadroName}
              onChange={(e) => setQuadroName(e.target.value)}
              style={{ fontSize: '0.8rem', padding: '4px 8px' }}
            />
            <div style={{ display: 'flex', gap: 4 }}>
              <button type="submit" className="btn btn--primary" style={{ fontSize: '0.75rem', padding: '3px 10px' }}>Criar</button>
              <button type="button" className="btn btn--ghost" style={{ fontSize: '0.75rem', padding: '3px 8px' }} onClick={() => setAddingQuadro(false)}>✕</button>
            </div>
          </form>
        )}
      </nav>
    </div>
  );
}

export default function Layout({ children }) {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <NavLink to="/" className="sidebar__logo">
          <div className="sidebar__logo-icon">T</div>
          <span className="sidebar__logo-name">TaskManager</span>
        </NavLink>

        <div className="sidebar__section">
          <p className="sidebar__section-label">Menu</p>
          <nav className="sidebar__nav">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? 'sidebar__nav-item sidebar__nav-item--active'
                  : 'sidebar__nav-item'
              }
            >
              <span className="sidebar__nav-icon">&#8962;</span>
              Home
            </NavLink>

            <NavLink
              to="/kanban"
              className={({ isActive }) =>
                isActive
                  ? 'sidebar__nav-item sidebar__nav-item--active'
                  : 'sidebar__nav-item'
              }
            >
              <span className="sidebar__nav-icon">&#9638;</span>
              Kanban
            </NavLink>
          </nav>
        </div>

        <SidebarBoards />

        <div className="sidebar__footer">
          <div
            className="sidebar__nav-item"
            style={{ fontSize: '0.72rem', cursor: 'default' }}
          >
            <span className="sidebar__nav-icon">&#9881;</span>
            v1.0.0
          </div>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
