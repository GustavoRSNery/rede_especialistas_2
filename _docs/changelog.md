# Changelog

Todas as mudanças notáveis que ocorrerão no ciclo de vida de desenvolvimento desse projeto (Gerenciador de Tarefas) serão documentadas neste arquivo.

## 26/04/2026 03:15

### Redis — Fila de Comandos (Queue) e Cache LRU por Sessão

#### Adicionado

**Queue — mutações serializadas via Redis:**
- `frontend/queue/redisClient.js` — singletons ioredis (main + worker dedicado com BLPOP).
- `frontend/queue/commandQueue.js` — `enqueue` (RPUSH + HSET atômico), `getJobStatus`, `setJobDone`, `setJobError`.
- `frontend/queue/commandExecutor.js` — mapa de 14 comandos (`task`, `board`, `quadro`, `grupo`, `grupo-task`) para chamadas HTTP ao backend.
- `frontend/queue/worker.js` — loop BLPOP one-at-a-time; processa um comando por vez para não sobrecarregar o backend; reinicia automaticamente após falha; fallback síncrono se Redis off.
- `frontend/queue/routes.js` — `POST /api/queue/enqueue` e `GET /api/queue/status/:jobId` (validação UUID v4 anti-injection).
- `frontend/view/react/services/queueService.js` — cliente React com polling 500ms, timeout 30s, fallback imediato se status `done`.

**Cache LRU — leituras rápidas por sessão de usuário:**
- `frontend/cache/cacheClient.js` — `getCachedQuadro` (hit Redis ≈1ms), `fetchAndCacheQuadro` (miss → backend em paralelo → Redis TTL 120s), `invalidateCachedQuadro`.
- `frontend/cache/lruTracker.js` — rastreia até 5 quadros por sessão via pipeline Redis (`LREM → LPUSH → LTRIM → EXPIRE`); ao acessar o 6º quadro o mais antigo é descartado automaticamente.
- `frontend/cache/cacheRoutes.js` — `GET /api/cache/quadro/:id` (cache-aside com header `X-Session-ID`); `GET /api/cache/session/:id/quadros` (lista LRU da sessão). Validação UUID v4 em todos os parâmetros.
- `frontend/view/react/services/sessionService.js` — gera e persiste UUID de sessão no `localStorage` (chave de afinidade de cache, não autenticação).

**Integração:**
- `apiService.getQuadroFull()` — substitui N+1 chamadas (getGrupos + getTasksByGrupo por grupo) por uma única req ao BFF com dados completos do quadro.
- `useQuadro.fetchAll()` reescrito para usar `getQuadroFull` (cache-aside transparente).
- `quadroId` propagado nos `pathParams` de `updateGrupo`, `deleteGrupo` e `createTaskInGrupo` para acionar invalidação de cache no worker após cada mutação.
- `frontend/server.js` — monta `/api/queue` e `/api/cache`; inicia `startWorker()` antes de `app.listen`.
- `frontend/vite.config.js` — proxies `/api/queue` e `/api/cache` → `bff-dev:3000` em dev.
- `frontend/Dockerfile` — estágio runtime inclui `COPY cache/`.
- `docker-compose.dev.yml` — 3 serviços: `redis-dev`, `bff-dev` (porta 3000), `frontend-dev` (porta 5173).
- `frontend/package.json` — dependência `ioredis ^5.3.2`.

#### Corrigido
- `BoardPage.jsx` — removido bloco duplicado (`StatusBadge` + `export default function BoardPage`) remanescente de rewrite parcial anterior.
- `apiService.js` — removida classe `ApiClient` e singleton `apiClient` duplicados remanescentes de rewrite parcial anterior.

## 25/04/2026 12:27

### Configurações de Pipelines e Fundamentos TDD (Test-Driven Development)

#### Adicionado
- Base de Test-Driven Development (TDD) implementada:
  - TDD/Unit: `backend/tests/unit/test_task_entity.py` validando integridade no Domínio.
  - TDD/Integration: `backend/tests/integration/test_adapters.py` validando bloqueios de Redis e SQL Raw Postgres.
  - TDD/Infra: `infra/tests/test_docker_setup.py` que testarão as restrições da network e yaml parser.
- Pipeline Completa no GitHub Actions (`.github/workflows/main_ci.yml`) validando instâncias de serviços reais no Job.

#### Alterado
- Nenhuma.

#### Corrigido
- Nenhum bug funcional.

## 25/04/2026 12:14

### Definições de Arquitetura e Engenharia

#### Adicionado
- Toda a documentação e definição arquitetural base estabelecida dentro da base de repositórios no diretório `/docs`:
  - Processo e Escopo (PDD).
  - Determinações de Engenharia e Nível de Segurança.
  - Fluxos Operacionais (ACID e Frontend Lazy Loading).
  - Padrões visuais do ecossistema e topologia em Markdown C4-Model.
  - Tracker inicial com marcos estipulados via `todo.md`.
- `README.md` primordial do repositório orientando premissas universais e o comando central de containerização (`docker compose up --build`).

#### Alterado
- Nenhuma alteração realizada nas bases de código em ambiente de homologação até o presente momento.

#### Corrigido
- Nenhum bug reportado no escopo.