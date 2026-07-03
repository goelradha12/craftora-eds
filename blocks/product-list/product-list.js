/**
 * Product List Block — Craftora EDS
 *
 * Default variant — full catalog with category filter tabs:
 *   Row 0: "category-list" label | <ul> of category names
 *   Row 1: <a href="...json"> link to products endpoint
 *   Supports ?category= URL param for initial filter state.
 *
 * `similar` variant — "You may also like" (product page):
 *   Row 0: "Heading" label | heading text
 *   Row 1: <a href="...json"> link to products endpoint
 *   Reads ?id= and shows other products in the same category.
 */

import {
  toggleWishlist, isWishlisted, getWishlist, saveWishlist, removeFromWishlist,
} from '../../scripts/wishlist-utils.js';
import { money, esc } from '../../scripts/cart-utils.js';
import { fetchProducts, resolveAssetPath } from '../../scripts/product-data.js';

const SIMILAR_LIMIT = 8;

/* ── Shared card rendering ──
   compact   = smaller card, no description
   removable = wishlist mode: remove-X overlay instead of the footer heart */
function cardHTML(p, compact = false, removable = false) {
  const imgSrc = resolveAssetPath(p.imageDefault || p.images?.default || '');
  const badge = p.badges ? String(p.badges).split(', ')[0] : (p.badges?.[0] || '');
  const price = Number(p.basePrice || 0);
  const wishlisted = isWishlisted(p.id);
  const productUrl = `/product?id=${encodeURIComponent(p.id)}`;

  const removeBtn = `<button class="product-list-card-remove" type="button" data-id="${esc(p.id)}" aria-label="Remove ${esc(p.name)} from wishlist">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
    </button>`;
  const wishBtn = `<button class="product-list-card-wishlist ${wishlisted ? 'wishlisted' : ''}"
      aria-label="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
      data-id="${esc(p.id)}" data-name="${esc(p.name)}"
      data-category="${esc(p.category)}" data-price="${price}"
      data-image="${esc(imgSrc)}" type="button">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="${wishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
      </svg>
    </button>`;

  return `<div class="product-list-card" data-id="${esc(p.id)}">
    ${badge ? `<span class="product-list-card-badge">${esc(badge)}</span>` : ''}
    ${removable ? removeBtn : ''}
    <a class="product-list-card-link" href="${productUrl}">
      <div class="product-list-card-image" style="background-image:url('${esc(imgSrc)}')"></div>
    </a>
    <div class="product-list-card-body">
      <span class="product-list-card-category">${esc(p.category || '')}</span>
      <h4 class="product-list-card-title">${esc(p.name || '')}</h4>
      ${compact ? '' : `<p class="product-list-card-desc">${esc(p.description || '')}</p>`}
      <div class="product-list-card-footer">
        <span class="product-list-card-price">${money(price)}<small> base price</small></span>
        ${removable ? '' : wishBtn}
      </div>
    </div>
  </div>`;
}

function wireGrid(grid, afterToggle) {
  grid.querySelectorAll('.product-list-card').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('a')) return;
      const { id } = card.dataset;
      if (id) window.location.href = `/product?id=${encodeURIComponent(id)}`;
    });
  });

  grid.querySelectorAll('.product-list-card-wishlist').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const {
        id, name, category, price, image,
      } = btn.dataset;
      const now = toggleWishlist({
        id, name, category, price: Number(price), image,
      });
      btn.classList.toggle('wishlisted', now);
      btn.setAttribute('aria-label', now ? 'Remove from wishlist' : 'Add to wishlist');
      const svg = btn.querySelector('path');
      if (svg) svg.setAttribute('fill', now ? 'currentColor' : 'none');
      if (afterToggle) afterToggle();
    });
  });

  grid.querySelectorAll('.product-list-card-remove').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromWishlist(btn.dataset.id);
      if (afterToggle) afterToggle();
    });
  });
}

function renderInto(grid, products, emptyMsg, compact = false, afterToggle = null) {
  if (!products.length) {
    grid.innerHTML = `<p class="product-list-empty">${emptyMsg}</p>`;
    return;
  }
  grid.innerHTML = products.map((p) => cardHTML(p, compact)).join('');
  wireGrid(grid, afterToggle);
}

/* ── "similar" variant — same-category products for the current ?id= ── */
async function decorateSimilar(block, rows, small) {
  const headingText = rows[0]?.children[1]?.textContent?.trim() || 'You may also like';
  const jsonUrl = rows[1]?.querySelector('a')?.getAttribute('href') || '/library/products.json';

  block.textContent = '';
  const heading = document.createElement('h2');
  heading.className = 'product-list-heading';
  heading.textContent = headingText;
  block.append(heading);

  const grid = document.createElement('div');
  grid.className = 'product-list-grid';
  block.append(grid);

  let products = [];
  try {
    products = await fetchProducts(jsonUrl);
  } catch (err) {
    grid.innerHTML = '<p class="product-list-empty">Unable to load products.</p>';
    return;
  }

  const id = new URLSearchParams(window.location.search).get('id');
  const current = id ? products.find((p) => String(p.id) === String(id)) : null;
  let items = products;
  if (current) {
    const others = products.filter((p) => p.id !== current.id);
    const same = others.filter((p) => (p.category || '') === (current.category || ''));
    items = same.length ? same : others;
  }
  renderInto(grid, items.slice(0, SIMILAR_LIMIT), 'No related products found.', small);
}

/* ── "wishlist" variant — saved products from localStorage ── */
function emptyWishlistHTML() {
  return `<div class="product-list-wishlist-empty">
    <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    <h3>Your wishlist is empty</h3>
    <p>Browse our products and save your favourites here.</p>
    <a class="product-list-browse-btn" href="/products">Browse Products</a>
  </div>`;
}

function decorateWishlist(block, rows, small) {
  const headingHTML = rows[0]?.children[1]?.innerHTML?.trim() || 'My Wishlist';
  block.textContent = '';

  const header = document.createElement('div');
  header.className = 'product-list-wishlist-header';
  header.innerHTML = `<h2 class="product-list-heading">${headingHTML}<span class="product-list-wishlist-count"></span></h2>
    <button class="product-list-clear-btn" type="button">Clear All</button>`;
  block.append(header);

  const grid = document.createElement('div');
  grid.className = 'product-list-grid';
  block.append(grid);

  const countEl = header.querySelector('.product-list-wishlist-count');
  const clearBtn = header.querySelector('.product-list-clear-btn');

  const render = () => {
    const items = getWishlist();
    countEl.textContent = items.length ? ` (${items.length})` : '';
    clearBtn.hidden = !items.length;
    if (!items.length) {
      grid.innerHTML = emptyWishlistHTML();
      return;
    }
    // Map the stored wishlist shape onto the product card shape.
    const products = items.map((w) => ({
      id: w.id, name: w.name, category: w.category, basePrice: w.price, imageDefault: w.image,
    }));
    grid.innerHTML = products.map((p) => cardHTML(p, small, true)).join('');
    wireGrid(grid, render);
  };

  clearBtn.addEventListener('click', () => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Remove all items from your wishlist?')) {
      saveWishlist([]);
      render();
    }
  });

  render();
  window.addEventListener('storage', (e) => { if (e.key === 'craftora_wishlist') render(); });
}

export default async function decorate(block) {
  const rows = [...block.children];
  const small = block.classList.contains('small');

  if (block.classList.contains('wishlist')) {
    decorateWishlist(block, rows, small);
    return;
  }

  if (block.classList.contains('similar')) {
    await decorateSimilar(block, rows, small);
    return;
  }

  // ── Default: category filter tabs + full grid ──
  const categoryRow = rows[0];
  const dataRow = rows[1];
  const categories = [...(categoryRow?.querySelectorAll('li') || [])].map((li) => li.textContent.trim());
  const jsonUrl = dataRow?.querySelector('a')?.getAttribute('href') || '/library/products.json';

  block.textContent = '';

  const filterBar = document.createElement('div');
  filterBar.className = 'product-list-filters';
  filterBar.setAttribute('aria-label', 'Category filters');

  const initialCategory = new URLSearchParams(window.location.search).get('category') || '';

  const grid = document.createElement('div');
  grid.className = 'product-list-grid';

  let products = [];

  const renderGrid = (category) => {
    const filtered = category
      ? products.filter((p) => (p.category || '').toLowerCase() === category.toLowerCase())
      : products;
    renderInto(grid, filtered, 'No products found matching your criteria.', small);
  };

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'product-list-filter-btn';
    btn.type = 'button';
    btn.textContent = cat;

    const isAll = cat.toLowerCase() === 'all category';
    if ((!initialCategory && isAll) || cat.toLowerCase() === initialCategory.toLowerCase()) {
      btn.classList.add('active');
    }

    btn.addEventListener('click', () => {
      filterBar.querySelectorAll('.product-list-filter-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderGrid(isAll ? '' : cat);
    });

    filterBar.append(btn);
  });

  block.append(filterBar);
  block.append(grid);

  try {
    products = await fetchProducts(jsonUrl);
  } catch (err) {
    grid.innerHTML = '<p class="product-list-empty">Unable to load products. Please try again later.</p>';
    return;
  }

  renderGrid(initialCategory);
}
