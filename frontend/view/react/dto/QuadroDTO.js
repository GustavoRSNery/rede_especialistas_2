/**
 * QuadroDTO — Data Transfer Object do Quadro (pertence a um Board)
 * Descarta qualquer campo fora da whitelist antes de trafegar entre camadas.
 */
const ALLOWED_FIELDS = ['id', 'board_id', 'nome', 'descricao', 'criado_em', 'is_deleted'];

export class QuadroDTO {
  constructor(raw = {}) {
    for (const field of ALLOWED_FIELDS) {
      this[field] = raw[field] !== undefined ? raw[field] : undefined;
    }
    this.is_deleted = this.is_deleted ?? false;
  }

  toPayload() {
    return {
      nome: this.nome,
      descricao: this.descricao ?? '',
    };
  }
}
