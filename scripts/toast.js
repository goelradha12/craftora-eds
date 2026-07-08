/**
 * Toast — lightweight, dependency-free notification helper
 *
 * Usage:
 *   import { showToast } from '../../scripts/toast.js';
 *
 *   showToast('Please log in to continue.', 'warning');
 *   showToast('Item added to cart.', 'success');
 *   showToast('Something went wrong.', 'error');
 *   showToast('Heads up.'); // defaults to 'info', 3000ms
 *
 * Options:
 *   showToast(message, type = 'info', options = {})
 *     type: 'info' | 'success' | 'warning' | 'error'
 *     options.duration: ms before auto-dismiss (default 3000, 0 = persist until clicked)
 *     options.dismissible: allow click-to-dismiss (default true)
 */

const CONTAINER_CLASS = 'toast-container';
const STYLE_ID = 'toast-styles';

let stylesInjected = false;

function injectStyles() {
  if (stylesInjected || document.getElementById(STYLE_ID)) return;
  stylesInjected = true;

  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    .${CONTAINER_CLASS} {
      position: fixed;
      top: var(--space-6, 24px);
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--space-2, 8px);
      z-index: calc(var(--z-modal, 9000) + 100);
      pointer-events: none;
      max-width: calc(100vw - 32px);
    }

    .toast {
      display: flex;
      align-items: center;
      gap: var(--space-2, 8px);
      background: var(--color-primary, #1a1a1a);
      color: var(--color-text-on-dark, #fff);
      padding: var(--space-3, 12px) var(--space-5, 20px);
      border-radius: var(--radius-md, 8px);
      font-family: var(--font-ui), Inter-fallback, sans-serif;
      font-size: var(--text-sm, 14px);
      font-weight: var(--weight-medium, 500);
      line-height: var(--leading-normal, 1.5);
      box-shadow: var(--shadow-lg, 0 12px 32px rgb(0 0 0 / 10%));
      opacity: 0;
      transform: translateY(-12px);
      transition: opacity var(--transition-smooth, 0.28s ease), transform var(--transition-smooth, 0.28s ease);
      pointer-events: auto;
      max-width: 100%;
    }

    .toast.toast-visible {
      opacity: 1;
      transform: translateY(0);
    }

    .toast.toast-dismissible {
      cursor: pointer;
    }

    .toast.toast-dismissible:focus-visible {
      outline: 2px solid var(--color-accent);
      outline-offset: 2px;
    }

    .toast-icon {
      flex: 0 0 auto;
      width: 16px;
      height: 16px;
    }

    .toast-message {
      flex: 1 1 auto;
      word-break: break-word;
      color: inherit;
    }

    .toast-info    { background: var(--color-secondary, #2563eb); }
    .toast-success { background: var(--color-success, #10b981); }
    .toast-warning { background: var(--color-warning, #d97706); }
    .toast-error   { background: var(--color-error, #dc2626); }

    @media (width < 600px) {
      .${CONTAINER_CLASS} {
        top: var(--space-4, 16px);
        width: calc(100vw - 32px);
      }
      .toast {
        width: 100%;
      }
    }
  `;
  document.head.append(style);
}

function getContainer() {
  let container = document.querySelector(`.${CONTAINER_CLASS}`);
  if (!container) {
    container = document.createElement('div');
    container.className = CONTAINER_CLASS;
    container.setAttribute('aria-live', 'polite');
    container.setAttribute('aria-atomic', 'true');
    document.body.append(container);
  }
  return container;
}

const ICONS = {
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="M20 6 9 17l-5-5"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><path d="M12 9v4"/><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="toast-icon"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
};

/**
 * Show a toast notification.
 * @param {string} message
 * @param {'info'|'success'|'warning'|'error'} type
 * @param {{duration?: number, dismissible?: boolean}} options
 * @returns {() => void} dismiss function, in case you want to close it programmatically
 */
export default function showToast(message, type = 'info', options = {}) {
  const { duration = 3000, dismissible = true } = options;

  injectStyles();
  const container = getContainer();

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}${dismissible ? ' toast-dismissible' : ''}`;
  toast.setAttribute('role', type === 'error' || type === 'warning' ? 'alert' : 'status');
  toast.innerHTML = `${ICONS[type] || ICONS.info}<span class="toast-message"></span>`;
  toast.querySelector('.toast-message').textContent = message;

  container.append(toast);

  let dismissed = false;
  const dismiss = () => {
    if (dismissed) return;
    dismissed = true;
    toast.classList.remove('toast-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    // Fallback in case transitionend doesn't fire (e.g. display:none ancestor)
    setTimeout(() => toast.remove(), 400);
  };

  if (dismissible) {
    toast.addEventListener('click', dismiss);
  }

  requestAnimationFrame(() => toast.classList.add('toast-visible'));

  if (duration > 0) {
    setTimeout(dismiss, duration);
  }

  return dismiss;
}
