import React from 'react';

/**
 * TaskFilter — Componente de filtro por status
 * Responsabilidade única: renderizar e disparar mudança de filtro.
 */
export function TaskFilter({ currentFilter, onFilterChange }) {
  const options = [
    { value: 'todos', label: 'Todos' },
    { value: 'pendente', label: 'Pendente' },
    { value: 'concluida', label: 'Concluída' },
  ];

  return (
    <section className="board-filters">
      {options.map((opt) => (
        <button
          key={opt.value}
          className={`filter-btn${currentFilter === opt.value ? ' filter-btn--active' : ''}`}
          onClick={() => onFilterChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </section>
  );
}
