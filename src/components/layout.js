import { escape, icon, initials, paintIcons, notify } from '../utils/ui.js';
import { isDemo, logout } from '../services/backend.js';

const navigation = [['dashboard', 'layout-dashboard', 'Overview'], ['projects', 'folder-kanban', 'Projects'], ['tasks', 'list-todo', 'All tasks'], ['files', 'paperclip', 'Files']];
export function layout(ctx, page) {
  const name = ctx.profile?.display_name || ctx.user.user_metadata?.display_name || ctx.user.email?.split('@')[0] || 'User';
  const active = ['board', 'project-edit'].includes(page) ? 'projects' : page;
  document.querySelector('#app').innerHTML = `<a href="#main" class="skip-link">Skip to content</a><div class="app-shell">
    <aside class="sidebar" id="sidebar"><a class="brand" href="/dashboard.html"><span class="brand-symbol">${icon('folder-kanban')}</span>taskboard<span class="brand-point">.</span></a>
      <div class="workspace-label"><span class="workspace-icon">T</span><span>My workspace<small>Make room for ideas</small></span></div>
      <p class="nav-caption">WORKSPACE</p><nav aria-label="Main navigation">${[...navigation, ...(ctx.admin ? [['admin', 'shield-check', 'Administration']] : [])].map(([key, glyph, label]) => `<a class="side-link ${active === key ? 'active' : ''}" href="/${key}.html" ${active === key ? 'aria-current="page"' : ''}>${icon(glyph)}${label}${key === 'projects' ? `<span class="nav-count">${ctx.data.projects.length}</span>` : ''}</a>`).join('')}</nav>
      <div class="sidebar-note"><span class="note-dot"></span><strong>Small steps matter.</strong><p>Make room for your next big idea.</p><a href="/project-edit.html">Create project ${icon('arrow-right')}</a></div>
      <div class="user-section"><span class="avatar">${escape(initials(name))}</span><div class="user-text"><strong>${escape(name)}</strong><small>${ctx.admin ? 'Administrator' : 'User'}</small></div><button class="icon-button" id="logout" aria-label="${isDemo() ? 'Leave demo' : 'Sign out'}">${icon('log-out')}</button></div>
    </aside><div class="sidebar-scrim" id="sidebar-scrim"></div>
    <div class="workspace-main"><header class="topbar"><button id="mobile-menu" class="icon-button mobile-menu" aria-label="Open menu" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button><div class="top-breadcrumb">Workspace <span>/</span> <strong id="breadcrumb">Overview</strong></div><div class="top-actions"><form action="/tasks.html" class="global-search" role="search"><label for="global-search" class="visually-hidden">Search tasks</label>${icon('search')}<input name="q" id="global-search" placeholder="Search tasks…" maxlength="160"><kbd>↵</kbd></form><span class="top-avatar">${escape(initials(name))}</span></div></header>
      ${isDemo() ? '<div class="demo-banner"><span><strong>Demo workspace</strong> · Changes are saved only in this browser.</span><a href="/login.html" id="cloud-link">Use a cloud account →</a></div>' : ''}
      <main id="main" class="page-content" tabindex="-1"><div id="page-error" class="alert alert-danger" role="alert" hidden></div><div id="page"></div></main><footer class="app-footer"><span>Taskboard · A place for good ideas.</span><span>Course project · Software Technologies with AI</span></footer>
    </div></div>`;
  document.querySelector('#logout').addEventListener('click', async event => { const button = event.currentTarget; button.disabled = true; try { await logout(); } catch (error) { notify(error.message, 'error'); button.disabled = false; } });
  document.querySelector('#cloud-link')?.addEventListener('click', () => sessionStorage.removeItem('taskboard-demo'));
  const mobile = matchMedia('(max-width:760px)');
  const toggleMenu = open => { const sidebar = document.querySelector('#sidebar'); sidebar.classList.toggle('open', open); sidebar.inert = mobile.matches && !open; document.querySelector('#sidebar-scrim').classList.toggle('open', open); document.querySelector('#mobile-menu').setAttribute('aria-expanded', String(open)); };
  mobile.addEventListener('change', () => toggleMenu(false)); toggleMenu(false);
  document.querySelector('#mobile-menu').addEventListener('click', () => toggleMenu(!document.querySelector('#sidebar').classList.contains('open')));
  document.querySelector('#sidebar-scrim').addEventListener('click', () => toggleMenu(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') toggleMenu(false); });
  paintIcons();
}
export function heading(title, description, action = '', eyebrow = 'YOUR WORKSPACE') {
  document.title = `${title} · Taskboard`;
  const breadcrumb = document.querySelector('#breadcrumb'); if (breadcrumb) breadcrumb.textContent = title;
  return `<div class="page-heading"><div><p class="eyebrow">${escape(eyebrow)}</p><h1>${escape(title)}</h1><p>${escape(description)}</p></div>${action}</div>`;
}
