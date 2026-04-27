# ToDo e Backlog do Projeto
TODOS OS CARDS COMPLETOS, SO ESTOU COM PREGUIÇAS DE ATUALIZAR TODOS AQUI....ZZZZzzz
Documento base de controle das etapas de implementação do projeto. Marcadores seguem a ordem natural de independência sistêmica (Infra -> Back -> Front -> Intersecções).

## 1. Configuração de Infraestrutura e Docker 🐳
- [ ] Criar a estrutura base de subpastas (`/backend`, `/frontend`, `/nginx`).
- [ ] Escrever o `docker-compose.yml` definindo os serviços: `postgres`, `redis`, `backend`, `frontend_nginx`.
- [ ] Configurar redes separadas no Compose (`public_net` e `private_net`).
- [ ] Criar os *Volumes* atrelados e de persistência de dados.
- [ ] Criar arquivo `nginx.conf` gerenciando proxy-pass e redirecionamentos.

## 2. Banco e Camada de Persistência (PostgreSQL + Redis) 🗄️
- [ ] Estruturar o script de inicialização do Schema PostgreSQL (Criação nativa das tabelas de *Tasks*).
- [ ] Garantir chaves `UUID`, propriedades `is_deleted`, e Timestamps nativos.
- [ ] Implementar classe de conexão puramente Raw SQL no Backend utilizando context managers (sem dependência de ORM).

## 3. Backend Python (Arquitetura Hexagonal) 🐍
- [ ] Configurar modelo Pydantic base de Validação (`TaskInbound`, `TaskOutbound`).
- [ ] Criar os Contratos (*Ports*) de abstração nas interfaces (`ITaskRepository`).
- [ ] Implementar o adaptador do PostgreSQL implementando as Interfaces.
- [ ] Criar serviços do Domínio com as regras de *Soft Delete* integradas.
- [ ] Desenvolver as Inbound Ports/Adapters via FastAPI/Flask (Criar todas as Rotas do CRUD + Rota Webhook).
- [ ] Implementar o Middleware Lógico de acesso ao Redis: Checagem de Nonce, Inserção de Timestamp Relativo (TTL) e bloqueio Idempotente.

## 4. Frontend React (Vite / DTOs) ⚛️
- [ ] Inicializar o pacote via Vite com suporte a TypeScript/JS Rigoroso.
- [ ] Criar o Hook personalizado ou Camada DTO para modelar dados conversíveis (Peculiar de trânsito React -> Backend e vice-versa).
- [ ] Fazer componente principal com *Lazy Loading*.
- [ ] Confeccionar o Formulário e atrelar geração de Header com UUID de requisição (`Nonce` e `Idempotency-Key`).
- [ ] Fazer o Painel interativo de listar tarefas, usando soft-delete na visualização.
- [ ] Otimizar o `Dockerfile` do Frontend para build Multi-stage copiando para a partição final Nginx.

## 5. Testes e Avaliações de Integração 🧪
- [ ] Unit Test Backend: `pytest` para validação isolada do Casos de Uso Core da Aplicação Mockando as *Ports* do banco.
- [ ] Interception Tests: Validar respostas HTTP da Nginx sem banco direto para comprovar a eficácia dos retornos *422 Unprocessable*.
- [ ] Homologar localmente via `docker compose up --build` com terminal desapegado.
