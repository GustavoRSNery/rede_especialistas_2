import React, { useEffect, useRef } from 'react';
import { TaskForm } from './TaskForm';

/**
 * TaskModal — Popup de criação de tarefa.
 * Fecha ao clicar fora do modal ou pressionar Escape.
 */
export function TaskModal({ open, onClose, onSubmit, loading }) {
  const overlayRef = useRef(null);

  // Fechar com Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    if (open) {
      document.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  function handleOverlayClick(e) {
    if (e.target === overlayRef.current) onClose();
  }

  return (
    <div className="modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal__header">
          <h2 className="modal__title" id="modal-title">Nova Tarefa</h2>
          <button className="btn btn--ghost modal__close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <TaskForm onSubmit={onSubmit} onCancel={onClose} loading={loading} />
      </div>
    </div>
  );
}
