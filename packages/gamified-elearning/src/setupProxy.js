const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function setupProxy(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.CODEIT_DEV_API_PROXY || 'http://127.0.0.1:8080',
      changeOrigin: true,
    })
  );
};
