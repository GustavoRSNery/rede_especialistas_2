# Desafio Técnico — Desenvolvedor

> **Entrega:** envie o link do seu repositório por e-mail ou pelo canal combinado

---

## O que você vai construir

Um **Gerenciador de Tarefas** com backend Python, frontend React e containerização via Docker.

O projeto deve funcionar inteiramente com **um único comando:**

```bash
docker compose up --build
```

---

## Requisitos

### Tarefa

Cada tarefa deve ter os seguintes campos:

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | inteiro ou UUID | Identificador único |
| `titulo` | string | Título da tarefa |
| `descricao` | string | Detalhes da tarefa |
| `status` | enum | `pendente` ou `concluida` |
| `criado_em` | datetime | Data de criação |
| `update_at` | datetime | Data de atualização |
| `is_deleted` | Bool | Boleano de task deletada |

### Backend — Python (FastAPI ou Flask)

- `GET /tasks` — lista todas as tarefas
- `POST /tasks` — cria uma nova tarefa
- `PUT /tasks/{id}` — atualiza uma tarefa existente
- `DELETE /tasks/{id}` — remove uma tarefa
- Retornar os status HTTP corretos (200, 201, 404, 422…)
- CORS configurado para o frontend conseguir consumir a API
- Persistência simples: SQLite ou arquivo JSON são suficientes

### Frontend — React

- Listar todas as tarefas
- Criar uma nova tarefa via formulário
- Marcar tarefa como concluída / pendente
- Excluir uma tarefa
- A **URL da API deve vir de variável de ambiente** — não deixe `localhost:8000` hardcoded no código

### Docker

- `Dockerfile` separado para o backend
- `Dockerfile` separado para o frontend
- `docker-compose.yml` orquestrando os dois serviços
- Variáveis de ambiente definidas no `docker-compose.yml`
- O projeto deve subir do zero com `docker compose up --build` sem nenhuma configuração manual adicional

---

## Diferenciais (não obrigatórios) [PARA A GENTE É OBRIGATORIO]

Não são eliminatórios, mas mostram capricho:

- Testes unitários no backend com `pytest`
- Filtro de tarefas por status no frontend
- Build multi-stage no Dockerfile do frontend (`build → nginx`)
- README com instruções detalhadas do projeto

---

## Estrutura sugerida

Não existe estrutura obrigatória, mas algo como o exemplo abaixo é um bom ponto de partida: [Vamos melhorar esta estrutura]

- Eu falando... aqui vamos precisar construir não so dois modulos, mas também dois serviços completamente independentes.
 Seguindo a arquitetura hexagonal de micro serviços.
 precisamos em back-end, construir uma rota webhook e uma rota de chamada API para enviar os dados tratados e/ou dados puxados do banco de dados para o front

 E já no front, vamos precisar de uma rota webhook de padrão junto com uma rota de chamada api por padrão, pois a chamada api vai enviar os dados para o backend tratar e/ou puxar os dados do banco de dados.

 Porem com tudo entretanto, os dois micro serviços vao ficar dentro de um serviço unico geral, e a unica parte publica sera o front end, para isto acontecer da melhor forma possivel vamos aplicar a conexão dos microserviços com dois .env diferentes informando a url de conexão entre eles, ou seja ambos naturalmente vao ter conhecimento para onde fazer e receber a requisição, e somente vao receber / enviar para essas rotas.

 ok, mas um usuario acessando apenas o front, oq impede ele de acessar o back-and atravez de uma captura de env via ataque? vamos utulizar proxy reverso para comunicação entre o front e o back.... vai ser um arquivo nginx unico para todo o projeto, ele vai orquestrar a parte publica com o cliente, e proteger o backend de ataques / chamadas de outros lugares.

- eu falando sobre a engenharia agora:
 precisamos de idempotencia, mtls, ttl e nonce entre os micro serviços.
  e para front -> cliente vamos trabalhar com DTOs e mais alguma sugestão.
 vamos trabalhar com os templates ACID e SOLID juntamente com a arquitetura hexagonal, isso vai trazer robustez.
 lazy loading obrigatorio.

 para os modelos, vamos trabalhar com pydantic para os models e schemas (banco de dados)

 agora para os serviços de banco de dados, vamos ter 2, um container postgree como ja falei no inicio para o back-end, e um conteiner redis para o front. n vamos usar ORMs, pois precisamos de 'ACID' e velocidade, e garantia de não ter o risco de SQL injection.

 com isto, vamos prosseguir para a primeira etapa da construção

 

```
.
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py
│       ├── routes/
│       └── models/
|
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       └── components/
└── docker-compose.yml
```

---

## Critérios de avaliação

Vamos olhar principalmente para:

1. **Funcionamento** — o projeto sobe e funciona como descrito
2. **Organização** — estrutura de arquivos, separação de responsabilidades
3. **Qualidade do código** — legibilidade, ausência de código morto, tratamento de erros
4. **Docker** — as imagens constroem corretamente e os serviços se comunicam
5. **Git** — histórico de commits claro e incremental

---
