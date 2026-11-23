import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { DisplayError } from './key.mjs';
import { askAI, modes } from './ask-ai.mjs';

const address = 'http://127.0.0.1:3000';
const assets = new Map(Object.entries({
  '/': ['question.html', 'text/html'],
  '/app.js': ['app.js', 'text/javascript'],
  '/storage.js': ['storage.js', 'text/javascript'],
  '/style.css': ['style.css', 'text/css'],
}).map(([url, [file, type]]) => [url, {type, data: readFileSync(new URL(file, import.meta.url))}]));

function safetyReply(question) {
  if (/\b(my (?:password|address|student id|full name) is|[\w.+-]+@[\w.-]+\.[a-z]{2,})/i.test(question))
    return 'Please remove private details and send just the math question.';
  if (/\b(?:hurt|kill|attack) (?:myself|someone|a classmate|him|her|me)\b/i.test(question))
    return 'If someone might be hurt, get a trusted adult immediately. They can help keep everyone safe.';
  if (/\b(?:being bullied|bullying me)\b/i.test(question))
    return 'You deserve to feel safe. Please tell a trusted adult, such as a teacher, what is happening.';
  return '';
}

createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' blob: data:; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  if (req.headers.host !== new URL(address).host) return res.writeHead(403).end();
  const asset = assets.get(req.url);
  if (req.method === 'GET' && asset) {
    return res.writeHead(200, { 'Content-Type': asset.type + '; charset=utf-8' }).end(asset.data);
  }
  if (req.method !== 'POST' || req.url !== '/ask') return res.writeHead(404).end();
  if (req.headers.origin && req.headers.origin !== address) return res.writeHead(403).end();
  const type = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (!['application/json', 'text/plain'].includes(type)) return res.writeHead(415).end();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 4_000_000) return res.writeHead(413).end('Choose a smaller photo.');
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    let input;
    try { input = type === 'text/plain' ? {mode:'homework', question:body} : JSON.parse(body); }
    catch { return res.writeHead(400).end('Please send your question again.'); }
    const {mode, question = '', photo = null} = input ?? {};
    if (!Object.hasOwn(modes, mode) || typeof question !== 'string' || question.length > 4000)
      return res.writeHead(400).end('Choose a kind of help and use a shorter question.');
    if (photo !== null && (typeof photo !== 'string' || !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+=*$/.test(photo)))
      return res.writeHead(400).end('Choose a clear photo of the problem.');
    if (!question.trim() && !photo) return res.writeHead(400).end('Type a math question or add a photo.');
    res.end(safetyReply(question) || await askAI(mode, question.trim(), photo));
  } catch (error) {
    res.writeHead(502).end(error instanceof DisplayError ? error.message
      : 'Your tutor could not answer. Check your internet connection and try again.');
  }
}).listen(3000, '127.0.0.1', () => console.log('Math Helper is ready at ' + address));
