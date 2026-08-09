/**
 * contact.js - Formulário de contato do OrigamiECJ.
 *
 * O formulário NÃO envia dados a nenhum servidor. Ele apenas monta uma
 * mensagem de e-mail no formato mailto: e a abre no programa de e-mail
 * padrão do dispositivo da pessoa. Nenhum dado é salvo ou coletado.
 *
 * Acessibilidade:
 *  - Validação com mensagens de erro vinculadas aos campos (aria-describedby);
 *  - Erros e confirmações anunciados via aria-live (role="status");
 *  - Fallback textual caso o dispositivo não tenha programa de e-mail.
 */

import { ECJ_CONTACT_EMAIL } from './config.js';
import { t } from './i18n.js';
import { announce } from './components.js';

function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;

  const nameInput = document.getElementById('contact-name');
  const subjectInput = document.getElementById('contact-subject');
  const messageInput = document.getElementById('contact-message');
  const fallbackNote = document.getElementById('contact-fallback');

  /** Marca/desmarca o estado de erro de um campo. */
  function setInvalid(field, invalid) {
    const wrapper = field.closest('.field');
    if (!wrapper) return;
    wrapper.classList.toggle('invalid', invalid);
    const errorMsg = wrapper.querySelector('.error-msg');
    if (errorMsg) {
      if (invalid) {
        errorMsg.setAttribute('id', `${field.id}-error`);
        field.setAttribute('aria-describedby', `${field.id}-error`);
        field.setAttribute('aria-invalid', 'true');
      } else {
        field.removeAttribute('aria-describedby');
        field.removeAttribute('aria-invalid');
        errorMsg.removeAttribute('id');
      }
    }
  }

  /** Limpa o estado de erro de um campo quando a pessoa digita. */
  function clearErrorOnInput(field) {
    field.addEventListener('input', () => setInvalid(field, false));
    field.addEventListener('blur', () => {
      if (!field.value.trim()) {
        setInvalid(field, field.required);
      }
    });
  }

  [subjectInput, messageInput, nameInput].forEach((field) => {
    if (field) clearErrorOnInput(field);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = (nameInput ? nameInput.value : '').trim();
    const subject = (subjectInput ? subjectInput.value : '').trim();
    const message = (messageInput ? messageInput.value : '').trim();

    let valid = true;
    if (subjectInput) {
      const invalid = !subject;
      setInvalid(subjectInput, invalid);
      if (invalid) valid = false;
    }
    if (messageInput) {
      const invalid = !message;
      setInvalid(messageInput, invalid);
      if (invalid) valid = false;
    }

    if (!valid) {
      announce(t('contact.required'));
      const firstInvalid = form.querySelector('.field.invalid input, .field.invalid textarea');
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    const bodyLines = [];
    if (name) bodyLines.push(`${t('contact.nameLabel')}: ${name}`);
    bodyLines.push(`${t('contact.subjectLabel')}: ${subject}`);
    bodyLines.push('');
    bodyLines.push(message);

    const subjectLine = subject;
    const body = bodyLines.join('\n');

    const mailtoUrl =
      `mailto:${encodeURIComponent(ECJ_CONTACT_EMAIL)}` +
      `?subject=${encodeURIComponent(subjectLine)}` +
      `&body=${encodeURIComponent(body)}`;

    // Tenta abrir o programa de e-mail.
    const opened = window.open(mailtoUrl, '_self');

    if (opened === null) {
      // Janela bloqueada: mostra o endereço de e-mail como fallback.
      if (fallbackNote) fallbackNote.hidden = false;
      announce(t('contact.mailtoFallback'));
    } else {
      announce(t('contact.sent'));
    }
  });
}

function init() {
  initContactForm();
  // Re-validar mensagens de erro após troca de idioma.
  document.addEventListener('i18n:change', () => {
    document.querySelectorAll('.field.invalid .error-msg').forEach((el) => {
      el.textContent = t('contact.required');
    });
  });
}

init();
