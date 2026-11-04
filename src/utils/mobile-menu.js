// Keep the narrow-screen navigation usable with touch, keyboard and a screen reader.
export function setupMobileMenu() {
  const sidebar = document.querySelector('#sidebar');
  const main = document.querySelector('.workspace-main');
  const toggle = document.querySelector('#mobile-menu');
  const close = document.querySelector('#close-menu');
  const scrim = document.querySelector('#sidebar-scrim');
  const skip = document.querySelector('.skip-link');
  const mobile = matchMedia('(max-width:760px)');

  function setOpen(requested) {
    const wasOpen = sidebar.classList.contains('open');
    const focusedInside = sidebar.contains(document.activeElement);
    const open = requested && mobile.matches;
    sidebar.classList.toggle('open', open);
    sidebar.inert = mobile.matches && !open;
    main.inert = open;
    skip.inert = open;
    scrim.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    if (open) {
      sidebar.setAttribute('role', 'dialog');
      sidebar.setAttribute('aria-modal', 'true');
      sidebar.setAttribute('aria-label', 'Workspace menu');
      if (!wasOpen) close.focus();
    } else {
      sidebar.removeAttribute('role');
      sidebar.removeAttribute('aria-modal');
      sidebar.removeAttribute('aria-label');
      if (mobile.matches && (wasOpen || focusedInside)) toggle.focus();
      else if (wasOpen && focusedInside) sidebar.querySelector('[aria-current="page"]').focus();
    }
  }

  toggle.addEventListener('click', () => setOpen(!sidebar.classList.contains('open')));
  close.addEventListener('click', () => setOpen(false));
  scrim.addEventListener('click', () => setOpen(false));
  mobile.addEventListener('change', () => setOpen(false));
  document.addEventListener('keydown', event => {
    if (!sidebar.classList.contains('open')) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
    } else if (event.key === 'Tab') {
      const focusable = [...sidebar.querySelectorAll('a[href], button:not(:disabled)')].filter(node => node.getClientRects().length);
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!sidebar.contains(document.activeElement) || (!event.shiftKey && document.activeElement === last)) {
        event.preventDefault(); first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault(); last.focus();
      }
    }
  });
  setOpen(false);
}
