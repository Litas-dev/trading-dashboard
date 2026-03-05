const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api/stooq',
    createProxyMiddleware({
      target: 'https://stooq.com',
      changeOrigin: true,
      pathRewrite: {
        '^/api/stooq': '/q/l/',
      },
    })
  );
};
