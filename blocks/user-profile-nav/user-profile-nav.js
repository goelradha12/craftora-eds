/**
 * User Profile Nav Block — Craftora EDS
 *
 * Full authenticated account page: profile card + account nav, personal
 * information, and order history. Guest state shown when not logged in.
 *
 * Authored DOM (all rows optional — sensible defaults are used when a row
 * is missing so authors can add/reorder content in DA Live over time):
 *   Row 0: page heading (e.g. "My Account")
 *   Row 1: placeholder/intro text (ignored — filled from the logged-in user)
 *   Row 2: a list of nav menu items, each "Label" + a nested icon (:profile: etc.).
 *          An item with no link (e.g. "Sign Out") becomes the logout action.
 *          Authored hrefs (My Account, My Orders, Wishlist, Cart, Sign Out)
 *          are preserved as-is; only the active state is computed.
 *   Row 3: "Personal Information" section heading text
 *   Row 4: "My Orders" / order history section heading text
 */

import { decorateIcons } from '../../scripts/aem.js';
import { getUser, logout } from '../../scripts/auth.js';
import {
  esc, formatDate, formatAddress, displayValue, getInitials, getDisplayName,
} from '../../scripts/helpers.js';
import { getOrdersForUser, money } from '../../scripts/cart-utils.js';

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

function rowText(row) {
  return row ? row.textContent.trim() : '';
}

function isActiveHref(href) {
  if (!href) return false;
  const [path, hash] = href.split('#');
  if (path !== window.location.pathname) return false;
  return hash ? `#${hash}` === window.location.hash : !window.location.hash;
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
  const activeClass = isActiveHref(item.href) ? ' user-profile-item--active' : '';
  return `<li><a class="user-profile-item${activeClass}" href="${esc(item.href)}">${inner}</a></li>`;
}

function personalInfoHTML(user, heading) {
  let address = '';
  if (user.addressObj && Object.keys(user.addressObj).length) {
    address = formatAddress(user.addressObj);
  } else if (user.address) {
    address = `<p>${esc(user.address)}</p>`;
  }

  return `<section class="user-profile-section" aria-labelledby="user-profile-info-heading">
    <h2 class="user-profile-section-title" id="user-profile-info-heading">${esc(heading)}</h2>
    <dl class="user-profile-info-grid">
      <div class="user-profile-info-field">
        <dt>Name</dt><dd>${displayValue(user.name)}</dd>
      </div>
      <div class="user-profile-info-field">
        <dt>Phone</dt><dd>${displayValue(user.phone)}</dd>
      </div>
      <div class="user-profile-info-field">
        <dt>Email</dt><dd>${displayValue(user.email)}</dd>
      </div>
      <div class="user-profile-info-field">
        <dt>Member Since</dt><dd>${esc(formatDate(user.joinedAt))}</dd>
      </div>
      <div class="user-profile-info-field user-profile-info-field--full">
        <dt>Shipping Address</dt><dd>${address || '<span class="value-empty">Not provided</span>'}</dd>
      </div>
    </dl>
  </section>`;
}

function orderItemsHTML(items) {
  if (!items?.length) return '';
  return `<ul class="user-profile-order-items">${items.map((item) => {
    const qty = item.qty ?? item.quantity ?? 1;
    const lineTotal = (item.price || 0) * qty;
    return `<li class="user-profile-order-item">
      <span class="user-profile-order-item-name">${esc(item.name)} &times; ${esc(qty)}</span>
      <span class="user-profile-order-item-price">${money(lineTotal)}</span>
    </li>`;
  }).join('')}</ul>`;
}

function orderCardHTML(order) {
  const isV2 = order.version === 2 || !!order.customer;
  const total = order.summary?.total ?? order.total ?? 0;
  const payment = order.payment?.label || order.payment?.method || 'Not available';
  const shippingAddress = isV2 ? order.shipping : order.delivery?.address;
  const addressHTML = shippingAddress ? formatAddress(shippingAddress) : '';

  return `<li class="user-profile-order-card">
    <div class="user-profile-order-header">
      <span class="user-profile-order-id">${esc(order.id)}</span>
      <span class="user-profile-order-date">${esc(formatDate(order.date))}</span>
      <span class="user-profile-order-status">${esc(order.status || 'Confirmed')}</span>
    </div>
    ${orderItemsHTML(order.items)}
    <div class="user-profile-order-footer">
      <span class="user-profile-order-payment">${esc(payment)}</span>
      <span class="user-profile-order-total">${money(total)}</span>
    </div>
    ${addressHTML ? `<div class="user-profile-order-address">${addressHTML}</div>` : ''}
  </li>`;
}

function ordersHTML(orders, heading) {
  const body = orders.length
    ? `<ul class="user-profile-order-list">${orders.map(orderCardHTML).join('')}</ul>`
    : `<div class="user-profile-orders-empty">
        <p>No orders yet.</p>
        <a class="user-profile-btn primary" href="/products">Start Shopping</a>
      </div>`;

  return `<section class="user-profile-section" id="my-orders" aria-labelledby="user-profile-orders-heading">
    <h2 class="user-profile-section-title" id="user-profile-orders-heading">${esc(heading)}</h2>
    ${body}
  </section>`;
}

export default function decorate(block) {
  const rows = [...block.children];
  const infoHeading = rowText(rows[3]) || 'Personal Information';
  const ordersHeading = rowText(rows[4]) || 'My Orders';
  const items = parseMenu(block);
  const user = getUser();

  block.textContent = '';

  if (!user) {
    block.innerHTML = guestHTML();
    return;
  }

  const initials = getInitials(user);
  const name = esc(getDisplayName(user, 'My Account'));
  const sub = esc(user.email || user.phone || '');
  const orders = getOrdersForUser(user);

  block.innerHTML = `<div class="user-profile-layout">
    <aside class="user-profile-sidebar">
      <div class="user-profile-card">
        <div class="user-profile-head">
          <span class="user-profile-avatar">${esc(initials)}</span>
          <div class="user-profile-id">
            <p class="user-profile-name">${name}</p>
            ${sub ? `<p class="user-profile-sub">${sub}</p>` : ''}
          </div>
        </div>
        <ul class="user-profile-menu">${items.map(menuItemHTML).join('')}</ul>
      </div>
    </aside>
    <div class="user-profile-main">
      ${personalInfoHTML(user, infoHeading)}
      ${ordersHTML(orders, ordersHeading)}
    </div>
  </div>`;

  decorateIcons(block);
  block.querySelector('.user-profile-logout')?.addEventListener('click', logout);
}
