/**
 * home.js - Página inicial: renderiza os recursos (features) e os
 * modelos em destaque, com o diagrama do resultado de cada um.
 */

import { initI18n, getLang, t } from './i18n.js';
import { loadAllModels, localize } from './models.js';
import { buildResultState, renderDiagramSvg } from './diagrams.js';
import { formatDuration } from './format.js';

let models = [];

async function boot() {
  await initI18n();
  renderFeatures();
  try {
    models = await loadAllModels();
    renderModels();
  } catch (e) {
    const container = document.querySelector('#home-models');
    if (container) {
      container.innerHTML = `<p class="note note-error">${esc(t('common.error'))}</p>`;
    }
  }
  document.addEventListener('i18n:change', () => {
    renderFeatures();
    renderModels();
  });
}

function renderFeatures() {
  const el = document.querySelector('#home-features');
  if (!el) return;
  const features = t('home.features');
  if (!Array.isArray(features)) return;
  el.innerHTML = features
    .map(
      (f) =>
        `<article class="card">` +
        `<h3>${esc(f.title)}</h3>` +
        `<p>${esc(f.text)}</p>` +
        `</article>`
    )
    .join('');
}

function renderModels() {
  const container = document.querySelector('#home-models');
  if (!container) return;
  if (!models.length) return;
  const lang = getLang();
  container.innerHTML = models
    .map((model) => {
      const state = buildResultState(model);
      const title = localize(model.title, lang);
      const svg = renderDiagramSvg(state, {
        uid: `home-${model.slug}`,
        title: `${title} — ${t('common.result')}`,
        desc: localize(model.result?.description, lang),
      });
      return (
        `<article class="card model-card">` +
        `<h3>${esc(localize(model.title, lang))}</h3>` +
        `<dl class="dl-grid">` +
        `<dt>${esc(t('common.difficulty'))}</dt><dd>${esc(t(`difficulty.${model.difficulty}`))}</dd>` +
        `<dt>${esc(t('common.duration'))}</dt><dd>${formatDuration(model.durationMinutes, lang)}</dd>` +
        `<dt>${esc(t('common.totalSteps'))}</dt><dd>${model.totalSteps}</dd>` +
        `</dl>` +
        `<div class="diagram-wrap">${svg}</div>` +
        `<p><a class="button" href="tutorial.html?model=${encodeURIComponent(model.slug)}">${esc(t('catalog.startTutorial'))}</a></p>` +
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
