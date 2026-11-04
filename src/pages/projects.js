import { heading } from '../components/layout.js';
import { projectCard } from '../components/project-card.js';
import { ownerOptions, ownerHeading } from '../components/ownership.js';
import { filterProjects, groupProjects } from '../utils/workspace.js';
import { icon, paintIcons, empty } from '../utils/ui.js';

export async function mount(ctx) {
  const requested = new URLSearchParams(location.search).get('owner') || '';
  let owner = ctx.admin && ctx.data.profiles.some(p => p.id === requested) ? requested : '';
  document.querySelector('#page').innerHTML = heading(ctx.admin ? 'Projects by owner' : 'Your projects', ctx.admin ? 'Keep each person’s work in view. Filter by owner or project status.' : 'From the first idea to the finished work. All in one place.', `<a href="/project-edit.html" class="btn btn-primary">${icon('plus')} New project</a>`) + `
    <div class="filter-bar flex-wrap"><div class="search-input">${icon('search')}<label class="visually-hidden" for="project-search">Search projects</label><input id="project-search" placeholder="Search by name or description…" type="search"></div>
    ${ctx.admin ? `<div class="filter-field"><label for="project-owner">Owner</label><select id="project-owner" class="form-select">${ownerOptions(ctx.data, ctx.user.id, owner)}</select></div>` : ''}
    <div class="filter-field"><label for="project-status">Project status</label><select id="project-status" class="form-select"><option value="">All statuses</option><option value="planned">Not started</option><option value="active">In progress</option><option value="completed">Completed</option></select></div><span class="results-count" id="result-count" aria-live="polite"></span></div><div id="projects-list"></div>`;
  function render() {
    const filtered = filterProjects(ctx.data.projects, ctx.data, {owner, query:document.querySelector('#project-search').value, status:document.querySelector('#project-status').value});
    document.querySelector('#result-count').textContent = `${filtered.length} project${filtered.length === 1 ? '' : 's'}`;
    document.querySelector('#projects-list').innerHTML = !filtered.length ? empty('No projects found', 'Try a different owner, status or search.') : ctx.admin ? groupProjects(filtered, ctx.data).map(group => `<section class="owner-group">${ownerHeading(group,ctx.data,ctx.user.id)}<div class="projects-grid">${group.projects.map(p => projectCard(p,ctx.data,ctx.user.id)).join('')}</div></section>`).join('') : `<div class="projects-grid">${filtered.map(p => projectCard(p,ctx.data,ctx.user.id)).join('')}</div>`;
    paintIcons();
  }
  document.querySelector('#project-search').addEventListener('input', render);
  document.querySelector('#project-status').addEventListener('change', render);
  document.querySelector('#project-owner')?.addEventListener('change', event => {owner=event.target.value;render();});
  render();
}
