/**
 * Cart Block — Craftora EDS
 *
 * Authored DOM (8 rows):
 *   Row 0: Empty state content (h2, p, CTA link) | (empty col)
 *   Row 1: "Order Summary" heading (bold)
 *   Row 2: "Items (0)" label | "₹0" value
 *   Row 3: "Shipping" label | "Free" value
 *   Row 4: "Discounts" label | "₹0" value
 *   Row 5: "Total" label | "₹0" value
 *   Row 6: "Proceed to Checkout" (bold text = button label)
 *   Row 7: Checkout note text
 *
 * Reads localStorage 'cart' and renders items + order summary.
 */

import {
  getCart, updateQty, removeFromCart,
  setCheckoutSession, money, esc,
} from '../../scripts/cart-utils.js';
import { showCartDesignPreview } from '../../scripts/design-preview.js';

export default function decorate(block) {
  const rows = [...block.children];

  // ── Extract authored content ──
  // Row 0: empty state
  const emptyCell = rows[0]?.children[0];
  const emptyHeading = emptyCell?.querySelector('h2')?.textContent?.trim() || 'Your cart is empty';
  const emptyParas = emptyCell?.querySelectorAll('p') || [];
  let emptyDesc = '';
  let emptyCTAHref = '/products';
  let emptyCTAText = 'Continue Shopping';
  emptyParas.forEach((p) => {
    const a = p.querySelector('a');
    if (a) { emptyCTAHref = a.getAttribute('href') || '/products'; emptyCTAText = a.textContent.trim(); } else if (p.textContent.trim()) emptyDesc = p.textContent.trim();
  });

  // Row 1: summary title
  const summaryTitle = rows[1]?.querySelector('h2, strong, p')?.textContent?.trim() || 'Order Summary';

  // Row 6: checkout button label
  const checkoutLabel = rows[6]?.querySelector('strong, p')?.textContent?.trim() || 'Proceed to Checkout';

  // Row 7: checkout note
  const checkoutNote = rows[7]?.querySelector('p')?.textContent?.trim() || 'Add products to continue to checkout.';

  // ── Clear block ──
  block.textContent = '';

  // ── Build layout ──
  const layout = document.createElement('div');
  layout.className = 'cart-layout';

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'cart-items';
  itemsContainer.setAttribute('aria-live', 'polite');

  const summary = document.createElement('aside');
  summary.className = 'cart-summary';

  layout.append(itemsContainer, summary);
  block.append(layout);

  // ── Render ──
  function render() {
    const cart = getCart().slice().reverse();

    if (!cart.length) {
      itemsContainer.innerHTML = `
        <div class="cart-empty">
          <h2>${esc(emptyHeading)}</h2>
          <p>${esc(emptyDesc)}</p>
          <a class="cart-empty-cta" href="${esc(emptyCTAHref)}">${esc(emptyCTAText)}</a>
        </div>`;
      renderSummary(0, 0);
      return;
    }

    let totalItems = 0;
    let subtotal = 0;

    itemsContainer.innerHTML = cart.map((item) => {
      totalItems += item.qty;
      subtotal += item.price * item.qty;

      return `<article class="cart-item" data-key="${esc(item.key)}">
        <div class="cart-item-img-wrap">
          <img class="cart-item-img" src="${esc(item.image)}" alt="${esc(item.name)}" width="120" height="120" loading="lazy">
        </div>
        <div class="cart-item-details">
          <div class="cart-item-header">
            <div>
              <h3 class="cart-item-name"><a href="/product?id=${esc(item.id)}">${esc(item.name)}</a></h3>
              <div class="cart-item-meta">
                ${item.color ? `<span class="cart-item-color"><span class="cart-item-color-dot" style="background:${esc(item.color)}"></span>${esc(item.colorName || '')}</span>` : ''}
                ${item.size ? `<span>Size ${esc(item.size)}</span>` : ''}
                ${item.customized && item.customization?.previewImage ? `<button class="cart-item-preview-btn" type="button" data-key="${esc(item.key)}">View design</button>` : ''}
              </div>
              ${item.designFee ? `<p class="cart-item-design-fee">Incl. design fee ${money(item.designFee)}</p>` : ''}
            </div>
            <span class="cart-item-price">${money(item.price * item.qty)}</span>
          </div>
          <div class="cart-item-actions">
            <div class="cart-item-controls">
              <div class="cart-qty" role="group" aria-label="Quantity for ${esc(item.name)}">
                <button class="cart-qty-btn cart-qty-minus" type="button" aria-label="Decrease" data-key="${esc(item.key)}" ${item.qty <= 1 ? 'disabled' : ''}>−</button>
                <output class="cart-qty-val">${item.qty}</output>
                <button class="cart-qty-btn cart-qty-plus" type="button" aria-label="Increase" data-key="${esc(item.key)}">+</button>
              </div>
              <span class="cart-item-unit-price">Unit ${money(item.price)}</span>
            </div>
            <button class="cart-item-remove" type="button" aria-label="Remove ${esc(item.name)}" data-key="${esc(item.key)}">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>
      </article>`;
    }).join('');

    renderSummary(totalItems, subtotal);
    wireItemEvents();
  }

  function renderSummary(totalItems, subtotal) {
    const hasItems = totalItems > 0;
    summary.innerHTML = `
      <h2 class="cart-summary-title">${esc(summaryTitle)}</h2>
      <div class="cart-summary-row"><span>Items (${totalItems})</span><span>${money(subtotal)}</span></div>
      <div class="cart-summary-row"><span>Shipping</span><span>Free</span></div>
      <div class="cart-summary-row cart-summary-row-muted"><span>Discounts</span><span>${money(0)}</span></div>
      <div class="cart-summary-divider"></div>
      <div class="cart-summary-row cart-summary-total"><span>Total</span><span>${money(subtotal)}</span></div>
      <button class="cart-checkout-btn" type="button" ${hasItems ? '' : 'disabled'}>${esc(checkoutLabel)}</button>
      <p class="cart-checkout-note">${hasItems ? 'Secure checkout with free shipping.' : esc(checkoutNote)}</p>`;

    summary.querySelector('.cart-checkout-btn')?.addEventListener('click', () => {
      const cart = getCart();
      if (!cart.length) return;
      setCheckoutSession('cart', cart);
      window.location.href = '/checkout';
    });
  }

  function wireItemEvents() {
    itemsContainer.querySelectorAll('.cart-qty-minus').forEach((btn) => {
      btn.addEventListener('click', () => { updateQty(btn.dataset.key, -1); render(); });
    });
    itemsContainer.querySelectorAll('.cart-qty-plus').forEach((btn) => {
      btn.addEventListener('click', () => { updateQty(btn.dataset.key, 1); render(); });
    });
    itemsContainer.querySelectorAll('.cart-item-remove').forEach((btn) => {
      btn.addEventListener('click', () => { removeFromCart(btn.dataset.key); render(); });
    });
    itemsContainer.querySelectorAll('.cart-item-preview-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); showCartDesignPreview(btn.dataset.key); });
    });
  }

  render();
  window.addEventListener('storage', (e) => { if (e.key === 'cart') render(); });
}
