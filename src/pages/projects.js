import { heading } from '../components/layout.js';
import { projectCard } from '../components/project-card.js';
import { icon, paintIcons, empty } from '../utils/ui.js';
export async function mount(ctx) {
  document.querySelector('#page').innerHTML = heading('Your projects', 'From the first idea to the finished work. All in one place.', `<a href="/project-edit.html" class="btn btn-primary">${icon('plus')} New project</a>`) + `<div class="filter-bar"><div class="search-input">${icon('search')}<label class="visually-hidden" for="project-search">Search projects</label><input id="project-search" placeholder="Search by name or description…" type="search"></div><span class="results-count" id="result-count"></span></div><div id="projects-list" class="projects-grid"></div>`;
  const render = () => { const q = document.querySelector('#project-search').value.toLocaleLowerCase('en'); const filtered = ctx.data.projects.filter(p => `${p.title} ${p.description}`.toLocaleLowerCase('en').includes(q)); document.querySelector('#result-count').textContent = `${filtered.length} projects`; document.querySelector('#projects-list').innerHTML = filtered.length ? filtered.map(p => projectCard(p, ctx.data)).join('') : empty('No projects found', q ? 'Try a different search.' : 'Start your first project.', '<a href="/project-edit.html" class="btn btn-primary">New project</a>'); paintIcons(); };
  document.querySelector('#project-search').addEventListener('input', render); render();
}
