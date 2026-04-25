# Gerenciador de Tarefas (Enterprise Architecture)

## 📌 Escopo do Projeto
Um sistema unificado de gerenciamento de tarefas estruturado sob o rigor da **Arquitetura Hexagonal (Ports and Adapters)**, projetado para operar como uma aplicação robusta de microsserviços. O sistema possui blindagem de segurança através de proxy reverso e implementa padrões C4 Model para o roteamento e arquitetura.

## 🚀 Tecnologias Integradas

*   **Infraestrutura & DevOps:** Docker, Docker Compose, Nginx.
*   **Frontend:** React (Vite/CRA) com Lazy Loading, Typescript/DTOs.
*   **Backend:** Python (FastAPI/Flask) validado por Pydantic.
*   **Bancos de Dados:** 
    *   **PostgreSQL:** Persistência transacional com rigor ACID (Sem ORM, apenas Raw SQL e Prepared Statements).
    *   **Redis:** Cache em memória para validação de fluxos (Idempotência, Nonce e TTL).

## 🛠️ Critérios de Arquitetura e Engenharia Aplicados

1.  **Comunicação Restrita (Redes Isoladas):** Os bancos de dados e o framework Python não possuem portas publicadas para o host. O acesso acontece estritamente através do ecossistema do **Nginx (API Gateway internamente isolado)**.
2.  **Idempotência e Prevenção de Ataques:** As rotas RESTful no Backend exigem a composição de UUIDs efêmeros (Nonce) via Headers para rejeitar tentativas de re-execução ou pacotes duplicados.
3.  **Padrão Hexagonal Pleno:** A injeção de dependências aparta regras de negócios das conexões web/banco de dados, tornando o modelo inviolável em face a mudanças de bibliotecas externas.
4.  **Soft-Delete:** Dados jamais são apagados usando o instrucional destrutivo `DELETE`. Apenas recebem a sinalização semântica `is_deleted = TRUE` associada aos *Timestamps* de alteração.

## ⚙️ Como Executar (One-Command Build)

Em conformidade direta com os requisitos fundamentais do sistema, não é necessária a pré-instalação de dependências Node/Python locais para rodar a aplicação em seu estágio computacional de contêineres:

1. Clone o repositório.
2. Crie ou popule os arquivos `.env` pertinentes nos diretórios especificados (opcional dependendo das configs pre-definidas no compose).
3. Execute na raiz do projeto:

```bash
docker compose up --build
```

O comando irá orquestrar sequencialmente as redes fechadas, os discos (volumes) dos bancos de dados, o *Multi-stage Build* do React injetado no ambiente Nginx, e o contêiner do Python.

🔗 **Acesse via:** `http://localhost/`

## 📖 Documentação Adicional

Acesse a pasta `/docs` para visualizar a fundamentação teórica e técnica:
*   [Especificações do Domínio (PDD)](./docs/pdd.md)
*   [Guia de Engenharia e Padrões (ACID/SOLID)](./docs/engineering.md)
*   [Arquitetura Macro](./docs/architecture.md)
*   [Diagramas Estruturais (C4 Model)](./docs/c4-model.md)
*   [Fluxo Lógico e de Requisição](./docs/flow.md)
