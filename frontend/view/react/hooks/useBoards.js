import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiService';
import { BoardDTO } from '../dto/BoardDTO';

/**
 * useBoards — Gerencia a lista de boards.
 * Retorna: { boards, loading, error, fetchBoards, createBoard, updateBoard, removeBoard }
 */
export function useBoards() {
  const [boards, setBoards]   = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const fetchBoards = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getBoards();
      setBoards(data.filter((b) => !b.is_deleted));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBoards(); }, [fetchBoards]);

  const createBoard = useCallback(async (dto) => {
    setLoading(true);
    setError(null);
    try {
      const created = await apiClient.createBoard(dto.toPayload());
      setBoards((prev) => [...prev, created]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBoard = useCallback(async (id, dto) => {
    try {
      await apiClient.updateBoard(id, dto.toPayload());
      setBoards((prev) =>
        prev.map((b) => (b.id === id ? new BoardDTO({ ...b, ...dto }) : b))
      );
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const removeBoard = useCallback(async (id) => {
    try {
      await apiClient.deleteBoard(id);
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return { boards, loading, error, fetchBoards, createBoard, updateBoard, removeBoard };
}
