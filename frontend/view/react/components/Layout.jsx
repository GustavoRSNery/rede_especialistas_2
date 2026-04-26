import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../../css/layout.css';
import { useBoards } from '../hooks/useBoards';
import { useQuadros } from '../hooks/useQuadros';
import { BoardDTO } from '../dto/BoardDTO';
import { QuadroDTO } from '../dto/QuadroDTO';

/** Menu de contexto (clique direito) */
function ContextMenu({ x, y, items, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  return (
    <ul
      ref={ref}
      style={{
        position: 'fixed',
        top: y,
        left: x,
        zIndex: 9998,
        background: 'var(--color-surface, #fff)',
        border: '1px solid var(--color-border, #ddd)',
        borderRadius: 6,
        padding: '4px 0',
        margin: 0,
        listStyle: 'none',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
        minWidth: 160,
      }}
    >
      {items.map((item) => (
        <li key={item.label}>
          <button
            onClick={() => { item.action(); onClose(); }}
            style={{
              width: '100%',
              textAlign: 'left',
              background: 'none',
              border: 'none',
              padding: '7px 16px',
              cursor: 'pointer',
              fontSize: '0.85rem',
              color: item.danger ? 'var(--color-danger, #c0392b)' : 'inherit',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-bg, #f5f5f5)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            {item.icon && <span style={{ marginRight: 8 }}>{item.icon}</span>}
            {item.label}
          </button>
        </li>
      ))}
    </ul>
  );
}

/** Modal de confirmação para operações destrutivas */
function ConfirmModal({ open, title, message, onConfirm, onCancel, loading }) {
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.45)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--color-surface, #fff)',
          borderRadius: 8,
          padding: '28px 32px',
          maxWidth: 400,
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginBottom: 10, color: 'var(--color-danger, #c0392b)' }}>{title}</h3>
        <p style={{ marginBottom: 24, color: 'var(--color-text-muted, #666)', lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button className="btn btn--ghost" onClick={onCancel} disabled={loading}>
            Cancelar
          </button>
          <button className="btn btn--danger" onClick={onConfirm} disabled={loading}>
            {loading ? 'Excluindo…' : 'Confirmar exclusão'}
          </button>
        </div>
      </div>
    </div>
  );
}

const BOARD_LIMIT = 10;

/**
 * BoardItem — Exibe um board com seus quadros no sidebar.
 * Cada instância tem seu próprio useQuadros para evitar chamadas com hook em loop.
 */
function BoardItem({ board, removeBoard }) {
  const navigate = useNavigate();
  const { quadros, createQuadro } = useQuadros(board.id);

  const [addingQuadro, setAddingQuadro] = useState(false);
  const [quadroName, setQuadroName]     = useState('');
  const [confirmOpen, setConfirmOpen]   = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [ctxMenu, setCtxMenu]           = useState(null);

  async function handleDeleteBoard() {
    setDeleteLoading(true);
    try {
      await removeBoard(board.id);
      setConfirmOpen(false);
      navigate('/');
    } finally {
      setDeleteLoading(false);
    }
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
    <nav className="sidebar__nav">
      {/* Nome do board */}
      <div
        className="sidebar__nav-item"
        style={{ fontWeight: 600, color: 'rgba(255,255,255,0.85)', cursor: 'default', gap: 6 }}
      >
        <span className="sidebar__nav-icon" style={{ fontSize: '0.85rem' }}>🗂</span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {board.nome}
        </span>
        <button
          className="btn btn--ghost"
          style={{ fontSize: '0.7rem', padding: '1px 6px', opacity: 0.7 }}
          onClick={(e) => { e.stopPropagation(); setAddingQuadro((v) => !v); }}
          title="Novo quadro"
        >
          +
        </button>
        <button
          className="btn btn--ghost"
          style={{ fontSize: '1rem', padding: '0 4px', opacity: 0.7, lineHeight: 1 }}
          onClick={(e) => { e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
          title="Opções do board"
        >
          ⋮
        </button>
      </div>

      {/* Quadros do board */}
      {quadros.map((q) => (
        <NavLink
          key={q.id}
          to={`/quadro/${q.id}`}
          className={({ isActive }) =>
            isActive ? 'sidebar__nav-item sidebar__nav-item--active' : 'sidebar__nav-item'
          }
          style={{ paddingLeft: 28 }}
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

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          onClose={() => setCtxMenu(null)}
          items={[{ label: 'Excluir board', icon: '🗑', danger: true, action: () => setConfirmOpen(true) }]}
        />
      )}

      <ConfirmModal
        open={confirmOpen}
        title="Excluir board?"
        message={`Tem certeza que deseja excluir o board "${board.nome}"? Todos os quadros e grupos associados serão removidos. Essa ação não pode ser desfeita.`}
        onConfirm={handleDeleteBoard}
        onCancel={() => setConfirmOpen(false)}
        loading={deleteLoading}
      />
    </nav>
  );
}

/**
 * SidebarBoards — Lista todos os boards com seus quadros.
 * Limita criação a BOARD_LIMIT boards; oculta o botão + ao atingir o limite.
 */
function SidebarBoards() {
  const { boards, createBoard, removeBoard } = useBoards();
  const atLimit = boards.length >= BOARD_LIMIT;

  const [addingBoard, setAddingBoard] = useState(false);
  const [boardName, setBoardName]     = useState('');

  async function handleCreateBoard(e) {
    e.preventDefault();
    if (!boardName.trim() || atLimit) return;
    try {
      await createBoard(new BoardDTO({ nome: boardName.trim() }));
      setBoardName('');
      setAddingBoard(false);
    } catch {
      // mantém form aberto para o usuário tentar de novo
    }
  }

  return (
    <div className="sidebar__section">
      <p className="sidebar__section-label" style={{ display: 'flex', alignItems: 'center' }}>
        BOARD
        {!atLimit && (
          <button
            className="btn btn--ghost"
            style={{ marginLeft: 'auto', fontSize: '0.7rem', padding: '1px 6px', opacity: 0.7 }}
            onClick={() => setAddingBoard((v) => !v)}
            title="Novo board"
          >
            +
          </button>
        )}
      </p>

      {boards.length === 0 && !addingBoard && (
        <nav className="sidebar__nav">
          <div
            className="sidebar__nav-item"
            style={{ cursor: 'pointer', opacity: 0.6 }}
            onClick={() => setAddingBoard(true)}
          >
            <span className="sidebar__nav-icon">+</span>
            Criar board
          </div>
        </nav>
      )}

      {addingBoard && !atLimit && (
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

      {boards.map((board) => (
        <BoardItem key={board.id} board={board} removeBoard={removeBoard} />
      ))}
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
