// Store only check marks for these fictional study tasks. Never store student input.
const storageKey = 'math-helper.study-list.v1';
export const tasks = [
  { id: 'fractions', label: 'Review fraction strips' },
  { id: 'facts', label: 'Practice times tables' },
  { id: 'steps', label: 'Check a worked problem' },
];
const validIds = new Set(tasks.map(task => task.id));
export function readChecks() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter(id => validIds.has(id)) : []);
  } catch { return new Set(); }
}
export function writeChecks(checked) {
  try {
    localStorage.setItem(storageKey, JSON.stringify([...checked].filter(id => validIds.has(id))));
    return true;
  } catch { return false; }
}
