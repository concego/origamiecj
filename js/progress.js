/**
 * progress.js - Progresso local do OrigamiECJ.
 *
 * O progresso é salvo exclusivamente no navegador (localStorage).
 * Não há cadastro, não há coleta de dados pessoais e nenhuma
 * informação é enviada a terceiros.
 *
 * Estrutura salva:
 * {
 *   "<slug-do-modelo>": {
 *     "step": number,          // última etapa visitada (1..N)
 *     "completed": boolean,    // concluiu o tutorial
 *     "updatedAt": ISO string  // data da última atualização
 *   }
 * }
 */

import { STORAGE_KEYS } from './config.js';

const STORAGE_KEY = STORAGE_KEYS.progress;

/** Lê todo o progresso salvo (objeto vazio se nada salvo). */
export function readAllProgress() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/** Salva o progresso inteiro. */
function writeAllProgress(data) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage indisponível ou cheio: progresso não é persistido.
  }
}

/**
 * Retorna o progresso de um modelo.
 * @param {string} slug identificador do modelo
 * @returns {{step:number, completed:boolean}|null}
 */
export function getProgress(slug) {
  return readAllProgress()[slug] || null;
}

/**
 * Registra a etapa atual de um modelo.
 * @param {string} slug
 * @param {number} step etapa atual (1..N)
 * @param {number} totalSteps total de etapas
 */
export function setStep(slug, step, totalSteps) {
  const all = readAllProgress();
  const prev = all[slug] || { step: 1, completed: false };
  const completed = step >= totalSteps;
  all[slug] = {
    step,
    completed,
    updatedAt: new Date().toISOString(),
  };
  writeAllProgress(all);
  return all[slug];
}

/**
 * Apaga o progresso de um único modelo.
 * @param {string} slug
 */
export function clearModelProgress(slug) {
  const all = readAllProgress();
  if (all[slug]) {
    delete all[slug];
    writeAllProgress(all);
  }
}

/** Apaga todo o progresso salvo no navegador. */
export function clearAllProgress() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    // ignora
  }
}

/** Indica se existe algum progresso salvo. */
export function hasAnyProgress() {
  return Object.keys(readAllProgress()).length > 0;
}

/** Indica se o navegador permite armazenamento local. */
export function storageAvailable() {
  try {
    const k = '__origamiecj_test__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch (e) {
    return false;
  }
}
