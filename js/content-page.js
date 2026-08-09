/**
 * content-page.js - Renderiza as páginas de conteúdo estático
 * (Sobre, Acessibilidade, Ajuda) a partir dos dicionários de tradução.
 */

import { initI18n, getLang, t } from './i18n.js';
import { renderSections, renderList } from './sections.js';

async function boot() {
  await initI18n();
  const page = document.body.getAttribute('data-page');

  if (page === 'about') {
    renderSections('#about-sections', 'about');
  } else if (page === 'accessibility') {
    renderSections('#accessibility-sections', 'accessibility');
    renderList('#accessibility-testing-list', 'accessibility.testingList');
  } else if (page === 'help') {
    renderHelpFaq();
  }

  document.addEventListener('i18n:change', () => {
    if (page === 'about') {
      renderSections('#about-sections', 'about');
    } else if (page === 'accessibility') {
      renderSections('#accessibility-sections', 'accessibility');
      renderList('#accessibility-testing-list', 'accessibility.testingList');
    } else if (page === 'help') {
      renderHelpFaq();
    }
  });
}

function renderHelpFaq() {
  const el = document.querySelector('#help-sections');
  if (!el) return;
  const sections = t('help.sections');
  if (!Array.isArray(sections)) return;
  el.innerHTML = sections
    .map((section) => {
      const paragraphs = (section.paragraphs || [])
        .map((p) => `<p>${esc(p)}</p>`)
        .join('');
      return `<details><summary>${esc(section.title)}</summary>${paragraphs}</details>`;
    })
    .join('');
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

boot();
