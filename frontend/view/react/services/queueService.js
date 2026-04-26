/**
 * queueService.js — Cliente React para a fila Redis via BFF
 *
 * Fluxo:
 *   1. POST /api/queue/enqueue → BFF enfileira no Redis, devolve { jobId }
 *   2. Polling GET /api/queue/status/:jobId até status === 'done' | 'error'
 *   3. Retorna o resultado (igual ao que o backend devolveu)
 *
 * Fallback automático: se o BFF devolver status='done' diretamente
 * (Redis off → execução síncrona), retorna imediatamente sem polling.
 */

const QUEUE_BASE        = '/api/queue';
const POLL_INTERVAL_MS  = 500;  // intervalo entre verificações
const POLL_MAX_ATTEMPTS = 60;   // 30 segundos máximos

/**
 * Enfileira uma mutação e aguarda (via polling) o resultado.
 *
 * @param {string} command        - ex: 'task:create', 'grupo:delete'
 * @param {object} pathParams     - variáveis de URL, ex: { id: '...', boardId: '...' }
 * @param {object} body           - corpo da requisição
 * @param {object} securityHeaders- X-Nonce + Idempotency-Key gerados no cliente
 * @returns {Promise<object>}     - resultado retornado pelo backend
 */
export async function enqueueMutation(command, pathParams = {}, body = {}, securityHeaders = {}) {
  const res = await fetch(`${QUEUE_BASE}/enqueue`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ command, payload: { pathParams, body }, headers: securityHeaders }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    const err     = new Error(errBody.error || 'Erro ao enfileirar comando');
    err.status    = res.status;
    throw err;
  }

  const { jobId, status, result } = await res.json();

  // BFF em modo fallback síncrono (Redis off): resultado já disponível
  if (status === 'done') return result;

  return _pollJob(jobId);
}

/**
 * Faz polling do status de um job até ele ser resolvido ou dar timeout.
 */
async function _pollJob(jobId, attempt = 0) {
  if (attempt >= POLL_MAX_ATTEMPTS) {
    throw new Error('Timeout: o servidor não respondeu a tempo (30s)');
  }

  await _sleep(POLL_INTERVAL_MS);

  const res = await fetch(`${QUEUE_BASE}/status/${jobId}`);
  if (!res.ok) throw new Error('Erro ao verificar status do job');

  const job = await res.json();

  if (job.status === 'done')    return job.result;
  if (job.status === 'error')   throw new Error(job.result?.detail || 'Erro ao processar comando');

  // status === 'pending' → continua polling
  return _pollJob(jobId, attempt + 1);
}

function _sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
