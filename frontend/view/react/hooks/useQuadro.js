import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiService';
import { GrupoDTO } from '../dto/GrupoDTO';
import { TaskDTO } from '../dto/TaskDTO';

/**
 * useQuadro — Gerencia um quadro completo: seus grupos e as tarefas por grupo.
 * @param {string|null} quadroId — ID do quadro
 * Retorna: { grupos, tasksByGrupo, loading, error, fetchAll,
 *            createGrupo, updateGrupo, removeGrupo,
 *            createTask, toggleTask, removeTask }
 */
export function useQuadro(quadroId) {
  const [grupos, setGrupos]               = useState([]);
  const [tasksByGrupo, setTasksByGrupo]   = useState({}); // { [grupoId]: TaskDTO[] }
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState(null);

  const fetchAll = useCallback(async () => {
    if (!quadroId) return;
    setLoading(true);
    setError(null);
    try {
      // Uma única chamada ao BFF → retorna quadro + grupos + tasks em cache
      const { grupos: gruposRaw, tasksByGrupo: tasksRaw } = await apiClient.getQuadroFull(quadroId);

      const activeGrupos = gruposRaw.filter((g) => !g.is_deleted);
      setGrupos(activeGrupos);

      // Filtra is_deleted nas tasks de cada grupo
      const filtered = Object.fromEntries(
        activeGrupos.map((g) => [
          g.id,
          (tasksRaw[g.id] || []).filter((t) => !t.is_deleted),
        ])
      );
      setTasksByGrupo(filtered);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [quadroId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Grupos ---

  const createGrupo = useCallback(async (dto) => {
    if (!quadroId) return;
    setError(null);
    try {
      const created = await apiClient.createGrupo(quadroId, dto.toPayload());
      setGrupos((prev) => [...prev, created]);
      setTasksByGrupo((prev) => ({ ...prev, [created.id]: [] }));
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [quadroId]);

  const updateGrupo = useCallback(async (grupoId, dto) => {
    try {
      await apiClient.updateGrupo(grupoId, dto.toPayload(), quadroId);
      setGrupos((prev) =>
        prev.map((g) => (g.id === grupoId ? new GrupoDTO({ ...g, ...dto }) : g))
      );
    } catch (err) {
      setError(err.message);
    }
  }, [quadroId]);

  const removeGrupo = useCallback(async (grupoId) => {
    try {
      await apiClient.deleteGrupo(grupoId, quadroId);
      setGrupos((prev) => prev.filter((g) => g.id !== grupoId));
      setTasksByGrupo((prev) => {
        const next = { ...prev };
        delete next[grupoId];
        return next;
      });
    } catch (err) {
      setError(err.message);
    }
  }, [quadroId]);

  // --- Tasks ---

  const createTask = useCallback(async (grupoId, dto) => {
    setError(null);
    try {
      const created = await apiClient.createTaskInGrupo(grupoId, dto.toPayload(), quadroId);
      setTasksByGrupo((prev) => ({
        ...prev,
        [grupoId]: [created, ...(prev[grupoId] || [])],
      }));
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }, [quadroId]);

  const toggleTask = useCallback(async (grupoId, task) => {
    const nextStatus = task.status === 'pendente' ? 'concluida' : 'pendente';
    try {
      await apiClient.updateTask(task.id, { titulo: task.titulo, descricao: task.descricao, status: nextStatus });
      setTasksByGrupo((prev) => ({
        ...prev,
        [grupoId]: (prev[grupoId] || []).map((t) =>
          t.id === task.id ? new TaskDTO({ ...t, status: nextStatus }) : t
        ),
      }));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const removeTask = useCallback(async (grupoId, taskId) => {
    try {
      await apiClient.deleteTask(taskId);
      setTasksByGrupo((prev) => ({
        ...prev,
        [grupoId]: (prev[grupoId] || []).filter((t) => t.id !== taskId),
      }));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  return {
    grupos,
    tasksByGrupo,
    loading,
    error,
    fetchAll,
    createGrupo,
    updateGrupo,
    removeGrupo,
    createTask,
    toggleTask,
    removeTask,
  };
}
