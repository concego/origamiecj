/**
 * catalog.js - Página de catálogo: filtros e lista de modelos.
 *
 * Filtros: dificuldade, tipo de modelo, tempo estimado, número de
 * etapas e idioma. Os filtros não dependem apenas de cor: cada cartão
 * traz o texto completo com as informações.
 */

import { initI18n, getLang, t, applyI18n } from './i18n.js';
import { loadAllModels, localize } from './models.js';
import { buildResultState, renderDiagramSvg } from './diagrams.js';
import { formatDuration } from './format.js';
import { getProgress } from './progress.js';

let models = [];
let currentFilter = {
  query: '',
  difficulty: 'all',
  type: 'all',
  time: 'all',
  steps: 'all',
  language: 'all',
  use: 'all',
};

async function boot() {
  await initI18n();
  const form = document.querySelector('#catalog-filters');
  if (form) {
    form.addEventListener('change', (e) => {
      if (!e.target.name) return;
      currentFilter[e.target.name] = e.target.value;
      renderResults();
    });
    const search = form.querySelector('[name="query"]');
    if (search) {
      search.addEventListener('input', () => {
        currentFilter.query = search.value;
        renderResults();
      });
    }
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      resetFilters(form);
    });
  }
  try {
    models = await loadAllModels();
    renderResults();
  } catch (e) {
    const container = document.querySelector('#catalog-results');
    if (container) {
      container.innerHTML = `<p class="note note-error">${esc(t('common.error'))}</p>`;
      container.setAttribute('aria-busy', 'false');
    }
  }
  document.addEventListener('i18n:change', () => {
    applyI18n();
    renderResults();
  });
}

function resetFilters(form) {
  currentFilter = {
    query: '',
    difficulty: 'all',
    type: 'all',
    time: 'all',
    steps: 'all',
    language: 'all',
    use: 'all',
  };
  const search = form.querySelector('[name="query"]');
  if (search) search.value = '';
  form.querySelectorAll('select').forEach((sel) => {
    sel.value = 'all';
  });
  renderResults();
}

function matchesTimeBucket(minutes, bucket) {
  if (bucket === 'all') return true;
  if (bucket === 'short') return minutes <= 5;
  if (bucket === 'medium') return minutes > 5 && minutes <= 10;
  if (bucket === 'long') return minutes > 10;
  return true;
}

function matchesStepsBucket(steps, bucket) {
  if (bucket === 'all') return true;
  if (bucket === 'short') return steps <= 5;
  if (bucket === 'medium') return steps > 5 && steps <= 10;
  if (bucket === 'long') return steps > 10;
  return true;
}

function modelSearchText(model) {
  return [
    localize(model.title, 'pt-BR'),
    localize(model.title, 'en'),
    localize(model.description, 'pt-BR'),
    localize(model.description, 'en'),
    model.category,
    ...(model.uses || []),
  ].join(' ').toLocaleLowerCase();
}

function filterModels() {
  const f = currentFilter;
  const query = f.query.trim().toLocaleLowerCase();
  return models.filter((model) => {
    if (query && !modelSearchText(model).includes(query)) return false;
    if (f.difficulty !== 'all' && model.difficulty !== f.difficulty) return false;
    if (f.type !== 'all' && model.category !== f.type) return false;
    if (f.use !== 'all' && !(model.uses || []).includes(f.use)) return false;
    if (!matchesTimeBucket(model.durationMinutes, f.time)) return false;
    if (!matchesStepsBucket(model.totalSteps, f.steps)) return false;
    if (f.language !== 'all') {
      // Os modelos usam `pt` para representar o idioma pt-BR.
      const languageKey = f.language === 'pt-BR' ? 'pt' : f.language;
      if (!(model.title[languageKey] && model.steps[0] && model.steps[0].title[languageKey])) {
        return false;
      }
    }
    return true;
  });
}

function renderResults() {
  const container = document.querySelector('#catalog-results');
  const empty = document.querySelector('#catalog-empty');
  const count = document.querySelector('#catalog-count');
  if (!container) return;

  const filtered = filterModels();
  const lang = getLang();

  count.textContent =
    filtered.length === 0
      ? ''
      : filtered.length === 1
        ? t('catalog.resultsCountOne')
        : t('catalog.resultsCount', { n: filtered.length });

  if (filtered.length === 0) {
    container.innerHTML = '';
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;

  container.innerHTML = filtered
    .map((model) => {
      const progress = getProgress(model.slug);
      const state = buildResultState(model);
      const title = localize(model.title, lang);
      const uses = (model.uses || []).map((use) => t(`use.${use}`)).join(', ');
      const svg = renderDiagramSvg(state, {
        uid: `cat-${model.slug}`,
        title: `${title} — ${t('common.result')}`,
        desc: localize(model.result?.description, lang),
      });
      const continueLink = progress
        ? `<a class="button" href="tutorial.html?model=${encodeURIComponent(model.slug)}#/passo/${progress.step}">${esc(t('catalog.continueTutorial'))} (${progress.step}/${model.totalSteps})</a>`
        : `<a class="button" href="tutorial.html?model=${encodeURIComponent(model.slug)}">${esc(t('catalog.startTutorial'))}</a>`;
      return (
        `<article class="card model-card">` +
        `<h3>${esc(localize(model.title, lang))}</h3>` +
        `<p>${esc(localize(model.description, lang))}</p>` +
        `<dl class="dl-grid">` +
        `<dt>${esc(t('common.difficulty'))}</dt><dd>${esc(t(`difficulty.${model.difficulty}`))}</dd>` +
        `<dt>${esc(t('common.type'))}</dt><dd>${esc(t(`category.${model.category}`))}</dd>` +
        `<dt>${esc(t('catalog.use'))}</dt><dd>${esc(uses)}</dd>` +
        `<dt>${esc(t('common.duration'))}</dt><dd>${formatDuration(model.durationMinutes, lang)}</dd>` +
        `<dt>${esc(t('common.totalSteps'))}</dt><dd>${model.totalSteps}</dd>` +
        `</dl>` +
        `<div class="diagram-wrap">${svg}</div>` +
        `<p>${continueLink}</p>` +
        `</article>`
      );
    })
    .join('');

  container.setAttribute('aria-busy', 'false');
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

boot();
