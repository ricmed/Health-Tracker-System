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
    ws: false,
    logger: console,
    on: {
      proxyReq: (proxyReq, req, res) => {
        if (req.headers['x-csrftoken']) {
          proxyReq.setHeader('X-CSRFToken', req.headers['x-csrftoken'] as string);
        }
      },
      error: (err, req, res) => {
        console.error('Proxy error:', err);
        if (res && 'writeHead' in res) {
          (res as any).writeHead(502, { 'Content-Type': 'application/json' });
          (res as any).end(JSON.stringify({ error: 'Django server is not available. Please ensure it is running.' }));
        }
      }
    }
  });

  app.use('/api', djangoProxy);

  return httpServer;
}
