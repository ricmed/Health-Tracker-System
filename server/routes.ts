import type { Express } from "express";
import { createServer, type Server } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  const djangoProxy = createProxyMiddleware({
    target: 'http://127.0.0.1:8000',
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req, res) => {
        const csrfToken = req.headers['x-csrftoken'];
        if (csrfToken) {
          proxyReq.setHeader('X-CSRFToken', csrfToken as string);
        }
      },
      error: (err, req, res) => {
        console.error('Proxy error:', err.message);
        if (res && 'writeHead' in res && !(res as any).headersSent) {
          (res as any).writeHead(502, { 'Content-Type': 'application/json' });
          (res as any).end(JSON.stringify({ error: 'Django server is not available' }));
        }
      }
    }
  });

  app.use('/api', (req, res, next) => {
    const originalUrl = req.url;
    req.url = '/api' + originalUrl;
    djangoProxy(req, res, next);
  });

  return httpServer;
}
