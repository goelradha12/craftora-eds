/**
 * Auth Block — Craftora EDS
 *
 * da.live table structure (4 rows):
 *   Row 0 → Logo picture
 *   Row 1 → Page heading  (e.g. "Welcome Back!")
 *   Row 2 → Submit button label (e.g. "Sign In")
 *   Row 3 → Switch-auth paragraph (e.g. "Don't have an account? <a>Sign up</a>")
 *
 * Variant classes added by da.live:
 *   .auth.signin  → login form
 */

const AUTH_KEY = 'craftora_user';
const USERS_KEY = 'craftora_users';

function getUser() {
  try { return JSON.parse(localStorage.getItem(AUTH_KEY)); } catch { return null; }
}

function attemptLogin(phone, password) {
  try {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
    const user = users.find((u) => u.phone === phone && u.password === password);
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user));
      return { ok: true };
    }
    return { ok: false, error: 'Invalid phone number or password.' };
  } catch {
    return { ok: false, error: 'An error occurred. Please try again.' };
  }
}

const ICON = {
  phone: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.62 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 8.91a16 16 0 0 0 5.61 5.61l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  lock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  eyeOpen: `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`,
  eyeOff: `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/>`,
  spinner: `<svg class="auth-spinner" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="6"/><line x1="12" y1="18" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="7.76" y2="7.76"/><line x1="16.24" y1="16.24" x2="19.07" y2="19.07"/><line x1="2" y1="12" x2="6" y2="12"/><line x1="18" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="7.76" y2="16.24"/><line x1="16.24" y1="7.76" x2="19.07" y2="4.93"/></svg>`,
  alert: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
};

export default function decorate(block) {
  document.querySelector('header')?.remove();
  document.querySelector('footer')?.remove();

  if (getUser()) {
    const params = new URLSearchParams(window.location.search);
    window.location.replace(params.get('redirect') || '/');
    return;
  }

  const rows = [...block.children];
  const logoPicture = rows[0]?.querySelector('picture') || null;
  const heading = rows[1]?.querySelector('p')?.textContent?.trim() || 'Welcome Back!';
  const btnLabel = rows[2]?.querySelector('p')?.textContent?.trim() || 'Sign In';
  const switchPara = rows[3]?.querySelector('p');
  const switchHTML = switchPara ? switchPara.innerHTML : "Don't have an account? <a href=\"/signup\">Sign up here</a>";

  const imagePanel = document.createElement('div');
  imagePanel.className = 'auth-image';
  if (logoPicture) imagePanel.append(logoPicture);

  const formPanel = document.createElement('div');
  formPanel.className = 'auth-form';
  formPanel.innerHTML = `
    <a class="auth-logo-link" href="/" aria-label="Craftora home">
      <img src="/assets/logo.webp" alt="Craftora" class="auth-logo" width="116" height="24" loading="lazy">
    </a>
    <h2 class="auth-heading">${heading}</h2>
    <div class="auth-error-banner" id="authError" role="alert" hidden>
      ${ICON.alert}
      <span id="authErrorMsg"></span>
    </div>
    <form id="authForm" class="auth-form-fields" novalidate>
      <div class="auth-field">
        <label for="auth-phone" class="auth-label auth-label-required">Phone Number</label>
        <div class="auth-input-wrap">
          ${ICON.phone}
          <input type="tel" id="auth-phone" name="phone" class="auth-input"
            placeholder="Enter your 10-digit number"
            autocomplete="tel" inputmode="numeric"
            minlength="10" maxlength="10" pattern="[0-9]{10}" required>
        </div>
        <span class="auth-field-error" id="authPhoneError" role="alert"></span>
      </div>
      <div class="auth-field">
        <label for="auth-password" class="auth-label auth-label-required">Password</label>
        <div class="auth-input-wrap">
          ${ICON.lock}
          <input type="password" id="auth-password" name="password" class="auth-input auth-input-pw"
            placeholder="Enter your password"
            autocomplete="current-password" required>
          <button type="button" class="auth-eye-toggle" id="authTogglePw" aria-label="Show password">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" id="authEyeIcon">${ICON.eyeOpen}</svg>
          </button>
        </div>
        <span class="auth-field-error" id="authPasswordError" role="alert"></span>
      </div>
      <button type="submit" class="auth-submit" id="authSubmitBtn">
        <span class="auth-btn-label">${btnLabel}</span>
        ${ICON.spinner}
      </button>
      <div class="auth-switch-link">${switchHTML}</div>
    </form>
  `;

  block.textContent = '';
  block.append(imagePanel, formPanel);

  wirePasswordToggle(block);
  wireFormSubmit(block);
  wireRedirectParam(block);
}

function wirePasswordToggle(block) {
  const input = block.querySelector('#auth-password');
  const btn = block.querySelector('#authTogglePw');
  const icon = block.querySelector('#authEyeIcon');
  if (!btn || !input || !icon) return;
  btn.addEventListener('click', () => {
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    icon.innerHTML = show ? ICON.eyeOff : ICON.eyeOpen;
  });
}

function wireFormSubmit(block) {
  const form = block.querySelector('#authForm');
  const submitBtn = block.querySelector('#authSubmitBtn');
  const errorBanner = block.querySelector('#authError');
  const errorMsg = block.querySelector('#authErrorMsg');
  const phoneInput = block.querySelector('#auth-phone');
  const passwordInput = block.querySelector('#auth-password');
  const phoneError = block.querySelector('#authPhoneError');
  const passwordError = block.querySelector('#authPasswordError');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorBanner.hidden = true;
    phoneError.textContent = '';
    passwordError.textContent = '';

    const phone = phoneInput.value.trim();
    const password = passwordInput.value;
    let valid = true;

    if (!phone) {
      phoneError.textContent = 'Phone number is required.';
      valid = false;
    } else if (!/^[0-9]{10}$/.test(phone)) {
      phoneError.textContent = 'Enter a valid 10-digit mobile number.';
      valid = false;
    }
    if (!password) {
      passwordError.textContent = 'Password is required.';
      valid = false;
    }
    if (!valid) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    setTimeout(() => {
      const result = attemptLogin(phone, password);
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
      if (result.ok) {
        const params = new URLSearchParams(window.location.search);
        window.location.href = params.get('redirect') || '/';
      } else {
        errorMsg.textContent = result.error;
        errorBanner.hidden = false;
      }
    }, 400);
  });
}

function wireRedirectParam(block) {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get('redirect');
  if (!redirect) return;
  const link = block.querySelector('.auth-switch-link a');
  if (link) {
    const base = link.getAttribute('href') || '/signup';
    link.href = `${base}?redirect=${encodeURIComponent(redirect)}`;
  }
}
