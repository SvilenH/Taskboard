import { heading } from '../components/layout.js';
import { projectCard } from '../components/project-card.js';
import { taskEditor } from '../components/task-editor.js';
import { statistics, isOverdue, priorities } from '../utils/model.js';
import { escape, icon, shortDate, paintIcons, empty } from '../utils/ui.js';
export async function mount(ctx) {
  const render = async () => {
    const projects = ctx.data.projects.filter(project => project.owner_id === ctx.user.id);
    const projectIds = new Set(projects.map(project => project.id));
    const stages = ctx.data.stages.filter(stage => projectIds.has(stage.project_id));
    const tasks = ctx.data.tasks.filter(task => projectIds.has(task.project_id));
    const stats = statistics(projects, stages, tasks);
    const open = tasks.filter(t => !stages.find(s => s.id === t.stage_id)?.is_done).sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999')).slice(0, 5);
    const name = ctx.profile?.display_name || ctx.user.user_metadata?.display_name || 'friend';
    document.querySelector('#page').innerHTML = heading(`Let’s make progress, ${name}.`, 'Your projects at a glance. One clear next step.', `<a class="btn btn-primary" href="/project-edit.html">${icon('plus')} New project</a>`, 'A GOOD DAY TO MAKE PROGRESS') + `
      ${ctx.admin ? `<div class="workspace-scope"><div><strong>Your personal overview</strong><p>The numbers below cover your own projects. Administration shows all ${ctx.data.projects.length} projects, grouped by owner.</p></div><a class="btn btn-light btn-sm" href="/admin.html">${icon('users')} Manage all users’ projects</a></div>` : ''}
      <div class="stats-grid"><article class="stat-card"><span class="stat-icon sage">${icon('folder-kanban')}</span><p>Your projects</p><strong>${stats.projects}</strong><span class="stat-note">Your ideas in motion</span></article><article class="stat-card"><span class="stat-icon blue">${icon('list-todo')}</span><p>Open tasks</p><strong>${stats.open}</strong><span class="stat-note">Every step counts</span></article><article class="stat-card"><span class="stat-icon peach">${icon('check-check')}</span><p>Completed tasks</p><strong>${stats.completed}<small> / ${stats.total}</small></strong><span class="stat-note">${stats.percent}% of your tasks completed</span></article><article class="focus-card"><span class="eyebrow">A LITTLE REMINDER</span><h2>One thing at a time.<br>Start with the next.</h2><a href="/tasks.html">Find your focus ${icon('arrow-right')}</a><span class="focus-decoration">✳</span></article></div>
      <section class="page-section"><div class="section-heading"><div><h2>Your projects <span>${projects.length}</span></h2><p>Big ideas, broken into small steps.</p></div><a class="text-link" href="/projects.html">All projects ${icon('arrow-right')}</a></div><div class="projects-grid">${projects.slice(0, 3).map(p => projectCard(p, ctx.data, ctx.user.id)).join('')}</div>${!projects.length ? empty('Start with an idea', 'Create your first project and give your work a direction.', '<a class="btn btn-primary" href="/project-edit.html">Create project</a>') : ''}</section>
      <section class="page-section"><div class="section-heading"><div><h2>In focus</h2><p>Upcoming tasks, ordered by due date.</p></div><a class="text-link" href="/tasks.html">All tasks ${icon('arrow-right')}</a></div><div class="surface">${open.length ? `<div class="table-responsive"><table class="table task-table"><thead><tr><th>Task</th><th>Project</th><th>Priority</th><th>Due date</th></tr></thead><tbody>${open.map(t => `<tr><td><button class="task-title-button" data-task="${escape(t.id)}">${icon('circle')}<span>${escape(t.title)}</span></button></td><td>${escape(projects.find(p => p.id === t.project_id)?.title)}</td><td><span class="priority ${t.priority}">${priorities[t.priority]}</span></td><td class="${isOverdue(t, stages) ? 'overdue' : ''}">${shortDate(t.due_date)}</td></tr>`).join('')}</tbody></table></div>` : empty('All caught up', 'No open tasks. Time for your next idea.')}</div></section>`;
    document.querySelectorAll('[data-task]').forEach(button => button.addEventListener('click', () => { const task = tasks.find(t => t.id === button.dataset.task); taskEditor(ctx, { task, project: projects.find(p => p.id === task.project_id) }, async () => { await ctx.refresh(); await render(); }); })); paintIcons();
  }; await render();
}
