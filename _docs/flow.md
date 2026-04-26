# Documento de Fluxo do Projeto

Este documento descreve detalhadamente o ciclo de vida das requisições e a interação comportamental entre os diversos componentes do Gerenciador de Tarefas.

## 1. Fluxo de Usuário (Acesso Inicial)

1.  **Requisição do Cliente:** O usuário acessa a URL pública hospedada (ex: `http://localhost/`).
2.  **Interceptação Nginx (Proxy/Gateway):** O serviço Nginx na rede pública atende a requisição.
3.  **Entrega do Estático (React):** O Nginx retorna os arquivos compilados de UI (HTML/JS/CSS). O Frontend React inicializa o DOM.
4.  **Lazy Loading:** Quando o usuário navega (ex: Carregamento do painel principal vs painel de relatórios/lixeira), os pacotes (chunks) específicos da view são carregados assincronamente pelo navegador (Lazy Loading), preservando a velocidade da primeira renderização.

## 2. Ciclo de Vida de uma Ação Rest (Ex: Criar uma Tarefa)

Este é o fluxo rigoroso de tráfego de dados para uma operação que requer comunicação síncrona segura de ponta a ponta.

1.  **Interação (Front-end):** O usuário preenche o formulário para adicionar uma tarefa preenchendo *título* e *descrição*.
2.  **Transformação DTO:** Os Hooks do React envelopam essas informações em um **Data Transfer Object (DTO)**, tipado e com chaves pré-validadas.
3.  **Injeção de Segurança HTTP:**
    *   O serviço HTTP do React gera um `Nonce` (UUID randômico único).
    *   O serviço assina o header da requisição com a `Idempotency-Key` atrelada à ação em si.
4.  **Transporte via Proxy:** O Payload é enviado via `$API_URL/tasks`. O Nginx intercepta o tráfego HTTP, valida internamente as definições SSL e realiza proxy reverso encaminhando o pacote para o IP interno do contêiner do Backend em `private_net`.
5.  **Recepção no Backend e Controle Redis:**
    *   O Backend (Python) recebe a requisição.
    *   **Ação de Cache/Segurança:** O Back interage primeiro com o cache (Redis). Ele consulta se a *Idempotency-Key* fornecida já teve uma resposta de sucesso cacheada nos minutos recentes (TTL).
    *   Ele valida o `Nonce` no Redis. Se o *Nonce* já foi recebido antes, ele aborta a requisição sinalizando falha de segurança ou processamento repetido (Replay Attack).
6.  **Validação Pura (Pydantic):** Confirmada a legitimidade sistêmica, a requisição em JSON ("Adapters") passa pelas validações sólidas das entidades Pydantic ("Ports/Domain"). Se rejeitado: *422 Unprocessable Entity*. Se válido, repassa as informações para o Repositório persistente.
7.  **Persistência ACID:** O Adaptador do Repositório traduz as ordens em sentenças "Raw SQL", com "Prepared Statements", e injeta no **PostgreSQL** por meio de uma transação. Apenas com a aprovação final (Commit SQL) do banco, os dados se tornam definitivos.
8.  **Retorno da Requisição:** Os dados convertidos das instâncias de Postgre voltam para Pydantic (Serialização), via Proxy (Nginx) sendo devolvidos aos status de resposta do React atualizando a tela imediatamente e encerram a conexão (código *201 Created*).

## 3. Dinâmica Diferenciada: Rotas Webhook (Notificação Assíncrona via Background)

Este fluxo difere da rota tradicional. Serve para atividades pesadas (como gerar longos relatórios ou requerer informações processadas por rotinas em background).

1.  O Frontend dispara a solicitação para processamento e recebe como resposta síncrona imediata um `202 Accepted` associando aquele pedido a uma *Id de Processo (Job ID)*.
2.  Posteriormente, o Backend atua em sua própria rotina computacional sem segurar a interface do usuário travada carregando chamadas.
3.  Quando finalizado, o Backend dispara internamente via Webhook Payload o resultado formatado de volta para um *Endpoint Recurso Listener* também mapeado entre os serviços ou exposto localmente.
4.  No frontend real, isso seria notificado ao cliente usando conexões dinâmicas via websocket ou fetch de long polling informando de forma assíncrona "Seu relatório de Tarefas de 2025 está pronto".

## 4. O Fluxo de Exclusão Lógica (*Soft-Delete*)

Se o comando do front for excluir (`DELETE /tasks/{id}`):
1.  **Exclusão Segura:** Em conformidade com a manutenção rigorosa e estabilidade de dados vitais ao negócio, o item não recebe uma injeção de comando `DELETE` nativo do SQL.
2.  **Regra do Domínio:** O Domínio processa apenas a substituição da Flag interna do objeto `is_deleted` para `True` e altera o Timestamp de `update_at`.
3.  **Aplicação do Banco:** No PostgreSQL ocorre apenas um `UPDATE tasks SET is_deleted=TRUE WHERE id=$1`.
4.  O Frontend passa estritamente a ocultar nas buscas filtradas registros com a *Flag: is_deleted*, garantindo total histórico em relatórios de backoffice caso necessitássemos de recuperação em massa ou integridade analítica, e honrando a premissa de um *Soft-Delete*.