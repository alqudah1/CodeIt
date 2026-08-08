'use strict';

const app = require('../packages/codeit-backend/test-quiz');

// Vercel sends every /api/* request to this one function. Restore the original
// API path before Express handles it so existing routes need no changes.
module.exports = (request, response) => {
  const rewrittenPath = request.query?.path;
  if (rewrittenPath) {
    const path = Array.isArray(rewrittenPath) ? rewrittenPath.join('/') : rewrittenPath;
    const query = new URL(request.url, 'http://localhost');
    query.searchParams.delete('path');
    const search = query.searchParams.toString();
    request.url = `/api/${path}${search ? `?${search}` : ''}`;
  }
  return app(request, response);
};
