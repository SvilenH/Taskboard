import { createIcons, LayoutDashboard, FolderKanban, ListTodo, Paperclip, ShieldCheck, ArrowRight, ArrowUpRight, Plus, Search, Menu, X, LogOut, ChevronDown, ChevronLeft, MoreHorizontal, Check, CheckCheck, Clock3, CalendarDays, GripVertical, Pencil, Trash2, Download, Upload, LayoutGrid, CheckCircle2, Circle, Users, Folder, ArrowLeft, AlertCircle, ExternalLink } from 'lucide';
const icons = { LayoutDashboard, FolderKanban, ListTodo, Paperclip, ShieldCheck, ArrowRight, ArrowUpRight, Plus, Search, Menu, X, LogOut, ChevronDown, ChevronLeft, MoreHorizontal, Check, CheckCheck, Clock3, CalendarDays, GripVertical, Pencil, Trash2, Download, Upload, LayoutGrid, CheckCircle2, Circle, Users, Folder, ArrowLeft, AlertCircle, ExternalLink };
export const icon = (name, cls = '') => `<i data-lucide="${name}" class="${cls}" aria-hidden="true"></i>`;
export const paintIcons = () => createIcons({ icons, attrs: { 'stroke-width': 1.7 } });
export const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
export const shortDate = value => value ? new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' }).format(new Date(`${value.slice(0, 10)}T12:00:00`)) : 'No due date';
export const initials = value => String(value || 'User').trim().split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
export const size = value => value < 1024 * 1024 ? `${Math.ceil(value / 1024)} KB` : `${(value / 1024 / 1024).toFixed(1)} MB`;
export function notify(message, kind = 'success') {
  let host = document.querySelector('#notifications');
  if (!host) { host = document.createElement('div'); host.id = 'notifications'; host.setAttribute('aria-live', 'polite'); document.body.append(host); }
  const toast = document.createElement('div'); toast.className = `notice ${kind}`; toast.setAttribute('role', kind === 'error' ? 'alert' : 'status'); toast.textContent = message; host.append(toast); setTimeout(() => toast.remove(), 5500);
}
export function errorBox(error, target = '#page-error') {
  const node = document.querySelector(target);
  if (node) { node.textContent = error.message || 'Something went wrong. Please try again.'; node.hidden = false; node.scrollIntoView({ block: 'nearest' }); }
  else notify(error.message || 'Something went wrong.', 'error');
}
export function empty(title, description, action = '') {
  return `<div class="empty-state">${icon('folder')}<h2>${escape(title)}</h2><p>${escape(description)}</p>${action}</div>`;
}
export async function busy(button, action) {
  button.disabled = true; button.setAttribute('aria-busy', 'true');
  try { return await action(); } catch (error) { errorBox(error); } finally { button.disabled = false; button.removeAttribute('aria-busy'); }
}
export function confirmDialog(title, message, label = 'Delete') {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog'); dialog.className = 'confirm-dialog';
    dialog.innerHTML = `<form method="dialog"><div class="dialog-icon">${icon('alert-circle')}</div><h2>${escape(title)}</h2><p>${escape(message)}</p><div class="d-flex gap-2 justify-content-end"><button class="btn btn-light" value="cancel">Cancel</button><button class="btn btn-danger" value="confirm">${escape(label)}</button></div></form>`;
    document.body.append(dialog); paintIcons(); dialog.addEventListener('close', () => { resolve(dialog.returnValue === 'confirm'); dialog.remove(); }, { once: true }); dialog.showModal();
  });
}
