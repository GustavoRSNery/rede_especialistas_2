# Arquitetura C4 Model (C4-PlantUML/Mermaid)

Este documento centraliza visualmente as decisões de engenharia arquitetural usando o Nível C4 de abstração para aprofundar e materializar o fluxo, com a sintaxe do *Mermaid*.

---

## 1. Nível 1: Diagrama de Contexto (Context)
*Visão macro de como o usuário final enxerga e interage com todo o sistema, sem visualizar divisões técnicas internas.*

```mermaid
C4Context
title Diagrama de Contexto (Nível 1) - Sistema Gerenciador de Tarefas

Person(user, "Usuário", "Pessoa que gerencia o fluxo de trabalho e suas tarefas")
System(task_system, "Sistema Gerenciador de Tarefas", "Plataforma conteinerizada que permite visualização, criação, edição e exclusão de tarefas em tempo real")

Rel(user, task_system, "Visita a página web, gerencia fluxos via interface e consome os dados listados", "HTTPS")
```

---

## 2. Nível 2: Diagrama de Contêineres (Containers)
*Evidenciando toda a infraestrutura física/lógica mapeada no Docker (O Frontend, o Proxy Gateway, o Backend e os Bancos PostgreSQL/Redis).*

```mermaid
C4Container
title Diagrama de Contêineres (Nível 2) - Isolamento via Proxy Reverso e Serviços Separados

Person(user, "Usuário", "Navegação via browser / Client HTTP")

System_Boundary(system, "Gerenciador de Tarefas (Docker Context)") {
    Container(nginx, "Proxy Gateway (Nginx)", "Nginx, SSL/TLS", "Única porta pro mundo real. Orquestra Load Balancing, roteamento estrito e Proxy Pass de API (Rede Pública)")
    
    Container(front, "Serviço Frontend App", "React, JS/TS", "Entrega a UI final rica, carrega as regras visuais da tarefa (Lazy Loaded) e os DTOs")
    
    Container(back, "Serviço de Processamento (Backend)", "Python (FastAPI/Flask)", "Microsserviço contendo todas as regras de negócios de manipulação das Tarefas")
    
    ContainerDb(redis, "Banco em Memória / Session", "Redis", "Monitoria de cache efêmero, estado de Sessões, validação de Nonce e proteção Idempotente das APIs")
    
    ContainerDb(database, "Banco Relacional (PostgreSQL)", "PostgreSQL", "Segurando as Propriedades ACID para persistência de alta fidelidade e esquemas estruturados rígidos das Tasks")
}

Rel(user, nginx, "Acessa URLs e interage de forma externa.", "HTTPS")
Rel(nginx, front, "Baixa/Serve chunks da interface JS/CSS estáticos", "Volume Físico / Local")
Rel(front, back, "Trafega endpoints /api e /webhook com bloqueios seletivos", "Proxy reverso, mTLS")
Rel(back, front, "Trafega o resultado de processamento das requisições geradas pelo Front", "Proxy reverso mTLS")
Rel(front, nginx, "Gera os request contendo UUID Nonce e Idempotency-Key", "HTTPS Request")
Rel(front, redis, "Processa validações de estado seguras em velocidade sub-milisegundo e mitiga Replay Attacks", "Socket / TCP")
Rel(redis, front, "Retorna enfileiramento para o banco de dados em função react, e também informações rapidas para o front", "Socket / TCP")
Rel(back, database, "Comando executado via chamadas Nativas SQL Prepared", "TCP")
Rel(database, back, "Comando executado via chamadas Nativas SQL Prepared", "TCP")
```

---

## 3. Nível 3: Diagrama de Componentes (Components)
*Um mergulho "Zoom-In" abrindo o Contêiner do **Backend (Python)** detalhando seus módulos internos baseados na Arquitetura Hexagonal adotada.*

```mermaid
C4Component
title Diagrama de Componentes (Nível 3) - Visão Interna do Microsserviço Backend Python

Container_Boundary(back, "Microsserviço de Processamento (Backend)") {
    Component(http_adapter, "Rotas / HTTP Adapters", "Framework (FastAPI/Flask)", "Exposto aos chamados do Nginx. Lida com Extração Headers, Invocação e Resoluções HTTP 200/201/404/422")
    
    Component(pydantic, "Camada de Sanitary Models / DTOs", "Pydantic Models", "Intercepta o tráfego que chega na Rota. Se violado quebra a rotina protegendo o Domínio de anomalias dinâmicas do JSON.")
    
    Component(core, "Domínio / Casos de Uso (Hexagonal Core)", "Python Puro", "Camada 100% isolada e de grande abstração; onde as validações lógicas da Tarefa e de negócios atuam ('Não apagar, usar is_deleted', etc)")
    
    Component(repo_port, "Ports (Output Interfaces)", "Interfaces/ABCs", "Ponte abstrata que define como o core da aplicação espera conversar com qualquer fonte de dados.")
    
    Component(pg_adapter, "PostgreSQL Database Adapter", "Driver Postgres + SQL Puro", "Implementador fidedigno das Ports de Outbound. Responsavel pela conexão ao BD, inserção manual prevenida por ACID via sentenças nativas formatadas.")
}

Container(nginx, "Nginx Proxy", "Gateway", "Portão exterior da rede fechada")
ContainerDb(postgres, "PostgreSQL", "Relacional", "Disco permanente das instâncias das Tarefas")

Rel(nginx, http_adapter, "Dispara Request JSON")
Rel(http_adapter, pydantic, "Entrega Raw JSON pra gerar a Entidade Concreta Segura")
Rel(pydantic, core, "Envia as validações pro processamento lógico puro")
Rel(core, repo_port, "Usa o contrato (Acessos via Abstração)")
Rel(pg_adapter, repo_port, "Herda/Implementa os Port Standards para que o Core fale com o Mundo Exterior")
Rel(pg_adapter, postgres, "Comunica Transações nativas via Raw SQL Seguras pelo ambiente Hexagonal no Driver", "Postgres TCP")
```

---

## 4. Nível 4: Diagrama de Código (Code - Class Strategy)
*O menor nível do C4 foca na estrutura das Classes/Code do domínio no Python em si, materializando O PORQUÊ do Padrão da Arquitetura Hexagonal proteger nossas premissas nativas.*

```mermaid
classDiagram
direction BT

namespace AdapterCamadaInfra {
    class PostgreSQLTaskAdapter {
        - connectionParamString
        + create_task_in_db(taskDTO) : dict
        + update_task_flag_in_db(taskID, updateQuery) : dict
    }
}

namespace InterfaceCamadaPorta {
    class ITaskRepository {
        <<Interface>>
        + create_task_in_db(task)*
        + update_task_flag_in_db(task_id)*
    }
}

namespace CamadaDominio {
    class TaskUseCase {
        - ITaskRepository repo
        + __init__(ITaskRepository repo)
        + handle_create_new_task(payload: PydanticTaskInbound) : TaskResult
        + handle_soft_delete(task_uuid: UUID) : Boolean
    }
    
    class TaskEntity {
        <<Entity>>
        + uuid: UUID
        + titulo: String
        + descricao: String
        + status: Enum(pendente, concluida)
        + update_at: Datetime
        + criado_em: Datetime
        + is_deleted: Boolean
        + soft_delete()
        + promote_status()
    }
}

PostgreSQLTaskAdapter ..|> ITaskRepository : <<Implementa contrato ditado pela Port!>>
TaskUseCase --> ITaskRepository : <<Injeta Inversão de dependência (Liskov) / Adaptador DB>>
TaskUseCase --> TaskEntity : <<Controla alterações do objeto em Memória>>
```