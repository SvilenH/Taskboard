import { escape, icon, paintIcons, notify, shortDate, size, confirmDialog } from '../utils/ui.js';
import { priorities } from '../utils/model.js';
import { saveTask, deleteTask, upload, download, deleteAttachment } from '../services/backend.js';

export function taskEditor(ctx, { task, project, stage }, onSaved) {
  const stages = ctx.data.stages.filter(s => s.project_id === project.id).sort((a, b) => a.position - b.position);
  const attachments = ctx.data.attachments.filter(a => a.task_id === task?.id);
  const dialog = document.createElement('dialog'); dialog.className = 'task-dialog';
  dialog.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">${escape(project.title)}</p><h2>${task ? 'Task details' : 'New task'}</h2></div><button class="icon-button" data-close aria-label="Close">${icon('x')}</button></div>
    <form id="task-form"><div class="dialog-body"><div class="alert alert-danger" id="task-error" role="alert" hidden></div><label class="form-label" for="task-title">Title <span>*</span></label><input class="form-control mb-3" id="task-title" name="title" value="${escape(task?.title || '')}" required maxlength="160" placeholder="What needs to be done?">
    <label class="form-label" for="task-description">Description</label><textarea class="form-control mb-3" id="task-description" name="description" rows="4" maxlength="5000" placeholder="Add some context…">${escape(task?.description || '')}</textarea>
    <div class="row g-3"><div class="col-sm-6"><label class="form-label" for="task-stage">Column</label><select class="form-select" name="stage_id" id="task-stage">${stages.map(s => `<option value="${escape(s.id)}" ${s.id === (task?.stage_id || stage?.id) ? 'selected' : ''}>${escape(s.name)}</option>`).join('')}</select></div><div class="col-sm-6"><label class="form-label" for="task-priority">Priority</label><select class="form-select" name="priority" id="task-priority">${Object.entries(priorities).map(([key, label]) => `<option value="${key}" ${key === (task?.priority || 'medium') ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="col-12"><label class="form-label" for="task-due">Due date</label><input class="form-control" type="date" id="task-due" name="due_date" value="${escape(task?.due_date || '')}"></div></div>
    <div class="attachment-area"><h3>${icon('paperclip')} Attachments</h3>${attachments.map(a => `<div class="attachment-row"><span>${escape(a.original_name)}<small>${size(a.size_bytes)} · ${shortDate(a.created_at)}</small></span><button type="button" class="icon-button" data-download="${escape(a.id)}" aria-label="Download ${escape(a.original_name)}">${icon('download')}</button><button type="button" class="icon-button" data-remove="${escape(a.id)}" aria-label="Remove ${escape(a.original_name)}">${icon('trash-2')}</button></div>`).join('')}
    <label class="upload-area" for="task-file">${icon('upload')}<strong>Attach a file to this task</strong><span>PNG, JPG, WebP, PDF or TXT · up to 5 MB</span><input id="task-file" name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"><span id="chosen-file"></span></label></div></div>
    <div class="dialog-footer">${task ? `<button type="button" class="icon-button danger" data-delete aria-label="Delete task">${icon('trash-2')}</button>` : ''}<div class="ms-auto d-flex gap-2"><button type="button" class="btn btn-light" data-close>Cancel</button><button class="btn btn-primary" type="submit">${icon('check')} ${task ? 'Save changes' : 'Create task'}</button></div></div></form>`;
  document.body.append(dialog); paintIcons(); dialog.showModal();
  let changed = false; let saving = false;
  const form = dialog.querySelector('form');
  const showError = error => { const box = dialog.querySelector('#task-error'); box.textContent = error.message; box.hidden = false; };
  async function close() { if (saving) return; if (changed && !await confirmDialog('Discard changes?', 'Unsaved changes to this task will be lost.', 'Discard changes')) return; dialog.close(); }
  dialog.addEventListener('close', () => dialog.remove(), { once: true });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', close));
  form.addEventListener('input', () => { changed = true; });
  dialog.querySelector('#task-file').addEventListener('change', event => { dialog.querySelector('#chosen-file').textContent = event.target.files[0]?.name || ''; });
  form.addEventListener('submit', async event => {
    event.preventDefault(); if (saving || !form.reportValidity()) return;
    saving = true; form.querySelectorAll('button').forEach(b => { b.disabled = true; });
    let savedId;
    try {
      const input = Object.fromEntries(new FormData(form)); const file = form.querySelector('#task-file').files[0];
      if (file) { const { validateFile } = await import('../utils/model.js'); validateFile(file); }
      savedId = await saveTask({ ...input, project_id: project.id }, task?.id);
      if (file) await upload(savedId, file);
      changed = false; dialog.close(); notify(task ? 'Changes saved.' : 'Task created.'); await onSaved();
    } catch (error) {
      if (savedId) { changed = false; dialog.close(); notify(`Task saved, but the file could not be uploaded: ${error.message}`, 'error'); await onSaved(); }
      else showError(error);
    } finally { saving = false; if (dialog.isConnected) form.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
  });
  dialog.querySelector('[data-delete]')?.addEventListener('click', async () => {
    if (!await confirmDialog('Delete task', `„${task.title}“ and its attachments will be deleted.`)) return;
    saving = true;
    try { await deleteTask(task.id); changed = false; dialog.close(); notify('Task deleted.'); await onSaved(); } catch (error) { showError(error); } finally { saving = false; }
  });
  dialog.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', async () => { button.disabled = true; try { await downloadFile(attachments.find(a => a.id === button.dataset.download)); } catch (error) { showError(error); } finally { button.disabled = false; } }));
  dialog.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', async () => {
    const attachment = attachments.find(a => a.id === button.dataset.remove);
    if (!await confirmDialog('Remove file', attachment.original_name)) return;
    button.disabled = true;
    try { await deleteAttachment(attachment); changed = false; dialog.close(); await onSaved(); notify('File removed.'); } catch (error) { showError(error); button.disabled = false; }
  }));
}
export async function downloadFile(attachment) {
  const blob = await download(attachment); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = attachment.original_name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
