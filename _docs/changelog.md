# Changelog

Todas as mudanças notáveis que ocorrerão no ciclo de vida de desenvolvimento desse projeto (Gerenciador de Tarefas) serão documentadas neste arquivo.

## 26/04/2026 05:30

### Frontend — Exibição do ID da tarefa nas views de Board e Quadro

#### Contexto e Decisão

O schema da entidade `Task` define `id` como campo obrigatório e identificador único. Porém a UI não o apresentava em nenhuma das duas views de visualização de tarefas. Para conformidade com o modelo de dados e rastreabilidade (útil para referência cruzada, suporte e debugging), o ID passou a ser exibido diretamente nas linhas e cards de tarefa.

A exibição usa os primeiros 8 caracteres do UUID (`#xxxxxxxx`) — suficiente para identificação visual sem poluir o layout. Fonte monospace e cor `text-muted` garantem hierarquia visual: o ID é informativo mas não compete com o título.

#### Alterado

- `frontend/view/react/pages/BoardPage.jsx` — coluna TAREFA da tabela de grupo agora exibe `#xxxxxxxx` entre o ícone ▶ e o nome da tarefa.
- `frontend/view/react/pages/QuadroPage.jsx` — cards Kanban (pendente e concluída) agora exibem `#xxxxxxxx` acima do título.

## 26/04/2026 05:00

### Projeto — Release Geral: Stack Completo, .env Publicado para Onboarding e Histórico de Desenvolvimento

#### Contexto

Este commit encerra o primeiro ciclo de desenvolvimento do **Gerenciador de Tarefas**, um sistema enterprise completo construído em ~8 horas de desenvolvimento ativo ao longo de dois dias (25–26/04/2026), com uma pausa de 8h entre as sessões.

O projeto foi desenvolvido do zero: da definição arquitetural até a UI funcional com boards, quadros, grupos e tarefas operando em toda a stack — FastAPI → Redis Queue → PostgreSQL → React/Vite.

#### Decisão — `.env` versionado intencionalmente

Os arquivos `.env` (raiz e `backend/.env`) foram removidos do `.gitignore` e commitados com valores de desenvolvimento local. **Esta decisão é deliberada:** o projeto é open-source de estudo e as credenciais presentes (`changeme_in_production`, `taskuser`) são exclusivamente para o ambiente Docker de desenvolvimento local. O objetivo é que qualquer pessoa que clone o repositório consiga executar `docker compose up --build` imediatamente, sem configuração adicional. Ambientes de produção devem substituir os valores antes do deploy — isso está documentado no `README.md`.

#### Resumo do Ciclo de Desenvolvimento

**Dia 1 — 25/04/2026 (~12h–22h):**
- Definição de arquitetura, PDD, fluxos ACID, C4-Model, topologia de rede.
- Fundação TDD: testes unitários, de integração e de infraestrutura.
- Pipeline GitHub Actions com serviços reais no Job.

**Pausa: ~8 horas (madrugada 25→26/04)**

**Dia 2 — 26/04/2026 (~03h–05h):**
- BFF Node.js/Express com Redis Queue (14 comandos mapeados) e Cache LRU por sessão.
- Backend reescrito com arquitetura hexagonal, repositórios, schemas Pydantic v2, soft-delete, idempotência.
- Frontend React completo: Layout com sidebar dinâmico (todos os boards + quadros), HomePage com cards, sistema de contexto menu + modal de confirmação, limite de 10 boards com bloqueio de UI.
- Docker Compose simplificado via `COMPOSE_FILE` no `.env` raiz — `docker compose up --build` sem flags.

**Total de desenvolvimento ativo: ~8 horas.**

#### Alterado
- `.gitignore` — linhas de `.env` e `frontend/.env` comentadas; arquivos de ambiente agora versionados para facilitar onboarding.
- `.env` (raiz) — adicionado `COMPOSE_FILE=docker-compose.dev.yml` para simplificar o comando de subida do stack.

## 26/04/2026 04:30

### Backend — Refatoração SOLID: Arquitetura Hexagonal, Repositórios, Schemas Pydantic v2 e Webhook Produção

#### Contexto e Decisões Arquiteturais

O backend original era um monobloco em `main.py` com queries SQL inline e sem separação de responsabilidades. Nesta sessão o microsserviço foi integralmente reescrito seguindo os princípios SOLID e a arquitetura Hexagonal (Ports & Adapters), separando a aplicação em quatro camadas autônomas: **rotas**, **schemas**, **repositórios** e **infraestrutura de banco**.

A decisão de manter SQL puro via `asyncpg` (sem ORM) foi deliberada: evita o custo de abstração do SQLAlchemy em queries de alta frequência, garante controle total sobre os índices e não introduz N+1 oculto. Todos os parâmetros são posicionais (`$1`, `$2`) — imunes a SQL Injection por design do driver.

O soft-delete foi adotado como invariante de domínio: nenhuma entidade sofre `DELETE` físico. Boards, quadros, grupos e tarefas ganham `is_deleted = TRUE` via `UPDATE`, preservando integridade referencial e rastreabilidade de auditoria futura.

A idempotência é imposta a nível de transporte: toda mutação (`POST`, `PUT`, `DELETE`) exige os headers `Idempotency-Key` e `X-Nonce`, validados em `helpers.require_security_headers()` antes de qualquer acesso ao banco. Headers ausentes retornam `400` imediatamente, sem custo de I/O.

#### Adicionado

**Camada de Infraestrutura:**
- `backend/app/db.py` — Pool `asyncpg` com ciclo de vida gerenciado pelo `lifespan` do FastAPI; `min_size=2`, `max_size=10`, `command_timeout=30s`; configuração via variáveis de ambiente (`DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`).

**Camada de Aplicação — Entrypoint:**
- `backend/app/main.py` — `FastAPI` com `lifespan` que cria o pool no startup e fecha pool + singleton `httpx.AsyncClient` no shutdown. CORS restrito a `http://localhost` e `http://nginx` (nunca origens externas diretas). Dois routers montados: `/api` (CRUD síncrono) e `/webhook` (jobs assíncronos).

**Camada de Schemas (Pydantic v2):**
- `backend/app/schemas/task_schema.py` — `TaskInbound`, `TaskUpdateInbound`.
- `backend/app/schemas/board_schema.py` — `BoardInbound`, `BoardUpdateInbound`.
- `backend/app/schemas/quadro_schema.py` — `QuadroInbound`, `QuadroUpdateInbound`.
- `backend/app/schemas/grupo_schema.py` — `GrupoInbound`, `GrupoUpdateInbound`.
- `backend/app/schemas/__init__.py` — re-exporta todos os schemas.

**Camada de Repositórios (SQL puro asyncpg):**
- `backend/app/repositories/task_repo.py` — CRUD completo + soft-delete; queries com `$N` posicionais.
- `backend/app/repositories/board_repo.py` — `list_boards`, `get_board`, `create_board`, `update_board`, `soft_delete_board`.
- `backend/app/repositories/quadro_repo.py` — `list_quadros_by_board`, `get_quadro`, `create_quadro`, `update_quadro`, `soft_delete_quadro`.
- `backend/app/repositories/grupo_repo.py` — `list_grupos_by_quadro`, `get_grupo`, `create_grupo`, `update_grupo`, `soft_delete_grupo`.

**Camada de Rotas (FastAPI APIRouter):**
- `backend/app/routes/tasks.py` — 5 handlers: `GET /tasks`, `POST /tasks`, `GET /tasks/{id}`, `PUT /tasks/{id}`, `DELETE /tasks/{id}`.
- `backend/app/routes/boards.py` — 5 handlers: list, create, get, update, soft-delete.
- `backend/app/routes/quadros.py` — 5 handlers: list por board, create, get, update, soft-delete.
- `backend/app/routes/grupos.py` — 5 handlers: list por quadro, create, get, update, soft-delete. Inclui `GET /grupos/{id}/tasks`.
- `backend/app/routes/api.py` — Agregador de 9 linhas: inclui os 4 routers acima; ponto único de montagem em `/api`.
- `backend/app/routes/webhook.py` — Reescrito para produção:
  - `_http_client = httpx.AsyncClient(timeout=10.0)` — singleton módulo-nível, reutiliza connection pool HTTP; fechado via `lifespan`.
  - `POST /webhook/tasks/process` — aceita job, retorna `202 Accepted` imediatamente, delega `_process_job` ao `BackgroundTasks` do FastAPI (sem bloqueio do event loop).
  - `notify_frontend_job_completed` e `push_tasks_to_frontend` — comunicação server-to-server via Nginx; nunca exposta ao cliente.

**Utilitários:**
- `backend/app/helpers.py` — `require_security_headers(idempotency_key, x_nonce)`: levanta `HTTP 400` se ausentes. `serialize(obj)`: converte `UUID` e `datetime` para JSON-safe sem dependência externa.

#### Alterado
- `backend/app/main.py` — substituído entrypoint monolítico por aplicação com lifespan, CORS configurado e dois routers montados.
- `backend/app/routes/webhook.py` — substituído padrão `async with httpx.AsyncClient()` por-chamada (overhead de conexão a cada request) por singleton + `BackgroundTasks`.

#### Decisões de Segurança (OWASP)
- **Injection (A03)**: SQL parametrizado `$1..$N` via asyncpg — injeção impossível por design.
- **Security Misconfiguration (A05)**: CORS origin list explícita; nenhum wildcard `*`.
- **Insecure Design (A04)**: Soft-delete preserva trilha de auditoria; sem destruição de dados acidental.
- **Broken Access Control (A01)**: Headers `Idempotency-Key` + `X-Nonce` obrigatórios em toda mutação; validação antes de qualquer I/O.

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