import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '../services/apiService';
import { TaskDTO } from '../dto/TaskDTO';

/**
 * useTasks — Custom Hook de Tarefas
 *
 * Responsabilidade única (SOLID — SRP):
 * Gerenciar todo o estado e ciclo de vida das tarefas,
 * isolando a UI de qualquer detalhe de HTTP ou DTO.
 */
export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('todos'); // 'todos' | 'pendente' | 'concluida'

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.getTasks();
      // Oculta tasks com is_deleted=true (soft-delete)
      setTasks(data.filter((t) => !t.is_deleted));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = useCallback(async (dto) => {
    setLoading(true);
    setError(null);
    try {
      const created = await apiClient.createTask(dto.toPayload());
      setTasks((prev) => [created, ...prev]);
      return created;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleStatus = useCallback(async (task) => {
    const nextStatus = task.status === 'pendente' ? 'concluida' : 'pendente';
    const updated = new TaskDTO({ ...task, status: nextStatus });
    try {
      await apiClient.updateTask(task.id, updated.toPayload());
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? new TaskDTO({ ...t, status: nextStatus }) : t))
      );
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const removeTask = useCallback(async (taskId) => {
    try {
      await apiClient.deleteTask(taskId);
      // Oculta localmente — o backend aplicou soft-delete
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const filteredTasks = filter === 'todos'
    ? tasks
    : tasks.filter((t) => t.status === filter);

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    error,
    filter,
    setFilter,
    fetchTasks,
    createTask,
    toggleStatus,
    removeTask,
  };
}
