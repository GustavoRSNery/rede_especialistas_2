/**
 * backendClient.js — Chamadas HTTP servidor-para-servidor (BFF → FastAPI via Nginx)
 *
 * Responsabilidade: centralizar toda comunicação do Node BFF com o backend Python.
 * Usado pelo worker da fila e pelas rotas de fallback síncrono.
 */

const BACKEND_API_URL     = process.env.BACKEND_API_URL     || 'http://nginx/backend/api';
const BACKEND_WEBHOOK_URL = process.env.BACKEND_WEBHOOK_URL || 'http://nginx/backend/webhook';

/**
 * Chama a API REST do backend.
 * @param {string} path           - Caminho relativo, ex: '/tasks'
 * @param {string} method         - HTTP method
 * @param {object|null} body      - Payload (ignorado em GET/DELETE)
 * @param {object} securityHeaders- X-Nonce e Idempotency-Key já gerados pelo cliente
 */
export async function callBackendApi(path, method = 'GET', body = null, securityHeaders = {}) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', ...securityHeaders },
  };

  if (body !== null && method !== 'GET' && method !== 'DELETE') {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`${BACKEND_API_URL}${path}`, options);

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err = new Error(errBody.detail || `Backend retornou ${res.status}`);
    err.status = res.status;
    throw err;
  }

  return res.json();
}

/**
 * Dispara um webhook no backend (processos assíncronos).
 */
export async function triggerBackendWebhook(endpoint, payload, securityHeaders = {}) {
  const res = await fetch(`${BACKEND_WEBHOOK_URL}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...securityHeaders },
    body: JSON.stringify(payload),
  });
  return res.json();
}
