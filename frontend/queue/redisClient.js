/**
 * redisClient.js — Singleton ioredis para o BFF Node.js
 *
 * Dois clientes:
 *  - redis:       operações gerais (HSET, HGETALL, RPUSH, MULTI/EXEC)
 *  - workerRedis: exclusivo para BLPOP (blocking pop — não pode compartilhar conexão)
 */

import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://redis:6379';

function makeClient(name) {
  const client = new Redis(REDIS_URL, {
    lazyConnect:            false,
    maxRetriesPerRequest:   3,
    retryStrategy: (times) => Math.min(times * 150, 5000),
    enableReadyCheck:       true,
  });

  client.on('ready', () => console.log(`[Redis:${name}] conectado`));
  client.on('error', (err) => console.error(`[Redis:${name}] erro: ${err.message}`));

  return client;
}

export const redis       = makeClient('main');
export const workerRedis = makeClient('worker');
