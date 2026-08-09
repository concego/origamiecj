/**
 * format.js - Formatação de valores exibidos ao usuário.
 */

/** Formata uma duração em minutos. */
export function formatDuration(minutes, lang) {
  const n = Number(minutes) || 0;
  if (n <= 1) {
    return lang === 'pt-BR' ? '1 minuto' : '1 minute';
  }
  const unit = lang === 'pt-BR' ? 'minutos' : 'minutes';
  return `${n} ${unit}`;
}
