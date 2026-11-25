import { DisplayError } from '../server/key.mjs';
import { askAI, modes } from '../server/ask-ai.mjs';

function safetyReply(question) {
  if (/\b(my (?:password|address|student id|full name) is|[\w.+-]+@[\w.-]+\.[a-z]{2,})/i.test(question))
    return 'Please remove private details and send just the math question.';
  if (/\b(?:hurt|kill|attack) (?:myself|me)\b/i.test(question))
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
    const {mode, question = '', photo = null, grade = null} = input ?? {};
    if (grade !== null && (!Number.isInteger(grade) || grade < 1 || grade > 18))
      return reply('Choose a grade from 1 to 18.', 400);
    if (typeof mode !== 'string' || !Object.hasOwn(modes, mode) || typeof question !== 'string' || question.length > 4000)
      return reply('Choose a kind of help and use a shorter question.', 400);
    if (photo !== null && (typeof photo !== 'string' || !/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+=*$/.test(photo)))
      return reply('Choose a clear photo of the problem.', 400);
    if (!question.trim() && !photo) return reply('Type a math question or add a photo.', 400);
    const answer = safetyReply(question) || await askAI(mode, question.trim(), photo, grade);
    if (typeof answer === 'string') return reply(answer);
    if (answer.kind === 'practice_set') {
      if (request.headers.get('accept')?.includes('application/json')) {
        return Response.json(answer, {headers: {'Cache-Control': 'no-store'}});
      }
      const questions = answer.questions.map((item, i) => (i + 1) + '. ' + item.question);
      const solutions = answer.questions.map((item, i) => (i + 1) + '. ' + item.answer + '\n' + item.reasoning);
      return reply(['Tips for this topic', ...answer.tips, 'Formula or rule', answer.formula,
        answer.howToUse, 'Practice questions', ...questions, 'Worked answers', ...solutions].join('\n\n'));
    }
    const {table, takeaway} = answer;
    const tableLines = [table.caption, table.leftHeading + ' | ' + table.rightHeading,
      ...table.rows.map(row => row.left + ' | ' + row.right), takeaway];
    if (answer.kind === 'lesson') {
      if (request.headers.get('accept')?.includes('application/vnd.math-helper.lesson+json')) {
        return Response.json(answer, {headers: {'Cache-Control': 'no-store', 'Content-Type':'application/vnd.math-helper.lesson+json'}});
      }
      return reply([answer.explanation, ...tableLines].join('\n\n'));
    }
    if (request.headers.get('accept')?.includes('application/json')) {
      // Older open tabs display the tips in one text field.
      return Response.json({...answer, tip: answer.tips.join('\n')}, {headers: {'Cache-Control': 'no-store'}});
    }
    const lines = ['Study tips', ...answer.tips];
    for (const item of answer.problems) {
      lines.push(item.problem, item.formula, ...item.steps.map((step, i) => (i + 1) + '. ' + step));
    }
    lines.push(...tableLines, 'Flashcards', ...answer.cards.map(card => card.question + ' — ' + card.answer));
    return reply(lines.join('\n'));
  } catch (error) {
    return reply(error instanceof DisplayError ? error.message
      : 'Your tutor could not answer. Check your internet connection and try again.', 502);
  }
}

export default {fetch: handleQuestion};
