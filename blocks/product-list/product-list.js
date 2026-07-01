/**
 * Product List Block — Craftora EDS
 *
 * Authored DOM (2 rows):
 *   Row 0: "category-list" label | <ul> of category names (bold text)
 *   Row 1: <a href="...json"> link to products endpoint
 *
 * Supports ?category= URL param for initial filter state.
 * Renders category filter tabs + product card grid.
 */

import { toggleWishlist, isWishlisted } from '../../scripts/wishlist-utils.js';
import { money, esc } from '../../scripts/cart-utils.js';

export default async function decorate(block) {
  // ── Extract authored content ──
  const rows = [...block.children];
  const categoryRow = rows[0];
  const dataRow = rows[1];

  // Get category names from the authored list
  const categoryItems = [...(categoryRow?.querySelectorAll('li') || [])];
  const categories = categoryItems.map((li) => li.textContent.trim());

  // Get JSON endpoint
  const link = dataRow?.querySelector('a');
  const jsonUrl = link?.getAttribute('href') || '/library/products.json';

  // ── Clear authored content ──
  block.textContent = '';

  // ── Build category filter tabs ──
  const filterBar = document.createElement('div');
  filterBar.className = 'product-list-filters';
  filterBar.setAttribute('aria-label', 'Category filters');

  // Read initial category from URL
  const urlParams = new URLSearchParams(window.location.search);
  const initialCategory = urlParams.get('category') || '';

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.className = 'product-list-filter-btn';
    btn.type = 'button';
    btn.textContent = cat;

    // Set active state
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

  // ── Build product grid container ──
  const grid = document.createElement('div');
  grid.className = 'product-list-grid';
  block.append(grid);

  // ── Fetch products ──
  let products = [];
  try {
    const resp = await fetch(jsonUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();
    // Handle multi-sheet shape: { data: { data: [...] } }
    if (json.data?.data && Array.isArray(json.data.data)) {
      products = json.data.data;
    } else if (Array.isArray(json.data)) {
      products = json.data;
    } else if (Array.isArray(json.products)) {
      products = json.products;
    }
  } catch (err) {
    grid.innerHTML = '<p class="product-list-empty">Unable to load products. Please try again later.</p>';
    return;
  }

  // ── Render function ──
  function renderGrid(category) {
    let filtered = products;
    if (category) {
      filtered = products.filter(
        (p) => (p.category || '').toLowerCase() === category.toLowerCase(),
      );
    }

    if (!filtered.length) {
      grid.innerHTML = '<p class="product-list-empty">No products found matching your criteria.</p>';
      return;
    }

    grid.innerHTML = filtered.map((p) => {
      const imgSrc = resolveImg(p.imageDefault || p.images?.default || '');
      const badge = p.badges ? String(p.badges).split(', ')[0] : (p.badges?.[0] || '');
      const price = Number(p.basePrice || 0);
      const wishlisted = isWishlisted(p.id);
      const productUrl = `/product?id=${encodeURIComponent(p.id)}`;

      return `<div class="product-list-card" data-id="${esc(p.id)}">
        ${badge ? `<span class="product-list-card-badge">${esc(badge)}</span>` : ''}
        <a class="product-list-card-link" href="${productUrl}">
          <div class="product-list-card-image" style="background-image:url('${esc(imgSrc)}')"></div>
        </a>
        <div class="product-list-card-body">
          <span class="product-list-card-category">${esc(p.category || '')}</span>
          <h4 class="product-list-card-title">${esc(p.name || '')}</h4>
          <p class="product-list-card-desc">${esc(p.description || '')}</p>
          <div class="product-list-card-footer">
            <span class="product-list-card-price">${money(price)}<small> base price</small></span>
            <button class="product-list-card-wishlist ${wishlisted ? 'wishlisted' : ''}"
              aria-label="${wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}"
              data-id="${esc(p.id)}" data-name="${esc(p.name)}"
              data-category="${esc(p.category)}" data-price="${price}"
              data-image="${esc(imgSrc)}" type="button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="${wishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>`;
    }).join('');

    // Wire card click → product page
    grid.querySelectorAll('.product-list-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button') || e.target.closest('a')) return;
        const id = card.dataset.id;
        if (id) window.location.href = `/product?id=${encodeURIComponent(id)}`;
      });
    });

    // Wire wishlist buttons
    grid.querySelectorAll('.product-list-card-wishlist').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const { id, name, category, price, image } = btn.dataset;
        const now = toggleWishlist({ id, name, category, price: Number(price), image });
        btn.classList.toggle('wishlisted', now);
        btn.setAttribute('aria-label', now ? 'Remove from wishlist' : 'Add to wishlist');
        const svg = btn.querySelector('path');
        if (svg) svg.setAttribute('fill', now ? 'currentColor' : 'none');
      });
    });
  }

  // Initial render
  renderGrid(initialCategory);
}

function resolveImg(path) {
  if (!path) return '';
  if (path.startsWith('./')) return path.slice(1);
  return path;
}
