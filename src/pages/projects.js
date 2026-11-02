import { heading } from '../components/layout.js';
import { projectCard } from '../components/project-card.js';
import { icon, paintIcons, empty } from '../utils/ui.js';
export async function mount(ctx) {
  document.querySelector('#page').innerHTML = heading('Твоите проекти', 'От първата идея до завършената работа. Всичко на едно място.', `<a href="/project-edit.html" class="btn btn-primary">${icon('plus')} Нов проект</a>`) + `<div class="filter-bar"><div class="search-input">${icon('search')}<label class="visually-hidden" for="project-search">Търси проект</label><input id="project-search" placeholder="Търси по име или описание…" type="search"></div><span class="results-count" id="result-count"></span></div><div id="projects-list" class="projects-grid"></div>`;
  const render = () => { const q = document.querySelector('#project-search').value.toLocaleLowerCase('bg'); const filtered = ctx.data.projects.filter(p => `${p.title} ${p.description}`.toLocaleLowerCase('bg').includes(q)); document.querySelector('#result-count').textContent = `${filtered.length} проекта`; document.querySelector('#projects-list').innerHTML = filtered.length ? filtered.map(p => projectCard(p, ctx.data)).join('') : empty('Няма намерени проекти', q ? 'Опитай с друга дума.' : 'Дай начало на първия си проект.', '<a href="/project-edit.html" class="btn btn-primary">Нов проект</a>'); paintIcons(); };
  document.querySelector('#project-search').addEventListener('input', render); render();
}
