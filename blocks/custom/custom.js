/* ==========================================================================
   custom.js
   Product Customizer block for AEM Edge Delivery Services (EDS/AEM Boilerplate)

   Authoring: the "custom" table in da.live can optionally contain rows of
   key/value pairs to override where the product/template JSON files live,
   e.g.

     | custom             |
     | templates | /library/templates.json |
     | products  | /library/products.json  |

   If no rows are present, the defaults below are used.
   ========================================================================== */

import {
  getCart, saveCart, getCartCount, esc, money, CART_UPDATED_EVENT,
} from '../../scripts/cart-utils.js';
import { fetchProducts, normalizeProduct, resolveAssetPath } from '../../scripts/product-data.js';
import {
  isLightColor, formatColorName, getColorKey as lookupColorKey, COLOR_PALETTE,
} from '../../scripts/color-utils.js';

const DEFAULT_TEMPLATES_URL = '/library/templates.json';
const DEFAULT_PRODUCTS_URL = '/library/products.json';

/* ── Color palette (shared full set) ── */
const colorPalette = COLOR_PALETTE;
const PALETTE_KEYS = Object.keys(colorPalette);
const DEFAULT_COLOR = colorPalette[PALETTE_KEYS[0]];

const CATEGORY_CONFIG = {
  tshirt: {
    label: 'T-Shirt', sides: ['front', 'back'], defaultSide: 'front', stageW: 300, stageH: 340, productShape: 'shirt', showColor: true,
  },
  diary: {
    label: 'Diary', sides: ['front', 'back'], defaultSide: 'front', stageW: 300, stageH: 360, productShape: 'rectBook', showColor: true,
  },
  bottle: {
    label: 'Bottle', sides: ['wrap'], defaultSide: 'wrap', stageW: 280, stageH: 360, productShape: 'rectLabel', showColor: true,
  },
  cup: {
    label: 'Cup', sides: ['wrap'], defaultSide: 'wrap', stageW: 280, stageH: 240, productShape: 'rectLabel', showColor: true,
  },
  default: {
    label: 'Product', sides: ['wrap'], defaultSide: 'wrap', stageW: 280, stageH: 320, productShape: 'rectLabel', showColor: true,
  },
};

const DESIGN_FEES = {
  Tshirt: 199, Diary: 149, Bottle: 149, Cup: 99,
};
const MAX_UPLOAD_BYTES = 50 * 1024; // 50 KB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const FORMAT_LABEL = 'JPG, PNG, or WEBP';

// getColorKey/formatColorName/isLightColor live in scripts/color-utils.js.
// Bind the customizer's own palette so existing call sites stay unchanged.
function getColorKey(hex) {
  return lookupColorKey(hex, colorPalette);
}

function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/* Reads optional key/value config rows authored under the "custom" block */
function readBlockConfig(block) {
  const cfg = {};
  [...block.children].forEach((row) => {
    const cells = [...row.children];
    if (cells.length >= 2) {
      const key = cells[0].textContent.trim().toLowerCase();
      const value = cells[1].textContent.trim();
      if (key) cfg[key] = value;
    }
  });
  return cfg;
}

const APP_MARKUP = `
<div class="custom-app">
  <header id="topbar">
    <div class="topbar-left">
      <button class="btn btn-sm" id="back-btn" type="button">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="15 18 9 12 15 6" /></svg>
        <span>Back to Product</span>
      </button>
      <span id="product-name">Loading&#x2026;</span>
      <span class="topbar-badge" id="category-badge"></span>
      <span class="unsaved-dot" id="unsaved-dot"></span>
    </div>
    <div class="topbar-right">
      <button class="btn btn-sm btn-danger" id="reset-all-btn" type="button" title="Reset all designs">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" /><path d="M3 3v5h5" /></svg>
        <span>Reset All</span>
      </button>
      <button class="btn btn-sm" id="clear-side-btn" type="button" title="Clear current side"><span>Clear Side</span></button>
      <button class="btn btn-sm topbar-save-btn" id="topbar-save-btn" type="button" title="Save design">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
        <span>Save</span>
      </button>
      <button class="btn btn-sm" id="tb-cart" type="button" title="Add to cart" style="position:relative;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M14 2C14 1.44772 13.5523 1 13 1C12.4477 1 12 1.44772 12 2V8.58579L9.70711 6.29289C9.31658 5.90237 8.68342 5.90237 8.29289 6.29289C7.90237 6.68342 7.90237 7.31658 8.29289 7.70711L12.2929 11.7071C12.6834 12.0976 13.3166 12.0976 13.7071 11.7071L17.7071 7.70711C18.0976 7.31658 18.0976 6.68342 17.7071 6.29289C17.3166 5.90237 16.6834 5.90237 16.2929 6.29289L14 8.58579V2ZM1 3C1 2.44772 1.44772 2 2 2H2.47241C3.82526 2 5.01074 2.90547 5.3667 4.21065L5.78295 5.73688L7.7638 13H18.236L20.2152 5.73709C20.3604 5.20423 20.9101 4.88998 21.4429 5.03518C21.9758 5.18038 22.29 5.73006 22.1448 6.26291L20.1657 13.5258C19.9285 14.3962 19.1381 15 18.236 15H8V16C8 16.5523 8.44772 17 9 17H16.5H18C18.5523 17 19 17.4477 19 18C19 18.212 18.934 18.4086 18.8215 18.5704C18.9366 18.8578 19 19.1715 19 19.5C19 20.8807 17.8807 22 16.5 22C15.1193 22 14 20.8807 14 19.5C14 19.3288 14.0172 19.1616 14.05 19H10.95C10.9828 19.1616 11 19.3288 11 19.5C11 20.8807 9.88071 22 8.5 22C7.11929 22 6 20.8807 6 19.5C6 18.863 6.23824 18.2816 6.63048 17.8402C6.23533 17.3321 6 16.6935 6 16V14.1339L3.85342 6.26312L3.43717 4.73688C3.31852 4.30182 2.92336 4 2.47241 4H2C1.44772 4 1 3.55228 1 3ZM16 19.5C16 19.2239 16.2239 19 16.5 19C16.7761 19 17 19.2239 17 19.5C17 19.7761 16.7761 20 16.5 20C16.2239 20 16 19.7761 16 19.5ZM8 19.5C8 19.2239 8.22386 19 8.5 19C8.77614 19 9 19.2239 9 19.5C9 19.7761 8.77614 20 8.5 20C8.22386 20 8 19.7761 8 19.5Z" fill="currentColor"/></svg>
        <span>Cart</span>
        <span class="tb-cart-badge" id="tb-cart-badge" style="display:none;">0</span>
      </button>
    </div>
  </header>

  <aside id="sidebar">
    <div id="side-tabs-wrap"></div>
    <div class="info-banner" id="info-banner">Loading product settings&#x2026;</div>

    <div class="panel-section" id="panel-color" style="display:none">
      <div class="panel-toggle" data-panel="color">
        <span class="panel-toggle-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10" /><path d="M8 12h8M12 8v8" /></svg>
          Product color
        </span>
        <span class="panel-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
      </div>
      <div class="panel-body" id="body-color">
        <div class="field">
          <div id="color-name-chip"><span class="chip-dot" id="chip-dot"></span><span id="chip-label">&#x2014;</span></div>
          <div class="color-swatches" id="preset-swatches" style="margin-top:8px;"></div>
        </div>
      </div>
    </div>

    <div class="panel-section" id="panel-design">
      <div class="panel-toggle" data-panel="design">
        <span class="panel-toggle-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" /></svg>
          Design &amp; Templates
          <span class="pill" id="tpl-count-pill">0</span>
        </span>
        <span class="panel-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
      </div>
      <div class="panel-body" id="body-design">
        <div class="field">
          <span class="field-label">Upload your image</span>
          <label class="upload-area" id="upload-area" tabindex="0" role="button" aria-label="Upload image" aria-describedby="upload-error-text">
            <input type="file" id="img-upload" accept="image/png,image/jpeg,image/webp" style="display:none">
            <div class="upload-area__idle" id="upload-idle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
              <span>Click or drag to upload</span>
              <span class="upload-area__hint">JPG, PNG, WEBP &middot; Max 50 KB</span>
            </div>
            <div class="upload-area__loading" id="upload-loading" style="display:none">
              <div class="upload-spinner" aria-hidden="true"></div>
              <span>Processing image&hellip;</span>
            </div>
            <div class="upload-area__preview" id="upload-preview" style="display:none">
              <img id="upload-thumb" src="" alt="Uploaded image preview">
              <button class="upload-area__remove" id="upload-remove" type="button" title="Remove uploaded image" aria-label="Remove uploaded image">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
              <span class="upload-area__name" id="upload-name"></span>
            </div>
          </label>
          <div class="upload-error" id="upload-error" role="alert" aria-live="assertive" aria-atomic="true">
            <svg class="upload-error__icon" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10A8 8 0 1 1 2 10a8 8 0 0 1 16 0zm-7-4a1 1 0 1 1 2 0v4a1 1 0 1 1-2 0V6zm1 8a1.25 1.25 0 1 0 0-2.5A1.25 1.25 0 0 0 12 14z" clip-rule="evenodd" /></svg>
            <span class="upload-error__text" id="upload-error-text"><strong class="upload-error__title" id="upload-error-title"></strong><span class="upload-error__detail" id="upload-error-detail"></span></span>
          </div>
        </div>

        <div class="upload-divider"><span>or choose a template</span></div>
        <div class="tpl-grid" id="tpl-grid"></div>

        <div class="sel-box" id="design-sel-box"><strong>No design selected</strong><br>Upload an image or pick a template above.</div>

        <div style="display:flex;gap:6px;">
          <button class="btn btn-sm" style="flex:1" id="center-design-btn" type="button">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="2" x2="12" y2="22" /><line x1="2" y1="12" x2="22" y2="12" /></svg>
            Center
          </button>
          <button class="btn btn-sm btn-danger" id="remove-design-btn" type="button">Remove</button>
        </div>
      </div>
    </div>

    <div class="panel-section" id="panel-text">
      <div class="panel-toggle" data-panel="text">
        <span class="panel-toggle-label">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" /></svg>
          Text
        </span>
        <span class="panel-chevron"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9" /></svg></span>
      </div>
      <div class="panel-body" id="body-text">
        <div class="field">
          <label class="field-label" for="txt-content">Content</label>
          <textarea id="txt-content" rows="2" placeholder="Your text&#x2026;">YOUR TEXT</textarea>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="txt-font">Font</label>
            <select id="txt-font"><option value="'Inter', sans-serif">Inter</option><option value="'Lato', sans-serif">Lato</option></select>
          </div>
          <div class="field">
            <label class="field-label" for="txt-weight">Weight</label>
            <select id="txt-weight"><option value="400" selected>Regular</option><option value="600">Semibold</option><option value="700">Bold</option></select>
          </div>
        </div>
        <div class="field-row">
          <div class="field">
            <label class="field-label" for="txt-size">Size (px)</label>
            <input type="number" id="txt-size" value="36" min="8" max="120">
          </div>
          <div class="field">
            <label class="field-label" for="txt-width">Width (px)</label>
            <input type="number" id="txt-width" value="160" min="40" max="320">
          </div>
        </div>
        <div class="field">
          <span class="field-label">Alignment</span>
          <div class="align-row">
            <button class="align-btn active" id="al-left" data-align="left" type="button">Left</button>
            <button class="align-btn" id="al-center" data-align="center" type="button">Center</button>
            <button class="align-btn" id="al-right" data-align="right" type="button">Right</button>
          </div>
        </div>
        <div class="field">
          <span class="field-label">Curve <strong id="curve-val" style="color:var(--ink);margin-left:4px;">0&#xB0;</strong></span>
          <input type="range" id="txt-curve" min="-60" max="60" value="0" step="1">
          <div class="range-labels"><span>Arch &#x2193;</span><span>Flat</span><span>Arch &#x2191;</span></div>
        </div>
        <div class="field">
          <span class="field-label">Color</span>
          <div class="color-field"><input type="color" id="txt-color" value="#FFFFFF"><span style="font-size:11px;color:var(--ink-3);">Text color</span></div>
        </div>
        <div class="sel-box" id="text-sel-box"><strong>No text selected</strong><br>Add text then click a layer to edit it.</div>
        <div style="display:flex;gap:6px;align-items:stretch;">
          <button class="btn-add-text" id="add-text-btn" type="button"><span class="at-icon">+</span><span class="at-label">Add Text to Canvas</span></button>
          <button class="btn btn-sm btn-danger" id="remove-text-btn" type="button" style="flex-shrink:0;">Remove</button>
        </div>
      </div>
    </div>
  </aside>

  <main id="canvas-wrap">
    <div id="canvas-toolbar">
      <div class="toolbar-cluster"><span id="side-label" style="font-size:12px;color:var(--ink-3);">Editing <strong style="color:var(--ink);">front</strong></span></div>
      <div class="toolbar-cluster">
        <button class="btn btn-xs" id="tb-center-x" type="button" title="Center horizontally">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="2" x2="12" y2="22" /></svg>
          Center X
        </button>
        <button class="btn btn-xs" id="tb-center-y" type="button" title="Center vertically">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="2" y1="12" x2="22" y2="12" /></svg>
          Center Y
        </button>
      </div>
    </div>
    <div id="canvas-stage-area">
      <div id="stage">
        <svg id="stage-svg" viewBox="0 0 300 340" xmlns="http://www.w3.org/2000/svg"></svg>
        <div id="overlay"></div>
      </div>
    </div>
  </main>

  <div id="save-bar">
    <button class="btn btn-accent btn-sm" style="flex:1" id="save-btn" type="button">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
      Save Design
    </button>
  </div>

  <div id="statusbar">
    <div style="display:flex;align-items:center;gap:6px;"><span id="status-dot"></span><span id="status-msg">Loading&#x2026;</span></div>
    <span id="layer-info" style="color:var(--ink-4);"></span>
  </div>

  <div class="purchase-float" id="purchaseFloat">
    <div class="purchase-float__row"><span class="purchase-float__label">Total</span><span class="purchase-float__price" id="cs-total-price">—</span></div>
    <span class="purchase-float__sub" id="cs-price-breakdown"></span>
    <span class="purchase-float__cta">View Options &amp; Checkout &#x2192;</span>
  </div>

  <div class="purchase-drawer-overlay" id="purchaseDrawerOverlay"></div>
  <aside class="purchase-drawer" id="purchaseDrawer">
    <div class="purchase-drawer__header">
      <h3>Your Order</h3>
      <button class="btn btn-sm btn-icon" id="purchase-drawer-close" type="button" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="purchase-drawer__body" id="body-purchase">
      <div class="purchase-drawer__card">
        <h4>Product Options</h4>
        <div class="field"><span class="field-label">Size</span><select id="cs-size-select" style="width:100%"></select></div>
        <div class="field">
          <span class="field-label">Quantity</span>
          <div class="cs-qty-row">
            <button class="btn btn-sm btn-icon" id="cs-qty-minus" type="button">&minus;</button>
            <span class="cs-qty-val" id="cs-qty-val">1</span>
            <button class="btn btn-sm btn-icon" id="cs-qty-plus" type="button">+</button>
          </div>
        </div>
      </div>
      <div class="purchase-drawer__card">
        <h4>Price Details</h4>
        <div class="purchase-drawer__price-row"><span>Base Price</span><span id="cs-base-price">—</span></div>
        <div class="purchase-drawer__price-row"><span>Customization Fee</span><span id="cs-design-fee">—</span></div>
        <div class="purchase-drawer__price-row"><span>Quantity</span><span id="cs-qty-display">&times;1</span></div>
        <div class="purchase-drawer__divider"></div>
        <div class="purchase-drawer__price-row purchase-drawer__price-total"><span>Total</span><span id="cs-drawer-total">—</span></div>
      </div>
      <div class="purchase-drawer__card purchase-drawer__trust">
        <div>&#x2713; High Quality Printing</div>
        <div>&#x2713; Secure Payment</div>
        <div>&#x2713; Easy Returns</div>
      </div>
      <button class="btn btn-accent btn-full" id="cs-add-to-cart" type="button" style="padding:14px 20px;font-size:14px;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
        Add to Cart
      </button>
    </div>
  </aside>

  <div class="modal-backdrop" id="back-modal">
    <div class="modal-card">
      <div class="modal-icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><circle cx="12" cy="12" r="10" fill="#FEF3C7" stroke="#F59E0B" stroke-width="1.5" /><path d="M12 7V13" stroke="#D97706" stroke-width="2" stroke-linecap="round" /><circle cx="12" cy="17" r="1.3" fill="#D97706" /></svg>
      </div>
      <div class="modal-title">Unsaved design</div>
      <div class="modal-body">You have unsaved changes. If you leave now, your design will be lost.</div>
      <div class="modal-actions">
        <button class="btn btn-sm" id="modal-card-close" type="button">X</button>
        <button class="btn btn-sm btn-danger" id="leave-anyway-btn" type="button">Leave anyway</button>
        <button class="btn btn-sm btn-accent" id="save-and-back-btn" type="button">Save &amp; go back</button>
      </div>
    </div>
  </div>

  <div class="modal-backdrop" id="reset-modal">
    <div class="modal-card">
      <div class="modal-icon danger">&#x1F5D1;&#xFE0F;</div>
      <div class="modal-title">Reset all designs?</div>
      <div class="modal-body">This will clear <strong>all layers on every side</strong> (front, back &amp; wrap) and start fresh. This cannot be undone.</div>
      <div class="modal-actions">
        <button class="btn btn-sm" id="reset-cancel-btn" type="button">Cancel</button>
        <button class="btn btn-sm btn-danger" id="reset-confirm-btn" type="button">Yes, reset everything</button>
      </div>
    </div>
  </div>

  <div class="toast" id="toast"></div>
  <div class="cs-tooltip" id="cs-tooltip"></div>
  <canvas id="snapshot-canvas" style="display:none;"></canvas>

  <div class="modal-backdrop" id="cart-modal">
    <div class="modal-card" style="position:relative;">
      <button class="cart-modal-close" id="cart-modal-close-btn" type="button" aria-label="Close">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
      <div class="modal-icon" style="background:#dcfce7;">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#10B981" stroke-width="2" stroke-linecap="round"><path d="M20 6L9 17l-5-5"/></svg>
      </div>
      <div class="modal-title">Added to cart!</div>
      <div class="modal-body" id="cart-modal-body">Your customized product has been added to your cart.</div>
      <div class="modal-actions" style="flex-direction:column;gap:8px;">
        <button class="btn btn-sm btn-accent" style="width:100%;justify-content:center;" id="cart-modal-go-product">Go to Product</button>
        <a href="/cart" class="btn btn-sm" style="width:100%;justify-content:center;text-decoration:none;gap:6px;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          Go to Cart
          <svg class="cart-modal-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
        </a>
      </div>
    </div>
  </div>
</div>`;

export default function decorate(block) {
  const blockCfg = readBlockConfig(block);
  const TEMPLATE_JSON_URL = blockCfg.templates || DEFAULT_TEMPLATES_URL;
  const PRODUCTS_JSON_URL = blockCfg.products || DEFAULT_PRODUCTS_URL;

  block.textContent = '';
  block.innerHTML = APP_MARKUP;

  const $ = (sel, root = block) => root.querySelector(sel);
  const $$ = (sel, root = block) => [...root.querySelectorAll(sel)];

  const state = {
    product: null,
    category: 'default',
    side: 'front',
    shirtColor: DEFAULT_COLOR,
    front: [],
    back: [],
    wrap: [],
    sel: null,
    nid: 1,
    saved: true,
    templates: [],
    templatesToShow: [],
    _colorInitialized: false,
  };

  function getCfg() { return CATEGORY_CONFIG[state.category] || CATEGORY_CONFIG.default; }
  function layers() { return state[state.side] || []; }
  function stageSize() { const c = getCfg(); return { w: c.stageW, h: c.stageH }; }

  function setStatus(msg, type = 'idle') {
    const dot = $('#status-dot');
    const txt = $('#status-msg');
    if (txt) txt.textContent = msg;
    if (dot) dot.className = type === 'success' ? 'active' : type === 'warning' ? 'warning' : '';
  }

  let toastTimer;
  function showToast(msg) {
    const t = $('#toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  }

  function markDirty() {
    state.saved = false;
    const d = $('#unsaved-dot');
    if (d) d.classList.add('show');
  }
  function markSaved() {
    state.saved = true;
    const d = $('#unsaved-dot');
    if (d) d.classList.remove('show');
  }
  function setLayerInfo() {
    const n = layers().length;
    $('#layer-info').textContent = n ? `${n} layer${n !== 1 ? 's' : ''}` : '';
  }
  function togglePanel(key) { const s = $(`#panel-${key}`); if (s) s.classList.toggle('open'); }
  function openPanel(key) { const s = $(`#panel-${key}`); if (s && !s.classList.contains('open')) s.classList.add('open'); }

  function buildSideTabs() {
    const cfg = getCfg();
    const wrap = $('#side-tabs-wrap');
    if (!wrap) return;
    if (cfg.sides.length <= 1) { wrap.innerHTML = ''; return; }
    wrap.innerHTML = `<div class="side-tabs">${cfg.sides.map((s) => `<button class="side-tab${state.side === s ? ' active' : ''}" data-side="${s}" type="button">${s === 'wrap' ? 'Wrap' : s.charAt(0).toUpperCase() + s.slice(1)}</button>`).join('')}</div>`;
    $$('.side-tab', wrap).forEach((btn) => btn.addEventListener('click', () => switchSide(btn.dataset.side)));
  }

  function switchSide(side) {
    if (!getCfg().sides.includes(side)) return;
    state.side = side;
    state.sel = null;
    buildSideTabs();
    const lbl = $('#side-label');
    if (lbl) lbl.innerHTML = `Editing <strong>${side}</strong>`;
    resetSelBoxes();
    renderAll();
    setStatus(`Switched to ${side} side.`);
  }

  const tipEl = $('#cs-tooltip');
  function showTip(text, x, y) {
    tipEl.textContent = text;
    tipEl.style.left = `${x}px`;
    tipEl.style.top = `${y}px`;
    tipEl.classList.add('show');
  }
  function hideTip() { tipEl.classList.remove('show'); }

  function updateColorChip(hex) {
    const key = getColorKey(hex);
    const name = key ? formatColorName(key) : hex;
    const dot = $('#chip-dot');
    const lbl = $('#chip-label');
    if (dot) dot.style.background = hex;
    if (lbl) lbl.textContent = name;
  }

  function buildSwatches() {
    const cfg = getCfg();
    const colorPanel = $('#panel-color');
    if (!colorPanel) return;
    if (!cfg.showColor) { colorPanel.style.display = 'none'; return; }
    colorPanel.style.display = '';
    const wrap = $('#preset-swatches');
    if (!wrap) return;
    wrap.innerHTML = '';
    if (!state._colorInitialized) { state.shirtColor = DEFAULT_COLOR; state._colorInitialized = true; }
    PALETTE_KEYS.forEach((key) => {
      const hex = colorPalette[key];
      const b = document.createElement('button');
      b.className = `cs${hex.toLowerCase() === state.shirtColor.toLowerCase() ? ' sel' : ''}${isLightColor(hex) ? ' light' : ''}`;
      b.type = 'button';
      b.style.background = hex;
      b.dataset.c = hex;
      b.dataset.name = formatColorName(key);
      b.title = formatColorName(key);
      b.addEventListener('mouseenter', () => { const r = b.getBoundingClientRect(); showTip(b.dataset.name, r.left + r.width / 2, r.top - 2); });
      b.addEventListener('mouseleave', hideTip);
      b.addEventListener('focus', () => { const r = b.getBoundingClientRect(); showTip(b.dataset.name, r.left + r.width / 2, r.top - 2); });
      b.addEventListener('blur', hideTip);
      b.addEventListener('click', () => setShirtColor(hex));
      wrap.appendChild(b);
    });
    updateColorChip(state.shirtColor);
  }

  function setShirtColor(v) {
    if (!/^#[0-9a-fA-F]{3,6}$/.test(v)) return;
    markDirty();
    state.shirtColor = v;
    $$('.cs').forEach((s) => s.classList.toggle('sel', s.dataset.c.toLowerCase() === v.toLowerCase()));
    updateColorChip(v);
    renderStage();
    setStatus('Product color updated.', 'success');
  }

  function shirtSVGInner(w, h, c) {
    return `<path d="M55,28 L18,75 L56,94 L52,308 L248,308 L244,94 L282,75 L245,28 Q226,13 208,19 Q190,47 150,52 Q110,47 92,19 Q74,13 55,28 Z" fill="${c}" stroke="black" stroke-width="2"/><path d="M55,28 Q74,13 92,19 Q110,47 150,52 Q190,47 208,19 Q226,13 245,28" fill="none" stroke="black" stroke-width="2"/>`;
  }
  function rectSVGInner(w, h, c) {
    return `<rect x="24" y="18" rx="22" ry="22" width="${w - 48}" height="${h - 36}" fill="${c}" stroke="black" stroke-width="2"/><rect x="38" y="32" rx="14" ry="14" width="${w - 76}" height="${h - 64}" fill="none" stroke="black" stroke-width="2" stroke-dasharray="5 4"/>`;
  }
  function bookSVGInner(w, h, c) {
    return `<rect x="28" y="16" rx="20" ry="20" width="${w - 56}" height="${h - 32}" fill="${c}" stroke="black" stroke-width="2"/><rect x="44" y="30" rx="12" ry="12" width="${w - 88}" height="${h - 60}" fill="none" stroke="black" stroke-width="2"/>`;
  }
  function productShapeInner(shape, w, h, c) {
    if (shape === 'shirt') return shirtSVGInner(w, h, c);
    if (shape === 'rectBook') return bookSVGInner(w, h, c);
    return rectSVGInner(w, h, c);
  }
  function productShapeSvg(shape, w, h, c) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">${productShapeInner(shape, w, h, c)}</svg>`;
  }

  function renderStage() {
    const cfg = getCfg();
    const stage = $('#stage');
    const svg = $('#stage-svg');
    if (!stage || !svg) return;
    const areaEl = $('#canvas-stage-area');
    if (areaEl) {
      const areaStyle = getComputedStyle(areaEl);
      const padX = parseFloat(areaStyle.paddingLeft) + parseFloat(areaStyle.paddingRight);
      const padY = parseFloat(areaStyle.paddingTop) + parseFloat(areaStyle.paddingBottom);
      const aW = areaEl.clientWidth - padX;
      const aH = areaEl.clientHeight - padY;
      const scale = Math.min(1, aW / cfg.stageW, aH / cfg.stageH);
      stage.style.width = `${cfg.stageW}px`;
      stage.style.height = `${cfg.stageH}px`;
      stage.style.transform = `scale(${scale})`;
      stage.style.transformOrigin = 'center center';
    } else {
      stage.style.width = `${cfg.stageW}px`;
      stage.style.height = `${cfg.stageH}px`;
    }
    svg.setAttribute('viewBox', `0 0 ${cfg.stageW} ${cfg.stageH}`);
    svg.innerHTML = productShapeInner(cfg.productShape, cfg.stageW, cfg.stageH, state.shirtColor);
  }

  async function loadTemplates() {
    try {
      const res = await fetch(TEMPLATE_JSON_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.data || data.templates || []);
      state.templates = list.map((t) => ({ ...t, file: resolveAssetPath(t.file) }));
    } catch (e) {
      state.templates = [];
    }
  }

  function renderTemplates() {
    const grid = $('#tpl-grid');
    const pill = $('#tpl-count-pill');
    if (!grid) return;
    const matching = state.templates.filter((t) => String(t.category || '').toLowerCase() === state.category);
    state.templatesToShow = matching;
    if (pill) pill.textContent = matching.length;
    grid.innerHTML = '';
    if (!matching.length) {
      grid.innerHTML = '<div class="empty-state" style="grid-column:1/-1"><div class="icon">🎨</div>No templates for this category.</div>';
      return;
    }
    matching.forEach((t, i) => {
      const b = document.createElement('button');
      b.className = 'tpl-btn';
      b.type = 'button';
      b.dataset.index = i;
      b.title = t.name || 'Template';
      b.innerHTML = `<img class="tpl-thumb" src="${esc(t.file)}" alt="${esc(t.name || 'Template')}" loading="lazy"><div class="tpl-name">${esc(t.name || 'Template')}</div>`;
      b.addEventListener('click', () => applyTemplate(t));
      grid.appendChild(b);
    });
  }

  function applyTemplate(tpl) {
    markDirty();
    state[state.side] = state[state.side].filter((l) => l.type !== 'image');
    state.sel = null;
    clearUploadUI(true);
    const s = stageSize();
    const size = Math.min(s.w, s.h) * 0.55;
    const layer = {
      id: state.nid++,
      type: 'image',
      _uploaded: false,
      x: Math.round((s.w - size) / 2),
      y: Math.round((s.h - size) / 2),
      w: size,
      h: size,
      src: tpl.file,
      name: tpl.name || 'Template',
    };
    layers().push(layer);
    renderAll();
    selectLayer(layer.id);
    setStatus(`Template "${tpl.name || 'Template'}" applied.`, 'success');
  }

  function refreshTemplateHighlight() {
    const selected = layers().find((l) => l.type === 'image' && !l._uploaded);
    $$('.tpl-btn').forEach((btn) => {
      const idx = Number(btn.dataset.index);
      const tpl = state.templatesToShow[idx];
      btn.classList.toggle('active', !!selected && !!tpl && selected.src === tpl.file);
    });
  }

  function makeCurvedTextSVG(layer) {
    const text = layer.text || '';
    const curve = layer.curve || 0;
    const fs = layer.fontSize || 30;
    const fw = layer.fontWeight || '400';
    const ff = layer.fontFamily || "'Inter', sans-serif";
    const col = layer.textColor || '#fff';
    const ta = layer.textAlign || 'center';
    const lw = layer.w || 160;

    if (curve === 0) {
      const lines = text.split('\n');
      const lineH = fs * 1.3;
      const totalH = lines.length * lineH;
      const svgH = Math.max(totalH + fs * 0.7, 40);
      const startY = (svgH - totalH) / 2 + fs * 0.78;
      const svgLines = lines.map((line, i) => {
        const ax = ta === 'left' ? 4 : ta === 'right' ? lw - 4 : lw / 2;
        const anchor = ta === 'left' ? 'start' : ta === 'right' ? 'end' : 'middle';
        return `<text x="${ax}" y="${startY + i * lineH}" text-anchor="${anchor}" fill="${col}" font-size="${fs}" font-weight="${fw}" font-family="${ff}">${esc(line)}</text>`;
      }).join('');
      return `<svg xmlns="http://www.w3.org/2000/svg" width="${lw}" height="${svgH}" viewBox="0 0 ${lw} ${svgH}">${svgLines}</svg>`;
    }

    const absCurve = Math.abs(curve);
    const radius = Math.max(lw * 0.5, (lw * 55) / absCurve);
    const halfAngle = Math.asin(Math.min(0.97, (lw * 0.44) / radius));
    const sagitta = radius - radius * Math.cos(halfAngle);
    const svgH = Math.max(sagitta + fs * 2.0, fs * 2.4);
    const svgW = lw;
    const pid = `cp${layer.id}_${(Math.random() * 1e6) | 0}`;
    let pathD;
    if (curve > 0) {
      const cx = svgW / 2;
      const cy = svgH + radius - sagitta - fs * 0.5;
      const sa = Math.PI / 2 + halfAngle;
      const ea = Math.PI / 2 - halfAngle;
      const sx = cx + radius * Math.cos(sa);
      const sy = cy - radius * Math.sin(sa);
      const ex = cx + radius * Math.cos(ea);
      const ey = cy - radius * Math.sin(ea);
      pathD = `M ${sx},${sy} A ${radius},${radius} 0 0,1 ${ex},${ey}`;
    } else {
      const cx = svgW / 2;
      const cy = -(radius - sagitta) + fs * 0.5;
      const sa = Math.PI / 2 + halfAngle;
      const ea = Math.PI / 2 - halfAngle;
      const sx = cx - radius * Math.cos(ea);
      const sy = cy + radius * Math.sin(ea);
      const ex = cx - radius * Math.cos(sa);
      const ey = cy + radius * Math.sin(sa);
      pathD = `M ${sx},${sy} A ${radius},${radius} 0 0,0 ${ex},${ey}`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}"><defs><path id="${pid}" d="${pathD}"/></defs><text font-size="${fs}" font-weight="${fw}" font-family="${ff}" fill="${col}"><textPath href="#${pid}" startOffset="50%" text-anchor="middle">${esc(text.replace(/\n/g, ' '))}</textPath></text></svg>`;
  }

  function renderLayer(layer) {
    const ov = $('#overlay');
    if (!ov) return;
    let el = $(`#lo-${layer.id}`);
    if (!el) {
      el = document.createElement('div');
      el.className = 'lobj';
      el.id = `lo-${layer.id}`;
      const frame = document.createElement('div');
      frame.className = 'lframe';
      el.appendChild(frame);
      const rh = document.createElement('div');
      rh.className = 'resize-handle';
      el.appendChild(rh);
      ov.appendChild(el);
      setupDrag(el, layer);
      setupResize(rh, layer);
      el.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.resize-handle')) return;
        e.stopPropagation();
        selectLayer(layer.id);
      });
    }
    el.style.left = `${layer.x}px`;
    el.style.top = `${layer.y}px`;
    el.style.width = `${layer.w}px`;
    el.style.height = `${layer.h}px`;
    el.classList.toggle('sel', state.sel === layer.id);
    const frame = el.querySelector('.lframe');
    if (layer.type === 'image') {
      const existing = frame.querySelector('img');
      if (!existing || existing.src !== layer.src) {
        frame.innerHTML = '';
        const img = document.createElement('img');
        img.src = layer.src;
        img.alt = layer.name || 'Design';
        frame.appendChild(img);
      }
    } else if (layer.type === 'text') {
      const svgStr = makeCurvedTextSVG(layer);
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const prev = frame.querySelector('img');
      if (prev && prev.src.startsWith('blob:')) URL.revokeObjectURL(prev.src);
      frame.innerHTML = '';
      const img = document.createElement('img');
      img.src = url;
      img.alt = 'Text layer';
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;';
      frame.appendChild(img);
    }
  }

  function renderAll() {
    const ov = $('#overlay');
    if (!ov) return;
    const ids = new Set(layers().map((l) => `lo-${l.id}`));
    [...ov.children].forEach((el) => { if (!ids.has(el.id)) el.remove(); });
    layers().forEach(renderLayer);
    setLayerInfo();
    refreshSelBoxes();
    refreshTemplateHighlight();
    updateToolbarState();
  }

  block.addEventListener('pointerdown', (e) => {
    const stage = $('#stage');
    if (stage && stage.contains(e.target) && !e.target.closest('.lobj')) {
      if (state.sel !== null) { state.sel = null; renderAll(); resetSelBoxes(); setStatus(''); }
    }
  });

  function selectLayer(id) {
    state.sel = id;
    const layer = layers().find((l) => l.id === id);
    if (layer && layer.type === 'text') { populateTextControls(layer); openPanel('text'); } else if (layer && layer.type === 'image') { openPanel('design'); }
    renderAll();
    setStatus(layer ? `${layer.type === 'text' ? 'Text' : 'Design'} layer selected — drag to move, corner to resize.` : '', 'idle');
  }

  function populateTextControls(layer) {
    $('#txt-content').value = layer.text || '';
    $('#txt-font').value = layer.fontFamily || "'Inter', sans-serif";
    $('#txt-weight').value = layer.fontWeight || '400';
    $('#txt-size').value = layer.fontSize || 36;
    $('#txt-width').value = layer.w || 160;
    $('#txt-color').value = layer.textColor || '#FFFFFF';
    $('#txt-curve').value = layer.curve || 0;
    $('#curve-val').textContent = `${layer.curve || 0}°`;
    setTextAlignUI(layer.textAlign || 'center');
  }

  function refreshSelBoxes() {
    const layer = layers().find((l) => l.id === state.sel);
    const dbox = $('#design-sel-box');
    const tbox = $('#text-sel-box');
    if (!layer) { resetSelBoxes(); return; }
    if (layer.type === 'image') {
      dbox.className = 'sel-box active';
      dbox.innerHTML = `<strong>${esc(layer.name || 'Design')}</strong><br>Selected. Drag to reposition, corner to resize.`;
      tbox.className = 'sel-box';
      tbox.innerHTML = '<strong>No text selected</strong><br>Click a text layer to edit it.';
    } else if (layer.type === 'text') {
      tbox.className = 'sel-box active';
      const preview = (layer.text || '').slice(0, 24);
      tbox.innerHTML = `<strong>Text layer</strong> — ${esc(preview)}${layer.text.length > 24 ? '&#x2026;' : ''}<br>Editing in the panel above.`;
      dbox.className = 'sel-box';
      dbox.innerHTML = '<strong>No design selected</strong><br>Click a design layer to select it.';
    }
  }

  function resetSelBoxes() {
    const dbox = $('#design-sel-box');
    const tbox = $('#text-sel-box');
    if (dbox) { dbox.className = 'sel-box'; dbox.innerHTML = '<strong>No design selected</strong><br>Upload an image or pick a template.'; }
    if (tbox) { tbox.className = 'sel-box'; tbox.innerHTML = '<strong>No text selected</strong><br>Add text then click a layer to edit it.'; }
  }

  function setTextAlignUI(a) { ['left', 'center', 'right'].forEach((v) => $(`#al-${v}`).classList.toggle('active', v === a)); }
  function setTextAlign(a) {
    markDirty();
    setTextAlignUI(a);
    const layer = layers().find((l) => l.id === state.sel && l.type === 'text');
    if (layer) { layer.textAlign = a; renderLayer(layer); }
  }

  function syncTextSel() {
    markDirty();
    const layer = layers().find((l) => l.id === state.sel && l.type === 'text');
    if (!layer) return;
    layer.text = $('#txt-content').value;
    layer.fontFamily = $('#txt-font').value;
    layer.fontWeight = $('#txt-weight').value;
    layer.fontSize = parseInt($('#txt-size').value, 10) || 30;
    layer.w = parseInt($('#txt-width').value, 10) || 160;
    layer.textColor = $('#txt-color').value;
    layer.curve = parseInt($('#txt-curve').value, 10) || 0;
    layer.textAlign = ['left', 'center', 'right'].find((v) => $(`#al-${v}`).classList.contains('active')) || 'center';
    renderLayer(layer);
  }

  function addTextLayer() {
    markDirty();
    const s = stageSize();
    const id = state.nid++;
    const layer = {
      id,
      type: 'text',
      x: Math.round(s.w * 0.2),
      y: Math.round(s.h * 0.4),
      w: parseInt($('#txt-width').value, 10) || 160,
      h: 64,
      text: $('#txt-content').value || 'YOUR TEXT',
      fontFamily: $('#txt-font').value,
      fontWeight: $('#txt-weight').value,
      fontSize: parseInt($('#txt-size').value, 10) || 36,
      textColor: $('#txt-color').value,
      textAlign: ['left', 'center', 'right'].find((v) => $(`#al-${v}`).classList.contains('active')) || 'center',
      curve: parseInt($('#txt-curve').value, 10) || 0,
    };
    layers().push(layer);
    renderAll();
    selectLayer(id);
    setStatus('Text layer added.', 'success');
  }

  function removeSel(fallback) {
    const idx = layers().findIndex((l) => l.id === state.sel);
    if (idx < 0) {
      setStatus(fallback === 'text' ? 'No text layer selected.' : fallback === 'design' ? 'No design layer selected.' : 'No layer selected.', 'warning');
      return;
    }
    const removed = layers()[idx];
    markDirty();
    layers().splice(idx, 1);
    state.sel = null;
    if (removed && removed._uploaded) clearUploadUI(true);
    renderAll();
    setStatus('Layer removed.');
  }

  function centerSel() {
    const layer = layers().find((l) => l.id === state.sel);
    if (!layer) { setStatus('Select a layer first.', 'warning'); return; }
    markDirty();
    const s = stageSize();
    layer.x = Math.round((s.w - layer.w) / 2);
    layer.y = Math.round((s.h - layer.h) / 2);
    renderLayer(layer);
    setStatus('Layer centered.', 'success');
  }

  function alignSel(axis) {
    const layer = layers().find((l) => l.id === state.sel);
    if (!layer) { setStatus('Select a layer first.', 'warning'); return; }
    markDirty();
    const s = stageSize();
    if (axis === 'hc') layer.x = Math.round((s.w - layer.w) / 2);
    else layer.y = Math.round((s.h - layer.h) / 2);
    renderLayer(layer);
    setStatus('Layer aligned.', 'success');
  }

  function clearSide(silent) {
    markDirty();
    state[state.side] = [];
    state.sel = null;
    const ov = $('#overlay');
    if (ov) ov.innerHTML = '';
    clearUploadUI(true);
    renderAll();
    if (!silent) { setStatus('Side cleared.'); showToast('Canvas cleared'); }
  }

  function promptResetDesign() { openModal('reset-modal'); }
  function confirmResetDesign() {
    closeModal('reset-modal');
    markDirty();
    state.front = []; state.back = []; state.wrap = []; state.sel = null;
    const ov = $('#overlay');
    if (ov) ov.innerHTML = '';
    clearUploadUI(true);
    renderAll();
    setStatus('Design reset.', 'success');
    showToast('All designs cleared');
  }

  function setupDrag(el, layer) {
    let sx; let sy; let ox; let
      oy;
    el.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.resize-handle')) return;
      e.preventDefault();
      sx = e.clientX; sy = e.clientY; ox = layer.x; oy = layer.y;
      el.setPointerCapture(e.pointerId);
      const s = stageSize();
      function mv(ev) {
        markDirty();
        layer.x = clamp(ox + (ev.clientX - sx), 0, s.w - layer.w);
        layer.y = clamp(oy + (ev.clientY - sy), 0, s.h - layer.h);
        el.style.left = `${layer.x}px`;
        el.style.top = `${layer.y}px`;
      }
      function up() { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); }
      el.addEventListener('pointermove', mv);
      el.addEventListener('pointerup', up);
    });
  }

  function setupResize(rh, layer) {
    let sx; let sy; let ow; let
      oh;
    rh.addEventListener('pointerdown', (e) => {
      e.preventDefault(); e.stopPropagation();
      sx = e.clientX; sy = e.clientY; ow = layer.w; oh = layer.h;
      rh.setPointerCapture(e.pointerId);
      const s = stageSize();
      function mv(ev) {
        markDirty();
        layer.w = clamp(ow + (ev.clientX - sx), 30, s.w - layer.x);
        if (layer.type === 'image') layer.h = layer.w;
        else layer.h = Math.max(24, oh + (ev.clientY - sy));
        renderLayer(layer);
      }
      function up() { rh.removeEventListener('pointermove', mv); rh.removeEventListener('pointerup', up); }
      rh.addEventListener('pointermove', mv);
      rh.addEventListener('pointerup', up);
    });
  }

  async function generateSnapshot() {
    const cfg = getCfg();
    const s = stageSize();
    const canvas = $('#snapshot-canvas');
    canvas.width = s.w; canvas.height = s.h;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, s.w, s.h);
    await drawSvgStringToCanvas(ctx, productShapeSvg(cfg.productShape, s.w, s.h, state.shirtColor), 0, 0, s.w, s.h);
    for (const layer of (state[state.side] || [])) {
      if (layer.type === 'image') await drawImageLayerToCanvas(ctx, layer);
      else if (layer.type === 'text') await drawSvgStringToCanvas(ctx, makeCurvedTextSVG(layer), layer.x, layer.y, layer.w, null);
    }
    return canvas.toDataURL('image/png');
  }

  function drawSvgStringToCanvas(ctx, svgStr, x, y, w, h) {
    return new Promise((resolve) => {
      const blob = new Blob([svgStr], { type: 'image/svg+xml' });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        try {
          if (h === null) {
            const nW = img.naturalWidth || img.width || w;
            const nH = img.naturalHeight || img.height || w;
            const drawH = nW > 0 ? (w * nH / nW) : nH;
            ctx.drawImage(img, x, y, w, drawH);
          } else {
            ctx.drawImage(img, x, y, w, h);
          }
        } finally { URL.revokeObjectURL(url); resolve(); }
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(); };
      img.src = url;
    });
  }

  function drawImageLayerToCanvas(ctx, layer) {
    return new Promise((resolve) => {
      const img = new Image();
      if (!layer._uploaded) img.crossOrigin = 'anonymous';
      img.onload = () => {
        try {
          const iw = img.naturalWidth || img.width || layer.w;
          const ih = img.naturalHeight || img.height || layer.h;
          if (!iw || !ih) { ctx.drawImage(img, layer.x, layer.y, layer.w, layer.h); return; }
          const scale = Math.min(layer.w / iw, layer.h / ih);
          const dw = iw * scale; const dh = ih * scale;
          const dx = layer.x + (layer.w - dw) / 2; const dy = layer.y + (layer.h - dh) / 2;
          ctx.drawImage(img, dx, dy, dw, dh);
        } finally { resolve(); }
      };
      img.onerror = () => resolve();
      img.src = layer.src;
    });
  }

  function serializeLayers(ls) {
    return ls.map((l) => {
      const o = {
        id: l.id, type: l.type, x: l.x, y: l.y, w: l.w, h: l.h, _uploaded: l._uploaded || false,
      };
      if (l.type === 'text') {
        Object.assign(o, {
          text: l.text, fontFamily: l.fontFamily, fontWeight: l.fontWeight, fontSize: l.fontSize, textColor: l.textColor, textAlign: l.textAlign, curve: l.curve,
        });
      }
      if (l.type === 'image') o.src = l.src;
      return o;
    });
  }

  async function saveDesign() {
    const pid = state.product && state.product.id;
    const key = pid ? `designData_${pid}` : 'designData';
    let previewImage = null;
    try { previewImage = await generateSnapshot(); } catch (e) { /* ignore snapshot failures */ }
    const data = {
      productId: pid || null,
      productCategory: state.category,
      productName: (state.product && state.product.name) || null,
      shirtColor: state.shirtColor,
      activeSide: state.side,
      front: serializeLayers(state.front),
      back: serializeLayers(state.back),
      wrap: serializeLayers(state.wrap),
      generatedAt: new Date().toISOString(),
      previewImage,
    };
    try {
      localStorage.setItem(key, JSON.stringify(data));
      markSaved();
      const btn = $('#save-btn');
      if (btn) {
        btn.classList.add('saved');
        btn.textContent = 'Saved!';
        setTimeout(() => {
          btn.classList.remove('saved');
          btn.innerHTML = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg> Save Design';
        }, 2200);
      }
      setStatus(`Design saved${pid ? ` for product #${pid}` : '.'}`, 'success');
      showToast('Design saved successfully!');
    } catch (err) {
      try {
        data.previewImage = null;
        localStorage.setItem(key, JSON.stringify(data));
        markSaved();
        showToast('Saved (preview skipped - storage full)');
      } catch (e2) {
        setStatus('Could not save design data.', 'warning');
        showToast('Save failed - storage may be full.');
      }
    }
  }

  function handleBack() { if (!state.saved) { openModal('back-modal'); return; } proceedBack(); }
  function openModal(id) { $(`#${id}`).classList.add('show'); }
  function closeModal(id) { $(`#${id}`).classList.remove('show'); }
  async function saveAndBack() { await saveDesign(); closeModal('back-modal'); proceedBack(); }
  function proceedBack() {
    closeModal('back-modal');
    const pid = state.product && state.product.id;
    window.location.href = pid ? `/product?id=${pid}` : '/product';
  }

  function updateMeta() {
    const cfg = getCfg();
    const p = state.product;
    const nameEl = $('#product-name');
    const badgeEl = $('#category-badge');
    const infoEl = $('#info-banner');
    const sideLbl = $('#side-label');
    if (nameEl) nameEl.textContent = (p && p.name) || 'Customizer';
    if (badgeEl) badgeEl.textContent = cfg.label;
    if (sideLbl) sideLbl.innerHTML = `Editing <strong>${state.side}</strong>`;
    if (infoEl) {
      const sd = cfg.sides.length === 1 ? `${cfg.sides[0]} panel` : `${cfg.sides.join(' & ')} panels`;
      infoEl.innerHTML = `<strong>${cfg.label}</strong> &mdash; ${sd}. Canvas: ${cfg.stageW}x${cfg.stageH}px.`;
    }
  }

  function observeResize() {
    // Mobile browsers resize the visual viewport as the address bar/toolbar
    // shows or hides, which can leave the first renderStage() measurement
    // (taken while the toolbar is still expanded) stale.
    window.visualViewport?.addEventListener('resize', () => renderStage());
    if (!window.ResizeObserver) return;
    const area = $('#canvas-stage-area');
    if (!area) return;
    new ResizeObserver(() => renderStage()).observe(area);
  }

  /* ── Upload handling ── */
  const uploadEls = {
    area: $('#upload-area'),
    input: $('#img-upload'),
    idle: $('#upload-idle'),
    loading: $('#upload-loading'),
    preview: $('#upload-preview'),
    thumb: $('#upload-thumb'),
    name: $('#upload-name'),
    remove: $('#upload-remove'),
    error: $('#upload-error'),
    errTitle: $('#upload-error-title'),
    errDetail: $('#upload-error-detail'),
  };

  function showUploadLoading() {
    uploadEls.idle.style.display = 'none';
    uploadEls.preview.style.display = 'none';
    uploadEls.loading.style.display = 'flex';
    uploadEls.area.classList.remove('upload-error-state');
  }
  function hideUploadLoading() { uploadEls.loading.style.display = 'none'; }
  function showUploadPreview(filename, dataUrl) {
    uploadEls.thumb.src = dataUrl;
    uploadEls.name.textContent = filename.length > 28 ? `${filename.slice(0, 25)}…` : filename;
    uploadEls.idle.style.display = 'none';
    uploadEls.loading.style.display = 'none';
    uploadEls.preview.style.display = 'flex';
    uploadEls.area.classList.remove('upload-error-state');
  }
  function showUploadError(title, detail) {
    hideUploadLoading();
    uploadEls.idle.style.display = 'flex';
    uploadEls.preview.style.display = 'none';
    uploadEls.errTitle.textContent = title;
    uploadEls.errDetail.textContent = detail;
    uploadEls.error.classList.add('visible');
    uploadEls.area.classList.add('upload-error-state');
  }
  function clearUploadError() {
    uploadEls.error.classList.remove('visible');
    uploadEls.area.classList.remove('upload-error-state');
    uploadEls.errTitle.textContent = '';
    uploadEls.errDetail.textContent = '';
  }

  function clearUploadUI(silentOnly) {
    uploadEls.thumb.src = ''; uploadEls.name.textContent = '';
    uploadEls.idle.style.display = 'flex';
    uploadEls.loading.style.display = 'none';
    uploadEls.preview.style.display = 'none';
    clearUploadError();
    if (!silentOnly) {
      state[state.side] = state[state.side].filter((l) => !(l.type === 'image' && l._uploaded));
      state.sel = null;
      renderAll();
      markDirty();
    }
  }

  function placeOnCanvas(dataUrl, filename) {
    markDirty();
    state[state.side] = state[state.side].filter((l) => !(l.type === 'image' && l._uploaded));
    state[state.side] = state[state.side].filter((l) => l.type !== 'image');
    state.sel = null;
    const s = stageSize();
    const size = Math.min(s.w, s.h) * 0.55;
    const layer = {
      id: state.nid++,
      type: 'image',
      _uploaded: true,
      x: Math.round((s.w - size) / 2),
      y: Math.round((s.h - size) / 2),
      w: size,
      h: size,
      src: dataUrl,
      name: filename || 'Uploaded image',
    };
    layers().push(layer);
    renderAll();
    selectLayer(layer.id);
    setStatus('Image uploaded — drag to reposition, corner to resize.', 'success');
    showToast('Image added to canvas');
  }

  function processFile(file) {
    clearUploadError();
    if (!ALLOWED_TYPES.includes(file.type)) {
      showUploadError('Unsupported format', `Only ${FORMAT_LABEL} images are supported. Please choose a different file.`);
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      const kb = (file.size / 1024).toFixed(1);
      showUploadError('File too large', `Image size (${kb} KB) exceeds the 50 KB limit. Please upload a smaller image.`);
      return;
    }
    showUploadLoading();
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      const testImg = new Image();
      testImg.onload = () => { hideUploadLoading(); showUploadPreview(file.name, dataUrl); placeOnCanvas(dataUrl, file.name); };
      testImg.onerror = () => { hideUploadLoading(); showUploadError('Corrupted file', 'This image could not be processed. Please try another file.'); };
      testImg.src = dataUrl;
    };
    reader.onerror = () => { hideUploadLoading(); showUploadError('Upload failed', 'Upload failed. Please try again.'); };
    reader.readAsDataURL(file);
  }

  if (uploadEls.area && uploadEls.input) {
    uploadEls.area.addEventListener('click', (e) => {
      if (uploadEls.remove && (e.target === uploadEls.remove || uploadEls.remove.contains(e.target))) return;
      if (uploadEls.preview.style.display !== 'none') return;
      uploadEls.input.click();
    });
    uploadEls.area.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); uploadEls.input.click(); }
    });
    uploadEls.area.addEventListener('dragover', (e) => { e.preventDefault(); uploadEls.area.classList.add('drag-over'); });
    uploadEls.area.addEventListener('dragleave', (e) => { if (!uploadEls.area.contains(e.relatedTarget)) uploadEls.area.classList.remove('drag-over'); });
    uploadEls.area.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadEls.area.classList.remove('drag-over');
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    });
    uploadEls.input.addEventListener('change', () => {
      const file = uploadEls.input.files[0];
      setTimeout(() => { uploadEls.input.value = ''; }, 0);
      if (file) processFile(file);
    });
    if (uploadEls.remove) {
      uploadEls.remove.addEventListener('click', (e) => { e.stopPropagation(); clearUploadUI(false); });
    }
  }

  /* ── Toolbar / cart badge ── */
  function updateToolbarState() {
    const hasSel = state.sel !== null;
    const cx = $('#tb-center-x');
    const cy = $('#tb-center-y');
    if (cx) cx.disabled = !hasSel;
    if (cy) cy.disabled = !hasSel;
    updateCartBadge();
  }

  function updateCartBadge() {
    const badge = $('#tb-cart-badge');
    if (!badge) return;
    const count = getCartCount();
    if (count > 0) {
      badge.textContent = count;
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  function handleToolbarCart() {
    $('#purchaseDrawer').classList.add('open');
    $('#purchaseDrawerOverlay').classList.add('open');
  }

  /* ── Purchase panel ── */
  function getDesignFee(category) {
    if (!category) return 0;
    const key = Object.keys(DESIGN_FEES).find((k) => k.toLowerCase() === String(category).toLowerCase());
    return key ? DESIGN_FEES[key] : 0;
  }
  let csQty = 1;
  function updatePurchasePanel() {
    const p = state.product;
    if (!p) return;
    const fee = getDesignFee(p.category);
    const total = (p.basePrice + fee) * csQty;
    const totalEl = $('#cs-total-price');
    const breakdownEl = $('#cs-price-breakdown');
    if (totalEl) totalEl.textContent = money(total);
    if (breakdownEl) breakdownEl.textContent = `Base ${money(p.basePrice)} + Design ${money(fee)}`;

    const baseEl = $('#cs-base-price');
    const feeEl = $('#cs-design-fee');
    const qtyEl = $('#cs-qty-display');
    const drawerTotal = $('#cs-drawer-total');
    if (baseEl) baseEl.textContent = money(p.basePrice);
    if (feeEl) feeEl.textContent = money(fee);
    if (qtyEl) qtyEl.textContent = `×${csQty}`;
    if (drawerTotal) drawerTotal.textContent = money(total);

    const sizeSelect = $('#cs-size-select');
    if (sizeSelect && p.sizes && sizeSelect.options.length === 0) {
      const urlSize = new URLSearchParams(window.location.search).get('size') || '';
      p.sizes.forEach((s) => {
        const opt = document.createElement('option');
        opt.value = s; opt.textContent = s;
        if (s === urlSize) opt.selected = true;
        sizeSelect.appendChild(opt);
      });
    }
  }

  $('#cs-qty-minus')?.addEventListener('click', () => { if (csQty > 1) { csQty--; $('#cs-qty-val').textContent = csQty; updatePurchasePanel(); } });
  $('#cs-qty-plus')?.addEventListener('click', () => { if (csQty < 99) { csQty++; $('#cs-qty-val').textContent = csQty; updatePurchasePanel(); } });

  $('#cs-add-to-cart')?.addEventListener('click', async () => {
    const p = state.product;
    if (!p) { showToast('No product loaded'); return; }
    await saveDesign();

    const selectedSize = $('#cs-size-select')?.value || p.sizes?.[0] || '';
    const selectedColor = state.shirtColor || '';
    const fee = getDesignFee(p.category);
    const totalPrice = p.basePrice + fee;

    const designKey = `designData_${p.id}`;
    let customization = null;
    try { customization = JSON.parse(localStorage.getItem(designKey)); } catch { /* ignore */ }

    const cartImage = (customization && customization.previewImage) || p.imageDefault || '';

    const hashData = {};
    if (customization) {
      Object.keys(customization).forEach((k) => {
        if (k !== 'previewImage' && k !== 'generatedAt') hashData[k] = customization[k];
      });
    }
    let hash = 0;
    const cs = JSON.stringify(hashData);
    for (let i = 0; i < cs.length; i++) { hash = ((hash << 5) - hash) + cs.charCodeAt(i); hash |= 0; }
    const uniqueKey = `${p.id}__${selectedSize}__${selectedColor}__${hash}`;

    const cart = getCart();
    const existing = cart.find((item) => item.key === uniqueKey);
    if (existing) {
      existing.qty += csQty;
      existing.customization = customization;
      existing.image = cartImage;
    } else {
      cart.push({
        key: uniqueKey,
        id: p.id,
        name: p.name,
        image: cartImage,
        category: p.category,
        basePrice: p.basePrice,
        designFee: fee,
        price: totalPrice,
        color: selectedColor,
        colorName: (() => { const k = getColorKey(selectedColor); return k ? formatColorName(k) : selectedColor; })(),
        size: selectedSize,
        qty: csQty,
        customized: true,
        designRequired: true,
        customization,
      });
    }
    saveCart(cart);

    const body = $('#cart-modal-body');
    if (body) body.textContent = `${p.name} (${selectedSize}) × ${csQty} added to cart.`;
    openModal('cart-modal');
    // Badge refresh is driven by the shared CART_UPDATED_EVENT (see init).
  });

  /* ── Wire up static controls ── */
  $('#back-btn')?.addEventListener('click', handleBack);
  $('#reset-all-btn')?.addEventListener('click', promptResetDesign);
  $('#clear-side-btn')?.addEventListener('click', () => clearSide());
  $('#topbar-save-btn')?.addEventListener('click', saveDesign);
  $('#save-btn')?.addEventListener('click', saveDesign);
  $('#tb-cart')?.addEventListener('click', handleToolbarCart);
  $('#tb-center-x')?.addEventListener('click', () => alignSel('hc'));
  $('#tb-center-y')?.addEventListener('click', () => alignSel('vc'));
  $('#center-design-btn')?.addEventListener('click', centerSel);
  $('#remove-design-btn')?.addEventListener('click', () => removeSel('design'));
  $('#add-text-btn')?.addEventListener('click', addTextLayer);
  $('#remove-text-btn')?.addEventListener('click', () => removeSel('text'));
  $$('.panel-toggle').forEach((el) => el.addEventListener('click', () => togglePanel(el.dataset.panel)));
  $$('.align-btn').forEach((el) => el.addEventListener('click', () => setTextAlign(el.dataset.align)));

  ['txt-font', 'txt-weight'].forEach((id) => $(`#${id}`)?.addEventListener('change', syncTextSel));
  ['txt-size', 'txt-width', 'txt-color'].forEach((id) => $(`#${id}`)?.addEventListener('input', syncTextSel));
  $('#txt-curve')?.addEventListener('input', (e) => { $('#curve-val').textContent = `${e.target.value}°`; syncTextSel(); });

  let syncTimer;
  $('#txt-content')?.addEventListener('input', () => { clearTimeout(syncTimer); syncTimer = setTimeout(syncTextSel, 60); });

  $('#modal-card-close')?.addEventListener('click', () => closeModal('back-modal'));
  $('#leave-anyway-btn')?.addEventListener('click', proceedBack);
  $('#save-and-back-btn')?.addEventListener('click', saveAndBack);
  $('#reset-cancel-btn')?.addEventListener('click', () => closeModal('reset-modal'));
  $('#reset-confirm-btn')?.addEventListener('click', confirmResetDesign);

  $('#purchaseFloat')?.addEventListener('click', () => { $('#purchaseDrawer').classList.add('open'); $('#purchaseDrawerOverlay').classList.add('open'); });
  $('#purchaseDrawerOverlay')?.addEventListener('click', () => { $('#purchaseDrawer').classList.remove('open'); $('#purchaseDrawerOverlay').classList.remove('open'); });
  $('#purchase-drawer-close')?.addEventListener('click', () => { $('#purchaseDrawer').classList.remove('open'); $('#purchaseDrawerOverlay').classList.remove('open'); });

  const cartModal = $('#cart-modal');
  $('#cart-modal-close-btn')?.addEventListener('click', () => closeModal('cart-modal'));
  $('#cart-modal-go-product')?.addEventListener('click', proceedBack);
  cartModal?.addEventListener('click', (e) => { if (e.target === cartModal) closeModal('cart-modal'); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && cartModal?.classList.contains('show')) closeModal('cart-modal'); });

  /* ── Init ── */
  async function init() {
    const id = new URLSearchParams(window.location.search).get('id');
    setStatus('Loading product...');
    try {
      const products = await fetchProducts(PRODUCTS_JSON_URL);
      const found = id ? products.find((p) => String(p.id) === String(id)) : null;
      if (!found && id) { setStatus('Product not found.', 'warning'); showToast('Product not found - showing default canvas.'); }
      const product = found ? normalizeProduct(found) : null;
      state.product = product;
      state.category = String((product && product.category) || 'default').toLowerCase();
      if (product && product.id) {
        const saved = localStorage.getItem(`designData_${product.id}`);
        if (saved) {
          try {
            const d = JSON.parse(saved);
            if (d.front) state.front = d.front || [];
            if (d.back) state.back = d.back || [];
            if (d.wrap) state.wrap = d.wrap || [];
            if (d.shirtColor) { state.shirtColor = d.shirtColor; state._colorInitialized = true; }
            const allIds = [...state.front, ...state.back, ...state.wrap].map((l) => l.id);
            if (allIds.length) state.nid = Math.max(...allIds) + 1;
            state.saved = true;
          } catch (e) { /* ignore corrupt saved data */ }
        }
      }
    } catch (err) {
      setStatus('Could not load product data.', 'warning');
    }
    const cfg = getCfg();
    state.side = cfg.defaultSide;
    await loadTemplates();
    updateMeta();
    buildSwatches();
    buildSideTabs();
    renderTemplates();
    renderStage();
    renderAll();
    observeResize();
    updatePurchasePanel();
    updateCartBadge();
    // Keep the toolbar badge in sync with same-tab cart writes (add-to-cart)
    // and cross-tab changes, via the shared cart utility events.
    window.addEventListener(CART_UPDATED_EVENT, updateCartBadge);
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key === 'cart') updateCartBadge();
    });
    setStatus('Ready - upload an image, pick a template, or add text.', 'success');
  }

  init();
}
