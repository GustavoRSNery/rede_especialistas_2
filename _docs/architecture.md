# Documentação de Arquitetura

Este documento detalha a topologia estrutural, o ecossistema de contêineres e a disposição lógica das camadas do projeto Gerenciador de Tarefas. A arquitetura foi concebida para fornecer a robustez de sistemas distribuídos empresariais, encapsulada em um ambiente contêinerizado unificado.

## 1. Visão Geral do Sistema

O ambiente será gerenciado inteiramente pelo `docker-compose.yml`, subindo uma rede virtual interna estrita. A topologia será composta por **cinco contêineres principais**:

1.  **Gateway Público (Nginx):** Único ponto de contato com o exterior.
2.  **Microsserviço de Frontend (React):** Interface do usuário.
3.  **Microsserviço de Backend (Python):** Lógica computacional e regras de negócio.
4.  **Banco de Dados Primário (PostgreSQL):** Persistência relacional.
5.  **Banco de Dados em Memória (Redis):** Cache, Idempotência e controle de fluxo.

---

## 2. Padrão Arquitetural: Hexagonal (Ports and Adapters)

Tanto o frontend (na medida do possível para aplicações de UI) quanto o backend empregarão estritamente o padrão de Arquitetura Hexagonal. O escopo lógico não permite vazamento de infraestrutura (banco de dados, HTTP) para as lógicas de domínio.

### 2.1 Backend (Python)
- **Domínio (Core):** Modelos puros da "Tarefa". Agregações, validações primárias de estado (ex: uma tarefa não pode ser concluída se já foi deletada) tratadas apenas em Python nativo e Pydantic.
- **Portas (Interfaces):**
  - *Inbound Ports:* Interfaces para os Webhooks e Rotas REST da API.
  - *Outbound Ports:* Interfaces de persistência (`TaskRepositoryInterface`) e serviços externos.
- **Adaptadores:**
  - *Inbound Adapters:* O framework HTTP (FastAPI ou Flask) recebendo payloads, traduzindo as requisições web para chamadas nos casos de uso.
  - *Outbound Adapters:* Classe executora de Raw SQL no PostgreSQL, implementando o `TaskRepositoryInterface`. 

### 2.2 Frontend (React)
- **Apresentação (UI):** Componentes React, puramente reativos. 
- **Casos de Uso/Estado:** Hooks especializados (`useTasks`, etc) que não fazem requisições HTTP, mas chamam as lógicas de abstração.
- **Adaptadores HTTP / DTOs:** Classes e serviços que constroem a requisição validando mTLS, TTL e Injeção do Nonce via DTO antes de bater na API.

---

## 3. Disposição de Redes e Infraestrutura (Docker)

Para garantir segurança, o Docker Composer definirá **duas redes diferentes**:
- `public_net`: Habilitada apenas no contêiner Nginx. Nenhuma outra aplicação vê portas do seu Host nativo.
- `private_net`: Rede fechada que conecta Frontend, Backend, Redis e PostgreSQL. O acesso a eles só pode ser encaminhado pelo Nginx ou entre eles mesmos.

### 3.1 Nginx como Proxy Reverso Único
*   O Nginx servirá os arquivos estáticos do React criados no processo de build multi-stage (`build -> nginx`). 
*   Ele interceptará as chamadas contendo `/api/*` e `/webhook/*` da UI, e fará proxy-pass de forma segura para o contêiner do Backend, disfarçando totalmente a porta (8000/5000) e IP reais do Backend da visão do cliente.

### 3.2 Rotas "Webhooks" e "Padrão"
O sistema diferencia ativamente:
*   **Rotas de API (Chamadas Padrão):** O Fluxo síncrono padrão (Request/Response). O Frontend exige a criação de uma `Task`, o Backend processa a Regra de Negócio e responde.
*   **Rotas Webhook:** Canais abertos para transições assíncronas de longa duração, atualizações massivas de bancos ou propagações de rotinas em lotes (batch processing). O Front possuirá listeners para atualizar a interface quando o Backend notificar finalizações pelos webhooks.

### 3.3 Gestão de Estado Global (Frontend + Redis)
O Redis funcionará no frontend/API layer para gerenciar o estado efêmero:
*   Acompanhar requisições em progresso.
*   Servir cache temporal rápido para os registros da lista de tarefas, aliviando o PostgreSQL do Backend.
*   Armazenar e anular chaves de **Idempotency-Key** e UUIDs de **Nonce** para prevenir ataques repetitivos no Back.

---

## 4. Variáveis de Ambiente e Injeção de Segurança

Os serviços se encontrarão dinamicamente pela sua nomenclatura e pelas configurações exportadas nos envs. 
Nem o backend nem o frontend terão chaves hardcoded. Será mandatório o fornecimento de arquivos `.env` para o provisionamento dos certificados (para o mTLS) e para os endereços das bases Postgre/Redis na montagem dos contêineres.