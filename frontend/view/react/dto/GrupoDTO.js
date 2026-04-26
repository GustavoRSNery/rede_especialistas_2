/**
 * GrupoDTO — Data Transfer Object do Grupo de Atividades (pertence a um Quadro)
 * Descarta qualquer campo fora da whitelist antes de trafegar entre camadas.
 */
const ALLOWED_FIELDS = ['id', 'quadro_id', 'nome', 'cor', 'ordem', 'is_deleted'];

export class GrupoDTO {
  constructor(raw = {}) {
    for (const field of ALLOWED_FIELDS) {
      this[field] = raw[field] !== undefined ? raw[field] : undefined;
    }
    this.is_deleted = this.is_deleted ?? false;
    this.cor   = this.cor   ?? 'default';
    this.ordem = this.ordem ?? 0;
  }

  toPayload() {
    return {
      nome:  this.nome,
      cor:   this.cor   ?? 'default',
      ordem: this.ordem ?? 0,
    };
  }
}
