// Tidewell landing page interactions: theme toggle, mobile nav, billing toggle, signup form.
(function () {
  const root = document.documentElement;

  // Theme: follow the system until the visitor picks one, then remember it.
  const themeBtn = document.getElementById('theme-toggle');
  const media = window.matchMedia('(prefers-color-scheme: dark)');
  let saved = null;
  try { saved = localStorage.getItem('tidewell-theme'); } catch (e) {}

  function currentTheme() {
    return root.dataset.theme || (media.matches ? 'dark' : 'light');
  }
  function applyTheme(theme) {
    root.dataset.theme = theme;
    themeBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }
  applyTheme(saved || currentTheme());
  if (!saved) {
    media.addEventListener('change', (e) => {
      let stored = null;
      try { stored = localStorage.getItem('tidewell-theme'); } catch (err) {}
      if (!stored) applyTheme(e.matches ? 'dark' : 'light');
    });
  }
  themeBtn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    try { localStorage.setItem('tidewell-theme', next); } catch (e) {}
  });

  // Mobile navigation
  const navToggle = document.getElementById('nav-toggle');
  const navLinks = document.getElementById('nav-links');
  function setNav(open) {
    navLinks.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  navToggle.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
  navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') {
      setNav(false);
      navToggle.focus();
    }
  });
  window.matchMedia('(min-width: 900px)').addEventListener('change', (e) => { if (e.matches) setNav(false); });

  // Billing period toggle
  const status = document.getElementById('billing-status');
  document.querySelectorAll('input[name="billing"]').forEach((input) => {
    input.addEventListener('change', () => {
      const period = input.value;
      document.querySelectorAll('[data-monthly][data-annual]').forEach((el) => {
        el.textContent = el.dataset[period];
      });
      status.textContent = period === 'annual' ? 'Showing annual prices' : 'Showing monthly prices';
    });
  });

  // Signup form: validate on submit and on blur after the first attempt.
  const form = document.getElementById('signup-form');
  const email = document.getElementById('email');
  const error = document.getElementById('email-error');
  const success = document.getElementById('form-success');
  const submitBtn = form.querySelector('button[type="submit"]');
  let attempted = false;

  function validate() {
    const value = email.value.trim();
    let message = '';
    if (!value) message = 'Enter your work email to start the trial.';
    else if (!email.checkValidity()) message = 'Enter an email address like you@company.com.';
    if (message) {
      error.innerHTML = '<svg class="icon" aria-hidden="true"><use href="#i-alert"/></svg>';
      error.append(message);
      error.hidden = false;
      email.setAttribute('aria-invalid', 'true');
    } else {
      error.hidden = true;
      email.removeAttribute('aria-invalid');
    }
    return !message;
  }

  email.addEventListener('blur', () => { if (attempted) validate(); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    attempted = true;
    success.textContent = '';
    if (!validate()) { email.focus(); return; }
    submitBtn.disabled = true;
    submitBtn.textContent = 'Starting…';
    // Demo only: no backend. Simulate a short request.
    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Start free trial';
      success.textContent = 'Check your inbox — we sent a link to ' + email.value.trim() + '.';
      form.reset();
      attempted = false;
    }, 700);
  });
})();
