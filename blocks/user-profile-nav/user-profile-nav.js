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
  esc, formatDate, formatAddress, displayValue, getInitials, getDisplayName, parseIconMenu,
} from '../../scripts/helpers.js';
import { getOrdersForUser, money } from '../../scripts/cart-utils.js';

const CHEVRON_ICON = '<svg class="user-profile-order-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>';
const RECEIPT_ICON = '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 3h16v18l-3-2-3 2-3-2-3 2-3-2-1 2Z"/><line x1="8" y1="8" x2="16" y2="8"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';

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

/* Action items (no href, e.g. "Sign Out") get a divider before them, matching
   legacy's `.account-sidebar__divider` ahead of its Sign Out button. */
function menuItemsHTML(items) {
  return items.map((item, i) => {
    const divider = !item.href && i > 0 ? '<li class="user-profile-divider" role="separator"></li>' : '';
    return divider + menuItemHTML(item);
  }).join('');
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
    const metaParts = [];
    if (item.size) metaParts.push(`Size ${esc(item.size)}`);
    if (item.color) {
      metaParts.push(`<span class="user-profile-order-item-color"><span class="user-profile-order-item-color-dot" style="background:${esc(item.color)}"></span>${esc(item.colorName || '')}</span>`);
    }
    const isCustomized = !!(item.customized || item.designRequired);
    return `<li class="user-profile-order-item">
      <img class="user-profile-order-item-img" src="${esc(item.image || '')}" alt="" width="48" height="48" loading="lazy">
      <div class="user-profile-order-item-info">
        <span class="user-profile-order-item-name">${esc(item.name)} &times; ${esc(qty)}</span>
        ${metaParts.length ? `<span class="user-profile-order-item-meta">${metaParts.join(' &middot; ')}</span>` : ''}
        <span class="user-profile-order-item-tags">
          <span class="user-profile-order-tag${isCustomized ? ' user-profile-order-tag--custom' : ''}">${isCustomized ? 'Customized' : 'Plain'}</span>
          ${item.designFee ? `<span class="user-profile-order-tag">+${money(item.designFee)} design</span>` : ''}
        </span>
      </div>
      <span class="user-profile-order-item-price">${money(lineTotal)}</span>
    </li>`;
  }).join('')}</ul>`;
}

function orderCardHTML(order, isFirst) {
  const isV2 = order.version === 2 || !!order.customer;
  const total = order.summary?.total ?? order.total ?? 0;
  const subtotal = order.summary?.subtotal ?? total;
  const designFees = order.summary?.designFees ?? 0;
  const payment = order.payment?.label || order.payment?.method || 'Not available';
  const customer = isV2
    ? order.customer
    : { name: order.delivery?.name, phone: order.delivery?.phone, email: order.delivery?.email };
  const shippingAddress = isV2 ? order.shipping : order.delivery?.address;
  const addressHTML = shippingAddress ? formatAddress(shippingAddress) : '';

  return `<details class="user-profile-order-card"${isFirst ? ' open' : ''}>
    <summary class="user-profile-order-summary">
      <span class="user-profile-order-id">${esc(order.id)}</span>
      <span class="user-profile-order-date">${esc(formatDate(order.date))}</span>
      <span class="user-profile-order-status">${esc(order.status || 'Confirmed')}</span>
      <span class="user-profile-order-summary-total">${money(total)}</span>
      ${CHEVRON_ICON}
    </summary>
    <div class="user-profile-order-body">
      <div class="user-profile-order-details-grid">
        <div class="user-profile-order-detail-card">
          <h3>Customer</h3>
          <p>${displayValue(customer?.name)}</p>
          <p>${displayValue(customer?.phone)}</p>
          <p>${displayValue(customer?.email)}</p>
        </div>
        <div class="user-profile-order-detail-card">
          <h3>Delivery Address</h3>
          ${addressHTML || '<p class="value-empty">Not provided</p>'}
        </div>
        <div class="user-profile-order-detail-card">
          <h3>Order Summary</h3>
          <div class="user-profile-order-summary-row"><span>Subtotal</span><span>${money(subtotal)}</span></div>
          ${designFees ? `<div class="user-profile-order-summary-row user-profile-order-summary-row-muted"><span>Design fees</span><span>${money(designFees)}</span></div>` : ''}
          <div class="user-profile-order-summary-row"><span>Shipping</span><span>Free</span></div>
          <div class="user-profile-order-summary-row user-profile-order-summary-row-total"><span>Total</span><span>${money(total)}</span></div>
          <p class="user-profile-order-payment">${esc(payment)}</p>
        </div>
      </div>
      <div class="user-profile-order-items-section">
        <h3>Products</h3>
        ${orderItemsHTML(order.items)}
      </div>
    </div>
  </details>`;
}

function ordersHTML(orders, heading) {
  const body = orders.length
    ? `<div class="user-profile-order-list">${orders.map((o, i) => orderCardHTML(o, i === 0)).join('')}</div>`
    : `<div class="user-profile-orders-empty">
        <span class="user-profile-orders-empty-icon">${RECEIPT_ICON}</span>
        <p class="user-profile-orders-empty-title">No orders yet</p>
        <p class="user-profile-orders-empty-desc">When you place an order, it'll show up here.</p>
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
  const items = parseIconMenu(block);
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
        <ul class="user-profile-menu">${menuItemsHTML(items)}</ul>
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
