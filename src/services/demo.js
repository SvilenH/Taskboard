import { upgradeDemoLanguage } from './demo-language.js';
import { reorderTask, validateProject, validateTask, validateFile } from '../utils/model.js';

const KEY = 'taskboard-codex-demo-v1';
export const demoUser = { id: 'demo-owner', email: 'demo@taskboard.local', user_metadata: { display_name: 'Svilen' } };
const today = new Date();
const day = offset => { const d = new Date(today); d.setDate(d.getDate() + offset); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
function seed() {
  const projects = [
    { id: 'website', title: 'Our new website', description: 'From the first sketch to the final detail. Building a better digital presence.', color: 'sage' },
    { id: 'launch', title: 'Autumn campaign', description: 'Ideas, content and everything we need for our next launch.', color: 'peach' },
    { id: 'course', title: 'Course project', description: 'Small steps towards a big achievement. Software Technologies with AI.', color: 'blue' },
  ].map((p, index) => ({ ...p, owner_id: demoUser.id, created_at: new Date(Date.now() - index * 86400000).toISOString() }));
  const stages = projects.flatMap(p => ['To do', 'In progress', 'Done'].map((name, position) => ({ id: `${p.id}-${position}`, project_id: p.id, name, position, is_done: position === 2 })));
  const items = [
    ['website', 0, 'Research inspiring examples', 'Collect five inspiring websites and note what works well.', 'medium', 3],
    ['website', 0, 'Write the About us page', 'A short introduction to our team and our story.', 'low', 5],
    ['website', 0, 'Accessibility review', 'Keyboard navigation, contrast and image descriptions.', 'high', 6],
    ['website', 1, 'Homepage design', 'Create layouts for desktop and mobile. Make the main action clear.', 'high', 1],
    ['website', 1, 'Components and navigation', 'Shared header, footer, buttons and cards for every page.', 'medium', 2],
    ['website', 2, 'Content structure', 'All main sections are now organised.', 'medium', -2],
    ['website', 2, 'Colours and typography', 'Primary colour, accents and a readable typeface selected.', 'low', -1],
    ['launch', 0, 'Social media plan', 'A calendar of ideas and publication dates.', 'medium', 4],
    ['launch', 1, 'Campaign visuals', 'Prepare three different formats.', 'high', 2],
    ['launch', 2, 'Core message', 'Clear, concise and memorable.', 'medium', -1],
    ['course', 0, 'Prepare the project presentation', 'Demonstrate the main workflows and explain the architecture.', 'high', 6],
    ['course', 1, 'Connect Supabase', 'Database, users and access permissions.', 'high', 3],
    ['course', 2, 'Review the requirements', 'At least five screens, four tables, Auth and Storage.', 'medium', -1],
  ];
  const tasks = items.map(([project_id, stage, title, description, priority, offset], index) => ({ id: `task-${index}`, project_id, stage_id: `${project_id}-${stage}`, title, description, priority, due_date: day(offset), position: index, created_by: demoUser.id, created_at: new Date(Date.now() - index * 3600000).toISOString() }));
  return { uiLanguage: 'en', projects, stages, tasks, attachments: [], profiles: [{ id: demoUser.id, display_name: 'Svilen', created_at: new Date().toISOString() }], roles: [{ user_id: demoUser.id, role: 'admin' }] };
}
function read() {
  const raw = localStorage.getItem(KEY);
  if (raw === null) { const state = seed(); write(state); return state; }
  let state;
  try { state = JSON.parse(raw); } catch { throw new Error('Demo data is corrupted. It has not been overwritten.'); }
  if (!state || !['projects', 'stages', 'tasks', 'attachments', 'profiles', 'roles'].every(k => Array.isArray(state[k]))) throw new Error('Invalid demo data format.');
  if (upgradeDemoLanguage(state)) write(state);
  return state;
}
function write(state) { localStorage.setItem(KEY, JSON.stringify(state)); }
async function blobs(mode, operation) {
  const db = await new Promise((resolve, reject) => { const request = indexedDB.open('taskboard-codex-files', 1); request.onupgradeneeded = () => request.result.createObjectStore('files'); request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error); });
  try { return await new Promise((resolve, reject) => { const tx = db.transaction('files', mode); const req = operation(tx.objectStore('files')); let result; req.onsuccess = () => { result = req.result; }; tx.oncomplete = () => resolve(result); tx.onerror = () => reject(tx.error); tx.onabort = () => reject(tx.error || new Error('The file operation was interrupted.')); }); }
  finally { db.close(); }
}
export const demo = {
  async load() { return read(); },
  async saveProject(input, id) {
    const values = validateProject(input); const state = read();
    if (id) { const found = state.projects.find(p => p.id === id); if (!found) throw new Error('Project not found.'); Object.assign(found, values); }
    else { id = crypto.randomUUID(); state.projects.unshift({ ...values, id, owner_id: demoUser.id, created_at: new Date().toISOString() }); state.stages.push(...['To do', 'In progress', 'Done'].map((name, position) => ({ id: crypto.randomUUID(), project_id: id, name, position, is_done: position === 2 }))); }
    write(state); return id;
  },
  async saveTask(input, id) {
    const values = validateTask(input); const state = read();
    const stage = state.stages.find(s => s.id === values.stage_id);
    if (!stage || stage.project_id !== input.project_id) throw new Error('Invalid column for this project.');
    if (id) {
      const task = state.tasks.find(t => t.id === id); if (!task || task.project_id !== input.project_id) throw new Error('Task not found.');
      if (task.stage_id !== values.stage_id) state.tasks = reorderTask(state.tasks, state.stages, id, values.stage_id, state.tasks.filter(t => t.stage_id === values.stage_id).length);
      Object.assign(state.tasks.find(t => t.id === id), values);
    } else { id = crypto.randomUUID(); state.tasks.push({ ...values, id, project_id: input.project_id, position: Math.max(-1, ...state.tasks.filter(t => t.stage_id === values.stage_id).map(t => t.position)) + 1, created_by: demoUser.id, created_at: new Date().toISOString() }); }
    write(state); return id;
  },
  async moveTask(id, stage, position) { const state = read(); state.tasks = reorderTask(state.tasks, state.stages, id, stage, position); write(state); },
  async deleteTask(id) { const state = read(); for (const a of state.attachments.filter(a => a.task_id === id)) await blobs('readwrite', s => s.delete(a.id)); state.tasks = state.tasks.filter(t => t.id !== id); state.attachments = state.attachments.filter(a => a.task_id !== id); write(state); },
  async deleteProject(id) { const state = read(); const taskIds = state.tasks.filter(t => t.project_id === id).map(t => t.id); for (const t of taskIds) await this.deleteTask(t); const fresh = read(); fresh.projects = fresh.projects.filter(p => p.id !== id); fresh.stages = fresh.stages.filter(s => s.project_id !== id); write(fresh); },
  async upload(task_id, file) {
    validateFile(file); const state = read(); if (!state.tasks.some(t => t.id === task_id)) throw new Error('Task not found.');
    const id = crypto.randomUUID(); await blobs('readwrite', s => s.put(file, id));
    try { state.attachments.push({ id, task_id, original_name: file.name, size_bytes: file.size, mime_type: file.type, uploaded_by: demoUser.id, created_at: new Date().toISOString() }); write(state); } catch (error) { await blobs('readwrite', s => s.delete(id)); throw error; }
  },
  async download(id) { const result = await blobs('readonly', s => s.get(id)); if (!result) throw new Error('This file is no longer available in this browser.'); return result; },
  async deleteAttachment(id) { await blobs('readwrite', s => s.delete(id)); const state = read(); state.attachments = state.attachments.filter(a => a.id !== id); write(state); },
};
