import { escape, icon } from '../utils/ui.js';
import { statistics } from '../utils/model.js';
export function projectCard(project, data) {
  const tasks = data.tasks.filter(t => t.project_id === project.id);
  const stats = statistics([project], data.stages, tasks);
  return `<article class="project-card"><div class="project-card-top"><span class="project-symbol ${escape(project.color)}">${icon('folder')}</span><a href="/project-edit.html?id=${encodeURIComponent(project.id)}" class="icon-button" aria-label="Редактирай ${escape(project.title)}">${icon('pencil')}</a></div><a class="project-title" href="/board.html?project=${encodeURIComponent(project.id)}"><h3>${escape(project.title)}</h3></a><p class="project-description">${escape(project.description || 'Готов за следващата ти идея.')}</p><div class="project-progress-label"><span>Напредък</span><strong>${stats.percent}%</strong></div><progress value="${stats.completed}" max="${stats.total || 1}" aria-label="Напредък на ${escape(project.title)}"></progress><div class="project-card-bottom"><span>${icon('list-todo')}${stats.completed} / ${stats.total} задачи</span><a href="/board.html?project=${encodeURIComponent(project.id)}" aria-label="Отвори ${escape(project.title)}">${icon('arrow-up-right')}</a></div></article>`;
}
