/**
 * queue/routes.js — Rotas Express da fila de comandos
 *
 * POST /api/queue/enqueue       → enfileira um comando; retorna { jobId, status: 'queued' }
 * GET  /api/queue/status/:jobId → consulta resultado de um job
 *
 * Fallback: se o Redis estiver indisponível, executa o comando de forma síncrona
 * e retorna { jobId: null, status: 'done', result } para que o cliente não quebre.
 */

import { Router }    from 'express';
import { enqueue, getJobStatus } from './commandQueue.js';
import { executeCommand }        from './commandExecutor.js';

const router = Router();

/* ─── POST /api/queue/enqueue ─────────────────────────────────────── */
router.post('/enqueue', async (req, res) => {
  const { command, payload, headers: cmdHeaders } = req.body ?? {};

  if (!command || !payload) {
    return res.status(400).json({ error: 'Campos obrigatórios: command, payload' });
  }

  try {
    const jobId = await enqueue({ command, payload, headers: cmdHeaders ?? {} });
    return res.status(202).json({ jobId, status: 'queued' });
  } catch (redisErr) {
    // Redis indisponível → fallback síncrono para não travar o usuário
    console.warn('[Queue] Redis off, executando de forma síncrona:', redisErr.message);
    try {
      const result = await executeCommand({ command, payload, headers: cmdHeaders ?? {} });
      return res.status(200).json({ jobId: null, status: 'done', result });
    } catch (execErr) {
      return res.status(502).json({ error: execErr.message });
    }
  }
});

/* ─── GET /api/queue/status/:jobId ────────────────────────────────── */
router.get('/status/:jobId', async (req, res) => {
  const { jobId } = req.params;

  // Valida UUID v4 para evitar injeção de chave arbitrária no Redis
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(jobId)) {
    return res.status(400).json({ error: 'jobId inválido' });
  }

  try {
    const job = await getJobStatus(jobId);
    if (!job) return res.status(404).json({ error: 'Job não encontrado ou expirado' });
    return res.json(job);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
