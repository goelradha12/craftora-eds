/**
 * Product Detail Block — Craftora EDS
 *
 * Authored DOM (1 row):
 *   Row 0: link to products JSON endpoint
 *
 * Reads ?id= URL param, fetches product data, renders full PDP.
 */

import { money, esc, addToCart, setCheckoutSession } from '../../scripts/cart-utils.js';
import { getDesignFee, calculateItemPrice } from '../../scripts/pricing.js';
import { toggleWishlist, isWishlisted } from '../../scripts/wishlist-utils.js';
import { showDesignPreview, designExists } from '../../scripts/design-preview.js';

/* ── Color palette (matches legacy) ── */
const COLORS = {
  pacificBlue: '#B0DDF7', angelBlue: '#A7BFE5', brightBlue: '#50C6F6',
  royalBlue: '#0055B8', navyBlue: '#190850', teal: '#1FAAAD',
  pastelGreen: '#CBE5BE', freshGreen: '#ACC636', emerald: '#6EA864',
  forestGreen: '#4B7A47', lavender: '#C7A2D0', plum: '#7B6AB0',
  violet: '#6D2B76', pastelPink: '#F7D8E7', rose: '#F1719B',
  hotPink: '#EE4791', fuschia: '#DC126B', peach: '#F7BCA4',
  prettyRed: '#E12D3A', burgundy: '#8E2D30', happyOrange: '#F79854',
  tangerine: '#F47F25', rust: '#BF6227', buttercup: '#FFF546',
  mustardYellow: '#E3C34D', sand: '#E1CF85', tan: '#D7CDB4',
  softGray: '#D0D2D4', charcoal: '#58585A', black: '#231F20',
};
const PALETTE_KEYS = Object.keys(COLORS);

function getColorName(hex) {
  const h = String(hex).toLowerCase();
  const key = PALETTE_KEYS.find((k) => COLORS[k].toLowerCase() === h);
  if (!key) return hex;
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());
}

function isLightColor(hex) {
  const c = hex.replace('#', '');
  const r = parseInt(c.substr(0, 2), 16);
  const g = parseInt(c.substr(2, 2), 16);
  const b = parseInt(c.substr(4, 2), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 200;
}

function resolveImg(path) {
  if (!path) return '';
  return path.startsWith('./') ? path.slice(1) : path;
}

/* ── State ── */
const state = { product: null, products: [], qty: 1, customization: null, designRequired: false, selectedColor: null };

function loadCustomization(id) {
  try {
    const raw = localStorage.getItem(`designData_${id}`);
    if (!raw) return null;
    const d = JSON.parse(raw);
    return String(d?.productId ?? '') === String(id) ? d : null;
  } catch { return null; }
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
    const resp = await fetch(jsonUrl);
    if (!resp.ok) throw new Error('fetch failed');
    console.log(resp);
    const json = await resp.json();

    // Handle multi-sheet or flat
    let products = [];
    if (json.data?.data && Array.isArray(json.data.data)) products = json.data.data;
    else if (Array.isArray(json.data)) products = json.data;
    else if (Array.isArray(json.products)) products = json.products;

    state.products = products;
    state.product = products.find((p) => p.id === productId);
    if (!state.product) { block.innerHTML = renderError('Product not found.'); return; }

    const p = state.product;
    document.title = `${p.name} — Craftora`;
    state.customization = loadCustomization(productId);
    state.selectedColor = state.customization?.shirtColor || COLORS[PALETTE_KEYS[0]];
    state.designRequired = !!state.customization;

    block.innerHTML = renderPage(p);
    bindEvents(block);
    updateUI(block);
  } catch {
    block.innerHTML = renderError('Failed to load product. Please refresh.');
  }
}

/* ── Render full page ── */
function renderPage(p) {
  const images = [resolveImg(p.imageDefault || p.images?.default), ...(p.imageOthers ? p.imageOthers.split(', ').map(resolveImg) : (p.images?.others || []).map(resolveImg))].filter(Boolean);
  const badges = p.badges ? (typeof p.badges === 'string' ? p.badges.split(', ') : p.badges) : [];
  const sizes = p.sizes ? (typeof p.sizes === 'string' ? p.sizes.split(', ') : p.sizes) : [];
  const isSaved = isWishlisted(p.id);
  const designFee = getDesignFee(p.category);
  const outOfStock = Number(p.stock) <= 0;
  const details = Array.isArray(p.productDetails) ? p.productDetails : [];

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
        <span class="pd-category">${esc(p.category)}</span>
        <h1 class="pd-name">${esc(p.name)}</h1>
        <div class="pd-pricing">
          <span class="pd-price" id="pdPrice">${money(p.basePrice)}</span>
          <span class="pd-price-note" id="pdPriceNote">base price</span>
        </div>
        <div class="pd-fee-breakdown" id="pdFee" hidden>
          <span>Base: ${money(p.basePrice)}</span>
          <span class="pd-fee-accent">+ Design fee: ${money(designFee)}</span>
        </div>
        <hr>
        <p class="pd-desc">${esc(p.description)}</p>
        ${renderColorPicker()}
        <div class="pd-options-row">
          ${sizes.length ? `<fieldset class="pd-option"><legend class="pd-option-label">Size</legend><div class="pd-sizes">${sizes.map((s, i) => `<label class="pd-size-label"><input type="radio" name="pd-size" value="${esc(s)}" ${i === 0 ? 'checked' : ''}><span class="pd-size-btn">${esc(s)}</span></label>`).join('')}</div></fieldset>` : ''}
          <div class="pd-option"><span class="pd-option-label">Quantity</span><div class="pd-qty"><button class="pd-qty-btn" id="pdQtyMinus" type="button" disabled>−</button><output class="pd-qty-val" id="pdQtyVal">1</output><button class="pd-qty-btn" id="pdQtyPlus" type="button">+</button></div></div>
        </div>
        <div class="pd-design-toggle"><span class="pd-option-label">Custom Design?</span><div class="pd-design-radios"><label><input type="radio" name="pd-design" value="no" checked ${outOfStock ? 'disabled' : ''}><span>No</span></label><label><input type="radio" name="pd-design" value="yes" ${outOfStock ? 'disabled' : ''}><span>Yes, customize</span></label></div></div>
        <div class="pd-cust-card missing" id="pdCustCard" hidden><div class="pd-cust-icon" id="pdCustIcon">🎨</div><div class="pd-cust-text"><p class="pd-cust-title" id="pdCustTitle">Design required</p><p class="pd-cust-desc" id="pdCustDesc">Open the studio and save your design.</p></div></div>
        <div class="pd-actions">
          <button class="pd-customize-btn" id="pdCustomizeBtn" ${outOfStock ? 'disabled' : ''} hidden><span id="pdCustBtnLabel">Open Design Studio</span></button>
          <div class="pd-btn-row"><button class="pd-add-btn" id="pdAddBtn" ${outOfStock ? 'disabled' : ''}>Add to Cart</button><button class="pd-buy-btn" id="pdBuyBtn" ${outOfStock ? 'disabled' : ''}>Buy Now</button></div>
        </div>
        <div class="pd-trust"><span>🚚 Free Shipping</span><span>↩️ Easy Returns</span><span>🔒 Secure Payment</span></div>
        ${details.length ? renderDetails(details) : ''}
      </div>
    </section>
    ${renderRelated(p)}`;
}

function renderColorPicker() {
  const active = state.selectedColor || COLORS[PALETTE_KEYS[0]];
  return `<div class="pd-color-section"><span class="pd-option-label">Color</span>
    <button class="pd-color-trigger" id="pdColorTrigger" type="button" aria-expanded="false">
      <span class="pd-color-dot" id="pdColorDot" style="background:${active}"></span>
      <span id="pdColorName">${getColorName(active)}</span>
    </button>
    <div class="pd-color-panel" id="pdColorPanel" hidden>
      <div class="pd-color-swatches">${PALETTE_KEYS.map((k) => { const hex = COLORS[k]; return `<button class="pd-swatch ${hex.toLowerCase() === active.toLowerCase() ? 'selected' : ''} ${isLightColor(hex) ? 'light' : ''}" data-color="${hex}" data-name="${getColorName(hex)}" style="background:${hex}" type="button" title="${getColorName(hex)}"></button>`; }).join('')}</div>
    </div></div>`;
}

function renderDetails(details) {
  return `<div class="pd-details"><button class="pd-details-toggle" id="pdDetailsToggle" type="button" aria-expanded="true"><span>Product Details</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg></button><dl class="pd-details-list" id="pdDetailsBody">${details.map((d) => `<div class="pd-details-row"><dt>${esc(d.label || d.key || '')}</dt><dd>${esc(d.value || '')}</dd></div>`).join('')}</dl></div>`;
}

function renderRelated(p) {
  const related = state.products.filter((x) => x.category === p.category && x.id !== p.id).slice(0, 4);
  if (!related.length) return '';
  return `<section class="pd-related"><h2>You May Also Like</h2><div class="pd-related-grid">${related.map((r) => `<a class="pd-related-card" href="/product?id=${esc(r.id)}"><img src="${resolveImg(r.imageDefault || r.images?.default || '')}" alt="${esc(r.name)}" loading="lazy" width="273" height="273"><div class="pd-related-body"><span class="pd-related-cat">${esc(r.category)}</span><h3>${esc(r.name)}</h3><span>${money(r.basePrice)}</span></div></a>`).join('')}</div></section>`;
}

function renderError(msg) {
  return `<div class="pd-error"><p>${esc(msg)}</p><a href="/products">Back to Shop</a></div>`;
}

/* ── UI Updates ── */
function updateUI(block) {
  const p = state.product;
  if (!p) return;
  const total = calculateItemPrice(Number(p.basePrice), p.category, state.designRequired);
  const priceEl = block.querySelector('#pdPrice');
  const noteEl = block.querySelector('#pdPriceNote');
  const feeEl = block.querySelector('#pdFee');
  const custCard = block.querySelector('#pdCustCard');
  const custBtn = block.querySelector('#pdCustomizeBtn');
  const addBtn = block.querySelector('#pdAddBtn');
  const buyBtn = block.querySelector('#pdBuyBtn');

  if (priceEl) priceEl.textContent = money(total);
  if (state.designRequired) {
    if (noteEl) noteEl.textContent = 'incl. design fee';
    if (feeEl) feeEl.hidden = false;
    if (custCard) { custCard.hidden = false; updateCustCard(block); }
    if (custBtn) custBtn.hidden = false;
  } else {
    if (noteEl) noteEl.textContent = 'base price';
    if (feeEl) feeEl.hidden = true;
    if (custCard) custCard.hidden = true;
    if (custBtn) custBtn.hidden = true;
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
  const has = !!state.customization;
  const card = block.querySelector('#pdCustCard');
  const icon = block.querySelector('#pdCustIcon');
  const title = block.querySelector('#pdCustTitle');
  const desc = block.querySelector('#pdCustDesc');
  const label = block.querySelector('#pdCustBtnLabel');
  if (!card) return;
  if (has) {
    card.className = 'pd-cust-card ready';
    if (icon) icon.textContent = '✓';
    if (title) title.textContent = 'Design saved — ready to order';
    if (desc) desc.textContent = `Color: ${getColorName(state.customization?.shirtColor)}`;
    if (label) label.textContent = 'Edit Design';
  } else {
    card.className = 'pd-cust-card missing';
    if (icon) icon.textContent = '🎨';
    if (title) title.textContent = 'Design required';
    if (desc) desc.textContent = 'Open the studio and save your design.';
    if (label) label.textContent = 'Open Design Studio';
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
    const now = toggleWishlist({ id: p.id, name: p.name, category: p.category, price: Number(p.basePrice), image: resolveImg(p.imageDefault || p.images?.default || '') });
    const btn = block.querySelector('#pdWishBtn');
    btn.classList.toggle('wishlisted', now);
    const svg = btn.querySelector('path');
    if (svg) { svg.setAttribute('fill', now ? '#e11d48' : 'none'); svg.setAttribute('stroke', now ? '#e11d48' : 'currentColor'); }
  });

  // Color picker
  block.querySelector('#pdColorTrigger')?.addEventListener('click', () => {
    const panel = block.querySelector('#pdColorPanel');
    panel.hidden = !panel.hidden;
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
  });

  // Design toggle
  block.querySelectorAll('input[name="pd-design"]').forEach((r) => {
    r.addEventListener('change', () => { state.designRequired = r.value === 'yes'; updateUI(block); });
  });

  // Customize button
  block.querySelector('#pdCustomizeBtn')?.addEventListener('click', () => {
    const size = block.querySelector('input[name="pd-size"]:checked')?.value || '';
    window.location.href = `/customize?id=${p.id}&size=${encodeURIComponent(size)}`;
  });

  // Details toggle
  block.querySelector('#pdDetailsToggle')?.addEventListener('click', () => {
    const body = block.querySelector('#pdDetailsBody');
    const expanded = block.querySelector('#pdDetailsToggle').getAttribute('aria-expanded') === 'true';
    block.querySelector('#pdDetailsToggle').setAttribute('aria-expanded', String(!expanded));
    body.hidden = expanded;
  });

  // Add to Cart / Buy Now
  block.querySelector('#pdAddBtn')?.addEventListener('click', () => handleAddToCart(block, false));
  block.querySelector('#pdBuyBtn')?.addEventListener('click', () => handleAddToCart(block, true));

  // Listen for design updates
  window.addEventListener('storage', (e) => {
    if (e.key === `designData_${p.id}`) {
      state.customization = loadCustomization(p.id);
      if (state.customization) { state.designRequired = true; setDesignRadio(block, true); }
      updateUI(block);
    }
  });
}

function setDesignRadio(block, yes) {
  block.querySelectorAll('input[name="pd-design"]').forEach((r) => { r.checked = r.value === (yes ? 'yes' : 'no'); });
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
    ? `${p.id}__${size}__${color}__custom`
    : `${p.id}__${size}__${color}__plain`;

  const item = {
    key, id: p.id, name: p.name,
    image: (state.designRequired && state.customization?.previewImage) ? state.customization.previewImage : resolveImg(p.imageDefault || p.images?.default || ''),
    category: p.category, basePrice: Number(p.basePrice), designFee, price: totalPrice,
    color, colorName, size, qty: state.qty,
    customized: state.designRequired, designRequired: state.designRequired,
    customization: state.designRequired ? state.customization : null,
  };

  if (redirect) {
    setCheckoutSession('buy-now', [item]);
    window.location.href = '/checkout';
  } else {
    addToCart(item);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
