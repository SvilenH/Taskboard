import { escape, icon, initials } from '../utils/ui.js';
import { ownerName } from '../utils/workspace.js';

export function ownerBadge(data, ownerId, viewerId) {
  return `<span class="owner-badge">${icon('users')}<span>Owner: <strong>${escape(ownerName(data, ownerId))}</strong>${ownerId === viewerId ? ' <small>(you)</small>' : ''}</span></span>`;
}

export function ownerOptions(data, viewerId, selected = '') {
  return `<option value="">All owners</option>${[...data.profiles].sort((a,b) => (a.display_name || '').localeCompare(b.display_name || '') || a.id.localeCompare(b.id)).map(profile => `<option value="${escape(profile.id)}" ${profile.id === selected ? 'selected' : ''}>${escape(profile.display_name || 'Unnamed user')}${profile.id === viewerId ? ' (you)' : ''}</option>`).join('')}`;
}

export function ownerHeading(group, data, viewerId) {
  const ids = new Set(group.projects.map(project => project.id));
  const tasks = data.tasks.filter(task => ids.has(task.project_id));
  return `<header class="owner-group-heading"><span class="avatar">${escape(initials(group.name))}</span><div><h2>${escape(group.name)}${group.ownerId === viewerId ? ' <small>(you)</small>' : ''}</h2><p>${group.projects.length} projects · ${tasks.length} tasks</p></div><a class="text-link ms-auto" href="/projects.html?owner=${encodeURIComponent(group.ownerId)}">View projects ${icon('arrow-up-right')}</a></header>`;
}
