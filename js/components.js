/**
 * components.js - Componentes compartilhados do OrigamiECJ.
 *
 * Injeta o cabeçalho (com menu, troca de idioma e controle de animações)
 * e o rodapé (com os créditos obrigatórios da equipe ECJ) em todas as
 * páginas. Mantém a navegação e a identidade visuais consistentes.
 */

import {
  SITE_NAME,
  ECJ_CONTACT_EMAIL,
  ORIGAMI_DATABASE_URL,
  ORIGAMI_DATABASE_LICENSE,
  STORAGE_KEYS,
} from './config.js';
import { t, getLang, switchLang, applyI18n } from './i18n.js';

/**
 * Injeta o cabeçalho no elemento <header id="site-header">.
 * A página deve definir data-page="<slug-da-pagina>" no <body> para
 * que o item de menu correspondente receba aria-current="page".
 */
export function injectHeader(containerId = 'site-header') {
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentPage = document.body.getAttribute('data-page') || '';
  const navItems = [
    { slug: 'home', href: 'index.html', key: 'nav.home' },
    { slug: 'catalog', href: 'catalogo.html', key: 'nav.catalog' },
    { slug: 'about', href: 'sobre.html', key: 'nav.about' },
    { slug: 'credits', href: 'creditos.html', key: 'nav.credits' },
    { slug: 'accessibility', href: 'acessibilidade.html', key: 'nav.accessibility' },
    { slug: 'contact', href: 'contato.html', key: 'nav.contact' },
    { slug: 'help', href: 'ajuda.html', key: 'nav.help' },
  ];

  const navList = navItems
    .map(
      (item) =>
        `<li><a href="${item.href}" data-i18n="${item.key}" ${
          item.slug === currentPage ? 'aria-current="page"' : ''
        }></a></li>`
    )
    .join('');

  container.innerHTML =
    `<a class="skip-link" href="#main" data-i18n="common.skipToContent"></a>` +
    `<div class="header-inner">` +
    `<a class="site-logo" href="index.html">${escapeHtml(SITE_NAME)}</a>` +
    `<nav aria-label="${escapeHtml(t('nav.label'))}" data-i18n-attr="aria-label:nav.label" class="site-nav">` +
    `<ul>${navList}</ul>` +
    `</nav>` +
    `<div class="header-controls">` +
    `<div class="anim-control">` +
    `<button type="button" id="anim-toggle" class="button button-small" data-i18n-attr="aria-label:animations.pause"></button>` +
    `</div>` +
    `<div class="lang-control">` +
    `<label for="lang-select" class="visually-hidden" data-i18n="lang.switchLabel"></label>` +
    `<select id="lang-select">` +
    `<option value="pt-BR">${escapeHtml(t('lang.pt-BR'))}</option>` +
    `<option value="en">${escapeHtml(t('lang.en'))}</option>` +
    `</select>` +
    `</div>` +
    `</div>` +
    `</div>` +
    `<div class="status-live visually-hidden" id="status-live" aria-live="polite" role="status"></div>`;

  const select = container.querySelector('#lang-select');
  select.value = getLang();
  select.addEventListener('change', () => {
    switchLang(select.value, select);
  });

  const animBtn = container.querySelector('#anim-toggle');
  setupAnimationToggle(animBtn);
}

/**
 * Injeta o rodapé com os créditos obrigatórios.
 * @param {string} containerId
 */
export function injectFooter(containerId = 'site-footer') {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML =
    `<div class="footer-grid">` +
    `<section class="footer-col">` +
    `<h2 class="footer-title" data-i18n="footer.creditTitle"></h2>` +
    `<p data-i18n="footer.credit"></p>` +
    `<p><a href="mailto:${ECJ_CONTACT_EMAIL}">${escapeHtml(ECJ_CONTACT_EMAIL)}</a></p>` +
    `</section>` +
    `<section class="footer-col">` +
    `<h2 class="footer-title" data-i18n="footer.sourcesTitle"></h2>` +
    `<p data-i18n="footer.origamiDbCredit"></p>` +
    `<p><a href="${ORIGAMI_DATABASE_URL}">${escapeHtml(ORIGAMI_DATABASE_URL)}</a> · ${escapeHtml(ORIGAMI_DATABASE_LICENSE)}</p>` +
    `</section>` +
    `<section class="footer-col">` +
    `<h2 class="footer-title" data-i18n="footer.privacyTitle"></h2>` +
    `<p data-i18n="footer.privacy"></p>` +
    `</section>` +
    `</div>` +
    `<div class="footer-bottom">` +
    `<p class="credit-line" data-i18n="footer.credit"></p>` +
    `<nav aria-label="${escapeHtml(t('footer.navLabel'))}" data-i18n-attr="aria-label:footer.navLabel">` +
    `<ul class="footer-nav">` +
    `<li><a href="index.html" data-i18n="nav.home"></a></li>` +
    `<li><a href="catalogo.html" data-i18n="nav.catalog"></a></li>` +
    `<li><a href="sobre.html" data-i18n="nav.about"></a></li>` +
    `<li><a href="creditos.html" data-i18n="nav.credits"></a></li>` +
    `<li><a href="acessibilidade.html" data-i18n="nav.accessibility"></a></li>` +
    `<li><a href="contato.html" data-i18n="nav.contact"></a></li>` +
    `<li><a href="ajuda.html" data-i18n="nav.help"></a></li>` +
    `</ul>` +
    `</nav>` +
    `<p><a href="#" id="back-to-top" data-i18n="footer.backToTop"></a></p>` +
    `</div>`;

  const backToTop = container.querySelector('#back-to-top');
  if (backToTop) {
    backToTop.addEventListener('click', (e) => {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'auto' });
    });
  }
}

/**
 * Controla o botão "Pausar animações".
 * - Respeita prefers-reduced-motion (animações já desligadas por padrão).
 * - A preferência é salva no localStorage.
 * - A alteração é anunciada via aria-live.
 */
function setupAnimationToggle(button) {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let paused = prefersReduced;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEYS.animations);
    if (saved === 'paused') paused = true;
    if (saved === 'running') paused = false;
  } catch (e) {
    // segue com o padrão
  }

  applyAnimationState(paused);
  updateAnimationButton(button, paused);

  button.addEventListener('click', () => {
    paused = !paused;
    applyAnimationState(paused);
    updateAnimationButton(button, paused);
    try {
      window.localStorage.setItem(STORAGE_KEYS.animations, paused ? 'paused' : 'running');
    } catch (e) {
      // ignora
    }
    announce(paused ? t('animations.off') : t('animations.on'));
  });
}

function applyAnimationState(paused) {
  document.documentElement.classList.toggle('animations-off', paused);
}

function updateAnimationButton(button, paused) {
  const label = paused ? t('animations.resume') : t('animations.pause');
  button.textContent = label;
  button.setAttribute('aria-pressed', paused ? 'true' : 'false');
  button.setAttribute('aria-label', label);
}

/** Anuncia mudanças importantes para leitores de tela (polite). */
export function announce(message) {
  const region = document.getElementById('status-live');
  if (region) {
    region.textContent = '';
    // reinicia o anúncio mesmo para mensagens repetidas
    window.setTimeout(() => {
      region.textContent = message;
    }, 20);
  }
}

/** Função utilitária de escape de HTML. */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Inicializa tudo o que é compartilhado: cabeçalho, rodapé e as
 * reações à troca de idioma. Deve ser chamado depois do initI18n().
 */
export function initChrome() {
  injectHeader();
  injectFooter();
  // O i18n inicial roda antes da injeção do cabeçalho e do rodapé.
  // Aplicamos novamente para não deixar os componentes compartilhados vazios.
  applyI18n();
  document.addEventListener('i18n:change', () => {
    applyI18n();
    const select = document.getElementById('lang-select');
    if (select) select.value = getLang();
    const animBtn = document.getElementById('anim-toggle');
    if (animBtn) {
      const paused = document.documentElement.classList.contains('animations-off');
      updateAnimationButton(animBtn, paused);
    }
  });
}
