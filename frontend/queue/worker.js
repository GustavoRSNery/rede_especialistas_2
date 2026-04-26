/**
 * worker.js — Processador de fila Redis
 *
 * Usa BLPOP (blocking pop) no `workerRedis` para aguardar itens na fila
 * sem polling ativo. Processa UM comando por vez, garantindo que o backend
 * não seja sobrecarregado com chamadas simultâneas.
 *
 * Fluxo:
 *   1. BLPOP cmd:queue (block até 5s)
 *   2. Deserializa o job
 *   3. Executa via commandExecutor → FastAPI
 *   4. Salva resultado (done | error) no HASH job:{id}
 *   5. Volta ao passo 1
 */

import { workerRedis }                  from './redisClient.js';
import { setJobDone, setJobError }      from './commandQueue.js';
import { executeCommand }               from './commandExecutor.js';
import { invalidateCachedQuadro }       from '../cache/cacheClient.js';

const QUEUE_KEY = 'cmd:queue';
let   running   = false;

/** Inicia o loop de processamento em background (non-blocking para o Express). */
export function startWorker() {
  if (running) return;
  running = true;
  console.log('[Queue Worker] Iniciado — aguardando comandos em', QUEUE_KEY);
  _loop();
}

/** Para o worker de forma graciosa. */
export function stopWorker() {
  running = false;
}

async function _loop() {
  while (running) {
    try {
      // BLPOP bloqueia até 5s esperando item; retorna null no timeout
      const item = await workerRedis.blpop(QUEUE_KEY, 5);
      if (!item) continue; // timeout sem item — continua loop

      const job = JSON.parse(item[1]);
      console.log(`[Worker] ▶ job ${job.jobId} | ${job.command}`);

      try {
        const result = await executeCommand(job);
        await setJobDone(job.jobId, result);

        // Invalida o cache Redis do quadro afetado para garantir consistência.
        // O campo quadroId é incluído no pathParams das mutações de grupos e tasks.
        const quadroId = job.payload?.pathParams?.quadroId;
        if (quadroId) {
          await invalidateCachedQuadro(quadroId);
        }

        console.log(`[Worker] ✓ job ${job.jobId} concluído`);
      } catch (execErr) {
        await setJobError(job.jobId, execErr.message);
        console.error(`[Worker] ✗ job ${job.jobId} falhou: ${execErr.message}`);
      }
    } catch (loopErr) {
      if (running) {
        console.error('[Worker] Erro no loop — aguardando 1s antes de reiniciar:', loopErr.message);
        await _sleep(1000);
      }
    }
  }

  console.log('[Queue Worker] Parado.');
}

function _sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
