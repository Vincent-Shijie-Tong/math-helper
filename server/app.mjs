import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { DisplayError, discardKey, getKey } from './key.mjs';

const page = readFileSync(new URL('./question.html', import.meta.url));
const address = 'http://127.0.0.1:3000';

async function answer(question) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const key = await getKey();
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4.1-mini', input: question, store: false,
        instructions: 'Tutor the student in math. Explain each step in simple English.',
      }),
      redirect: 'error',
      signal: AbortSignal.timeout(60000),
    });
    if (response.status === 401) {
      await response.body?.cancel();
      discardKey(key);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      throw new DisplayError('The AI could not answer this question right now.');
    }
    const data = await response.json();
    const text = (data.output ?? []).flatMap(item => item.content ?? [])
      .filter(part => part.type === 'output_text').map(part => part.text).join('\n');
    if (!text) throw new DisplayError('The AI returned an empty answer.');
    return text;
  }
  throw new DisplayError('OpenAI rejected the replacement key from MindDo.');
}

createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.headers.host !== new URL(address).host) return res.writeHead(403).end();
  if (req.method === 'GET' && req.url === '/') {
    return res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' }).end(page);
  }
  if (req.method !== 'POST' || req.url !== '/ask') return res.writeHead(404).end();
  if (req.headers.origin && req.headers.origin !== address) return res.writeHead(403).end();
  const mediaType = req.headers['content-type']?.split(';')[0].trim().toLowerCase();
  if (mediaType !== 'text/plain') return res.writeHead(415).end();
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  try {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 16000) return res.writeHead(413).end('Please send a shorter question.');
      chunks.push(chunk);
    }
    const question = Buffer.concat(chunks).toString('utf8').trim();
    if (!question) return res.writeHead(400).end('Enter a math question.');
    res.end(await answer(question));
  } catch (error) {
    res.writeHead(502).end(error instanceof DisplayError
      ? error.message : 'Math Helper could not reach the AI service. Please try again later.');
  }
}).listen(3000, '127.0.0.1', () => console.log('Math Helper is ready at ' + address));
