import { icon, escape, paintIcons } from '../utils/ui.js';
import { login, register, startDemo, session, isDemo } from '../services/backend.js';
import { safeReturnPath } from '../utils/navigation.js';
export async function mount({ page }) {
  const returnPath = safeReturnPath(new URLSearchParams(location.search).get('next'));
  if (!isDemo() && await session()) { location.replace(returnPath); return; }
  const isRegister = page === 'register';
  document.querySelector('#app').innerHTML = `<main class="auth-page"><a class="brand auth-brand" href="/"><span class="brand-symbol">${icon('folder-kanban')}</span>taskboard.</a><section class="auth-story"><p class="eyebrow">A PLACE FOR GOOD IDEAS</p><h1>One task.<br>One step.<br><em>Real progress.</em></h1><p>Organise your day and make more room for what matters.</p><div class="auth-art">${icon('folder-kanban')}<span>Your next project<br>starts here.</span></div></section><section class="auth-form-wrap"><a href="/" class="back-link">${icon('arrow-left')} Home</a><h2>${isRegister ? 'Let’s get started.' : 'Welcome back.'}</h2><p>${isRegister ? 'Make a home for your ideas and projects.' : 'Sign in to your workspace.'}</p><div id="auth-error" class="alert alert-danger" role="alert" hidden></div><div id="auth-success" class="alert alert-success" role="status" hidden></div><form id="auth-form">
    ${isRegister ? '<label class="form-label" for="name">Your name</label><input id="name" name="display_name" class="form-control mb-3" required maxlength="80" autocomplete="name" placeholder="What should we call you?">' : ''}
    <label class="form-label" for="email">Email address</label><input id="email" name="email" type="email" class="form-control mb-3" required autocomplete="email" placeholder="name@example.com"><label class="form-label" for="password">Password</label><input id="password" name="password" type="password" class="form-control mb-2" required minlength="8" autocomplete="${isRegister ? 'new-password' : 'current-password'}"><small class="field-help">${isRegister ? 'At least 8 characters.' : 'Use the password for your account.'}</small><button class="btn btn-primary w-100 mt-4" type="submit">${isRegister ? 'Create account' : 'Sign in'} ${icon('arrow-right')}</button></form><p class="auth-switch">${isRegister ? 'Already have an account?' : 'New here?'} <a href="/${isRegister ? 'login' : 'register'}.html">${isRegister ? 'Sign in' : 'Sign up'}</a></p><div class="auth-divider"><span>or take a look around</span></div><button class="btn btn-light w-100" id="demo">Open demo workspace ${icon('arrow-up-right')}</button><p class="auth-note">The demo uses sample data stored only in your browser.</p></section></main>`;
  document.querySelector('#demo').addEventListener('click', startDemo);
  document.querySelector('#auth-form').addEventListener('submit', async event => {
    event.preventDefault(); const form = event.currentTarget; if (!form.reportValidity()) return; const button = form.querySelector('button'); button.disabled = true; const values = Object.fromEntries(new FormData(form));
    document.querySelector('#auth-error').hidden = true;
    try {
      if (isRegister) {
        const data = await register(values.email.trim(), values.password, values.display_name.trim());
        if (!data.session) { const notice = document.querySelector('#auth-success'); notice.innerHTML = `Registration submitted. Check your email for a confirmation link, then <a href="/login.html">sign in</a>.`; notice.hidden = false; form.querySelector('#password').value = ''; return; }
      } else await login(values.email.trim(), values.password);
      location.href = returnPath;
    } catch (error) { const box = document.querySelector('#auth-error'); box.textContent = error.message; box.hidden = false; }
    finally { button.disabled = false; }
  }); paintIcons();
}
