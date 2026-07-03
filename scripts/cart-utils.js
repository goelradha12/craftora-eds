/**
 * cart-utils.js — Craftora EDS Shared Cart Utilities
 * localStorage-based cart CRUD + badge updates.
 * Matches legacy craftora/scripts/cart.js logic.
 */

const CART_KEY = 'cart';
const ORDERS_KEY = 'craftora_orders';
const CHECKOUT_SESSION_KEY = 'craftora_checkout';

/**
 * Name of the same-tab cart-change event. Cross-tab changes are covered by
 * the native `storage` event; this custom event covers changes made in the
 * current tab, which `storage` does not fire for.
 */
export const CART_UPDATED_EVENT = 'cart-updated';

/* Notifies same-tab listeners that the cart changed. Consumers (header badge,
   customizer badge, cart page) listen for CART_UPDATED_EVENT and re-read the
   cart themselves — the event carries no payload, keeping one source of truth. */
function notifyCartChanged() {
  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
}

/* ── Formatting ── */

export function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

// esc() is a generic HTML escaper owned by helpers.js; re-exported here so cart
// consumers can pull esc + money from a single module (one source of truth).
export { esc } from './helpers.js';

/* ── Cart CRUD ── */

export function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || '[]');
  } catch { return []; }
}

export function saveCart(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items));
  notifyCartChanged();
}

export function addToCart(item) {
  const cart = getCart();
  const existing = cart.find((i) => i.key === item.key);
  if (existing) {
    existing.qty += item.qty || 1;
    if (item.customization) {
      existing.customization = item.customization;
      existing.image = item.image;
    }
  } else {
    cart.push(item);
  }
  saveCart(cart);
}

export function removeFromCart(key) {
  saveCart(getCart().filter((i) => i.key !== key));
}

export function updateQty(key, delta) {
  const cart = getCart();
  const item = cart.find((i) => i.key === key);
  if (!item) return;
  const newQty = item.qty + delta;
  if (newQty < 1) return;
  item.qty = newQty;
  saveCart(cart);
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  notifyCartChanged();
}

/* ── Cart Count ── */

export function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.qty ?? 1), 0);
}

/* ── Badge Update ── */

export function updateCartBadges() {
  const count = getCartCount();
  document.querySelectorAll('.nav-cart-badge, .cart-badge').forEach((badge) => {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden', 'cart-badge--hidden');
    } else {
      badge.classList.add('hidden', 'cart-badge--hidden');
    }
  });
}

/* ── Orders ── */

export function getOrders() {
  try {
    return JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]');
  } catch { return []; }
}

/**
 * Get orders filtered for a specific user (by phone number).
 * Supports both v1 (delivery.phone) and v2 (customer.phone) order formats.
 * @param {object|null} user - User object with .phone property
 * @returns {Array} Orders belonging to the user, sorted newest first
 */
export function getOrdersForUser(user) {
  if (!user || !user.phone) return [];
  const phone = String(user.phone).trim();
  return getOrders()
    .filter((o) => {
      const v2Phone = String(o.customer?.phone || '').trim();
      const v1Phone = String(o.delivery?.phone || '').trim();
      return v2Phone === phone || v1Phone === phone;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function addOrder(order) {
  const orders = getOrders();
  orders.unshift(order);
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

export function generateOrderId() {
  return `CRF-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
}

/* ── Checkout Session ── */

export function setCheckoutSession(source, items) {
  sessionStorage.setItem(CHECKOUT_SESSION_KEY, JSON.stringify({ source, items }));
}

export function getCheckoutSession() {
  try {
    return JSON.parse(sessionStorage.getItem(CHECKOUT_SESSION_KEY) || 'null');
  } catch { return null; }
}

export function clearCheckoutSession() {
  sessionStorage.removeItem(CHECKOUT_SESSION_KEY);
}
