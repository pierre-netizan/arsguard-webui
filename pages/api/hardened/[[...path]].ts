import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import https from 'https';

const TARGET = process.env.HARDENED_OPENCLAW_URL || 'http://localhost:3128';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const path = `/${(req.query.path as string[] || []).join('/')}`;
  const query = new URL(req.url || '', 'http://localhost').search;
  const targetUrl = `${TARGET}${path}${query}`;

  let bodyStr = '';
  if (req.body) {
    bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const preview = bodyStr.length > 200 ? bodyStr.slice(0, 200) + '...' : bodyStr;
    console.log(`[HARDENED] >> ${req.method} ${path} body: ${preview}`);
  } else {
    console.log(`[HARDENED] >> ${req.method} ${path}`);
  }

  const options = new URL(targetUrl);
  const lib = options.protocol === 'https:' ? https : http;

  return new Promise<void>((resolve) => {
    const proxyReq = lib.request(
      targetUrl,
      {
        method: req.method,
        headers: {
          ...req.headers,
          host: options.host,
        },
      },
      (proxyRes) => {
        console.log(`[HARDENED] << ${req.method} ${path} -> ${proxyRes.statusCode}`);
        res.status(proxyRes.statusCode || 500);
        for (const [key, value] of Object.entries(proxyRes.headers)) {
          if (key && value) {
            const excluded = ['transfer-encoding', 'connection', 'keep-alive'];
            if (!excluded.includes(key)) {
              res.setHeader(key, Array.isArray(value) ? value.join(', ') : value);
            }
          }
        }
        proxyRes.pipe(res);
        proxyRes.on('end', () => resolve());
      }
    );

    proxyReq.on('error', (err) => {
      console.error(`[HARDENED] !! ${req.method} ${path} error: ${err.message}`);
      res.status(502).json({ error: `Proxy error: ${err.message}` });
      resolve();
    });

    if (bodyStr) {
      proxyReq.write(bodyStr);
    }
    proxyReq.end();
  });
}
