import 'bootstrap/dist/css/bootstrap.min.css';
import './styles.css';
import { layout } from './components/layout.js';
import { session, load, isDemo, supabase } from './services/backend.js';
import { paintIcons, escape } from './utils/ui.js';

const page = document.body.dataset.page;
const modules = {
  index: () => import('./pages/landing.js'), login: () => import('./pages/auth.js'), register: () => import('./pages/auth.js'),
  dashboard: () => import('./pages/dashboard.js'), projects: () => import('./pages/projects.js'), 'project-edit': () => import('./pages/project-edit.js'),
  board: () => import('./pages/board.js'), tasks: () => import('./pages/tasks.js'), files: () => import('./pages/files.js'), admin: () => import('./pages/admin.js'),
};
async function initialize() {
  const module = await modules[page]();
  if (['index', 'login', 'register'].includes(page)) { await module.mount({ page }); paintIcons(); return; }
  const current = await session();
  if (!current) { location.replace(`/login.html?next=${encodeURIComponent(location.pathname + location.search)}`); return; }
  const data = await load();
  const ctx = { user: current.user, data, profile: data.profiles.find(p => p.id === current.user.id), admin: data.roles.some(r => r.user_id === current.user.id && r.role === 'admin') };
  ctx.refresh = async () => { ctx.data = await load(); };
  layout(ctx, page);
  if (supabase && !isDemo()) supabase.auth.onAuthStateChange((event, next) => { if (event === 'SIGNED_OUT' || (next && next.user.id !== ctx.user.id)) location.replace('/login.html'); });
  if (page === 'admin' && !ctx.admin) { document.querySelector('#page').innerHTML = '<h1>Нямаш достъп до тази страница</h1><p>Администрацията е достъпна само за администратори.</p><a href="/dashboard.html" class="btn btn-primary">Към обзора</a>'; return; }
  await module.mount(ctx); paintIcons();
}
initialize().catch(error => {
  document.querySelector('#app').innerHTML = `<main class="fatal-error"><span class="brand-symbol">!</span><h1>Не успяхме да заредим пространството</h1><p>${escape(error.message)}</p><p>Данните ти не са променени. При нова облачна база първо трябва да се приложат SQL migrations.</p><button class="btn btn-primary" id="retry">Опитай отново</button> <a class="btn btn-light" href="/">Начална страница</a></main>`;
  document.querySelector('#retry').addEventListener('click', () => location.reload());
});
