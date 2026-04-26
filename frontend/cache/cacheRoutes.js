/**
 * cacheRoutes.js — Rotas Express para leitura com cache Redis
 *
 * GET /api/cache/quadro/:quadroId
 *   - Verifica Redis primeiro (cache hit → retorno imediato)
 *   - Cache miss → busca no backend → armazena → retorna
 *   - Registra acesso no LRU tracker da sessão (fire-and-forget)
 *   - Retorna: { quadro, grupos, tasksByGrupo, _fromCache: bool }
 *
 * GET /api/cache/session/:sessionId/quadros
 *   - Retorna a lista LRU dos últimos quadros acessados pelo usuário
 *   - Retorna: { quadroIds: string[] }
 *
 * Segurança (OWASP A03 - Injection):
 *   - Todos os parâmetros de rota são validados contra UUID v4 regex
 *     antes de serem usados como chaves Redis ou caminhos de API.
 */

import { Router } from 'express';
import { getCachedQuadro, fetchAndCacheQuadro } from './cacheClient.js';
import { trackQuadroAccess, getUserQuadros }    from './lruTracker.js';

const router = Router();

// UUID v4 regex — evita injeção de chaves Redis arbitrárias
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ---------------------------------------------------------------------------
// GET /api/cache/quadro/:quadroId
// ---------------------------------------------------------------------------
router.get('/quadro/:quadroId', async (req, res) => {
  const { quadroId } = req.params;
  const sessionId    = (req.headers['x-session-id'] || '').trim();

  if (!UUID_RE.test(quadroId)) {
    return res.status(400).json({ error: 'quadroId inválido' });
  }

  try {
    // 1. Tenta o cache (resposta rápida)
    let data      = await getCachedQuadro(quadroId);
    const fromCache = !!data;

    // 2. Cache miss → busca no backend, popula cache
    if (!data) {
      data = await fetchAndCacheQuadro(quadroId);
    }

    // 3. Atualiza LRU da sessão (não bloqueia a resposta)
    if (UUID_RE.test(sessionId)) {
      trackQuadroAccess(sessionId, quadroId).catch(() => {});
    }

    return res.json({ ...data, _fromCache: fromCache });
  } catch (err) {
    console.error('[CacheRoute] Erro ao carregar quadro:', err.message);
    return res.status(502).json({
      error:  'Falha ao carregar dados do quadro',
      detail: err.message,
    });
  }
});

// ---------------------------------------------------------------------------
// GET /api/cache/session/:sessionId/quadros
// Retorna os IDs dos quadros em cache para a sessão (lista LRU)
// ---------------------------------------------------------------------------
router.get('/session/:sessionId/quadros', async (req, res) => {
  const { sessionId } = req.params;

  if (!UUID_RE.test(sessionId)) {
    return res.status(400).json({ error: 'sessionId inválido' });
  }

  const quadroIds = await getUserQuadros(sessionId);
  return res.json({ quadroIds });
});

export default router;
