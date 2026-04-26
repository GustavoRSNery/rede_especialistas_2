import { v4 as uuidv4 } from 'uuid';
import { TaskDTO }   from '../dto/TaskDTO';
import { BoardDTO }  from '../dto/BoardDTO';
import { QuadroDTO } from '../dto/QuadroDTO';
import { GrupoDTO }  from '../dto/GrupoDTO';
import { enqueueMutation } from './queueService';
import { getSessionId }   from './sessionService';

/**
 * ApiClient — Adaptador HTTP do Frontend
 *
 * Responsabilidades:
 * - Leituras (GET): chamadas diretas ao backend via VITE_BACKEND_API_URL
 * - Mutações (POST/PUT/DELETE): enfileiradas no Redis via BFF (/api/queue/enqueue)
 *   garantindo que o backend processe um comando por vez sem sobrecarga
 * - Injetar automaticamente X-Nonce e Idempotency-Key em toda mutação
 */

const BASE_URL  = import.meta.env.VITE_BACKEND_API_URL || '/backend/api';
const BFF_URL   = import.meta.env.VITE_BFF_URL || '';

export class ApiClient {
  /** Gera headers de segurança únicos por mutação. */
  _secHeaders() {
    return {
      'X-Nonce':           uuidv4(),
      'Idempotency-Key':   uuidv4(),
    };
  }

  /** Prepara payload de segurança (mantido para compatibilidade com testes). */
  preparePostPayload(body) {
    return {
      headers: { 'Content-Type': 'application/json', ...this._secHeaders() },
      body: JSON.stringify(body),
    };
  }

  /** Chamadas de leitura (GET) — vão direto ao backend. */
  async _get(path) {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error(err.detail || 'Erro na requisição'), { status: res.status });
    }
    return res.json();
  }

  // =========================================================
  // Tasks — leituras diretas / mutações via fila
  // =========================================================

  async getTasks() {
    const data = await this._get('/tasks');
    return (data.tasks || []).map((t) => new TaskDTO(t));
  }

  async getTask(id) {
    const data = await this._get(`/tasks/${id}`);
    return new TaskDTO(data);
  }

  async createTask(taskPayload) {
    const data = await enqueueMutation('task:create', {}, taskPayload, this._secHeaders());
    return new TaskDTO(data);
  }

  async updateTask(id, taskPayload) {
    const data = await enqueueMutation('task:update', { id }, taskPayload, this._secHeaders());
    return new TaskDTO(data);
  }

  async deleteTask(id) {
    return enqueueMutation('task:delete', { id }, {}, this._secHeaders());
  }

  // =========================================================
  // Board methods
  // =========================================================

  async getBoards() {
    const data = await this._get('/boards');
    return (data.boards || []).map((b) => new BoardDTO(b));
  }

  async getBoard(id) {
    const data = await this._get(`/boards/${id}`);
    return new BoardDTO(data);
  }

  async createBoard(boardPayload) {
    const data = await enqueueMutation('board:create', {}, boardPayload, this._secHeaders());
    return new BoardDTO(data);
  }

  async updateBoard(id, boardPayload) {
    const data = await enqueueMutation('board:update', { id }, boardPayload, this._secHeaders());
    return new BoardDTO(data);
  }

  async deleteBoard(id) {
    return enqueueMutation('board:delete', { id }, {}, this._secHeaders());
  }

  // =========================================================
  // Quadro methods
  // =========================================================

  async getQuadros(boardId) {
    const data = await this._get(`/boards/${boardId}/quadros`);
    return (data.quadros || []).map((q) => new QuadroDTO(q));
  }

  async getQuadro(quadroId) {
    const data = await this._get(`/quadros/${quadroId}`);
    return new QuadroDTO(data);
  }

  /**
   * Busca dados completos de um quadro (quadro + grupos + tasks) via cache Redis.
   * Cache hit → resposta imediata sem chamar o backend.
   * Cache miss → BFF busca no backend, popula cache, registra no LRU.
   * @returns {{ quadro: QuadroDTO, grupos: GrupoDTO[], tasksByGrupo: object, _fromCache: boolean }}
   */
  async getQuadroFull(quadroId) {
    const sessionId = getSessionId();
    const res = await fetch(`${BFF_URL}/api/cache/quadro/${quadroId}`, {
      method: 'GET',
      headers: {
        'Content-Type':  'application/json',
        'X-Session-ID':  sessionId,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw Object.assign(new Error(err.error || 'Erro ao carregar quadro'), { status: res.status });
    }
    const data = await res.json();
    return {
      quadro:       new QuadroDTO(data.quadro || {}),
      grupos:       (data.grupos || []).map((g) => new GrupoDTO(g)),
      tasksByGrupo: Object.fromEntries(
        Object.entries(data.tasksByGrupo || {}).map(([gid, tasks]) => [
          gid,
          (tasks || []).map((t) => new TaskDTO(t)),
        ])
      ),
      _fromCache:   data._fromCache ?? false,
    };
  }

  async createQuadro(boardId, quadroPayload) {
    const data = await enqueueMutation('quadro:create', { boardId }, quadroPayload, this._secHeaders());
    return new QuadroDTO(data);
  }

  async updateQuadro(quadroId, quadroPayload) {
    const data = await enqueueMutation('quadro:update', { id: quadroId }, quadroPayload, this._secHeaders());
    return new QuadroDTO(data);
  }

  async deleteQuadro(quadroId) {
    return enqueueMutation('quadro:delete', { id: quadroId }, {}, this._secHeaders());
  }

  // =========================================================
  // Grupo methods
  // =========================================================

  async getGrupos(quadroId) {
    const data = await this._get(`/quadros/${quadroId}/grupos`);
    return (data.grupos || []).map((g) => new GrupoDTO(g));
  }

  async getGrupo(grupoId) {
    const data = await this._get(`/grupos/${grupoId}`);
    return new GrupoDTO(data);
  }

  async createGrupo(quadroId, grupoPayload) {
    const data = await enqueueMutation('grupo:create', { quadroId }, grupoPayload, this._secHeaders());
    return new GrupoDTO(data);
  }

  async updateGrupo(grupoId, grupoPayload, quadroId = null) {
    const pathParams = { id: grupoId, ...(quadroId ? { quadroId } : {}) };
    const data = await enqueueMutation('grupo:update', pathParams, grupoPayload, this._secHeaders());
    return new GrupoDTO(data);
  }

  async deleteGrupo(grupoId, quadroId = null) {
    const pathParams = { id: grupoId, ...(quadroId ? { quadroId } : {}) };
    return enqueueMutation('grupo:delete', pathParams, {}, this._secHeaders());
  }

  // =========================================================
  // Tasks por Grupo
  // =========================================================

  async getTasksByGrupo(grupoId) {
    const data = await this._get(`/grupos/${grupoId}/tasks`);
    return (data.tasks || []).map((t) => new TaskDTO(t));
  }

  async createTaskInGrupo(grupoId, taskPayload, quadroId = null) {
    const pathParams = { grupoId, ...(quadroId ? { quadroId } : {}) };
    const data = await enqueueMutation('grupo-task:create', pathParams, taskPayload, this._secHeaders());
    return new TaskDTO(data);
  }
}

// Singleton exportado para uso nos hooks
export const apiClient = new ApiClient();
