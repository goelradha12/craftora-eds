/**
 * User Profile Block — Craftora EDS
 *
 * A self-contained profile card: avatar (initials) + logged-in user's name,
 * followed by an authored account menu. Guest state shown when not logged in.
 *
 * Authored DOM:
 *   Row 0/1: placeholder labels (ignored — filled from the logged-in user)
 *   Row 2: a list of menu items, each "Label" + a nested icon (:profile: etc.).
 *          An item with no link (e.g. "Sign Out") becomes the logout action.
 */

import { decorateIcons } from '../../scripts/aem.js';
import { getUser, logout } from '../../scripts/auth.js';
import { esc } from '../../scripts/helpers.js';

function getInitials(user) {
  return (user.name || user.phone || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/* Parse the authored menu list into { label, href, iconHTML } items. */
function parseMenu(block) {
  const list = block.querySelector('ul');
  if (!list) return [];
  return [...list.children].map((li) => {
    const link = li.querySelector('a');
    const iconHTML = li.querySelector('.icon')?.outerHTML || '';
    let label;
    if (link) {
      label = link.textContent.trim();
    } else {
      const clone = li.cloneNode(true);
      clone.querySelectorAll('ul').forEach((u) => u.remove());
      label = clone.textContent.trim();
    }
    return { label, href: link?.getAttribute('href') || '', iconHTML };
  }).filter((it) => it.label);
}

function guestHTML() {
  return `<div class="user-profile-card user-profile-guest">
    <span class="user-profile-avatar" aria-hidden="true">?</span>
    <p class="user-profile-guest-title">You're not signed in</p>
    <p class="user-profile-guest-msg">Sign in to access your account, orders and wishlist.</p>
    <div class="user-profile-guest-actions">
      <a class="user-profile-btn primary" href="/login">Sign In</a>
      <a class="user-profile-btn secondary" href="/signup">Create Account</a>
    </div>
  </div>`;
}

function menuItemHTML(item) {
  const inner = `${item.iconHTML}<span class="user-profile-item-label">${esc(item.label)}</span>`;
  if (!item.href) {
    return `<li><button class="user-profile-item user-profile-logout" type="button">${inner}</button></li>`;
  }
  return `<li><a class="user-profile-item" href="${esc(item.href)}">${inner}</a></li>`;
}

export default function decorate(block) {
  const items = parseMenu(block);
  const user = getUser();

  block.textContent = '';

  if (!user) {
    block.innerHTML = guestHTML();
    return;
  }

  const initials = getInitials(user);
  const name = esc(user.name || user.phone || 'My Account');
  const sub = esc(user.email || user.phone || '');

  block.innerHTML = `<div class="user-profile-card">
    <div class="user-profile-head">
      <span class="user-profile-avatar">${esc(initials)}</span>
      <div class="user-profile-id">
        <p class="user-profile-name">${name}</p>
        ${sub ? `<p class="user-profile-sub">${sub}</p>` : ''}
      </div>
    </div>
    <ul class="user-profile-menu">${items.map(menuItemHTML).join('')}</ul>
  </div>`;

  decorateIcons(block);
  block.querySelector('.user-profile-logout')?.addEventListener('click', logout);
}
