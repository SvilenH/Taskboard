import { createClient } from '@supabase/supabase-js';
import { validateFile, validateProject, validateTask } from '../utils/model.js';
import { demo, demoUser } from './demo.js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && key ? createClient(url, key) : null;
export const isDemo = () => sessionStorage.getItem('taskboard-demo') === 'yes';
export function startDemo() { sessionStorage.setItem('taskboard-demo', 'yes'); location.href = '/dashboard.html'; }
export function leaveDemo() { sessionStorage.removeItem('taskboard-demo'); location.href = '/'; }
function client() { if (!supabase) throw new Error('Облачната връзка още не е настроена. Можеш да разгледаш демото от началната страница.'); return supabase; }
async function result(request) { const { data, error } = await request; if (error) throw new Error(error.message); return data; }
async function all(table) {
  const data = []; let offset = 0;
  while (true) { const page = await result(client().from(table).select('*').order('id').range(offset, offset + 499)); data.push(...page); if (page.length < 500) break; offset += 500; }
  return data;
}
export async function session() {
  if (isDemo()) return { user: demoUser };
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession(); if (error) throw error; return data.session;
}
export async function login(email, password) { sessionStorage.removeItem('taskboard-demo'); const { data, error } = await client().auth.signInWithPassword({ email, password }); if (error) throw error; return data; }
export async function register(email, password, display_name) {
  sessionStorage.removeItem('taskboard-demo'); const { data, error } = await client().auth.signUp({ email, password, options: { data: { display_name } } }); if (error) throw error; return data;
}
export async function logout() { if (isDemo()) return leaveDemo(); const { error } = await client().auth.signOut(); if (error) throw error; location.href = '/'; }
export async function load() {
  if (isDemo()) return demo.load();
  const [projects, stages, tasks, attachments, profiles, roles] = await Promise.all(['tb_projects', 'tb_stages', 'tb_tasks', 'tb_attachments', 'tb_profiles', 'tb_user_roles'].map(all));
  return { projects, stages, tasks, attachments, profiles, roles };
}
export async function saveProject(input, id) {
  if (isDemo()) return demo.saveProject(input, id);
  const values = validateProject(input);
  if (id) { await result(client().from('tb_projects').update(values).eq('id', id).select('id').single()); return id; }
  return result(client().rpc('tb_create_project', { p_title: values.title, p_description: values.description, p_color: values.color }));
}
export async function saveTask(input, id) {
  if (isDemo()) return demo.saveTask(input, id);
  const values = validateTask(input);
  return result(client().rpc('tb_save_task', { p_id: id || null, p_project_id: input.project_id, p_stage_id: values.stage_id, p_title: values.title, p_description: values.description, p_priority: values.priority, p_due_date: values.due_date }));
}
export async function moveTask(id, stage, position) { if (isDemo()) return demo.moveTask(id, stage, position); return result(client().rpc('tb_move_task', { p_task: id, p_stage: stage, p_position: position })); }
export async function deleteTask(id) {
  if (isDemo()) return demo.deleteTask(id);
  const files = await result(client().from('tb_attachments').select('*').eq('task_id', id));
  if (files.length) await result(client().storage.from('tb-attachments').remove(files.map(f => f.storage_path)));
  await result(client().from('tb_tasks').delete().eq('id', id).select('id').single());
}
export async function deleteProject(id) {
  if (isDemo()) return demo.deleteProject(id);
  const files = await result(client().from('tb_attachments').select('*').eq('project_id', id));
  if (files.length) await result(client().storage.from('tb-attachments').remove(files.map(f => f.storage_path)));
  await result(client().from('tb_projects').delete().eq('id', id).select('id').single());
}
export async function upload(task_id, file) {
  if (isDemo()) return demo.upload(task_id, file);
  validateFile(file);
  const task = await result(client().from('tb_tasks').select('project_id').eq('id', task_id).single());
  const { user } = await session(); const path = `${task.project_id}/${task_id}/${crypto.randomUUID()}`;
  await result(client().storage.from('tb-attachments').upload(path, file, { contentType: file.type, upsert: false }));
  try { await result(client().from('tb_attachments').insert({ task_id, project_id: task.project_id, uploaded_by: user.id, storage_path: path, original_name: file.name, mime_type: file.type, size_bytes: file.size })); }
  catch (error) { await client().storage.from('tb-attachments').remove([path]); throw error; }
}
export async function download(attachment) { if (isDemo()) return demo.download(attachment.id); return result(client().storage.from('tb-attachments').download(attachment.storage_path)); }
export async function deleteAttachment(attachment) {
  if (isDemo()) return demo.deleteAttachment(attachment.id);
  await result(client().storage.from('tb-attachments').remove([attachment.storage_path]));
  await result(client().from('tb_attachments').delete().eq('id', attachment.id).select('id').single());
}
export async function setRole(user_id, role) { if (isDemo()) throw new Error('Демо акаунтът е фиксиран. Ролите се управляват в облачната версия.'); return result(client().rpc('tb_set_role', { p_user: user_id, p_role: role })); }
