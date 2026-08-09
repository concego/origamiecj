/**
 * models.js - Carregamento dos dados dos modelos.
 *
 * Os modelos vivem em data/models/<slug>.json (dados separados da
 * interface). Para adicionar um modelo, basta criar o arquivo e incluir
 * o slug em data/models/index.json — a aplicação principal não muda.
 */

import { SUPPORTED_LANGS } from './config.js';

/**
 * Lê a lista de slugs em data/models/index.json.
 * @returns {Promise<string[]>}
 */
export async function listModelSlugs() {
  const res = await fetch('data/models/index.json');
  if (!res.ok) throw new Error(`index.json HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.models) ? data.models : [];
}

/**
 * Carrega um modelo completo.
 * @param {string} slug
 * @returns {Promise<object>}
 */
export async function loadModel(slug) {
  const res = await fetch(`data/models/${slug}.json`);
  if (!res.ok) throw new Error(`${slug}.json HTTP ${res.status}`);
  return res.json();
}

/**
 * Carrega todos os modelos do catálogo.
 * @returns {Promise<object[]>}
 */
export async function loadAllModels() {
  const slugs = await listModelSlugs();
  const models = await Promise.all(slugs.map((slug) => loadModel(slug)));
  return models;
}

/**
 * Retorna o valor de um campo traduzido (objeto { pt, en }).
 * Usa o idioma atual e cai para o idioma padrão se faltar.
 * @param {object|string|undefined} field
 * @param {string} lang idioma atual
 * @returns {string}
 */
export function localize(field, lang) {
  if (field == null) return '';
  if (typeof field === 'string') return field;
  if (lang && field[lang]) return field[lang];
  for (const l of SUPPORTED_LANGS) {
    if (field[l]) return field[l];
  }
  return '';
}
