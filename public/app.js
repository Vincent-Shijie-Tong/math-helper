import { tasks, readChecks, writeChecks } from './storage.js';
const byId = id => document.getElementById(id);
const gradePicker = byId('grade');
for (let grade = 1; grade <= 18; grade++) {
  gradePicker.add(new Option('Grade ' + grade, String(grade)));
}
const activities = {
  study: ['✎', 'Study tips', 'What’s on your math test?', 'My quiz is about comparing fractions. How can I study?', 'Get study tips'],
  homework: ['⌂', 'Homework help', 'Where are you stuck?', 'I have 3 bags of 4 marbles. How do I find the total?', 'Help me start'],
  steps: ['≡', 'Show steps', 'Which problem should we work through?', 'Show me how to solve 42 − 17.', 'Show me the steps'],
  check: ['✓', 'Check my work', 'What was the problem, and what answer did you get?', 'I think 3 × 4 = 7. Can you check my answer?', 'Check my answer'],
  concept: ['?', 'Explain a concept', 'Which math idea feels confusing?', 'Why is 1/8 smaller than 1/4 when 8 is bigger than 4?', 'Explain this idea'],
};
let current = 'study';
let photo = null;
let busy = false;
let readingPhoto = false;
function show(text) {
  byId('response').hidden = false;
  byId('guide').replaceChildren();
  document.querySelector('output').textContent = text;
}
function addText(parent, tag, text) {
  const element = document.createElement(tag);
  element.textContent = text;
  parent.append(element);
  return element;
}
function showGuide(guide) {
  show('Your study guide is ready.');
  const panel = byId('guide');
  addText(panel, 'h4', 'Study tips');
  const tips = document.createElement('ul');
  panel.append(tips);
  for (const tip of guide.tips ?? [guide.tip]) addText(tips, 'li', tip);
  for (const item of guide.problems) {
    addText(panel, 'h4', item.problem);
    const rule = addText(panel, 'p', item.formula);
    rule.className = 'study-formula';
    const steps = document.createElement('ol');
    panel.append(steps);
    for (const step of item.steps) addText(steps, 'li', step);
  }
  if (guide.table) showTable(guide);
  addText(panel, 'h4', 'Flashcards');
  addText(panel, 'p', 'Start with two review cards. Then solve the four practice problems. Tap a card when you’re ready to check your work.');
  for (const card of guide.cards) {
    const details = document.createElement('details');
    addText(details, 'summary', card.question);
    addText(details, 'p', card.answer);
    panel.append(details);
  }
}
function showTable({table, takeaway}) {
  const panel = byId('guide');
  const grid = document.createElement('table');
  grid.createCaption().textContent = table.caption;
  const header = grid.createTHead().insertRow();
  for (const title of [table.leftHeading, table.rightHeading]) {
    addText(header, 'th', title).scope = 'col';
  }
  const body = grid.createTBody();
  for (const row of table.rows) {
    const tr = body.insertRow();
    addText(tr, 'td', row.left);
    addText(tr, 'td', row.right);
  }
  panel.append(grid);
  addText(panel, 'p', takeaway);
}
function removePhoto() {
  photo = null;
  byId('file').value = '';
  byId('review').checked = false;
  byId('preview').removeAttribute('src');
  byId('attachment').hidden = true;
}
function choose(mode) {
  current = mode;
  const [, title, label, example, action] = activities[mode];
  byId('activity').textContent = title;
  byId('label').textContent = label;
  byId('question').placeholder = example;
  byId('example').textContent = 'Use example question';
  byId('send').textContent = action;
  byId('response').hidden = true;
  for (const button of byId('modes').children) button.setAttribute('aria-pressed', button.dataset.mode === mode);
}
for (const [mode, [glyph, title]] of Object.entries(activities)) {
  const button = document.createElement('button');
  button.className = 'mode';
  button.dataset.mode = mode;
  const icon = document.createElement('span');
  icon.className = 'glyph';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = glyph;
  button.append(icon, title);
  button.onclick = () => choose(mode);
  byId('modes').append(button);
}
choose('study');
byId('example').onclick = () => {
  byId('question').value = activities[current][3];
  byId('question').focus();
};
byId('privacy-link').onclick = () => { byId('privacy').open = true; };
byId('remove').onclick = removePhoto;
byId('file').onchange = async () => {
  const file = byId('file').files[0];
  if (!file) return;
  removePhoto();
  readingPhoto = true;
  byId('send').disabled = byId('file').disabled = true;
  try {
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 12000000)
      throw new Error('Choose a JPG, PNG or WebP photo under 12 MB.');
    const image = await createImageBitmap(file);
    const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(image.width * scale));
    canvas.height = Math.max(1, Math.round(image.height * scale));
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    image.close();
    photo = canvas.toDataURL('image/jpeg', 0.82);
    byId('preview').src = photo;
    byId('attachment').hidden = false;
  } catch { show('Choose a readable JPG, PNG or WebP photo under 12 MB.'); }
  finally {
    readingPhoto = false;
    byId('send').disabled = byId('file').disabled = false;
  }
};
byId('ask-form').onsubmit = async event => {
  event.preventDefault();
  if (busy || readingPhoto) return;
  const question = byId('question').value.trim();
  if (!question && !photo) return show('Type a math question or add a photo.');
  if (photo && !byId('review').checked) return show('Check the photo for private details first.');
  busy = true;
  const controls = document.querySelectorAll('#grade, form button, form input, form textarea, nav button');
  controls.forEach(el => { el.disabled = true; });
  show('Thinking…');
  try {
    const result = await fetch('/api/ask', {method: 'POST', headers: {'Content-Type':'application/json', Accept:'application/json, application/vnd.math-helper.lesson+json'},
      body: JSON.stringify({ mode: current, question, photo, grade: gradePicker.value ? Number(gradePicker.value) : null })});
    const type = result.headers.get('content-type') ?? '';
    if (result.ok && type.includes('application/vnd.math-helper.lesson+json')) {
      const lesson = await result.json();
      show(lesson.explanation);
      showTable(lesson);
    } else if (result.ok && type.includes('application/json')) {
      showGuide(await result.json());
    } else {
      show(await result.text() || 'Check your internet connection and try again.');
    }
  } catch { show('Check your internet connection and try again.'); }
  finally {
    busy = false;
    controls.forEach(el => { el.disabled = false; });
  }
};
const checked = readChecks();
function updateProgress(saved = true) {
  byId('progress').value = checked.size;
  byId('count').textContent = saved ? checked.size + ' of ' + tasks.length + ' complete' : 'Browser saving is unavailable.';
}
for (const task of tasks) {
  const label = document.createElement('label');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = checked.has(task.id);
  box.onchange = () => {
    if (box.checked) checked.add(task.id);
    else checked.delete(task.id);
    updateProgress(writeChecks(checked));
  };
  label.append(box, task.label);
  byId('tasks').append(label);
}
updateProgress();
