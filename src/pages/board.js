import Sortable from 'sortablejs';
import { heading } from '../components/layout.js';
import { taskEditor } from '../components/task-editor.js';
import { moveTask } from '../services/backend.js';
import { ownerBadge } from '../components/ownership.js';
import { ownerName } from '../utils/workspace.js';
import { statistics, priorities, isOverdue } from '../utils/model.js';
import { escape, icon, paintIcons, shortDate, notify, empty, initials } from '../utils/ui.js';
export async function mount(ctx) {
  const projectId = new URLSearchParams(location.search).get('project');
  const project = ctx.data.projects.find(p => p.id === projectId);
  if (!project) { document.querySelector('#page').innerHTML = heading('Choose a project', 'Every board is a home for an idea.') + empty('No board selected', 'Open a project to view its tasks.', '<a href="/projects.html" class="btn btn-primary">View projects</a>'); paintIcons(); return; }
  let instances = []; let moving = false;
  const refresh = async () => { await ctx.refresh(); render(); };
  const openTask = (task, stage) => taskEditor(ctx, { task, stage, project }, refresh);
  function render() {
    instances.forEach(instance => instance.destroy()); instances = [];
    const stages = ctx.data.stages.filter(s => s.project_id === project.id).sort((a, b) => a.position - b.position);
    const tasks = ctx.data.tasks.filter(t => t.project_id === project.id);
    const stats = statistics([project], stages, tasks);
    document.querySelector('#page').innerHTML = `<a class="back-link" href="/projects.html">${icon('arrow-left')} All projects</a>` + heading(project.title, project.description || 'One task closer to your goal.', `<button class="btn btn-primary" id="new-task">${icon('plus')} New task</button>`, 'PROJECT / KANBAN BOARD') + ownerBadge(ctx.data, project.owner_id, ctx.user.id) + `<div class="board-toolbar"><div class="board-view-label">${icon('layout-grid')} Board <span>${tasks.length} tasks</span></div><div class="board-toolbar-right"><span class="board-completion">${icon('check-circle-2')} ${stats.completed} / ${stats.total} completed</span><a class="icon-button" href="/project-edit.html?id=${encodeURIComponent(project.id)}" aria-label="Edit project">${icon('pencil')}</a></div></div><div class="board" aria-label="Task board">${stages.map(stage => {
      const column = tasks.filter(t => t.stage_id === stage.id).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id));
      return `<section class="board-column"><div class="column-heading"><h2><span class="column-dot ${stage.is_done ? 'done' : stage.position === 0 ? 'todo' : 'progress-dot'}"></span>${escape(stage.name)} <span class="column-count">${column.length}</span></h2><button class="icon-button" data-add="${escape(stage.id)}" aria-label="Add a task to ${escape(stage.name)}">${icon('plus')}</button></div><div class="task-column" data-stage="${escape(stage.id)}">${column.map((task, index) => `<article class="task-card ${stage.is_done ? 'task-complete' : ''}" data-task-id="${escape(task.id)}"><div class="task-card-top"><span class="priority ${task.priority}">${priorities[task.priority]}</span><button class="drag-handle icon-button" aria-label="Drag to move; use the arrows below with a keyboard">${icon('grip-vertical')}</button></div><button class="card-open" data-open="${escape(task.id)}"><h3>${escape(task.title)}</h3>${task.description ? `<p>${escape(task.description)}</p>` : ''}</button><div class="task-card-meta"><span class="${isOverdue(task, stages) ? 'overdue' : ''}">${icon(stage.is_done ? 'check-circle-2' : 'calendar-days')}${shortDate(task.due_date)}</span><span>${ctx.data.attachments.filter(a => a.task_id === task.id).length ? `${icon('paperclip')} ${ctx.data.attachments.filter(a => a.task_id === task.id).length}` : ''}</span></div><div class="task-card-bottom"><span class="avatar tiny" title="Created by ${escape(ownerName(ctx.data, task.created_by))}">${escape(initials(ownerName(ctx.data, task.created_by)))}</span><div class="task-move-buttons"><button class="icon-button" data-up="${escape(task.id)}" ${index === 0 ? 'disabled' : ''} aria-label="Move ${escape(task.title)} up">↑</button><button class="icon-button" data-down="${escape(task.id)}" ${index === column.length - 1 ? 'disabled' : ''} aria-label="Move ${escape(task.title)} down">↓</button><button class="icon-button" data-open="${escape(task.id)}" aria-label="Edit or change column">${icon('more-horizontal')}</button></div></div></article>`).join('')}</div><button class="column-add" data-add="${escape(stage.id)}">${icon('plus')} Add task</button></section>`;
    }).join('')}</div><p class="board-help">${icon('grip-vertical')} Drag tasks to move them. With a keyboard, use the arrows to reorder and the editor to change columns.</p>`;
    document.querySelector('#new-task').addEventListener('click', () => openTask(null, stages[0]));
    document.querySelectorAll('[data-add]').forEach(button => button.addEventListener('click', () => openTask(null, stages.find(s => s.id === button.dataset.add))));
    document.querySelectorAll('[data-open]').forEach(button => button.addEventListener('click', () => openTask(tasks.find(t => t.id === button.dataset.open))));
    document.querySelectorAll('[data-up],[data-down]').forEach(button => button.addEventListener('click', async () => { const task = tasks.find(t => t.id === (button.dataset.up || button.dataset.down)); const column = tasks.filter(t => t.stage_id === task.stage_id).sort((a, b) => a.position - b.position || a.id.localeCompare(b.id)); const index = column.findIndex(t => t.id === task.id); await move(task.id, task.stage_id, index + (button.dataset.up ? -1 : 1)); }));
    document.querySelectorAll('.task-column').forEach(column => instances.push(new Sortable(column, { group: 'tasks', handle: '.drag-handle', animation: 160, ghostClass: 'task-ghost', delayOnTouchOnly: true, delay: 130, onEnd: event => move(event.item.dataset.taskId, event.to.dataset.stage, event.newIndex) })));
    paintIcons();
  }
  async function move(id, stage, index) { if (moving) return; moving = true; instances.forEach(s => s.option('disabled', true)); try { await moveTask(id, stage, index); } catch (error) { notify(`The move could not be saved: ${error.message}`, 'error'); } finally { try { await refresh(); } catch (error) { notify(error.message, 'error'); } moving = false; } }
  window.addEventListener('pagehide', () => instances.forEach(s => s.destroy()), { once: true }); render();
}
