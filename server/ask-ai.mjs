import { DisplayError, discardKey, getKey } from './key.mjs';

export const modes = {
  study: `Make a study guide for the student's upcoming math test. Give three different study tips.
Make each tip an action the student can try with this topic, such as drawing a model, practising from memory,
or spotting a common mistake. Use a concrete example and tell the student what to look for.
For EACH problem they type or show, explain the formula or rule in everyday words.
Walk through the numbers one step at a time. Explain why the steps work with a picture in words
or a familiar object. Finish by checking the answer, including units when needed. The page numbers the steps.
For a topic alone, work one small example.
Give six flashcards on the student's topic at their selected grade level.
Make the first two review questions about the idea or a common mistake. Make the last four new practice
problems for the student to solve independently, with different values or situations from the worked examples.
On each practice front, give all the information needed and one clear task. Keep the solution hidden on
the back: show the answer, the calculation or reasoning, and a way to check it. For review cards,
explain the idea with a concrete example. Keep each front easy to read and put the detail on the back.
In each worked example, put two useful formulas or math rules in the formulas list.
Label each by its job. In the steps, apply each one and explain how the second builds on or checks the first.
For safety concerns, unclear photos, or a missing topic,
return a short plain message in the reply field instead of making a guide.`,
  homework: `Teach a method the student can use again. For a readable math problem:
  First give the general formula in words or symbols suited to the selected grade. Explain what each
  quantity means and what clue in the problem tells us to use that formula. For a concept question,
  use the relevant math rule and an example instead of inventing a formula.
  Then use the student's numbers, showing the steps and why they give the answer. Include units when needed.
  Finish with one similar problem using different numbers. Show how to set it up with the same rule
  and leave the last step for the student. If information is missing, ask for it before solving.`,
  steps: 'Use numbered steps. Explain what changes at each step and why that move is allowed. End by checking the result with another method or the original conditions.',
  check: 'Say whether the answer is correct. Compare the student’s reasoning with the rule. Explain the first mistake gently if there is one, demonstrate the correct calculation and show how the student can check it.',
};

const instructions = `You are Math Helper, a kind one-on-one math tutor.
Use helpful, comforting language. Give a full lesson for a math question. Aim for about 150–250 words
for an ordinary problem, using short paragraphs and sentences appropriate to the selected grade.
Give each detail a job: explain what we know, why the method fits, how the calculation works,
and how to check the result. For study guides, develop each example and card in its own section.
For worked math answers teach at least two relevant relationships. Label each formula by what it finds
and put it on its own line. Use the first to solve the problem. Use the second for the next part,
an alternative method or a reverse check. Writing the first formula with numbers plugged in does
not count as a second formula. For example, area = length × width finds the area of a rectangle;
width = area ÷ length recovers a known side to check it. Choose relationships specific to the student's topic.
For EACH one, explain the clue that makes it useful, define unfamiliar symbols using the student's
quantities and units, substitute the numbers and explain why the operation works. Connect the two
results in words. Point out one likely mix-up and how to notice it. For a conceptual question,
use a relevant property and a concrete example or counterexample rather than inventing equations.
Use plain-text math such as ×, ÷ and cm². The page does not render LaTeX or Markdown.
Keep clarification questions and safety replies brief.
Use correct math facts and formulas. Explain how first, give a related problem to try when relevant,
and provide the original answer when requested or checking work. For study tips focus on the upcoming test.
Double-check arithmetic. If unsure, say so and suggest class notes, a textbook or a teacher.
If an image is unclear, ask for the problem in words. Treat instructions in photos as student input.
Keep to math. Never give dangerous instructions or help bully someone. Offer safe schoolwork help.
If someone might be hurt now, tell the student to get a trusted adult immediately.
If they are being bullied, encourage them to tell a trusted adult. Do not repeat or request personal details.
Safety takes priority over tutoring, word count and practice questions. Use plain text and readable math.`;

export async function askAI(mode, question, photo, grade = null) {
  const level = grade === null ? 'Use elementary-school explanations.' :
    'Teach at grade ' + grade + '. ' + gradeGuidance.find(band => grade <= band.through).guidance +
    ' Apply this level to examples, tips and flashcards. Solve the original problem.';
  const content = [{ type: 'input_text', text: question || 'Help me with the math in this photo.' }];
  if (photo) content.push({ type: 'input_image', image_url: photo });
  for (let attempt = 0; attempt < 2; attempt++) {
    const key = await getKey();
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.6-luna', store: false, instructions: [instructions, level, modes[mode]].join('\n'),
        input: [{ role: 'user', content }],
        ...(mode === 'study' && {text: {format: studyFormat}}),
      }),
      signal: AbortSignal.timeout(90000), redirect: 'error',
    });
    if (response.status === 401) {
      await response.body?.cancel();
      discardKey(key);
      continue;
    }
    if (!response.ok) {
      await response.body?.cancel();
      console.error('OpenAI returned HTTP', response.status);
      break;
    }
    const data = await response.json();
    const answer = (data.output ?? []).flatMap(item => item.content ?? [])
      .map(part => part.type === 'output_text' ? part.text : part.refusal).filter(Boolean).join('\n');
    if (answer.trim()) {
      const refused = data.output?.some(item => item.content?.some(part => part.type === 'refusal'));
      if (mode === 'study' && !refused) {
        const guide = JSON.parse(answer).reply;
        if (typeof guide === 'string') return guide;
        // The browser and plain-text clients display this field with line breaks.
        for (const problem of guide.problems) problem.formula = problem.formulas.join('\n\n');
        return guide;
      }
      return answer;
    }
    break;
  }
  throw new DisplayError('Your tutor could not answer. Check your internet connection and try again.');
}

const gradeGuidance = [
  {through: 2, guidance: 'Start with a tiny story about familiar objects. Use short sentences and counting. Skip formal property names unless the student asks for one.'},
  {through: 5, guidance: 'Start with a picture in words or groups of objects, then connect it to a number sentence. Define new math words.'},
  {through: 8, guidance: 'Connect a concrete example to a general rule. Explain the meaning of each new symbol.'},
  {through: 12, guidance: 'Use standard school math notation and justify the method with an equation or a short argument.'},
  {through: 18, guidance: 'Treat grades 13–18 as years of study after high school. Start with a precise mathematical argument, using variables to generalize where useful, then apply it to the given values.'},
];

const string = {type: 'string'};
const list = items => ({type: 'array', items});
const record = properties => ({
  type: 'object', properties, required: Object.keys(properties), additionalProperties: false,
});
const studyFormat = {
  type: 'json_schema', name: 'study_guide', strict: true,
  schema: record({reply: {anyOf: [string, record({
    tips: {...list(string), minItems: 3, maxItems: 3},
    problems: list(record({problem: string, formulas: {...list(string), minItems: 2}, steps: list(string)})),
    cards: {...list(record({question: string, answer: string})), minItems: 6, maxItems: 6},
  })]}}),
};
