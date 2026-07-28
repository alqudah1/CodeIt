'use strict';

const ALLOWED_SOURCES = new Set(['pricing', 'parents-guide', 'homepage']);
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function normalizeFoundingLead(input = {}) {
  if (input.consent !== true) {
    return { error: 'Adult consent is required.' };
  }

  const email = String(input.email || '').trim().toLowerCase();
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return { error: 'Enter a valid email address.' };
  }

  const source = ALLOWED_SOURCES.has(input.source) ? input.source : 'pricing';
  return { value: { email, source } };
}

module.exports = { normalizeFoundingLead };
