import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useBoards } from '../hooks/useBoards';
import { useQuadros } from '../hooks/useQuadros';

/** Card de um board — tamanho fixo, mostra quadros abaixo */
function BoardCard({ board }) {
  const navigate = useNavigate();
  const { quadros } = useQuadros(board.id);

  return (
    <div
      style={{
        width: 240,
        flexShrink: 0,
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        padding: '20px 20px 16px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        transition: 'box-shadow 0.15s',
        cursor: 'default',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.10)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)'; }}
    >
      {/* Cabeçalho do card */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 'var(--radius)',
          background: 'var(--color-primary)', color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1rem', fontWeight: 700, flexShrink: 0,
        }}>
          {board.nome.charAt(0).toUpperCase()}
        </div>
        <span style={{
          fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {board.nome}
        </span>
      </div>

      {/* Lista de quadros */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {quadros.length === 0 && (
          <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)' }}>Nenhum quadro ainda</span>
        )}
        {quadros.map((q) => (
          <button
            key={q.id}
            onClick={() => navigate(`/quadro/${q.id}`)}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--color-surface-raised)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius)',
              padding: '6px 10px', cursor: 'pointer',
              fontSize: '0.8rem', color: 'var(--color-text)',
              textAlign: 'left', transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-primary-light)'; e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--color-surface-raised)'; e.currentTarget.style.borderColor = 'var(--color-border)'; }}
          >
            <span style={{ fontSize: '0.75rem', opacity: 0.5 }}>&#9776;</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.nome}</span>
          </button>
        ))}
      </div>

      {/* Rodapé */}
      <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid var(--color-border)', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
        {quadros.length} quadro{quadros.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}

export default function HomePage() {
  const { boards, loading } = useBoards();

  return (
    <main style={{ padding: '40px 32px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ marginBottom: 8, fontSize: '1.5rem' }}>Gerenciador de Tarefas</h1>
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.95rem' }}>
          Organize, priorize e acompanhe seu fluxo de trabalho com clareza.
        </p>
      </div>

      {/* Label */}
      <p style={{
        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
        letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 16,
      }}>
        Boards
      </p>

      {/* Grid de cards */}
      {loading && (
        <p style={{ color: 'var(--color-text-muted)' }}>Carregando…</p>
      )}

      {!loading && boards.length === 0 && (
        <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
          Nenhum board criado ainda. Use o menu lateral para criar o primeiro.
        </p>
      )}

      {!loading && boards.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {boards.map((b) => (
            <BoardCard key={b.id} board={b} />
          ))}
        </div>
      )}
    </main>
  );
}
