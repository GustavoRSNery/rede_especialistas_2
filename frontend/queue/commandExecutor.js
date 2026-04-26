/**
 * commandExecutor.js — Mapeia comandos de fila para chamadas HTTP ao backend FastAPI.
 *
 * Cada entrada define:
 *   method  — HTTP verb
 *   path    — função que recebe pathParams e retorna o path relativo
 *   hasBody — se deve enviar o campo `body` do payload
 *
 * Payload esperado: { pathParams: {}, body: {} }
 * Headers de segurança (X-Nonce, Idempotency-Key) são repassados ao backend.
 */

import { callBackendApi } from '../lib/backendClient.js';

const COMMANDS = {
  // ── Tasks globais ─────────────────────────────────────────
  'task:create':       { method: 'POST',   path: (_)  => '/tasks',                         hasBody: true  },
  'task:update':       { method: 'PUT',    path: (p)  => `/tasks/${p.id}`,                 hasBody: true  },
  'task:delete':       { method: 'DELETE', path: (p)  => `/tasks/${p.id}`,                 hasBody: false },

  // ── Boards ────────────────────────────────────────────────
  'board:create':      { method: 'POST',   path: (_)  => '/boards',                        hasBody: true  },
  'board:update':      { method: 'PUT',    path: (p)  => `/boards/${p.id}`,                hasBody: true  },
  'board:delete':      { method: 'DELETE', path: (p)  => `/boards/${p.id}`,                hasBody: false },

  // ── Quadros ───────────────────────────────────────────────
  'quadro:create':     { method: 'POST',   path: (p)  => `/boards/${p.boardId}/quadros`,   hasBody: true  },
  'quadro:update':     { method: 'PUT',    path: (p)  => `/quadros/${p.id}`,               hasBody: true  },
  'quadro:delete':     { method: 'DELETE', path: (p)  => `/quadros/${p.id}`,               hasBody: false },

  // ── Grupos de atividades ──────────────────────────────────
  'grupo:create':      { method: 'POST',   path: (p)  => `/quadros/${p.quadroId}/grupos`,  hasBody: true  },
  'grupo:update':      { method: 'PUT',    path: (p)  => `/grupos/${p.id}`,                hasBody: true  },
  'grupo:delete':      { method: 'DELETE', path: (p)  => `/grupos/${p.id}`,                hasBody: false },

  // ── Tasks dentro de grupo ─────────────────────────────────
  'grupo-task:create': { method: 'POST',   path: (p)  => `/grupos/${p.grupoId}/tasks`,     hasBody: true  },
  'grupo-task:update': { method: 'PUT',    path: (p)  => `/tasks/${p.id}`,                 hasBody: true  },
  'grupo-task:delete': { method: 'DELETE', path: (p)  => `/tasks/${p.id}`,                 hasBody: false },
};

/**
 * Executa um comando enfileirado chamando o backend FastAPI.
 * @param {{ command: string, payload: { pathParams: object, body: object }, headers: object }} job
 */
export async function executeCommand({ command, payload, headers }) {
  const def = COMMANDS[command];
  if (!def) throw new Error(`Comando desconhecido: "${command}"`);

  const { pathParams = {}, body = {} } = payload;
  const path        = def.path(pathParams);
  const requestBody = def.hasBody ? body : null;

  return callBackendApi(path, def.method, requestBody, headers);
}
