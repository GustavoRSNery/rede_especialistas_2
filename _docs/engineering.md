# Especificações de Engenharia de Software

Este documento define as diretrizes rigorosas de engenharia que guiam a construção do Gerenciador de Tarefas, focando em segurança, alta performance e resiliência.

## 1. Princípios e Padrões Base

### 1.1 SOLID e Arquitetura Hexagonal
Tanto o backend quanto o frontend devem seguir os princípios **SOLID** para garantir manutenibilidade e escalabilidade.
A aplicação usará a **Arquitetura Hexagonal (Ports and Adapters)**:
*   **Core (Domínio):** Regras de negócio puras, isoladas de qualquer framework ou banco de dados.
*   **Ports (Portas):** Interfaces que definem como o mundo externo se comunica com o Domínio (ex: Repositórios, Casos de Uso).
*   **Adapters (Adaptadores):** Implementações concretas (ex: Conexão PostgreSQL, Controladores FastAPI/Flask, Chamadas HTTP externas).

### 1.2 Transações ACID
O banco de dados relacional (PostgreSQL) deve operar estritamente sob as propriedades ACID:
*   **Atomicidade:** Transações são "tudo ou nada".
*   **Consistência:** Os dados devem ser válidos segundo os esquemas.
*   **Isolamento:** Transações simultâneas não interferem entre si.
*   **Durabilidade:** Dados salvos não se perdem.

Não utilizaremos **ORM (Object-Relational Mapping)**. As consultas serão feitas de forma nativa (Raw SQL) utilizando Prepared Statements para garantir performance máxima, controle exato do plano de execução e prevenção total contra SQL Injection. Os retornos serão tipados e validados pelo **Pydantic**.

## 2. Segurança e Comunicação entre Microsserviços

Sendo dois microsserviços distintos (Front e Back) orquestrados por uma rede interna no Docker, a comunicação exige padrões criptográficos e de validação de estado altamente rigorosos.

### 2.1 Proxy Reverso Universal (Nginx)
O sistema não expõe o Backend de forma alguma. Um Nginx servirá como API Gateway/Proxy Reverso, gerenciando a entrada do cliente apenas para a rota pública, e fazendo proxy seguro internamente para a API do backend. 

### 2.2 mTLS (Mutual TLS)
A comunicação HTTP entre os contêineres na rede interna exigirá certificados bilaterais. Tanto o Frontend precisa provar quem é para o Backend, quanto o Backend deve provar quem é para o Frontend, evitando *Man-in-the-Middle* mesmo em rede isolada.

### 2.3 Nonce (Number Used Once)
Todas as requisições que alterem estado (POST, PUT, DELETE) devem trafegar um `nonce` (UUID randômico único). O destino deve validar em cache (Redis) se este nonce já foi processado. Isso previne **Replay Attacks** (ataques de repetição).

### 2.4 Idempotência
Todas as APIs críticas suportarão chaves de idempotência (fornecidas via Header: `Idempotency-Key`). Se um erro de rede ocorrer e a mesma requisição for disparada pelo cliente, o backend não duplicará o registro, apenas retornará a resposta já processada na primeira chamada.

### 2.5 TTL (Time to Live)
Tokens, Nonces, e payloads encriptados terão um limite de tempo muito curto de validade definido via TTL. Requisições atrasadas ou interceptadas antigas serão brutalmente rejeitadas.

## 3. Contratos de Dados (DTOs e Pydantic)

*   **Pydantic:** No Python, toda a camada de *Schemas* de entrada (Requests) e saída (Responses) passará por entidades validadoras puras do Pydantic. Validação estrita de tipos e sanitização de inputs.
*   **DTOs (Data Transfer Objects):** No Frontend, utilizaremos classes/interfaces estritas para tipar qualquer dado originado no Backend ou enviado para o Backend. Nada de `any` ou objetos dinâmicos vagos.

## 4. Performance

*   **Cache de Front-Edge:** Utilizaremos **Redis** no ambiente frontend para reter requisições estáticas ou estado passageiro, balanceando as requisições diretas ao banco do Back.
*   **Lazy Loading:** O Frontend (React) utilizará Code Splitting e Lazy Loading por rota/componente, carregando os recursos sob demanda estrita para diminuir o Time To Interactive (TTI).
