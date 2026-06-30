/**
 * design-preview.js — Craftora EDS Design Preview Modal
 * Shows saved design snapshots from localStorage in a modal overlay.
 * Matches legacy craftora/scripts/design_preview.js (DesignPreview IIFE).
 *
 * Usage:
 *   import { showDesignPreview, showCartDesignPreview, designExists } from './design-preview.js';
 *   showDesignPreview(productId);
 *   showCartDesignPreview(cartItemKey);
 *   designExists(productId); // boolean
 */

const DESIGN_KEY_PREFIX = 'designData_';

let stylesInjected = false;
let modalBuilt = false;

/* ── Inject modal styles ── */
function injectStyles() {
  if (stylesInjected) return;
  stylesInjected = true;
  const style = document.createElement('style');
  style.id = 'design-preview-styles';
  style.textContent = `
    .dp-backdrop {
      position: fixed; inset: 0;
      background: rgb(13 13 13 / 0.55);
      backdrop-filter: blur(6px);
      display: flex; align-items: center; justify-content: center;
      z-index: 99000; padding: 20px;
      opacity: 0; transition: opacity 200ms ease;
    }
    .dp-backdrop.dp-visible { opacity: 1; }
    .dp-card {
      background: #fff; border-radius: 20px; border: 1px solid #e2e1dc;
      width: min(460px, 100%); overflow: hidden;
      transform: scale(0.94) translateY(10px);
      transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
      font-family: var(--font-ui, 'Inter', sans-serif);
    }
    .dp-backdrop.dp-visible .dp-card { transform: scale(1) translateY(0); }
    .dp-header {
      display: flex; align-items: center; justify-content: space-between;
      padding: 16px 18px 14px; border-bottom: 1px solid #e2e1dc;
    }
    .dp-title { font-size: 14px; font-weight: 700; color: #0d0d0d; }
    .dp-subtitle { font-size: 11px; color: #737373; display: block; margin-top: 2px; }
    .dp-close {
      width: 28px; height: 28px; border-radius: 50%;
      border: 1px solid #e2e1dc; background: #f5f5f3; color: #737373;
      cursor: pointer; display: flex; align-items: center; justify-content: center;
    }
    .dp-close:hover { background: #0d0d0d; color: #fff; border-color: #0d0d0d; }
    .dp-image-wrap {
      background: #f5f5f3; display: flex; align-items: center; justify-content: center;
      padding: 28px 40px;
    }
    .dp-image { width: 100%; max-width: 260px; height: auto; display: block; border-radius: 6px; }
    .dp-no-preview { text-align: center; color: #b0b0b0; font-size: 12px; line-height: 1.6; }
    .dp-no-preview-icon { font-size: 32px; margin-bottom: 8px; }
    .dp-footer {
      display: flex; align-items: center; justify-content: space-between;
      padding: 12px 18px; border-top: 1px solid #e2e1dc; gap: 8px;
    }
    .dp-meta { font-size: 11px; color: #b0b0b0; }
  `;
  document.head.appendChild(style);
}

/* ── Build modal DOM ── */
function buildModal() {
  if (modalBuilt) return;
  modalBuilt = true;
  const backdrop = document.createElement('div');
  backdrop.className = 'dp-backdrop';
  backdrop.id = 'dpBackdrop';
  backdrop.style.display = 'none';
  backdrop.innerHTML = `
    <div class="dp-card">
      <div class="dp-header">
        <div>
          <span class="dp-title">Your Saved Design</span>
          <span class="dp-subtitle" id="dpSubtitle">—</span>
        </div>
        <button class="dp-close" id="dpClose" aria-label="Close preview">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
      <div class="dp-image-wrap">
        <div class="dp-no-preview" id="dpNoPreview">
          <div class="dp-no-preview-icon">🎨</div>No preview available
        </div>
        <img class="dp-image" id="dpImage" alt="Design preview" style="display:none;">
      </div>
      <div class="dp-footer">
        <span class="dp-meta" id="dpMeta"></span>
        <div></div>
      </div>
    </div>`;
  document.body.appendChild(backdrop);

  backdrop.addEventListener('click', (e) => { if (e.target === backdrop) close(); });
  document.getElementById('dpClose').addEventListener('click', close);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && backdrop.classList.contains('dp-visible')) close();
  });
}

/* ── Open / Close ── */
function open() {
  const backdrop = document.getElementById('dpBackdrop');
  if (!backdrop) return;
  document.body.style.overflow = 'hidden';
  backdrop.style.display = 'flex';
  requestAnimationFrame(() => {
    requestAnimationFrame(() => backdrop.classList.add('dp-visible'));
  });
}

function close() {
  const backdrop = document.getElementById('dpBackdrop');
  if (!backdrop) return;
  backdrop.classList.remove('dp-visible');
  document.body.style.overflow = '';
  setTimeout(() => { backdrop.style.display = 'none'; }, 220);
}

/* ── Populate modal ── */
function populate(data) {
  const img = document.getElementById('dpImage');
  const noPreview = document.getElementById('dpNoPreview');
  const subtitle = document.getElementById('dpSubtitle');
  const meta = document.getElementById('dpMeta');

  const parts = [];
  if (data.productName) parts.push(data.productName);
  if (data.productCategory) parts.push(data.productCategory);
  subtitle.textContent = parts.join(' · ') || 'Custom design';

  if (data.generatedAt) {
    const d = new Date(data.generatedAt);
    meta.textContent = `Saved ${d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  } else {
    meta.textContent = '';
  }

  if (data.previewImage) {
    img.src = data.previewImage;
    img.style.display = 'block';
    noPreview.style.display = 'none';
  } else {
    img.style.display = 'none';
    img.src = '';
    noPreview.style.display = 'block';
  }
}

/* ── Public API ── */

/**
 * Show design preview for a product ID.
 * @param {string} productId
 * @returns {boolean} true if preview shown
 */
export function showDesignPreview(productId) {
  injectStyles();
  buildModal();

  const key = productId ? `${DESIGN_KEY_PREFIX}${productId}` : 'designData';
  const raw = localStorage.getItem(key);
  if (!raw) return false;

  let data;
  try { data = JSON.parse(raw); } catch { return false; }

  populate(data);
  open();
  return true;
}

/**
 * Show design preview for a cart item by its unique key.
 * @param {string} cartItemKey
 * @returns {boolean} true if preview shown
 */
export function showCartDesignPreview(cartItemKey) {
  injectStyles();
  buildModal();

  let cart;
  try { cart = JSON.parse(localStorage.getItem('cart') || '[]'); } catch { return false; }

  const item = cart.find((i) => i.key === cartItemKey);
  if (!item || !item.customization) return false;

  populate({
    productName: item.name,
    productCategory: item.category,
    generatedAt: item.customization.generatedAt,
    previewImage: item.customization.previewImage,
  });
  open();
  return true;
}

/**
 * Check if a saved design exists for a product.
 * @param {string} productId
 * @returns {boolean}
 */
export function designExists(productId) {
  const key = productId ? `${DESIGN_KEY_PREFIX}${productId}` : 'designData';
  return !!localStorage.getItem(key);
}

/**
 * Get raw design data for a product (or null).
 * @param {string} productId
 * @returns {object|null}
 */
export function getDesignData(productId) {
  const key = productId ? `${DESIGN_KEY_PREFIX}${productId}` : 'designData';
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

/**
 * Close the preview modal programmatically.
 */
export function closeDesignPreview() {
  close();
}
