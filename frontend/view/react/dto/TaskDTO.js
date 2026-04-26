/**
 * TaskDTO — Data Transfer Object da Tarefa
 *
 * Responsabilidade única (Single Responsibility — SOLID):
 * Garantir que nenhum campo inesperado vaze entre camadas.
 * Campos fora da whitelist são descartados silenciosamente.
 */

const ALLOWED_FIELDS = ['id', 'grupo_id', 'titulo', 'descricao', 'status', 'criado_em', 'update_at', 'is_deleted'];

export class TaskDTO {
  constructor(raw = {}) {
    for (const field of ALLOWED_FIELDS) {
      this[field] = raw[field] !== undefined ? raw[field] : undefined;
    }
    // Garante que is_deleted nunca é undefined — padrão false
    this.is_deleted = this.is_deleted ?? false;
    // Normaliza status para o enum esperado pelo backend
    if (this.status && !['pendente', 'concluida'].includes(this.status)) {
      this.status = 'pendente';
    }
  }

  /** Serializa apenas os campos mutáveis para envio ao backend */
  toPayload() {
    return {
      titulo:    this.titulo,
      descricao: this.descricao,
      status:    this.status ?? 'pendente',
      ...(this.grupo_id ? { grupo_id: this.grupo_id } : {}),
    };
  }
}
