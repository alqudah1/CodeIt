'use strict';

function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
}

function maskEmail(value) {
  const [local, domain] = String(value || '').split('@');
  if (!local || !domain) return null;
  return `${local.slice(0, 1)}${'*'.repeat(Math.min(5, Math.max(2, local.length - 1)))}@${domain}`;
}

function validLegacyConsent(input, noticeVersion) {
  const relationship = String(input?.relationship || '').trim().toLowerCase();
  return input?.consent === true
    && input?.noticeVersion === noticeVersion
    && ['parent', 'guardian'].includes(relationship);
}

module.exports = {
  maskEmail,
  validEmail,
  validLegacyConsent,
};
