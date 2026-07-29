'use strict';

const ACTIVE_USER_DEFINITION = 'A non-admin signed-in account that opened or used CodeIt during the selected period.';

function normalizeUserId(value) {
  const userId = Number(value);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}

module.exports = {
  ACTIVE_USER_DEFINITION,
  normalizeUserId,
};
