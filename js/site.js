/**
 * site.js - Ponto de entrada comum a todas as páginas.
 * Inicializa o i18n e injeta o cabeçalho e o rodapé compartilhados.
 */

import { initI18n } from './i18n.js';
import { initChrome } from './components.js';

async function boot() {
  await initI18n();
  initChrome();
}

boot();
