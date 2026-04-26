-- =============================================================
-- Schema PostgreSQL — Gerenciador de Tarefas
-- Executa automaticamente na primeira inicialização do container
-- via docker-compose volume (initdb.d)
-- =============================================================

-- Extensão para geração de UUIDs no servidor
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================
-- boards
-- =============================================================
CREATE TABLE IF NOT EXISTS boards (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    nome        TEXT        NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 200),
    descricao   TEXT,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE
);

-- =============================================================
-- quadros  (pertencem a um board)
-- =============================================================
CREATE TABLE IF NOT EXISTS quadros (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    board_id    UUID        NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    nome        TEXT        NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 200),
    descricao   TEXT,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_quadros_board_id ON quadros(board_id) WHERE is_deleted = FALSE;

-- =============================================================
-- grupos  (pertencem a um quadro)
-- =============================================================
CREATE TABLE IF NOT EXISTS grupos (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    quadro_id   UUID        NOT NULL REFERENCES quadros(id) ON DELETE CASCADE,
    nome        TEXT        NOT NULL CHECK (char_length(nome) BETWEEN 1 AND 200),
    cor         TEXT        NOT NULL DEFAULT 'default',
    ordem       INTEGER     NOT NULL DEFAULT 0,
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_grupos_quadro_id ON grupos(quadro_id) WHERE is_deleted = FALSE;

-- =============================================================
-- tasks  (pertencem a um grupo)
-- =============================================================
CREATE TABLE IF NOT EXISTS tasks (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    grupo_id    UUID        REFERENCES grupos(id) ON DELETE SET NULL,
    titulo      TEXT        NOT NULL CHECK (char_length(titulo) BETWEEN 1 AND 500),
    descricao   TEXT        NOT NULL DEFAULT '',
    status      TEXT        NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluida')),
    criado_em   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    update_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    is_deleted  BOOLEAN     NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_tasks_grupo_id   ON tasks(grupo_id)  WHERE is_deleted = FALSE;
CREATE INDEX IF NOT EXISTS idx_tasks_status     ON tasks(status)    WHERE is_deleted = FALSE;

-- =============================================================
-- Trigger: atualiza update_at automaticamente em cada UPDATE
-- =============================================================
CREATE OR REPLACE FUNCTION set_update_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.update_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_tasks_update_at ON tasks;
CREATE TRIGGER trg_tasks_update_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_update_at();
