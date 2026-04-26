/**
 * commandQueue.js — Operações na fila Redis (RPUSH/BLPOP) e status dos jobs (HSET)
 *
 * Estrutura Redis:
 *   LIST  cmd:queue          → itens JSON a processar (RPUSH enqueue / BLPOP worker)
 *   HASH  job:{uuid}         → status, createdAt, doneAt, result
 *
 * TTL padrão: 1 hora (jobs expiram automaticamente do Redis)
 */

import { randomUUID } from 'crypto';
import { redis } from './redisClient.js';

const QUEUE_KEY = 'cmd:queue';
const JOB_TTL   = 3600; // segundos

/**
 * Enfileira um comando. Retorna o jobId para o cliente fazer polling.
 * @param {{ command: string, payload: object, headers: object }} job
 */
export async function enqueue({ command, payload, headers }) {
  const jobId = randomUUID();
  const item  = JSON.stringify({ jobId, command, payload, headers, createdAt: Date.now() });

  // Atômica: criar registro do job E enfileirar em um único MULTI
  await redis
    .multi()
    .hset(`job:${jobId}`, 'status', 'pending', 'createdAt', String(Date.now()))
    .expire(`job:${jobId}`, JOB_TTL)
    .rpush(QUEUE_KEY, item)
    .exec();

  return jobId;
}

/**
 * Retorna o status atual de um job pelo ID.
 * @returns {{ jobId, status, createdAt, doneAt, result } | null}
 */
export async function getJobStatus(jobId) {
  const data = await redis.hgetall(`job:${jobId}`);
  if (!data || !data.status) return null;

  return {
    jobId,
    status:    data.status,
    createdAt: data.createdAt ? Number(data.createdAt) : null,
    doneAt:    data.doneAt    ? Number(data.doneAt)    : null,
    result:    data.result    ? JSON.parse(data.result) : null,
  };
}

/** Marca job como concluído com o resultado retornado pelo backend. */
export async function setJobDone(jobId, result) {
  await redis
    .multi()
    .hset(
      `job:${jobId}`,
      'status', 'done',
      'result', JSON.stringify(result),
      'doneAt', String(Date.now()),
    )
    .expire(`job:${jobId}`, JOB_TTL)
    .exec();
}

/** Marca job como falho com a mensagem de erro. */
export async function setJobError(jobId, errorDetail) {
  await redis
    .multi()
    .hset(
      `job:${jobId}`,
      'status', 'error',
      'result', JSON.stringify({ detail: errorDetail }),
      'doneAt', String(Date.now()),
    )
    .expire(`job:${jobId}`, JOB_TTL)
    .exec();
}
