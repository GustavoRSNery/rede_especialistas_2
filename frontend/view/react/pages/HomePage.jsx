import React from 'react';
import { Link } from 'react-router-dom';

/**
 * HomePage — Página inicial / Landing Page
 */
export default function HomePage() {
  return (
    <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 32px', textAlign: 'center' }}>
      <h1 style={{ marginBottom: 16 }}>Gerenciador de Tarefas</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 40, fontSize: '1.05rem' }}>
        Organize, priorize e acompanhe seu fluxo de trabalho com clareza.
      </p>
      <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
        <Link to="/quadro" className="btn btn--primary">Ver Quadro</Link>
        <Link to="/kanban" className="btn btn--secondary">Ver Kanban</Link>
      </div>
    </main>
  );
}
