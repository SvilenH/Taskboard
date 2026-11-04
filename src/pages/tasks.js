import { heading } from '../components/layout.js';
import { taskEditor } from '../components/task-editor.js';
import { ownerOptions, ownerBadge } from '../components/ownership.js';
import { priorities, isOverdue } from '../utils/model.js';
import { ownerName } from '../utils/workspace.js';
import { escape, icon, shortDate, paintIcons, empty } from '../utils/ui.js';
export async function mount(ctx) {
  let search=new URLSearchParams(location.search).get('q')||'', projectFilter='', owner='', status='all', page=1;
  const perPage=10;
  document.querySelector('#page').innerHTML=heading('All tasks','Find a task by project, owner or progress.','<a href="/projects.html" class="btn btn-primary">Open project →</a>')+`<div class="filter-bar flex-wrap"><div class="search-input">${icon('search')}<label class="visually-hidden" for="task-search">Search tasks</label><input id="task-search" type="search" value="${escape(search)}" placeholder="Search tasks…"></div>${ctx.admin?`<div class="filter-field"><label for="task-owner">Owner</label><select class="form-select" id="task-owner">${ownerOptions(ctx.data,ctx.user.id)}</select></div>`:''}<div class="filter-field"><label for="project-filter">Project</label><select class="form-select" id="project-filter"><option value="">All projects</option>${ctx.data.projects.map(p=>`<option value="${escape(p.id)}">${escape(p.title)}${ctx.admin?' · '+escape(ownerName(ctx.data,p.owner_id)):''}</option>`).join('')}</select></div><div class="filter-field"><label for="status-filter">Status</label><select class="form-select" id="status-filter"><option value="all">All statuses</option><option value="open">Open</option><option value="done">Done</option><option value="overdue">Overdue</option></select></div></div><div class="surface" id="task-results"></div>`;
  function render() {
    const filtered=ctx.data.tasks.filter(task=>{
      const done=ctx.data.stages.find(s=>s.id===task.stage_id)?.is_done;
      const project=ctx.data.projects.find(p=>p.id===task.project_id);
      return `${task.title} ${task.description}`.toLocaleLowerCase('en').includes(search.toLocaleLowerCase('en'))&&(!projectFilter||task.project_id===projectFilter)&&(!owner||project?.owner_id===owner)&&(status==='all'||(status==='done'?done:status==='overdue'?isOverdue(task,ctx.data.stages):!done));
    }).sort((a,b)=>(a.due_date||'9999').localeCompare(b.due_date||'9999')||a.id.localeCompare(b.id));
    const pages=Math.max(1,Math.ceil(filtered.length/perPage));page=Math.min(page,pages);
    const rows=filtered.slice((page-1)*perPage,page*perPage);
    document.querySelector('#task-results').innerHTML=rows.length?`<div class="table-responsive"><table class="table task-table"><thead><tr><th>Task</th><th>Project${ctx.admin?' / Owner':''}</th><th>Status</th><th>Priority</th><th>Due date</th></tr></thead><tbody>${rows.map(task=>{
      const stage=ctx.data.stages.find(s=>s.id===task.stage_id),project=ctx.data.projects.find(p=>p.id===task.project_id);
      return `<tr><td><button class="task-title-button" data-open="${escape(task.id)}">${icon(stage?.is_done?'check-circle-2':'circle')}<span>${escape(task.title)}</span></button></td><td><a class="muted-link" href="/board.html?project=${encodeURIComponent(task.project_id)}">${escape(project?.title)}</a>${ctx.admin?ownerBadge(ctx.data,project?.owner_id,ctx.user.id):''}</td><td><span class="status-label ${stage?.is_done?'status-done':''}">${escape(stage?.name)}</span></td><td><span class="priority ${task.priority}">${priorities[task.priority]}</span></td><td class="${isOverdue(task,ctx.data.stages)?'overdue':''}">${shortDate(task.due_date)}</td></tr>`;
    }).join('')}</tbody></table></div><div class="pagination-row"><span aria-live="polite">${filtered.length} tasks · page ${page} of ${pages}</span><div><button class="btn btn-light btn-sm" id="prev" ${page===1?'disabled':''}>← Previous</button><button class="btn btn-light btn-sm" id="next" ${page===pages?'disabled':''}>Next →</button></div></div>`:empty('No matching tasks','Try another owner, project or status.');
    document.querySelector('#prev')?.addEventListener('click',()=>{page--;render();});document.querySelector('#next')?.addEventListener('click',()=>{page++;render();});
    document.querySelectorAll('[data-open]').forEach(button=>button.addEventListener('click',()=>{const task=ctx.data.tasks.find(t=>t.id===button.dataset.open);taskEditor(ctx,{task,project:ctx.data.projects.find(p=>p.id===task.project_id)},async()=>{await ctx.refresh();render();});}));paintIcons();
  }
  document.querySelector('#task-search').addEventListener('input',event=>{search=event.target.value;page=1;render();});
  document.querySelector('#project-filter').addEventListener('change',event=>{projectFilter=event.target.value;page=1;render();});
  document.querySelector('#status-filter').addEventListener('change',event=>{status=event.target.value;page=1;render();});
  document.querySelector('#task-owner')?.addEventListener('change',event=>{owner=event.target.value;page=1;render();});render();
}
