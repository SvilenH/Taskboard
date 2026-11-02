export const priorities = { low: 'Low', medium: 'Medium', high: 'High' };
export const colors = ['sage', 'blue', 'peach', 'violet'];
export function text(value, label, max = 160) {
  const result = String(value ?? '').trim();
  if (!result || result.length > max) throw new Error(`${label}: enter between 1 and ${max} characters.`);
  return result;
}
export function validateProject(input) {
  const description = String(input.description ?? '').trim();
  if (description.length > 2000) throw new Error('Description must be 2,000 characters or fewer.');
  return { title: text(input.title, 'Project name', 120), description, color: colors.includes(input.color) ? input.color : 'sage' };
}
export function validateTask(input) {
  const description = String(input.description ?? '').trim();
  if (description.length > 5000) throw new Error('Description must be 5,000 characters or fewer.');
  if (!Object.hasOwn(priorities, input.priority)) throw new Error('Choose a valid priority.');
  const due_date = input.due_date || null;
  if (due_date && (!/^\d{4}-\d{2}-\d{2}$/.test(due_date) || new Date(`${due_date}T12:00:00Z`).toISOString().slice(0, 10) !== due_date)) throw new Error('Invalid date.');
  return { title: text(input.title, 'Title', 160), description, priority: input.priority, due_date, stage_id: text(input.stage_id, 'Column', 80) };
}
export function isOverdue(task, stages, today = new Date()) {
  const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  return Boolean(task.due_date && task.due_date < localDate && !stages.find(s => s.id === task.stage_id)?.is_done);
}
export function statistics(projects, stages, tasks) {
  const completed = tasks.filter(t => stages.find(s => s.id === t.stage_id)?.is_done).length;
  return { projects: projects.length, total: tasks.length, completed, open: tasks.length - completed, percent: tasks.length ? Math.round(completed / tasks.length * 100) : 0 };
}
export function reorderTask(tasks, stages, taskId, stageId, index) {
  const task = tasks.find(t => t.id === taskId);
  const stage = stages.find(s => s.id === stageId);
  if (!task || !stage || stage.project_id !== task.project_id) throw new Error('The task and column must belong to the same project.');
  if (!Number.isInteger(index) || index < 0) throw new Error('Invalid position.');
  const next = tasks.map(t => ({ ...t }));
  const moved = next.find(t => t.id === taskId);
  const previous = moved.stage_id;
  moved.stage_id = stageId;
  for (const id of new Set([previous, stageId])) {
    const column = next.filter(t => t.stage_id === id && t.id !== taskId).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
    if (id === stageId) column.splice(Math.min(index, column.length), 0, moved);
    column.forEach((t, position) => { t.position = position; });
  }
  return next;
}
export const MAX_FILE = 5 * 1024 * 1024;
export const FILE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'application/pdf', 'text/plain'];
export function validateFile(file) {
  if (!file || !file.size) throw new Error('Choose a non-empty file.');
  if (file.size > MAX_FILE) throw new Error('Maximum file size is 5 MB.');
  if (!FILE_TYPES.includes(file.type)) throw new Error('Allowed formats: PNG, JPG, WebP, PDF and TXT.');
}
