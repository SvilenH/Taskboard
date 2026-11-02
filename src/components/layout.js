import { escape, icon, initials, paintIcons, notify } from '../utils/ui.js';
import { isDemo, logout } from '../services/backend.js';

const navigation = [['dashboard', 'layout-dashboard', 'Обзор'], ['projects', 'folder-kanban', 'Проекти'], ['tasks', 'list-todo', 'Всички задачи'], ['files', 'paperclip', 'Файлове']];
export function layout(ctx, page) {
  const name = ctx.profile?.display_name || ctx.user.user_metadata?.display_name || ctx.user.email?.split('@')[0] || 'Потребител';
  const active = ['board', 'project-edit'].includes(page) ? 'projects' : page;
  document.querySelector('#app').innerHTML = `<a href="#main" class="skip-link">Към съдържанието</a><div class="app-shell">
    <aside class="sidebar" id="sidebar"><a class="brand" href="/dashboard.html"><span class="brand-symbol">${icon('folder-kanban')}</span>taskboard<span class="brand-point">.</span></a>
      <div class="workspace-label"><span class="workspace-icon">T</span><span>Моето пространство<small>Подреди идеите си</small></span></div>
      <p class="nav-caption">РАБОТНО ПРОСТРАНСТВО</p><nav aria-label="Основна навигация">${[...navigation, ...(ctx.admin ? [['admin', 'shield-check', 'Администрация']] : [])].map(([key, glyph, label]) => `<a class="side-link ${active === key ? 'active' : ''}" href="/${key}.html" ${active === key ? 'aria-current="page"' : ''}>${icon(glyph)}${label}${key === 'projects' ? `<span class="nav-count">${ctx.data.projects.length}</span>` : ''}</a>`).join('')}</nav>
      <div class="sidebar-note"><span class="note-dot"></span><strong>Малките стъпки имат значение.</strong><p>Дай място на следващата си голяма идея.</p><a href="/project-edit.html">Създай проект ${icon('arrow-right')}</a></div>
      <div class="user-section"><span class="avatar">${escape(initials(name))}</span><div class="user-text"><strong>${escape(name)}</strong><small>${ctx.admin ? 'Администратор' : 'Потребител'}</small></div><button class="icon-button" id="logout" aria-label="${isDemo() ? 'Изход от демото' : 'Изход'}">${icon('log-out')}</button></div>
    </aside><div class="sidebar-scrim" id="sidebar-scrim"></div>
    <div class="workspace-main"><header class="topbar"><button id="mobile-menu" class="icon-button mobile-menu" aria-label="Отвори менюто" aria-controls="sidebar" aria-expanded="false">${icon('menu')}</button><div class="top-breadcrumb">Работно пространство <span>/</span> <strong id="breadcrumb">Обзор</strong></div><div class="top-actions"><form action="/tasks.html" class="global-search" role="search"><label for="global-search" class="visually-hidden">Търси задачи</label>${icon('search')}<input name="q" id="global-search" placeholder="Търси задача…" maxlength="160"><kbd>↵</kbd></form><span class="top-avatar">${escape(initials(name))}</span></div></header>
      ${isDemo() ? '<div class="demo-banner"><span><strong>Демо пространство</strong> · Промените се пазят само в този браузър.</span><a href="/login.html" id="cloud-link">Към реален акаунт →</a></div>' : ''}
      <main id="main" class="page-content" tabindex="-1"><div id="page-error" class="alert alert-danger" role="alert" hidden></div><div id="page"></div></main><footer class="app-footer"><span>Taskboard · Място за добри идеи.</span><span>Курсов проект · Software Technologies with AI</span></footer>
    </div></div>`;
  document.querySelector('#logout').addEventListener('click', async event => { const button = event.currentTarget; button.disabled = true; try { await logout(); } catch (error) { notify(error.message, 'error'); button.disabled = false; } });
  document.querySelector('#cloud-link')?.addEventListener('click', () => sessionStorage.removeItem('taskboard-demo'));
  const toggleMenu = open => { document.querySelector('#sidebar').classList.toggle('open', open); document.querySelector('#sidebar-scrim').classList.toggle('open', open); document.querySelector('#mobile-menu').setAttribute('aria-expanded', String(open)); };
  document.querySelector('#mobile-menu').addEventListener('click', () => toggleMenu(!document.querySelector('#sidebar').classList.contains('open')));
  document.querySelector('#sidebar-scrim').addEventListener('click', () => toggleMenu(false));
  document.addEventListener('keydown', event => { if (event.key === 'Escape') toggleMenu(false); });
  paintIcons();
}
export function heading(title, description, action = '', eyebrow = 'ТВОЕТО ПРОСТРАНСТВО') {
  document.title = `${title} · Taskboard`;
  const breadcrumb = document.querySelector('#breadcrumb'); if (breadcrumb) breadcrumb.textContent = title;
  return `<div class="page-heading"><div><p class="eyebrow">${escape(eyebrow)}</p><h1>${escape(title)}</h1><p>${escape(description)}</p></div>${action}</div>`;
}
