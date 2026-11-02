import { escape, icon, paintIcons, notify, shortDate, size, confirmDialog } from '../utils/ui.js';
import { priorities } from '../utils/model.js';
import { saveTask, deleteTask, upload, download, deleteAttachment } from '../services/backend.js';

export function taskEditor(ctx, { task, project, stage }, onSaved) {
  const stages = ctx.data.stages.filter(s => s.project_id === project.id).sort((a, b) => a.position - b.position);
  const attachments = ctx.data.attachments.filter(a => a.task_id === task?.id);
  const dialog = document.createElement('dialog'); dialog.className = 'task-dialog';
  dialog.innerHTML = `<div class="dialog-heading"><div><p class="eyebrow">${escape(project.title)}</p><h2>${task ? 'Детайли за задачата' : 'Нова задача'}</h2></div><button class="icon-button" data-close aria-label="Затвори">${icon('x')}</button></div>
    <form id="task-form"><div class="dialog-body"><div class="alert alert-danger" id="task-error" role="alert" hidden></div><label class="form-label" for="task-title">Заглавие <span>*</span></label><input class="form-control mb-3" id="task-title" name="title" value="${escape(task?.title || '')}" required maxlength="160" placeholder="Какво трябва да се направи?">
    <label class="form-label" for="task-description">Описание</label><textarea class="form-control mb-3" id="task-description" name="description" rows="4" maxlength="5000" placeholder="Добави малко контекст…">${escape(task?.description || '')}</textarea>
    <div class="row g-3"><div class="col-sm-6"><label class="form-label" for="task-stage">Колона</label><select class="form-select" name="stage_id" id="task-stage">${stages.map(s => `<option value="${escape(s.id)}" ${s.id === (task?.stage_id || stage?.id) ? 'selected' : ''}>${escape(s.name)}</option>`).join('')}</select></div><div class="col-sm-6"><label class="form-label" for="task-priority">Приоритет</label><select class="form-select" name="priority" id="task-priority">${Object.entries(priorities).map(([key, label]) => `<option value="${key}" ${key === (task?.priority || 'medium') ? 'selected' : ''}>${label}</option>`).join('')}</select></div><div class="col-12"><label class="form-label" for="task-due">Краен срок</label><input class="form-control" type="date" id="task-due" name="due_date" value="${escape(task?.due_date || '')}"></div></div>
    <div class="attachment-area"><h3>${icon('paperclip')} Прикачени файлове</h3>${attachments.map(a => `<div class="attachment-row"><span>${escape(a.original_name)}<small>${size(a.size_bytes)} · ${shortDate(a.created_at)}</small></span><button type="button" class="icon-button" data-download="${escape(a.id)}" aria-label="Изтегли ${escape(a.original_name)}">${icon('download')}</button><button type="button" class="icon-button" data-remove="${escape(a.id)}" aria-label="Премахни ${escape(a.original_name)}">${icon('trash-2')}</button></div>`).join('')}
    <label class="upload-area" for="task-file">${icon('upload')}<strong>Добави файл към задачата</strong><span>PNG, JPG, WebP, PDF или TXT · до 5 MB</span><input id="task-file" name="file" type="file" accept="image/png,image/jpeg,image/webp,application/pdf,text/plain"><span id="chosen-file"></span></label></div></div>
    <div class="dialog-footer">${task ? `<button type="button" class="icon-button danger" data-delete aria-label="Изтрий задачата">${icon('trash-2')}</button>` : ''}<div class="ms-auto d-flex gap-2"><button type="button" class="btn btn-light" data-close>Отказ</button><button class="btn btn-primary" type="submit">${icon('check')} ${task ? 'Запази промените' : 'Създай задача'}</button></div></div></form>`;
  document.body.append(dialog); paintIcons(); dialog.showModal();
  let changed = false; let saving = false;
  const form = dialog.querySelector('form');
  const showError = error => { const box = dialog.querySelector('#task-error'); box.textContent = error.message; box.hidden = false; };
  async function close() { if (saving) return; if (changed && !await confirmDialog('Да оставим промените?', 'Незаписаните промени по задачата ще бъдат изгубени.', 'Остави промените')) return; dialog.close(); }
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
      changed = false; dialog.close(); notify(task ? 'Промените са запазени.' : 'Задачата е създадена.'); await onSaved();
    } catch (error) {
      if (savedId) { changed = false; dialog.close(); notify(`Задачата е запазена, но файлът не е качен: ${error.message}`, 'error'); await onSaved(); }
      else showError(error);
    } finally { saving = false; if (dialog.isConnected) form.querySelectorAll('button').forEach(b => { b.disabled = false; }); }
  });
  dialog.querySelector('[data-delete]')?.addEventListener('click', async () => {
    if (!await confirmDialog('Изтриване на задача', `„${task.title}“ и прикачените файлове ще бъдат премахнати.`)) return;
    saving = true;
    try { await deleteTask(task.id); changed = false; dialog.close(); notify('Задачата е изтрита.'); await onSaved(); } catch (error) { showError(error); } finally { saving = false; }
  });
  dialog.querySelectorAll('[data-download]').forEach(button => button.addEventListener('click', async () => { button.disabled = true; try { await downloadFile(attachments.find(a => a.id === button.dataset.download)); } catch (error) { showError(error); } finally { button.disabled = false; } }));
  dialog.querySelectorAll('[data-remove]').forEach(button => button.addEventListener('click', async () => {
    const attachment = attachments.find(a => a.id === button.dataset.remove);
    if (!await confirmDialog('Премахване на файл', attachment.original_name)) return;
    button.disabled = true;
    try { await deleteAttachment(attachment); changed = false; dialog.close(); await onSaved(); notify('Файлът е премахнат.'); } catch (error) { showError(error); button.disabled = false; }
  }));
}
export async function downloadFile(attachment) {
  const blob = await download(attachment); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = attachment.original_name; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
