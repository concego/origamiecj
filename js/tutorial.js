/**
 * tutorial.js - Página de tutorial.
 *
 * Renderiza o modelo completo: informações, resultado, etapas com
 * diagramas acessíveis, modos de exibição (visual/descritivo/ambos),
 * progresso salvo localmente e navegação entre etapas.
 *
 * Acessibilidade:
 * - anuncia a etapa atual e o total (aria-live);
 * - move o foco para o título da etapa apenas por ação do usuário;
 * - todos os controles são botões reais com nomes acessíveis;
 * - os diagramas têm <title>/<desc> e descrição textual equivalente;
 * - o progresso fica salvo no navegador, sem envio de dados.
 */

import { initI18n, getLang, t, applyI18n } from './i18n.js';
import { loadModel, localize } from './models.js';
import { buildRenderState, buildResultState, renderDiagramSvg } from './diagrams.js';
import { formatDuration } from './format.js';
import {
  getProgress,
  setStep,
  clearModelProgress,
  clearAllProgress,
  storageAvailable,
} from './progress.js';
import { announce } from './components.js';
import { STORAGE_KEYS } from './config.js';

const ROOT = '#tutorial-root';

let model = null;
let lang = 'pt-BR';
let currentStep = 1;
let displayMode = 'both';

async function boot() {
  await initI18n();
  lang = getLang();
  displayMode = loadDisplayMode();

  const slug = new URLSearchParams(window.location.search).get('model');
  if (!slug) {
    renderNotFound();
    return;
  }

  try {
    model = await loadModel(slug);
  } catch (e) {
    renderNotFound();
    return;
  }

  const saved = getProgress(model.slug);
  currentStep = readStepFromHash() || (saved ? saved.step : 1);
  currentStep = clamp(currentStep, 1, model.totalSteps);

  renderFull();

  window.addEventListener('hashchange', () => {
    const fromHash = readStepFromHash();
    if (fromHash && fromHash !== currentStep) {
      currentStep = clamp(fromHash, 1, model.totalSteps);
      renderFull();
    }
  });

  document.addEventListener('i18n:change', () => {
    lang = getLang();
    renderFull();
  });
}

/**
 * Re-renderiza toda a página do tutorial (shell + etapa atual).
 * Usado no carregamento, na troca de idioma e na navegação por hash.
 */
function renderFull() {
  const root = document.querySelector(ROOT);
  if (!root || !model) return;
  root.innerHTML = buildShell(model);
  bindControls();
  renderStep({ focusHeading: false });
}

/* ------------------------------------------------------------------ */
/* Modo de exibição                                                     */
/* ------------------------------------------------------------------ */

function loadDisplayMode() {
  try {
    const m = window.localStorage.getItem(STORAGE_KEYS.displayMode);
    if (m === 'visual' || m === 'descriptive' || m === 'both') return m;
  } catch (e) {
    // segue
  }
  return 'both';
}

function saveDisplayMode() {
  try {
    window.localStorage.setItem(STORAGE_KEYS.displayMode, displayMode);
  } catch (e) {
    // ignora
  }
}

/* ------------------------------------------------------------------ */
/* Estrutura                                                            */
/* ------------------------------------------------------------------ */

function buildShell(m) {
  const title = localize(m.title, lang);
  return (
    `<nav class="breadcrumb" aria-label="${esc(t('common.backToCatalog'))}">` +
    `<ol>` +
    `<li><a href="index.html">${esc(t('nav.home'))}</a></li>` +
    `<li><a href="catalogo.html">${esc(t('nav.catalog'))}</a></li>` +
    `<li aria-current="page">${esc(title)}</li>` +
    `</ol>` +
    `</nav>` +
    `<h1>${esc(title)}</h1>` +
    `<p>${esc(localize(m.description, lang))}</p>` +
    `<p class="credit-line">${esc(localize(m.credit, lang))}</p>` +
    `<section aria-labelledby="meta-title">` +
    `<h2 id="meta-title">${esc(t('tutorial.metaTitle'))}</h2>` +
    `<dl class="dl-grid">` +
    `<dt>${esc(t('common.difficulty'))}</dt><dd>${esc(t(`difficulty.${m.difficulty}`))}</dd>` +
    `<dt>${esc(t('common.type'))}</dt><dd>${esc(t(`category.${m.category}`))}</dd>` +
    `<dt>${esc(t('common.duration'))}</dt><dd>${formatDuration(m.durationMinutes, lang)}</dd>` +
    `<dt>${esc(t('common.totalSteps'))}</dt><dd>${m.totalSteps}</dd>` +
    `<dt>${esc(t('common.materials'))}</dt><dd>${esc(materialsText(m))}</dd>` +
    `<dt>${esc(t('common.paperSize'))}</dt><dd>${esc(localize(m.paper.size, lang))}</dd>` +
    `</dl>` +
    `</section>` +
    `<section aria-labelledby="result-title">` +
    `<h2 id="result-title">${esc(t('common.result'))}</h2>` +
    `<p>${esc(localize(m.result.description, lang))}</p>` +
    `<div class="diagram-wrap" data-diagram data-result-diagram></div>` +
    `</section>` +
    renderLegendSection() +
    renderDisplayModeSection() +
    `<section aria-labelledby="progress-title">` +
    `<h2 id="progress-title">${esc(t('tutorial.progress'))}</h2>` +
    `<p class="step-status" id="step-status" role="status" aria-live="polite"></p>` +
    `<div class="progress-row">` +
    `<progress id="step-progress" max="${m.totalSteps}" value="1"></progress>` +
    `<span id="progress-label"></span>` +
    `</div>` +
    `<p id="storage-warning" class="note note-warning" hidden></p>` +
    `</section>` +
    `<section aria-labelledby="step-title" class="step-block" id="step-section"></section>` +
    renderStepListSection() +
    `<div class="step-nav" aria-label="${esc(t('tutorial.instructions'))}">` +
    `<button type="button" class="button button-secondary" id="btn-prev">${esc(t('tutorial.prev'))}</button>` +
    `<button type="button" class="button" id="btn-next">${esc(t('tutorial.next'))}</button>` +
    `<button type="button" class="button button-secondary" id="btn-restart">${esc(t('tutorial.restart'))}</button>` +
    `<button type="button" class="button button-danger" id="btn-clear">${esc(t('tutorial.clearProgress'))}</button>` +
    `<button type="button" class="button button-danger" id="btn-clear-all">${esc(t('tutorial.clearAllProgress'))}</button>` +
    `</div>` +
    `<p class="note">` +
    `<strong>${esc(t('tutorial.storageNoteTitle'))}:</strong> ${esc(t('tutorial.storageNote'))}` +
    `</p>`
  );
}

function materialsText(m) {
  return (m.materials || []).map((mat) => localize(mat, lang)).join('; ');
}

function renderLegendSection() {
  return (
    `<details class="legend">` +
    `<summary><strong>${esc(t('legend.title'))}</strong></summary>` +
    `<ul class="legend-list">` +
    `<li><span class="legend-symbol"><span class="legend-valley"></span></span><span>${esc(t('legend.valley'))}</span></li>` +
    `<li><span class="legend-symbol"><span class="legend-mountain"></span></span><span>${esc(t('legend.mountain'))}</span></li>` +
    `<li><span class="legend-symbol"><span class="legend-solid"></span></span><span>${esc(t('legend.solid'))}</span></li>` +
    `<li><span class="legend-symbol" aria-hidden="true">→</span><span>${esc(t('legend.arrow'))}</span></li>` +
    `<li><span class="legend-symbol"><span class="legend-front"></span></span><span>${esc(t('legend.front'))}</span></li>` +
    `<li><span class="legend-symbol"><span class="legend-back"></span></span><span>${esc(t('legend.back'))}</span></li>` +
    `<li><span class="legend-symbol" aria-hidden="true">↑</span><span>${esc(t('legend.up'))}</span></li>` +
    `</ul>` +
    `</details>`
  );
}

function renderDisplayModeSection() {
  return (
    `<section aria-labelledby="view-mode-title">` +
    `<h2 id="view-mode-title">${esc(t('displayMode.label'))}</h2>` +
    `<div class="view-mode" role="group" aria-label="${esc(t('displayMode.label'))}">` +
    `<button type="button" class="button" data-mode="both" aria-pressed="true">${esc(t('displayMode.both'))}</button>` +
    `<button type="button" class="button button-secondary" data-mode="visual" aria-pressed="false">${esc(t('displayMode.visual'))}</button>` +
    `<button type="button" class="button button-secondary" data-mode="descriptive" aria-pressed="false">${esc(t('displayMode.descriptive'))}</button>` +
    `</div>` +
    `<p id="view-mode-hint"></p>` +
    `</section>`
  );
}

function renderStepListSection() {
  const items = model.steps
    .map(
      (s) =>
        `<li><a href="#/passo/${s.id}" data-step-link="${s.id}" aria-current="${s.id === currentStep ? 'true' : 'false'}">${esc(t('tutorial.goToStep', { n: s.id }))} — ${esc(localize(s.title, lang))}</a></li>`
    )
    .join('');
  return (
    `<section aria-labelledby="all-steps-title">` +
    `<h2 id="all-steps-title">${esc(t('tutorial.allSteps'))}</h2>` +
    `<p>${esc(t('tutorial.allStepsHint'))}</p>` +
    `<ul class="step-list">${items}</ul>` +
    `</section>`
  );
}

/* ------------------------------------------------------------------ */
/* Controles                                                            */
/* ------------------------------------------------------------------ */

function bindControls() {
  const next = document.getElementById('btn-next');
  const prev = document.getElementById('btn-prev');
  const restart = document.getElementById('btn-restart');
  const clearBtn = document.getElementById('btn-clear');
  const clearAllBtn = document.getElementById('btn-clear-all');

  next.addEventListener('click', () => goTo(currentStep + 1));
  prev.addEventListener('click', () => goTo(currentStep - 1));

  restart.addEventListener('click', () => {
    if (window.confirm(t('tutorial.restartConfirm'))) {
      clearModelProgress(model.slug);
      goTo(1);
      announce(t('tutorial.restart'));
    }
  });
  clearBtn.addEventListener('click', () => {
    if (window.confirm(t('tutorial.clearProgressConfirm'))) {
      clearModelProgress(model.slug);
      announce(t('tutorial.clearProgress'));
    }
  });
  clearAllBtn.addEventListener('click', () => {
    if (window.confirm(t('tutorial.clearAllConfirm'))) {
      clearAllProgress();
      announce(t('tutorial.clearAllProgress'));
    }
  });

  document.querySelectorAll('.view-mode [data-mode]').forEach((btn) => {
    btn.addEventListener('click', () => {
      displayMode = btn.getAttribute('data-mode');
      saveDisplayMode();
      updateModeButtons();
      applyModeVisibility();
      announce(t(`displayMode.${displayMode}Hint`));
    });
  });
}

function setupZoomButtons() {
  document.querySelectorAll('.diagram-wrap:not([data-zoom-ready])').forEach((wrap) => {
    wrap.setAttribute('data-zoom-ready', 'true');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'button button-small';
    btn.setAttribute('aria-expanded', 'false');
    btn.dataset.zoomToggle = '';
    btn.addEventListener('click', () => {
      const zoomed = wrap.classList.toggle('zoomed');
      btn.setAttribute('aria-expanded', zoomed ? 'true' : 'false');
      btn.textContent = zoomed ? t('tutorial.diagramZoomOut') : t('tutorial.diagramZoomIn');
      announce(zoomed ? t('tutorial.diagramZoomIn') : t('tutorial.diagramZoomOut'));
    });
    wrap.prepend(btn);
  });
}

function goTo(step) {
  const nextStep = clamp(step, 1, model.totalSteps);
  if (nextStep === currentStep) {
    return;
  }
  currentStep = nextStep;
  renderFull();
}

/* ------------------------------------------------------------------ */
/* Renderização da etapa                                                */
/* ------------------------------------------------------------------ */

function renderStep({ focusHeading = false } = {}) {
  if (!model) return;
  const step = model.steps[currentStep - 1];

  const status = document.getElementById('step-status');
  if (status) {
    status.textContent = t('tutorial.currentStep', { current: currentStep, total: model.totalSteps });
  }
  const progress = document.getElementById('step-progress');
  if (progress) progress.value = currentStep;
  const progressLabel = document.getElementById('progress-label');
  if (progressLabel) {
    progressLabel.textContent = t('tutorial.progressLabel', { done: currentStep, total: model.totalSteps });
  }

  setStep(model.slug, currentStep, model.totalSteps);

  if (!storageAvailable()) {
    const warn = document.getElementById('storage-warning');
    if (warn) {
      warn.hidden = false;
      warn.textContent = t('tutorial.localStorageWarning');
    }
  }

  // Diagrama do resultado
  const resultDiagram = document.querySelector('[data-result-diagram]');
  if (resultDiagram) {
    const resultState = buildResultState(model);
    resultDiagram.innerHTML = renderDiagramSvg(resultState, {
      uid: `res-${model.slug}`,
      title: `${localize(model.title, lang)} — ${t('common.result')}`,
      desc: localize(model.result.description, lang),
    });
  }

  // Seção da etapa
  const section = document.getElementById('step-section');
  if (section) {
    section.innerHTML = buildStepMarkup(step);
  }

  document.querySelectorAll('[data-step-link]').forEach((a) => {
    a.setAttribute(
      'aria-current',
      a.getAttribute('data-step-link') === String(currentStep) ? 'true' : 'false'
    );
  });

  setupZoomButtons();
  updateModeButtons();
  applyModeVisibility();
  updateZoomButtons();
  updateNavButtons();

  const completed = currentStep >= model.totalSteps;
  if (completed) {
    announce(`${t('tutorial.completed')}. ${t('tutorial.currentStep', { current: currentStep, total: model.totalSteps })}`);
  } else {
    announce(`${t('tutorial.currentStep', { current: currentStep, total: model.totalSteps })} — ${localize(step.title, lang)}`);
  }

  window.history.replaceState(
    null,
    '',
    `tutorial.html?model=${encodeURIComponent(model.slug)}#/passo/${currentStep}`
  );

  if (focusHeading) {
    const heading = document.getElementById('step-title');
    if (heading) heading.focus({ preventScroll: false });
  }
}

function buildStepMarkup(step) {
  const isCompleted = currentStep >= model.totalSteps;
  const completedNote = isCompleted
    ? `<p class="note note-success"><strong>${esc(t('tutorial.completed'))}.</strong> ${esc(t('tutorial.completedMsg'))}</p>`
    : '';

  const state = buildRenderState(model, currentStep - 1);
  const svg = renderDiagramSvg(state, {
    uid: `tut-${model.slug}-${step.id}`,
    title: `${t('tutorial.diagramTitle', { n: step.id })} — ${localize(step.title, lang)}`,
    desc: localize(step.diagramDescription, lang),
  });

  const aspects = renderAspects(step.aspects);

  return (
    `<h2 id="step-title" tabindex="-1">${esc(t('tutorial.stepTitle', { n: step.id, title: localize(step.title, lang) }))}</h2>` +
    completedNote +
    `<div class="diagram-wrap" data-diagram role="img" aria-label="${esc(t('tutorial.diagramTitle', { n: step.id }))}">${svg}</div>` +
    `<h3>${esc(t('tutorial.instructions'))}</h3>` +
    `<ul class="step-aspects">${aspects}</ul>` +
    `<section aria-labelledby="diag-desc-${step.id}">` +
    `<h3 id="diag-desc-${step.id}">${esc(t('tutorial.diagramDescriptionTitle'))}</h3>` +
    `<p>${esc(localize(step.diagramDescription, lang))}</p>` +
    `</section>`
  );
}

function renderAspects(aspects) {
  const order = [
    ['position', 'tutorial.position'],
    ['orientation', 'tutorial.orientation'],
    ['moving', 'tutorial.moving'],
    ['direction', 'tutorial.direction'],
    ['expected', 'tutorial.expected'],
    ['commonError', 'tutorial.commonError'],
    ['correction', 'tutorial.correction'],
    ['followUp', 'tutorial.followUp'],
  ];
  const out = [];
  for (const [key, labelKey] of order) {
    const value = aspects && aspects[key];
    if (!value) continue;
    const label = t(labelKey);
    out.push(`<li><strong>${esc(label)}:</strong> <span>${esc(localize(value, lang))}</span></li>`);
  }
  return out.join('');
}

/* ------------------------------------------------------------------ */
/* Modos / botões                                                       */
/* ------------------------------------------------------------------ */

function updateModeButtons() {
  document.querySelectorAll('.view-mode [data-mode]').forEach((btn) => {
    const on = btn.getAttribute('data-mode') === displayMode;
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
    if (on) {
      btn.classList.add('button');
      btn.classList.remove('button-secondary');
    } else {
      btn.classList.add('button-secondary');
      btn.classList.remove('button');
    }
  });
  const hint = document.getElementById('view-mode-hint');
  if (hint) hint.textContent = t(`displayMode.${displayMode}Hint`);
}

function applyModeVisibility() {
  const isVisual = displayMode === 'visual';
  const isDescriptive = displayMode === 'descriptive';
  document.querySelectorAll('[data-diagram]').forEach((el) => {
    el.hidden = isDescriptive;
  });
  document.querySelectorAll('#step-section section').forEach((el) => {
    el.hidden = isVisual;
  });
}

function updateZoomButtons() {
  document.querySelectorAll('[data-zoom-toggle]').forEach((btn) => {
    const wrap = btn.closest('.diagram-wrap');
    const zoomed = wrap.classList.contains('zoomed');
    btn.textContent = zoomed ? t('tutorial.diagramZoomOut') : t('tutorial.diagramZoomIn');
    btn.setAttribute('aria-expanded', zoomed ? 'true' : 'false');
  });
}

function updateNavButtons() {
  const prev = document.getElementById('btn-prev');
  const next = document.getElementById('btn-next');
  if (prev) prev.disabled = currentStep <= 1;
  if (next) next.disabled = currentStep >= model.totalSteps;
}

/* ------------------------------------------------------------------ */
/* Utilidades                                                           */
/* ------------------------------------------------------------------ */

function readStepFromHash() {
  const m = window.location.hash.match(/^#\/passo\/(\d+)/);
  return m ? parseInt(m[1], 10) : null;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function renderNotFound() {
  const root = document.querySelector(ROOT);
  if (!root) return;
  root.innerHTML =
    `<p class="note note-error">${esc(t('tutorial.notFound'))}</p>` +
    `<p><a class="button" href="catalogo.html">${esc(t('tutorial.backToCatalog'))}</a></p>`;
  root.setAttribute('aria-busy', 'false');
}

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

boot();
