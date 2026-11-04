import { heading } from '../components/layout.js';
import { ownerBadge, ownerOptions } from '../components/ownership.js';
import { ownerName } from '../utils/workspace.js';
import { downloadFile } from '../components/task-editor.js';
import { upload, deleteAttachment } from '../services/backend.js';
import { escape, icon, size, shortDate, paintIcons, empty, errorBox, notify, confirmDialog } from '../utils/ui.js';
export async function mount(ctx) {
  let saving=false,owner='';
  function render() {
    const projects=ctx.data.projects.filter(p=>!owner||p.owner_id===owner),ids=new Set(projects.map(p=>p.id));
    const tasks=ctx.data.tasks.filter(t=>ids.has(t.project_id)),attachments=ctx.data.attachments.filter(a=>ids.has(a.project_id));
    document.querySelector('#page').innerHTML=heading('All your files, together.','See the task, project and owner behind every attachment.')+`${ctx.admin?`<div class="filter-bar"><div class="filter-field"><label for="files-owner">Owner</label><select id="files-owner" class="form-select">${ownerOptions(ctx.data,ctx.user.id,owner)}</select></div></div>`:''}<div class="files-layout"><section class="surface"><div class="surface-heading"><h2>Attachments <span class="column-count">${attachments.length}</span></h2></div>${attachments.length?`<div class="table-responsive"><table class="table file-table"><thead><tr><th>File</th><th>Task / Project${ctx.admin?' / Owner':''}</th><th>Size</th><th>Actions</th></tr></thead><tbody>${attachments.map(a=>{
      const project=projects.find(p=>p.id===a.project_id);
      return `<tr><td><div class="file-name">${icon('paperclip')}<span>${escape(a.original_name)}<small>${shortDate(a.created_at)}</small></span></div></td><td>${escape(tasks.find(t=>t.id===a.task_id)?.title)}<small class="workspace-counts">${escape(project?.title)}</small>${ctx.admin?ownerBadge(ctx.data,project?.owner_id,ctx.user.id):''}</td><td>${size(a.size_bytes)}</td><td><div class="d-flex gap-1"><button class="icon-button" data-download="${escape(a.id)}" aria-label="Download ${escape(a.original_name)}">${icon('download')}</button><button class="icon-button danger" data-delete="${escape(a.id)}" aria-label="Remove ${escape(a.original_name)}">${icon('trash-2')}</button></div></td></tr>`;
    }).join('')}</tbody></table></div>`:empty('No files in this view','Choose another owner or attach a file to a task.')}</section><aside class="surface upload-panel"><span class="project-symbol blue">${icon('upload')}</span><h2>Add file</h2><p>Choose the task that this file belongs to.</p>${tasks.length?`<form id="upload-form"><label class="form-label" for="file-task">Task</label><select id="file-task" name="task" class="form-select mb-3" required><option value="">Choose a task…</option>${tasks.map(t=>{const p=projects.find(p=>p.id===t.project_id);return `<option value="${escape(t.id)}">${ctx.admin?escape(ownerName(ctx.data,p?.owner_id))+' / ':''}${escape(p?.title)} / ${escape(t.title)}</option>`;}).join('')}</select><label class="form-label" for="file">File</label><input id="file" type="file" class="form-control" required accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"><small class="field-help">PNG, JPG, WebP, PDF, TXT · up to 5 MB</small><button type="submit" class="btn btn-primary w-100 mt-4">${icon('upload')} Upload file</button></form>`:'<p>No tasks available for this owner.</p><a href="/projects.html" class="btn btn-light">View projects</a>'}</aside></div>`;
    document.querySelector('#files-owner')?.addEventListener('change',event=>{if(saving)return;owner=event.target.value;render();});
    document.querySelector('#upload-form')?.addEventListener('submit',async event=>{
      event.preventDefault();if(saving)return;const form=event.currentTarget;if(!form.reportValidity())return;
      const errorPanel=document.querySelector('#page-error');if(errorPanel)errorPanel.hidden=true;
      const button=form.querySelector('button');saving=true;button.disabled=true;form.setAttribute('aria-busy','true');
      const filter=document.querySelector('#files-owner');if(filter)filter.disabled=true;
      try{await upload(form.querySelector('#file-task').value,form.querySelector('#file').files[0]);await ctx.refresh();render();notify('File uploaded.');}catch(error){errorBox(error);}finally{saving=false;button.disabled=false;form.removeAttribute('aria-busy');const currentFilter=document.querySelector('#files-owner');if(currentFilter)currentFilter.disabled=false;}
    });
    document.querySelectorAll('[data-download]').forEach(button=>button.addEventListener('click',async()=>{button.disabled=true;try{await downloadFile(attachments.find(a=>a.id===button.dataset.download));}catch(error){errorBox(error);}finally{button.disabled=false;}}));
    document.querySelectorAll('[data-delete]').forEach(button=>button.addEventListener('click',async()=>{const a=attachments.find(a=>a.id===button.dataset.delete);if(!await confirmDialog('Remove file',a.original_name))return;button.disabled=true;try{await deleteAttachment(a);await ctx.refresh();render();notify('File removed.');}catch(error){errorBox(error);button.disabled=false;}}));paintIcons();
  }
  render();
}
