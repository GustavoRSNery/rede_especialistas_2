import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiService';
import { QuadroDTO } from '../dto/QuadroDTO';

/**
 * useQuadros — Gerencia a lista de quadros de um board.
 * @param {string|null} boardId — ID do board pai
 * Retorna: { quadros, loading, error, fetchQuadros, createQuadro, updateQuadro, removeQuadro }
 */
export function useQuadros(boardId) {
  const [quadros, setQuadros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchQuadros = useCallback(async () => {
    if (!boardId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getQuadros(boardId);
      setQuadros(data.filter((q) => !q.is_deleted));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => { fetchQuadros(); }, [fetchQuadros]);

  const createQuadro = useCallback(async (dto) => {
    if (!boardId) return;
    setLoading(true);
    setError(null);
    try {
      const created = await apiClient.createQuadro(boardId, dto.toPayload());
      setQuadros((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  const updateQuadro = useCallback(async (quadroId, dto) => {
    try {
      await apiClient.updateQuadro(quadroId, dto.toPayload());
      setQuadros((prev) =>
        prev.map((q) => (q.id === quadroId ? new QuadroDTO({ ...q, ...dto }) : q))
      );
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const removeQuadro = useCallback(async (quadroId) => {
    try {
      await apiClient.deleteQuadro(quadroId);
      setQuadros((prev) => prev.filter((q) => q.id !== quadroId));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { quadros, loading, error, fetchQuadros, createQuadro, updateQuadro, removeQuadro };
}
