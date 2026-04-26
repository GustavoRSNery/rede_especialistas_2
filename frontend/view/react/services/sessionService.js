/**
 * sessionService.js — Gerencia o ID de sessão do usuário no localStorage
 *
 * Gera um UUID v4 único na primeira visita e persiste no localStorage.
 * Esse ID é enviado como header X-Session-ID nas requisições ao BFF,
 * permitindo que o Redis rastreie quais quadros cada usuário acessou
 * para o algoritmo LRU de cache.
 *
 * Nota: não é autenticação — é apenas uma chave de afinidade de cache.
 */

import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 're_session_id';

/** Retorna o ID de sessão do usuário, criando um novo se não existir. */
export function getSessionId() {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = uuidv4();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
