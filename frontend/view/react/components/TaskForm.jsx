import React, { useState } from 'react';
import { TaskDTO } from '../dto/TaskDTO';

/**
 * TaskForm — Componente de formulário de criação de tarefa
 * Responsabilidade única: coletar, validar e submeter dados de uma nova tarefa.
 */
export function TaskForm({ onSubmit, onCancel, loading }) {
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [status, setStatus] = useState('pendente');
  const [errors, setErrors] = useState({});

  function validate() {
    const errs = {};
    if (!titulo.trim()) errs.titulo = 'O título é obrigatório.';
    if (!descricao.trim()) errs.descricao = 'A descrição é obrigatória.';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    const dto = new TaskDTO({ titulo, descricao, status });
    await onSubmit(dto);
  }

  return (
    <main className="form-container">
      <form className="task-form" onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="titulo" className="form-label">
            Título <span className="required">*</span>
          </label>
          <input
            id="titulo"
            type="text"
            className="form-input"
            placeholder="Descreva o título da tarefa"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            maxLength={120}
          />
          <span className="form-error">{errors.titulo}</span>
        </div>

        <div className="form-group">
          <label htmlFor="descricao" className="form-label">
            Descrição <span className="required">*</span>
          </label>
          <textarea
            id="descricao"
            className="form-input form-input--textarea"
            placeholder="Descreva os detalhes da tarefa"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={5}
          />
          <span className="form-error">{errors.descricao}</span>
        </div>

        <div className="form-group">
          <label htmlFor="status" className="form-label">Status</label>
          <select
            id="status"
            className="form-input form-input--select"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="pendente">Pendente</option>
            <option value="concluida">Concluída</option>
          </select>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn--secondary" onClick={onCancel}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar Tarefa'}
          </button>
        </div>
      </form>
    </main>
  );
}
