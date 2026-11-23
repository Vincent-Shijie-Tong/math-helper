import { DisplayError } from '../server/key.mjs';
import { askAI, modes } from '../server/ask-ai.mjs';

function safetyReply(question) {
  if (/\b(my (?:password|address|student id|full name) is|[\w.+-]+@[\w.-]+\.[a-z]{2,})/i.test(question))
    return 'Please remove private details and send just the math question.';
  if (/\b(?:hurt|kill|attack) (?:myself|someone|a classmate|him|her|me)\b/i.test(question))
    return 'If someone might be hurt, get a trusted adult immediately. They can help keep everyone safe.';
  if (/\b(?:being bullied|bullying me)\b/i.test(question))
    return 'You deserve to feel safe. Please tell a trusted adult, such as a teacher, what is happening.';
  return '';
}

function reply(text, status = 200) {
  return new Response(text, {status, headers: {
    'Content-Type': 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  }});
}

async function handleQuestion(request) {
  if (request.method !== 'POST') {
    const response = reply('Send your question with POST.', 405);
    response.headers.set('Allow', 'POST');
    return response;
  }
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply('', 403);
  const type = request.headers.get('content-type')?.split(';')[0].trim().toLowerCase();
  if (!['application/json', 'text/plain'].includes(type)) return reply('', 415);

  try {
    let size = 0;
    const chunks = [];
    for await (const chunk of request.body ?? []) {
      size += chunk.byteLength;
      if (size > 4_000_000) return reply('Choose a smaller photo.', 413);
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks).toString('utf8');
    let input;
    try { input = type === 'text/plain' ? {mode:'homework', question:body} : JSON.parse(body); }
    catch { return reply('Please send your question again.', 400); }
    const {mode, question = '', photo = null} = input ?? {};
    if (typeof mode !== 'string' || !Object.hasOwn(modes, mode) || typeof question !== 'string' || question.length > 4000)
      return reply('Choose a kind of help and use a shorter question.', 400);
    if (photo !== null && (typeof photo !== 'string' || !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+=*$/.test(photo)))
      return reply('Choose a clear photo of the problem.', 400);
    if (!question.trim() && !photo) return reply('Type a math question or add a photo.', 400);
    return reply(safetyReply(question) || await askAI(mode, question.trim(), photo));
  } catch (error) {
    return reply(error instanceof DisplayError ? error.message
      : 'Your tutor could not answer. Check your internet connection and try again.', 502);
  }
}

export default {fetch: handleQuestion};
