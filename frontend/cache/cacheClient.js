/**
 * cacheClient.js — Operações de cache Redis para quadros
 *
 * Responsável por:
 * - Ler dados de um quadro (quadro + grupos + tasks) do cache Redis
 * - Buscar no backend e armazenar em cache quando há cache miss
 * - Invalidar o cache quando o backend processa uma mutação
 *
 * Chaves Redis:
 *   cache:quadro:{quadroId}  → JSON com { quadro, grupos, tasksByGrupo }
 *   TTL: 120 segundos (suficiente para navegação fluida, seguro para consistência)
 */

import { redis }          from '../queue/redisClient.js';
import { callBackendApi } from '../lib/backendClient.js';

const CACHE_PREFIX = 'cache:quadro:';
const CACHE_TTL    = 120; // segundos

/**
 * Tenta ler os dados de um quadro do Redis.
 * @returns {object|null} dados ou null em caso de cache miss
 */
export async function getCachedQuadro(quadroId) {
  try {
    const raw = await redis.get(`${CACHE_PREFIX}${quadroId}`);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('[Cache] Erro ao ler cache (miss forçado):', err.message);
  }
  return null;
}

/**
 * Busca os dados completos do quadro no backend, armazena em Redis e retorna.
 * Busca em paralelo: grupos e tasks de cada grupo.
 * @returns {object} { quadro, grupos, tasksByGrupo }
 */
export async function fetchAndCacheQuadro(quadroId) {
  // Busca quadro e grupos em paralelo
  const [quadro, gruposRes] = await Promise.all([
    callBackendApi(`/quadros/${quadroId}`, 'GET'),
    callBackendApi(`/quadros/${quadroId}/grupos`, 'GET'),
  ]);

  const grupos = gruposRes.grupos || [];

  // Busca tasks de todos os grupos em paralelo
  const taskEntries = await Promise.all(
    grupos.map(async (g) => {
      const res = await callBackendApi(`/grupos/${g.id}/tasks`, 'GET');
      return [String(g.id), res.tasks || []];
    })
  );
  const tasksByGrupo = Object.fromEntries(taskEntries);

  const data = { quadro, grupos, tasksByGrupo };

  try {
    await redis.setex(`${CACHE_PREFIX}${quadroId}`, CACHE_TTL, JSON.stringify(data));
  } catch (err) {
    console.warn('[Cache] Erro ao gravar cache (ignorado):', err.message);
  }

  return data;
}

/**
 * Apaga o cache de um quadro específico.
 * Chamado pelo worker após processar uma mutação relacionada ao quadro.
 */
export async function invalidateCachedQuadro(quadroId) {
  if (!quadroId) return;
  try {
    await redis.del(`${CACHE_PREFIX}${quadroId}`);
    console.log(`[Cache] Invalidado: cache:quadro:${quadroId}`);
  } catch (err) {
    console.warn('[Cache] Erro ao invalidar cache:', err.message);
  }
}
