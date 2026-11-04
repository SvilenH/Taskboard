import { heading } from '../components/layout.js';
import { ownerOptions, ownerHeading } from '../components/ownership.js';
import { groupProjects, projectState, ownerName } from '../utils/workspace.js';
import { deleteProject, setRole, isDemo } from '../services/backend.js';
import { escape, icon, paintIcons, errorBox, notify, confirmDialog } from '../utils/ui.js';

export async function mount(ctx) {
  let owner = '';
  function renderProjects() {
    const projects = ctx.data.projects.filter(p => !owner || p.owner_id === owner);
    document.querySelector('#admin-project-count').textContent = `${projects.length} projects`;
    document.querySelector('#admin-projects').innerHTML = projects.length ? groupProjects(projects,ctx.data).map(group => `<section class="owner-group">${ownerHeading(group,ctx.data,ctx.user.id)}<div class="surface table-responsive"><table class="table task-table"><thead><tr><th>Project</th><th>Status</th><th>Tasks</th><th>Files</th><th>Actions</th></tr></thead><tbody>${group.projects.map(project => {
      const state = projectState(project,ctx.data);
      return `<tr><td><a class="muted-link" href="/board.html?project=${encodeURIComponent(project.id)}">${escape(project.title)}</a></td><td><span class="project-state state-${state.key}">${state.label}</span></td><td>${state.completed} / ${state.total} done</td><td>${ctx.data.attachments.filter(a=>a.project_id===project.id).length}</td><td><div class="d-flex gap-2"><a class="btn btn-light btn-sm" href="/board.html?project=${encodeURIComponent(project.id)}">Open</a><a class="icon-button" href="/project-edit.html?id=${encodeURIComponent(project.id)}" aria-label="Edit ${escape(project.title)}">${icon('pencil')}</a><button class="icon-button danger" data-delete="${escape(project.id)}" aria-label="Delete ${escape(project.title)}">${icon('trash-2')}</button></div></td></tr>`;
    }).join('')}</tbody></table></div></section>`).join('') : '<div class="surface p-4"><p class="mb-0">No projects for this owner.</p></div>';
    document.querySelectorAll('[data-delete]').forEach(button => button.addEventListener('click', async () => {
      const project=ctx.data.projects.find(p=>p.id===button.dataset.delete);
      if(!await confirmDialog('Delete project',`“${project.title}”, owned by ${ownerName(ctx.data,project.owner_id)}, and all its tasks and files will be deleted.`)) return;
      button.disabled=true;
      try {await deleteProject(project.id);await ctx.refresh();render();notify('Project deleted.');} catch(error){errorBox(error);button.disabled=false;}
    }));
    paintIcons();
  }
  function render() {
    document.querySelector('#page').innerHTML = heading('Administration','Review each person’s workspace and manage access. Projects stay grouped by their owner.','','ADMIN ACCESS') + `${isDemo()?'<p class="inline-note">The demo administrator is fixed. Manage roles in the cloud version with real accounts.</p>':''}
      <section class="surface mb-4"><div class="surface-heading"><h2>Users and roles</h2></div><div class="table-responsive"><table class="table task-table"><thead><tr><th>Name</th><th>Role</th><th>Workspace</th><th>Role action</th></tr></thead><tbody>${ctx.data.profiles.map(profile=>{
        const role=ctx.data.roles.find(r=>r.user_id===profile.id)?.role||'user';
        const projects=ctx.data.projects.filter(p=>p.owner_id===profile.id);
        const ids=new Set(projects.map(p=>p.id));
        return `<tr><td><strong>${escape(profile.display_name||'Unnamed user')}</strong>${profile.id===ctx.user.id?' <small>(you)</small>':''}</td><td><span class="status-label">${role==='admin'?'Administrator':'User'}</span></td><td><a class="muted-link" href="/projects.html?owner=${encodeURIComponent(profile.id)}">${projects.length} projects ${icon('arrow-up-right')}</a><small class="workspace-counts">${ctx.data.tasks.filter(t=>ids.has(t.project_id)).length} tasks · ${ctx.data.attachments.filter(a=>ids.has(a.project_id)).length} files</small></td><td><button class="btn btn-light btn-sm" data-user="${escape(profile.id)}" data-role="${role==='admin'?'user':'admin'}" aria-label="${role==='admin'?'Remove administrator role from':'Make administrator:'} ${escape(profile.display_name||'Unnamed user')}" ${isDemo()||profile.id===ctx.user.id?'disabled':''}>${role==='admin'?'Remove admin':'Make admin'}</button></td></tr>`;
      }).join('')}</tbody></table></div></section>
      <div class="section-heading"><div><h2>Projects by owner</h2><p id="admin-project-count" aria-live="polite"></p></div><div class="filter-field"><label for="admin-owner">Owner</label><select id="admin-owner" class="form-select">${ownerOptions(ctx.data,ctx.user.id,owner)}</select></div></div><div id="admin-projects"></div>`;
    document.querySelector('#admin-owner').addEventListener('change',event=>{owner=event.target.value;renderProjects();});
    document.querySelectorAll('[data-user]').forEach(button=>button.addEventListener('click',async()=>{
      const name=ownerName(ctx.data,button.dataset.user);
      if(!await confirmDialog('Change role',`${name} will become ${button.dataset.role==='admin'?'an administrator':'a regular user'}. This immediately changes their permissions.`,'Confirm')) return;
      button.disabled=true;
      try {await setRole(button.dataset.user,button.dataset.role);await ctx.refresh();render();notify('Role updated.');}catch(error){errorBox(error);button.disabled=false;}
    }));
    renderProjects();
  }
  render();
}
