import { icon, escape, paintIcons } from '../utils/ui.js';
import { login, register, startDemo } from '../services/backend.js';
export async function mount({ page }) {
  const isRegister = page === 'register';
  document.querySelector('#app').innerHTML = `<main class="auth-page"><a class="brand auth-brand" href="/"><span class="brand-symbol">${icon('folder-kanban')}</span>taskboard.</a><section class="auth-story"><p class="eyebrow">МЯСТО ЗА ДОБРИ ИДЕИ</p><h1>Една задача.<br>Една стъпка.<br><em>Много напредък.</em></h1><p>Подреди деня си и остави повече място за онова, което има значение.</p><div class="auth-art">${icon('folder-kanban')}<span>Твоят следващ проект<br>започва тук.</span></div></section><section class="auth-form-wrap"><a href="/" class="back-link">${icon('arrow-left')} Начална страница</a><h2>${isRegister ? 'Нека започнем.' : 'Здравей отново.'}</h2><p>${isRegister ? 'Създай си място за идеи и проекти.' : 'Влез в своето работно пространство.'}</p><div id="auth-error" class="alert alert-danger" role="alert" hidden></div><div id="auth-success" class="alert alert-success" role="status" hidden></div><form id="auth-form">
    ${isRegister ? '<label class="form-label" for="name">Твоето име</label><input id="name" name="display_name" class="form-control mb-3" required maxlength="80" autocomplete="name" placeholder="Как да те наричаме?">' : ''}
    <label class="form-label" for="email">Имейл адрес</label><input id="email" name="email" type="email" class="form-control mb-3" required autocomplete="email" placeholder="name@example.com"><label class="form-label" for="password">Парола</label><input id="password" name="password" type="password" class="form-control mb-2" required minlength="8" autocomplete="${isRegister ? 'new-password' : 'current-password'}"><small class="field-help">${isRegister ? 'Поне 8 знака.' : 'Използвай паролата за своя акаунт.'}</small><button class="btn btn-primary w-100 mt-4" type="submit">${isRegister ? 'Създай акаунт' : 'Вход'} ${icon('arrow-right')}</button></form><p class="auth-switch">${isRegister ? 'Вече имаш акаунт?' : 'Тук си за първи път?'} <a href="/${isRegister ? 'login' : 'register'}.html">${isRegister ? 'Влез' : 'Регистрирай се'}</a></p><div class="auth-divider"><span>или първо разгледай</span></div><button class="btn btn-light w-100" id="demo">Отвори демо пространството ${icon('arrow-up-right')}</button><p class="auth-note">Демото използва само примерни данни в твоя браузър.</p></section></main>`;
  document.querySelector('#demo').addEventListener('click', startDemo);
  document.querySelector('#auth-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const button = form.querySelector('button'); button.disabled = true; const values = Object.fromEntries(new FormData(form));
    document.querySelector('#auth-error').hidden = true;
    try {
      if (isRegister) {
        const data = await register(values.email.trim(), values.password, values.display_name.trim());
        if (!data.session) { const notice = document.querySelector('#auth-success'); notice.innerHTML = `Регистрацията е изпратена. Ако е необходимо потвърждение, провери имейла си, след което <a href="/login.html">влез в акаунта</a>.`; notice.hidden = false; form.querySelector('#password').value = ''; return; }
      } else await login(values.email.trim(), values.password);
      const next = new URLSearchParams(location.search).get('next');
      const allowed = /^\/(?:dashboard|projects|project-edit|board|tasks|files|admin)\.html(?:\?.*)?$/;
      location.href = next && allowed.test(next) ? next : '/dashboard.html';
    } catch (error) { const box = document.querySelector('#auth-error'); box.textContent = error.message; box.hidden = false; }
    finally { button.disabled = false; }
  }); paintIcons();
}
