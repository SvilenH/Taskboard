import { reorderTask, validateProject, validateTask, validateFile } from '../utils/model.js';

const KEY = 'taskboard-codex-demo-v1';
export const demoUser = { id: 'demo-owner', email: 'demo@taskboard.local', user_metadata: { display_name: 'Свилен' } };
const today = new Date();
const day = offset => { const d = new Date(today); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function seed() {
  const projects = [
    { id: 'website', title: 'Новият ни уебсайт', description: 'От първата скица до последния детайл. Създаваме по-добро дигитално присъствие.', color: 'sage' },
    { id: 'launch', title: 'Есенна кампания', description: 'Идеи, съдържание и всичко необходимо за следващия ни старт.', color: 'peach' },
    { id: 'course', title: 'Курсов проект', description: 'Малките стъпки към едно голямо постижение. Софтуерни технологии с AI.', color: 'blue' },
  ].map((p, index) => ({ ...p, owner_id: demoUser.id, created_at: new Date(Date.now() - index * 86400000).toISOString() }));
  const stages = projects.flatMap(p => ['За изпълнение', 'В процес', 'Завършени'].map((name, position) => ({ id: `${p.id}-${position}`, project_id: p.id, name, position, is_done: position === 2 })));
  const items = [
    ['website', 0, 'Проучване на добри примери', 'Събери 5 сайта, които ни вдъхновяват. Запиши какво работи добре в тях.', 'medium', 3],
    ['website', 0, 'Текстове за страницата „За нас“', 'Кратко представяне на екипа и нашата история.', 'low', 5],
    ['website', 0, 'Проверка на достъпността', 'Клавиатурна навигация, контраст и описания на изображенията.', 'high', 6],
    ['website', 1, 'Дизайн на началната страница', 'Подготви оформление за голям и малък екран. Обърни внимание на основното действие.', 'high', 1],
    ['website', 1, 'Компоненти и навигация', 'Общ header, footer, бутони и карти за всички страници.', 'medium', 2],
    ['website', 2, 'Структура на съдържанието', 'Подредени са всички основни раздели.', 'medium', -2],
    ['website', 2, 'Цветове и типография', 'Избрани са основен цвят, акценти и четим шрифт.', 'low', -1],
    ['launch', 0, 'План за социалните мрежи', 'Календар с идеи и дати за публикации.', 'medium', 4],
    ['launch', 1, 'Визии за кампанията', 'Подготви три различни формата.', 'high', 2],
    ['launch', 2, 'Основно послание', 'Ясно, кратко и запомнящо се.', 'medium', -1],
    ['course', 0, 'Подготовка за защитата', 'Демонстрирай основните сценарии и обясни архитектурата.', 'high', 6],
    ['course', 1, 'Връзка със Supabase', 'База данни, потребители и права за достъп.', 'high', 3],
    ['course', 2, 'Преглед на изискванията', 'Поне 5 екрана, 4 таблици, Auth и Storage.', 'medium', -1],
  ];
  const tasks = items.map(([project_id, stage, title, description, priority, offset], index) => ({ id: `task-${index}`, project_id, stage_id: `${project_id}-${stage}`, title, description, priority, due_date: day(offset), position: index, created_by: demoUser.id, created_at: new Date(Date.now() - index * 3600000).toISOString() }));
  return { projects, stages, tasks, attachments: [], profiles: [{ id: demoUser.id, display_name: 'Свилен', created_at: new Date().toISOString() }], roles: [{ user_id: demoUser.id, role: 'admin' }] };
}
function read() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) { const state = seed(); write(state); return state; }
  let state;
  try { state = JSON.parse(raw); } catch { throw new Error('Демо данните са повредени. Не са презаписани.'); }
  if (!state || !['projects', 'stages', 'tasks', 'attachments', 'profiles', 'roles'].every(k => Array.isArray(state[k]))) throw new Error('Невалиден формат на демо данните.');
  return state;
}
function write(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
async function blobs(mode, operation) {
  const db = await new Promise((resolve, reject) => { const request = indexedDB.open('taskboard-codex-files', 1); request.onupgradeneeded = () => request.result.createObjectStore('files'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  try { return await new Promise((resolve, reject) => { const tx = db.transaction('files', mode); const req = operation(tx.objectStore('files')); let result; req.onsuccess = () => { result = req.result; }; tx.oncomplete = () => resolve(result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('Файловата операция е прекъсната.')); }); }
  finally { db.close(); }
}
export const demo = {
  async load() { return read(); },
  async saveProject(input, id) {
    const values = validateProject(input); const state = read();
    if (id) { const found = state.projects.find(p => p.id === id); if (!found) throw new Error('Проектът не е намерен.'); Object.assign(found, values); }
    else { id = crypto.randomUUID(); state.projects.unshift({ ...values, id, owner_id: demoUser.id, created_at: new Date().toISOString() }); state.stages.push(...['За изпълнение', 'В процес', 'Завършени'].map((name, position) => ({ id: crypto.randomUUID(), project_id: id, name, position, is_done: position === 2 }))); }
    write(state); return id;
  },
  async saveTask(input, id) {
    const values = validateTask(input); const state = read();
    const stage = state.stages.find(s => s.id === values.stage_id);
    if (!stage || stage.project_id !== input.project_id) throw new Error('Невалидна колона за проекта.');
    if (id) {
      const task = state.tasks.find(t => t.id === id); if (!task || task.project_id !== input.project_id) throw new Error('Задачата не е намерена.');
      if (task.stage_id !== values.stage_id) state.tasks = reorderTask(state.tasks, state.stages, id, values.stage_id, state.tasks.filter(t => t.stage_id === values.stage_id).length);
      Object.assign(state.tasks.find(t => t.id === id), values);
    } else { id = crypto.randomUUID(); state.tasks.push({ ...values, id, project_id: input.project_id, position: Math.max(-1, ...state.tasks.filter(t => t.stage_id === values.stage_id).map(t => t.position)) + 1, created_by: demoUser.id, created_at: new Date().toISOString() }); }
    write(state); return id;
  },
  async moveTask(id, stage, position) { const state = read(); state.tasks = reorderTask(state.tasks, state.stages, id, stage, position); write(state); },
  async deleteTask(id) { const state = read(); for (const a of state.attachments.filter(a => a.task_id === id)) await blobs('readwrite', s => s.delete(a.id)); state.tasks = state.tasks.filter(t => t.id !== id); state.attachments = state.attachments.filter(a => a.task_id !== id); write(state); },
  async deleteProject(id) { const state = read(); const taskIds = state.tasks.filter(t => t.project_id === id).map(t => t.id); for (const t of taskIds) await this.deleteTask(t); const fresh = read(); fresh.projects = fresh.projects.filter(p => p.id !== id); fresh.stages = fresh.stages.filter(s => s.project_id !== id); write(fresh); },
  async upload(task_id, file) {
    validateFile(file); const state = read(); if (!state.tasks.some(t => t.id === task_id)) throw new Error('Задачата не е намерена.');
    const id = crypto.randomUUID(); await blobs('readwrite', s => s.put(file, id));
    try { state.attachments.push({ id, task_id, original_name: file.name, size_bytes: file.size, mime_type: file.type, uploaded_by: demoUser.id, created_at: new Date().toISOString() }); write(state); } catch (error) { await blobs('readwrite', s => s.delete(id)); throw error; }
  },
  async download(id) { const result = await blobs('readonly', s => s.get(id)); if (!result) throw new Error('Файлът вече не е наличен в този браузър.'); return result; },
  async deleteAttachment(id) { await blobs('readwrite', s => s.delete(id)); const state = read(); state.attachments = state.attachments.filter(a => a.id !== id); write(state); },
};
