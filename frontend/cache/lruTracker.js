/**
 * lruTracker.js — Rastreador LRU de quadros por sessão de usuário
 *
 * Implementa o algoritmo de substituição LRU (Least Recently Used) para
 * manter no Redis os últimos N quadros acessados por cada usuário.
 *
 * Chave Redis:
 *   user:{sessionId}:quadros → LIST (posição 0 = mais recente, último = mais antigo)
 *   TTL: 1 hora (renovado a cada acesso)
 *
 * Lógica LRU (atômica dentro do pipeline Redis):
 *   1. LREM  → remove entrada duplicada (caso já exista na lista)
 *   2. LPUSH → insere no início (mais recente)
 *   3. LTRIM → mantém no máximo MAX_QUADROS itens
 *   4. EXPIRE → renova o TTL da sessão
 *
 * Com MAX_QUADROS = 5: se o usuário acessar um 6º quadro diferente,
 * o mais antigo (posição 4) é automaticamente descartado pelo LTRIM.
 */

import { redis } from '../queue/redisClient.js';

const MAX_QUADROS  = 5;
const SESSION_TTL  = 3600; // 1 hora em segundos

function sessionKey(sessionId) {
  return `user:${sessionId}:quadros`;
}

/**
 * Registra o acesso de um usuário a um quadro.
 * Atualiza a posição na fila LRU e descarta o mais antigo se necessário.
 *
 * @param {string} sessionId — ID de sessão do usuário (UUID v4)
 * @param {string} quadroId  — ID do quadro acessado (UUID v4)
 */
export async function trackQuadroAccess(sessionId, quadroId) {
  if (!sessionId || !quadroId) return;
  const key = sessionKey(sessionId);
  try {
    // Pipeline: executa todos os comandos em sequência sem round-trips extras
    const pipe = redis.pipeline();
    pipe.lrem(key, 0, String(quadroId));      // remove duplicata existente
    pipe.lpush(key, String(quadroId));         // insere no início (mais recente)
    pipe.ltrim(key, 0, MAX_QUADROS - 1);      // descarta os mais antigos (>= índice 5)
    pipe.expire(key, SESSION_TTL);             // renova TTL da sessão
    await pipe.exec();
  } catch (err) {
    // Falha no tracking não deve impactar a resposta ao usuário
    console.warn('[LRU] Erro ao rastrear acesso (ignorado):', err.message);
  }
}

/**
 * Retorna a lista ordenada de IDs dos quadros em cache para um usuário.
 * Posição 0 = acessado mais recentemente.
 *
 * @param {string} sessionId
 * @returns {string[]} lista de até MAX_QUADROS quadroIds
 */
export async function getUserQuadros(sessionId) {
  if (!sessionId) return [];
  try {
    return await redis.lrange(sessionKey(sessionId), 0, MAX_QUADROS - 1);
  } catch (err) {
    console.warn('[LRU] Erro ao ler quadros da sessão:', err.message);
    return [];
  }
}
