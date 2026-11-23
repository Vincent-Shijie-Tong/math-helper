import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import ask from '../api/ask.mjs';

const address = new URL('http://127.0.0.1:3000');
const assets = new Map(Object.entries({
  '/': ['index.html', 'text/html'],
  '/app.js': ['app.js', 'text/javascript'],
  '/storage.js': ['storage.js', 'text/javascript'],
  '/style.css': ['style.css', 'text/css'],
}).map(([path, [name, type]]) => [path, {
  type, data: readFileSync(new URL('../public/' + name, import.meta.url)),
}]));

createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' blob: data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  if (req.headers.host !== address.host) return res.writeHead(403).end();
  const path = req.url.split('?')[0];
  const asset = assets.get(path);
  if (req.method === 'GET' && asset) {
    return res.writeHead(200, {'Content-Type': asset.type + '; charset=utf-8'}).end(asset.data);
  }
  if (path !== '/api/ask' && path !== '/ask') return res.writeHead(404).end();
  try {
    const request = new Request(new URL(path, address), {
      method: req.method, headers: req.headers,
      body: req.method === 'POST' ? req : undefined, duplex: 'half',
    });
    const response = await ask.fetch(request);
    res.writeHead(response.status, Object.fromEntries(response.headers));
    res.end(await response.text());
  } catch {
    res.writeHead(400).end('Please send your question again.');
  }
}).listen(Number(address.port), address.hostname, () => console.log('Math Helper is ready at ' + address.origin));
