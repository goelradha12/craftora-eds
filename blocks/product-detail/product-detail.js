/**
 * Product Detail Block — Craftora EDS
 *
 * Authored DOM (1 row):
 *   Row 0: link to products JSON endpoint
 *
 * Reads ?id= URL param, fetches product data, renders full PDP.
 */

import {
  money, esc, addToCart, setCheckoutSession,
} from '../../scripts/cart-utils.js';
import { getUser } from '../../scripts/auth.js';
import { getDesignFee, calculateItemPrice } from '../../scripts/pricing.js';
import { toggleWishlist, isWishlisted } from '../../scripts/wishlist-utils.js';
import { fetchProducts, resolveAssetPath } from '../../scripts/product-data.js';
import { isLightColor, getColorName as lookupColorName, COLOR_PALETTE } from '../../scripts/color-utils.js';
import { showDesignPreview, designExists } from '../../scripts/design-preview.js';

/* ── Color palette (shared full set) ── */
const COLORS = COLOR_PALETTE;
const PALETTE_KEYS = Object.keys(COLORS);

// getColorName/isLightColor live in scripts/color-utils.js. Bind this block's
// COLORS palette so existing call sites stay unchanged.
function getColorName(hex) {
  return lookupColorName(hex, COLORS);
}

/* ── State ── */
const state = {
  product: null, products: [], qty: 1, customization: null, designRequired: false, selectedColor: null,
};

function loadCustomization(id) {
  try {
    const raw = localStorage.getItem(`designData_${id}`);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return String(d?.productId ?? '') === String(id) ? d : null;
  } catch { return null; }
}

/* Stable hash of a design (excludes preview/timestamp) so different designs
   for the same product/size/color become distinct cart line items. */
function designHash(customization) {
  if (!customization) return 'plain';
  const data = {};
  Object.keys(customization).forEach((k) => {
    if (k !== 'previewImage' && k !== 'generatedAt') data[k] = customization[k];
  });
  const s = JSON.stringify(data);
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    // eslint-disable-next-line no-bitwise
    h = (((h << 5) - h) + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

/* Add-to-cart confirmation toast (matches legacy UX). */
function showToast() {
  document.getElementById('pd-toast')?.remove();
  const toast = document.createElement('div');
  toast.id = 'pd-toast';
  toast.className = 'pd-toast';
  toast.innerHTML = '<span class="pd-toast-msg">Added to cart</span>'
    + '<a class="pd-toast-cta" href="/cart">Go to Cart</a>'
    + '<button class="pd-toast-close" type="button" aria-label="Dismiss">×</button>';
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  const close = () => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 250);
  };
  toast.querySelector('.pd-toast-close').addEventListener('click', close);
  setTimeout(close, 4000);
}

/* ── Main decorate ── */
export default async function decorate(block) {
  const link = block.querySelector('a');
  const jsonUrl = link?.getAttribute('href') || '/library/products.json';
  const productId = new URLSearchParams(window.location.search).get('id');

  block.textContent = '';
  block.setAttribute('aria-live', 'polite');

  if (!productId) { block.innerHTML = renderError('No product specified.'); return; }

  try {
    const products = await fetchProducts(jsonUrl);
    state.products = products;
    state.product = products.find((p) => p.id === productId);
    if (!state.product) { block.innerHTML = renderError('Product not found.'); return; }

    const p = state.product;
    document.title = `${p.name} — Craftora`;
    state.customization = loadCustomization(productId);
    state.selectedColor = state.customization?.shirtColor || COLORS[PALETTE_KEYS[0]];
    state.designRequired = true;

    block.innerHTML = renderPage(p);
    bindEvents(block);
    updateUI(block);
  } catch {
    block.innerHTML = renderError('Failed to load product. Please refresh.');
  }
}

/* ── Render full page ── */
function renderPage(p) {
  const images = [resolveAssetPath(p.imageDefault || p.images?.default), ...(p.imageOthers ? p.imageOthers.split(', ').map(resolveAssetPath) : (p.images?.others || []).map(resolveAssetPath))].filter(Boolean);
  const badges = p.badges ? (typeof p.badges === 'string' ? p.badges.split(', ') : p.badges) : [];
  const sizes = p.sizes ? (typeof p.sizes === 'string' ? p.sizes.split(', ') : p.sizes) : [];
  const isSaved = isWishlisted(p.id);
  const designFee = getDesignFee(p.category);
  const outOfStock = Number(p.stock) <= 0;
  const details = Array.isArray(p.productDetails) ? p.productDetails : [];
  const shippingBody = '<ul class="pd-shipping-list">'
    + '<li>Standard orders ship in 3–5 business days.</li>'
    + '<li>Customized products require approximately 5 additional business days.</li>'
    + '<li>Returns are accepted within 7 days for non-customized products only.</li>'
    + '</ul>';

  return `
    <nav class="pd-breadcrumb" aria-label="Breadcrumb">
      <a href="/products">Shop</a> / <a href="/products?category=${esc(p.category)}">${esc(p.category)}</a> / <span>${esc(p.name)}</span>
    </nav>
    <section class="pd-main">
      <div class="pd-gallery">
        <div class="pd-main-img-wrap">
          ${badges.length ? `<div class="pd-badges">${badges.map((b) => `<span class="pd-badge">${esc(b)}</span>`).join('')}</div>` : ''}
          <button class="pd-wishlist-btn ${isSaved ? 'wishlisted' : ''}" id="pdWishBtn" aria-label="${isSaved ? 'Remove from wishlist' : 'Save to wishlist'}">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="${isSaved ? '#e11d48' : 'none'}" stroke="${isSaved ? '#e11d48' : 'currentColor'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
          </button>
          <img class="pd-main-img" id="pdMainImg" src="${images[0]}" alt="${esc(p.name)}" width="800" height="1000">
        </div>
        ${images.length > 1 ? `<div class="pd-thumbs">${images.map((src, i) => `<button class="pd-thumb ${i === 0 ? 'active' : ''}" data-src="${src}" type="button" aria-label="Image ${i + 1}"><img src="${src}" alt="" width="64" height="64" loading="lazy"></button>`).join('')}</div>` : ''}
      </div>
      <div class="pd-info">
        <div class="pd-meta">
          <span class="pd-category">${esc(p.category)}</span>
          <h1 class="pd-name">${esc(p.name)}</h1>
          <p class="pd-desc">${esc(p.description)}</p>
        </div>
        <hr>
        <div class="pd-pricing">
          <span class="pd-price" id="pdPrice">${money(p.basePrice)}</span>
          <span class="pd-base-label">BASE PRICE</span>
          <span class="pd-fee-pill">+ ${money(designFee)} Custom Design</span>
        </div>
        <hr>
        ${renderColorPicker()}
        <div class="pd-options-row">
          ${sizes.length ? `<fieldset class="pd-option"><legend class="pd-option-label">Size</legend><div class="pd-sizes">${sizes.map((s, i) => `<label class="pd-size-label"><input type="radio" name="pd-size" value="${esc(s)}" ${i === 0 ? 'checked' : ''}><span class="pd-size-btn">${esc(s)}</span></label>`).join('')}</div></fieldset>` : ''}
          <div class="pd-option"><span class="pd-option-label">Quantity</span><div class="pd-qty"><button class="pd-qty-btn" id="pdQtyMinus" type="button" disabled>−</button><output class="pd-qty-val" id="pdQtyVal">1</output><button class="pd-qty-btn" id="pdQtyPlus" type="button">+</button></div></div>
        </div>
        <div class="pd-cust-section">
          <div class="pd-cust-header">
            <div class="pd-cust-heading">
              <span class="pd-base-label">Apply Custom Design</span>
            </div>
            <label class="pd-toggle">
              <input type="checkbox" id="pdDesignToggle" ${outOfStock ? 'disabled' : ''}>
              <span class="pd-toggle-slider"></span>
            </label>
          </div>
          <div class="pd-cust-card missing" id="pdCustCard" hidden>
            <div class="pd-cust-preview-wrap">
              <img id="pdCustPreview" alt="Saved design preview" hidden>
              <span class="pd-cust-icon" id="pdCustIcon">🎨</span>
            </div>
            <div class="pd-cust-text">
              <p class="pd-cust-status" id="pdCustStatus">NO DESIGN SELECTED</p>
              <div class="pd-cust-title-row">
                <p class="pd-cust-title" id="pdCustTitle">Design required</p>
              </div>
              <p class="pd-cust-desc" id="pdCustDesc">Create your design to personalize this product.</p>
              <button class="pd-view-design-btn" id="pdViewDesignBtn" type="button" hidden><span>View design</span> <span class="pd-view-design-chevron">&rsaquo;</span></button>
            </div>
            <button class="pd-cust-edit-link" id="pdCustomizeBtn" ${outOfStock ? 'disabled' : ''} type="button"><svg class="pd-cust-edit-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg> <span id="pdCustBtnLabel">CREATE</span></button>
          </div>
        </div>
        <div class="pd-actions">
          <div class="pd-btn-row"><button class="pd-add-btn" id="pdAddBtn" ${outOfStock ? 'disabled' : ''}>Add to Cart</button><button class="pd-buy-btn" id="pdBuyBtn" ${outOfStock ? 'disabled' : ''}>Buy Now</button></div>
        </div>
        ${details.length ? renderAccordion('pdDetailsToggle', 'pdDetailsBody', 'Product Details', renderDetailsBody(details)) : ''}
        ${renderAccordion('pdShippingToggle', 'pdShippingBody', 'Shipping & Returns', shippingBody)}
      </div>
    </section>`;
}

function renderColorPicker() {
  const active = state.selectedColor || COLORS[PALETTE_KEYS[0]];
  return `<div class="pd-color-section"><span class="pd-option-label">Color</span>
    <button class="pd-color-trigger" id="pdColorTrigger" type="button" aria-expanded="false">
      <span class="pd-color-dot" id="pdColorDot" style="background:${active}"></span>
      <span class="pd-color-name" id="pdColorName">${getColorName(active)}</span>
      <svg class="pd-color-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
    </button>
    <div class="pd-color-panel" id="pdColorPanel" hidden>
      <div class="pd-color-swatches">${PALETTE_KEYS.map((k) => { const hex = COLORS[k]; return `<button class="pd-swatch ${hex.toLowerCase() === active.toLowerCase() ? 'selected' : ''} ${isLightColor(hex) ? 'light' : ''}" data-color="${hex}" data-name="${getColorName(hex)}" style="background:${hex}" type="button" title="${getColorName(hex)}"></button>`; }).join('')}</div>
    </div></div>`;
}

function renderDetailsBody(details) {
  return `<dl class="pd-details-dl">${details.map((d) => `<div class="pd-details-row"><dt>${esc(d.label || d.key || '')}</dt><dd>${esc(d.value || '')}</dd></div>`).join('')}</dl>`;
}

function renderAccordion(toggleId, bodyId, title, bodyHtml) {
  return `<div class="pd-details"><button class="pd-details-toggle" id="${toggleId}" type="button" aria-expanded="true"><span>${esc(title)}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></button><div class="pd-details-list" id="${bodyId}">${bodyHtml}</div></div>`;
}

function renderError(msg) {
  return `<div class="pd-error"><p>${esc(msg)}</p><a href="/products">Back to Shop</a></div>`;
}

/* ── UI Updates ── */
function updateUI(block) {
  const p = state.product;
  if (!p) return;
  const total = calculateItemPrice(Number(p.basePrice), p.category, state.designRequired);
  const custCard = block.querySelector('#pdCustCard');
  const addBtn = block.querySelector('#pdAddBtn');
  const buyBtn = block.querySelector('#pdBuyBtn');
  const toggle = block.querySelector('#pdDesignToggle');

  if (toggle) toggle.checked = state.designRequired;
  if (addBtn) addBtn.textContent = `Add to Cart • ${money(total)}`;
  if (buyBtn) buyBtn.textContent = `Buy Now • ${money(total)}`;

  if (state.designRequired) {
    if (custCard) { custCard.hidden = false; updateCustCard(block); }
  } else if (custCard) {
    custCard.hidden = true;
  }

  const outOfStock = Number(p.stock) <= 0;
  if (outOfStock) { if (addBtn) addBtn.disabled = true; if (buyBtn) buyBtn.disabled = true; return; }
  if (state.designRequired) {
    const has = !!state.customization;
    if (addBtn) addBtn.disabled = !has;
    if (buyBtn) buyBtn.disabled = !has;
  } else {
    if (addBtn) addBtn.disabled = false;
    if (buyBtn) buyBtn.disabled = false;
  }
}

function updateCustCard(block) {
  const p = state.product;
  const has = !!state.customization;
  const outOfStock = Number(p.stock) <= 0;
  const card = block.querySelector('#pdCustCard');
  const icon = block.querySelector('#pdCustIcon');
  const preview = block.querySelector('#pdCustPreview');
  const status = block.querySelector('#pdCustStatus');
  const title = block.querySelector('#pdCustTitle');
  const desc = block.querySelector('#pdCustDesc');
  const label = block.querySelector('#pdCustBtnLabel');
  const viewBtn = block.querySelector('#pdViewDesignBtn');
  if (!card) return;

  const previewImg = has ? state.customization.previewImage : '';
  if (preview && previewImg && !outOfStock) {
    preview.src = previewImg;
    preview.hidden = false;
    if (icon) icon.hidden = true;
  } else {
    if (preview) preview.hidden = true;
    if (icon) icon.hidden = false;
  }
  if (viewBtn) viewBtn.hidden = !(has && !outOfStock && designExists(p.id));

  if (outOfStock) {
    card.className = 'pd-cust-card missing';
    if (icon) icon.textContent = '✗';
    if (status) status.textContent = 'OUT OF STOCK';
    if (title) title.textContent = 'Out of stock';
    if (desc) desc.textContent = 'This product is currently unavailable.';
    if (label) label.textContent = 'CREATE';
  } else if (has) {
    card.className = 'pd-cust-card ready';
    if (icon) icon.textContent = '✓';
    if (status) status.textContent = 'Active Customization';
    if (title) title.textContent = '';
    if (desc) desc.textContent = `Color: ${getColorName(state.customization?.shirtColor)}`;
    if (label) label.textContent = 'EDIT';
  } else {
    card.className = 'pd-cust-card missing';
    if (icon) icon.textContent = '🎨';
    if (status) status.textContent = 'NO DESIGN SELECTED';
    if (title) title.textContent = 'Design required';
    if (desc) desc.textContent = 'Create your design to personalize this product.';
    if (label) label.textContent = 'CREATE';
  }
}

/* ── Event binding ── */
function bindEvents(block) {
  const p = state.product;

  // Thumbnails
  block.querySelectorAll('.pd-thumb').forEach((btn) => {
    btn.addEventListener('click', () => {
      block.querySelector('#pdMainImg').src = btn.dataset.src;
      block.querySelectorAll('.pd-thumb').forEach((t) => t.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Quantity
  const qtyVal = block.querySelector('#pdQtyVal');
  block.querySelector('#pdQtyMinus')?.addEventListener('click', () => {
    if (state.qty <= 1) return;
    qtyVal.textContent = --state.qty;
    block.querySelector('#pdQtyMinus').disabled = state.qty <= 1;
  });
  block.querySelector('#pdQtyPlus')?.addEventListener('click', () => {
    if (state.qty >= 99) return;
    qtyVal.textContent = ++state.qty;
    block.querySelector('#pdQtyMinus').disabled = false;
  });

  // Wishlist
  block.querySelector('#pdWishBtn')?.addEventListener('click', () => {
    const now = toggleWishlist({
      id: p.id, name: p.name, category: p.category, price: Number(p.basePrice), image: resolveAssetPath(p.imageDefault || p.images?.default || ''),
    });
    const btn = block.querySelector('#pdWishBtn');
    btn.classList.toggle('wishlisted', now);
    const svg = btn.querySelector('path');
    if (svg) { svg.setAttribute('fill', now ? '#e11d48' : 'none'); svg.setAttribute('stroke', now ? '#e11d48' : 'currentColor'); }
  });

  // Color picker
  block.querySelector('#pdColorTrigger')?.addEventListener('click', () => {
    const trigger = block.querySelector('#pdColorTrigger');
    const panel = block.querySelector('#pdColorPanel');
    const willOpen = panel.hidden;
    panel.hidden = !willOpen;
    trigger.setAttribute('aria-expanded', String(willOpen));
  });
  block.querySelector('.pd-color-swatches')?.addEventListener('click', (e) => {
    const swatch = e.target.closest('.pd-swatch');
    if (!swatch) return;
    state.selectedColor = swatch.dataset.color;
    block.querySelectorAll('.pd-swatch').forEach((s) => s.classList.remove('selected'));
    swatch.classList.add('selected');
    block.querySelector('#pdColorDot').style.background = swatch.dataset.color;
    block.querySelector('#pdColorName').textContent = swatch.dataset.name;
    block.querySelector('#pdColorPanel').hidden = true;
    block.querySelector('#pdColorTrigger').setAttribute('aria-expanded', 'false');
  });

  // View saved design
  block.querySelector('#pdViewDesignBtn')?.addEventListener('click', () => showDesignPreview(p.id));

  // Design toggle
  block.querySelector('#pdDesignToggle')?.addEventListener('change', (e) => {
    state.designRequired = e.target.checked;
    updateUI(block);
  });

  // Customize button
  block.querySelector('#pdCustomizeBtn')?.addEventListener('click', () => {
    const size = block.querySelector('input[name="pd-size"]:checked')?.value || '';
    window.location.href = `/customize?id=${p.id}&size=${encodeURIComponent(size)}`;
  });

  // Accordion toggles (Product Details, Shipping & Returns)
  block.querySelectorAll('.pd-details-toggle').forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const body = toggle.nextElementSibling;
      const expanded = toggle.getAttribute('aria-expanded') === 'true';
      toggle.setAttribute('aria-expanded', String(!expanded));
      if (body) body.hidden = expanded;
    });
  });

  // Add to Cart / Buy Now
  block.querySelector('#pdAddBtn')?.addEventListener('click', () => handleAddToCart(block, false));
  block.querySelector('#pdBuyBtn')?.addEventListener('click', () => handleAddToCart(block, true));

  // Re-sync the saved design across tabs (storage), on back-nav from the studio
  // (pageshow / bfcache), and on the studio's in-tab save event.
  const syncDesign = () => {
    state.customization = loadCustomization(p.id);
    if (state.customization) state.designRequired = true;
    updateUI(block);
  };
  window.addEventListener('storage', (e) => { if (e.key === `designData_${p.id}`) syncDesign(); });
  window.addEventListener('pageshow', syncDesign);
  window.addEventListener('craftora-design-updated', (e) => {
    if (e.detail?.productId === p.id) syncDesign();
  });
}

function handleAddToCart(block, redirect) {
  const p = state.product;
  if (!p || (state.designRequired && !state.customization)) return;

  const size = block.querySelector('input[name="pd-size"]:checked')?.value || '';
  const color = state.selectedColor || COLORS[PALETTE_KEYS[0]];
  const colorName = getColorName(color);
  const designFee = state.designRequired ? getDesignFee(p.category) : 0;
  const totalPrice = calculateItemPrice(Number(p.basePrice), p.category, state.designRequired);

  const key = state.designRequired
    ? `${p.id}__${size}__${color}__${designHash(state.customization)}`
    : `${p.id}__${size}__${color}__plain`;

  const item = {
    key,
    id: p.id,
    name: p.name,
    image: (state.designRequired && state.customization?.previewImage) ? state.customization.previewImage : resolveAssetPath(p.imageDefault || p.images?.default || ''),
    category: p.category,
    basePrice: Number(p.basePrice),
    designFee,
    price: totalPrice,
    color,
    colorName,
    size,
    qty: state.qty,
    customized: state.designRequired,
    designRequired: state.designRequired,
    customization: state.designRequired ? state.customization : null,
  };

  if (redirect) {
    // Buy Now requires a logged-in user (matches legacy).
    const user = getUser();
    if (!user || !user.phone) {
      // eslint-disable-next-line no-alert
      alert('You are not logged in. Please log in to continue with your purchase.');
      const back = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?redirect=${back}`;
      return;
    }
    setCheckoutSession('buy-now', [item]);
    window.location.href = '/checkout';
  } else {
    addToCart(item);
    showToast();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
