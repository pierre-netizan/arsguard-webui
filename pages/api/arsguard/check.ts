import type { NextApiRequest, NextApiResponse } from 'next';
import http from 'http';
import https from 'https';

const TARGET = process.env.ARSGUARD_CHECK_URL || 'http://localhost:9091';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const targetUrl = `${TARGET}/check`;

  let bodyStr = '';
  if (req.body) {
    bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    console.log(`[ARSGUARD] >> POST /check body: ${bodyStr.slice(0, 300)}`);
  }

  const options = new URL(targetUrl);
  const lib = options.protocol === 'https:' ? https : http;

  return new Promise<void>((resolve) => {
    const proxyReq = lib.request(
      targetUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          host: options.host,
        },
      },
      (proxyRes) => {
        console.log(`[ARSGUARD] << POST /check -> ${proxyRes.statusCode}`);
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
      console.error(`[ARSGUARD] !! POST /check error: ${err.message}`);
      res.status(502).json({ error: `Arsguard proxy error: ${err.message}` });
      resolve();
    });

    if (bodyStr) {
      proxyReq.write(bodyStr);
    }
    proxyReq.end();
  });
}
