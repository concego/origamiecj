/**
 * sections.js - Renderiza seções de conteúdo traduzidas.
 *
 * As páginas Sobre, Acessibilidade e Ajuda exibem listas de seções
 * definidas no dicionário de tradução (ex.: "about.sections").
 * Cada seção tem { title, paragraphs } ou { title, list }.
 */

import { t } from './i18n.js';

/**
 * Renderiza um conjunto de seções dentro de um container.
 * @param {string|HTMLElement} container seletor ou elemento
 * @param {string} keyPrefix chave no dicionário (ex.: "about")
 */
export function renderSections(container, keyPrefix) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return;
  const sections = t(`${keyPrefix}.sections`);
  if (!Array.isArray(sections)) return;
  el.innerHTML = sections
    .map((section) => {
      const paragraphs = (section.paragraphs || [])
        .map((p) => `<p>${escapeHtml(p)}</p>`)
        .join('');
      const list = Array.isArray(section.list)
        ? `<ul>${section.list.map((li) => `<li>${escapeHtml(li)}</li>`).join('')}</ul>`
        : '';
      return (
        `<section class="content-section">` +
        `<h2>${escapeHtml(section.title)}</h2>` +
        paragraphs +
        list +
        `</section>`
      );
    })
    .join('');
}

/**
 * Renderiza uma lista simples (ex.: lista de testes de acessibilidade).
 * @param {string|HTMLElement} container
 * @param {string} key chave no dicionário que contém um array
 */
export function renderList(container, key) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;
  if (!el) return;
  const items = t(key);
  if (!Array.isArray(items)) return;
  el.innerHTML = items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
