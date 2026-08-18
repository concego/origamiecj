/**
 * i18n.js - Sistema de tradução do OrigamiECJ.
 *
 * Responsável por:
 *  - Detectar o idioma do navegador (com fallback para pt-BR);
 *  - Carregar os dicionários de tradução em data/i18n/<idioma>.json;
 *  - Aplicar as traduções na página (atributos data-i18n e data-i18n-attr);
 *  - Manter o idioma escolhido durante a navegação (localStorage);
 *  - Permitir troca de idioma em tempo real, sem recarregar a página.
 *
 * Nenhum idioma é misturado na mesma interface: ao trocar de idioma,
 * todos os textos da página são re-traduzidos de uma só vez.
 */

import {
  SUPPORTED_LANGS,
  DEFAULT_LANG,
  STORAGE_KEYS,
} from './config.js';

let dictionary = {};
let currentLang = DEFAULT_LANG;
let readyPromise = null;

/**
 * Detecta o idioma inicial: preferência salva > idioma do navegador > fallback.
 * @returns {string} código do idioma (ex.: "pt-BR")
 */
export function detectLang() {
  let saved = null;
  try {
    saved = window.localStorage.getItem(STORAGE_KEYS.language);
  } catch (e) {
    saved = null;
  }
  if (saved && SUPPORTED_LANGS.includes(saved)) {
    return saved;
  }
  const browserLangs = (navigator.languages || [navigator.language || '']);
  for (const l of browserLangs) {
    const normalized = normalizeLang(l);
    if (SUPPORTED_LANGS.includes(normalized)) {
      return normalized;
    }
  }
  return DEFAULT_LANG;
}

/** Normaliza códigos como "pt-BR", "pt-br", "pt_BR", "en-US" para nossos códigos. */
function normalizeLang(code) {
  const c = String(code || '').replace('_', '-').toLowerCase();
  if (c === 'pt-br' || c === 'pt') return 'pt-BR';
  if (c.startsWith('pt')) return 'pt-BR';
  if (c.startsWith('en')) return 'en';
  return c;
}

/** Salva o idioma escolhido para manter durante a navegação. */
function persistLang(lang) {
  try {
    window.localStorage.setItem(STORAGE_KEYS.language, lang);
  } catch (e) {
    // localStorage indisponível: segue sem persistência.
  }
}

/**
 * Carrega o dicionário de um idioma e aplica na página.
 * @param {string} lang código do idioma
 * @returns {Promise<boolean>} true se carregado com sucesso
 */
export async function loadLang(lang) {
  try {
    const res = await fetch(`data/i18n/${lang}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    dictionary = data;
    currentLang = lang;
    persistLang(lang);
    return true;
  } catch (e) {
    if (lang !== DEFAULT_LANG) {
      return loadLang(DEFAULT_LANG);
    }
    dictionary = {};
    currentLang = lang;
    return false;
  }
}

/** @returns {string} idioma atualmente ativo */
export function getLang() {
  return currentLang;
}

/**
 * Retorna o texto traduzido para uma chave.
 * @param {string} key chave no dicionário (ex.: "nav.home")
 * @param {object} [vars] variáveis de substituição, ex.: { n: 3 }
 * @returns {string}
 */
export function t(key, vars) {
  const raw = lookup(dictionary, key);
  const fallback = lookup({}, key);
  const value = raw === undefined ? (fallback === undefined ? key : fallback) : raw;
  if (vars && typeof value === 'string') {
    return value.replace(/\{(\w+)\}/g, (m, name) =>
      Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : m
    );
  }
  return value;
}

/**
 * Navega em um objeto por chave pontilhada.
 *
 * Os dicionários também usam algumas chaves literais com ponto, como
 * `meta.title.home`. Primeiro tentamos a chave restante inteira em cada
 * nível; assim os dois formatos (objeto aninhado e chave literal) funcionam.
 */
function lookup(obj, key) {
  if (!obj || typeof obj !== 'object') return undefined;

  const parts = String(key).split('.');
  let current = obj;
  for (let i = 0; i < parts.length; i += 1) {
    if (!current || typeof current !== 'object') return undefined;
    const rest = parts.slice(i).join('.');
    if (Object.prototype.hasOwnProperty.call(current, rest)) {
      return current[rest];
    }
    current = current[parts[i]];
  }
  return current;
}

/**
 * Aplica as traduções em um escopo do DOM.
 * - [data-i18n]       substitui o conteúdo de texto do elemento;
 * - [data-i18n-attr]  substitui atributos no formato "attr:chave,attr2:chave2".
 * - [data-i18n-html]  substitui HTML interno (usar com cuidado).
 * @param {ParentNode} root
 */
export function applyI18n(root = document) {
  root.querySelectorAll('[data-i18n]').forEach((el) => {
    const val = t(el.getAttribute('data-i18n'));
    if (typeof val === 'string') {
      el.textContent = val;
    }
  });
  root.querySelectorAll('[data-i18n-html]').forEach((el) => {
    const val = t(el.getAttribute('data-i18n-html'));
    if (typeof val === 'string') {
      el.innerHTML = val;
    }
  });
  root.querySelectorAll('[data-i18n-attr]').forEach((el) => {
    const spec = el.getAttribute('data-i18n-attr');
    spec.split(',').forEach((pair) => {
      const [attr, key] = pair.split(':').map((s) => s.trim());
      const val = t(key);
      if (attr && typeof val === 'string') {
        el.setAttribute(attr, val);
      }
    });
  });
}

/**
 * Inicializa o i18n: detecta idioma, carrega dicionário e aplica traduções.
 * Idempotente: chamadas repetidas reutilizam a mesma inicialização.
 * @returns {Promise<void>}
 */
export function initI18n() {
  if (!readyPromise) {
    readyPromise = (async () => {
      const lang = detectLang();
      await loadLang(lang);
      applyI18n();
      document.documentElement.lang = currentLang;
      updateTitle();
    })();
  }
  return readyPromise;
}

/** Mantém o <title> traduzido, usando o título específico da página. */
function updateTitle() {
  const page = document.body.getAttribute('data-page') || '';
  const docTitle =
    lookup(dictionary, `meta.title.${page}`) || lookup(dictionary, 'meta.title');
  if (typeof docTitle === 'string' && docTitle.trim()) {
    document.title = docTitle;
  }
}

/**
 * Troca o idioma em tempo real, re-aplicando as traduções na página.
 * Dispara o evento "i18n:change" para que módulos dinâmicos re-renderizem.
 * O foco permanece no elemento que acionou a troca.
 * @param {string} lang
 * @param {HTMLElement} [focusTarget] elemento que deve receber o foco
 */
export async function switchLang(lang, focusTarget) {
  if (!SUPPORTED_LANGS.includes(lang) || lang === currentLang) return;
  const ok = await loadLang(lang);
  if (!ok) return;
  applyI18n();
  document.documentElement.lang = currentLang;
  updateTitle();
  document.dispatchEvent(new CustomEvent('i18n:change', { detail: { lang } }));
  if (focusTarget) {
    try {
      focusTarget.focus();
    } catch (e) {
      // ignora falhas de foco
    }
  }
}
