import express from 'express';
import cors from 'cors';
import queueRoutes from './queue/routes.js';
import cacheRoutes from './cache/cacheRoutes.js';
import { startWorker } from './queue/worker.js';
import { callBackendApi, triggerBackendWebhook } from './lib/backendClient.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: ['http://localhost', 'http://nginx'] }));
app.use(express.json());

// =========================================================
// INBOUND: Receive FROM Backend Python
// =========================================================

// 1. API Receiver Síncrono: Backend avisa o Front para sincronizar cache de tarefas
app.post('/api/sync-cache', (req, res) => {
    const { message, tasks } = req.body;
    console.log(`[Front API] Sinal síncrono recebido do Back: ${message}`);
    // TODO: Propagar via WebSocket/SSE para os clientes React conectados
    res.status(200).json({ status: 'received', message });
});

// 2. Webhook Receiver Assíncrono: Backend notifica jobs concluídos
app.post('/webhook/notifications', (req, res) => {
    const { job_id, result } = req.body;
    console.log(`[Front Webhook] Job ${job_id} concluído pelo Backend. Resultado:`, result);
    // TODO: Emitir evento Socket.io para o browser do usuário que iniciou o job
    res.status(200).json({ status: 'notification_received', job_id });
});

// =========================================================
// QUEUE: Fila de comandos Redis (POST /api/queue/enqueue, GET /api/queue/status/:id)
// =========================================================
app.use('/api/queue', queueRoutes);

// =========================================================
// CACHE: Leitura rápida via Redis LRU (GET /api/cache/quadro/:id)
// =========================================================
app.use('/api/cache', cacheRoutes);

// =========================================================
// OUTBOUND helpers: exportados para uso interno (ex.: testes)
// =========================================================
export { callBackendApi, triggerBackendWebhook };

// =========================================================
// React SPA: Entrega o bundle compilado (multi-stage via Nginx)
// =========================================================
app.get('/*', (req, res) => {
    res.send('<h1>React App</h1><p>Lazy Loading enabled. Vite multi-stage build served via Nginx in production.</p>');
});

// =========================================================
// Start
// =========================================================
startWorker();

app.listen(PORT, () => {
    console.log(`[Frontend BFF] Server running on port ${PORT}`);
    console.log(`  BACKEND_API_URL → ${process.env.BACKEND_API_URL || 'http://nginx/backend/api'}`);
    console.log(`  REDIS_URL       → ${process.env.REDIS_URL       || 'redis://redis:6379'}`);
});
