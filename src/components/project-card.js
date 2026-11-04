import { escape, icon } from '../utils/ui.js';
import { statistics } from '../utils/model.js';
import { projectState } from '../utils/workspace.js';
import { ownerBadge } from './ownership.js';
export function projectCard(project, data, viewerId) {
  const tasks = data.tasks.filter(t => t.project_id === project.id);
  const stats = statistics([project], data.stages, tasks);
  const state = projectState(project, data);
  return `<article class="project-card"><div class="project-card-top"><span class="project-symbol ${escape(project.color)}">${icon('folder')}</span><span class="project-state state-${state.key}">${state.label}</span><a href="/project-edit.html?id=${encodeURIComponent(project.id)}" class="icon-button" aria-label="Edit ${escape(project.title)}">${icon('pencil')}</a></div><a class="project-title" href="/board.html?project=${encodeURIComponent(project.id)}"><h3>${escape(project.title)}</h3></a>${ownerBadge(data, project.owner_id, viewerId)}<p class="project-description">${escape(project.description || 'Ready for your next idea.')}</p><div class="project-progress-label"><span>Progress</span><strong>${stats.percent}%</strong></div><progress value="${stats.completed}" max="${stats.total || 1}" aria-label="Progress for ${escape(project.title)}"></progress><div class="project-card-bottom"><span>${icon('list-todo')}${stats.completed} / ${stats.total} tasks</span><a href="/board.html?project=${encodeURIComponent(project.id)}" aria-label="Open ${escape(project.title)}">${icon('arrow-up-right')}</a></div></article>`;
}
