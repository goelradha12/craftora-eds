/**
 * Carousel Block — Craftora EDS
 *
 * Renders a horizontally scrollable row of cards from a JSON endpoint.
 * Supports two variants: .carousel.products and .carousel.reviews
 *
 * Authored input (two rows):
 *   Row 1: "Heading" label | actual heading markup (h2)
 *   Row 2: <a href="...json-endpoint">
 */

import { decorateIcons } from '../../scripts/aem.js';

/* ── Helpers ── */
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[m]);
}

function money(val) {
  return `₹${Number(val).toLocaleString('en-IN')}`;
}

/**
 * Resolve relative image paths (./assets/...) to site-root-relative paths.
 */
function resolveImagePath(path) {
  if (!path) return '';
  if (path.startsWith('./')) return path.slice(1); // ./assets/... → /assets/...
  return path;
}

/* ── Products Parser + Renderer ── */
function parseProducts(json) {
  // Shape: { data: { data: [...] }, ... }
  const wrapper = json.data;
  if (!wrapper || !wrapper.data) return [];
  return wrapper.data.map((p) => ({
    id: p.id,
    name: p.name,
    category: p.category,
    basePrice: Number(p.basePrice),
    description: p.description,
    imageDefault: resolveImagePath(p.imageDefault),
    badges: p.badges ? p.badges.split(', ') : [],
    featured: p.featured === 'TRUE',
    stock: Number(p.stock),
  }));
}

function renderProductCard(product) {
  const badge = product.badges[0] || '';
  // ASSUMPTION: product detail URL is /product?id={id}
  // Flag: this matches the legacy pattern (product.html?id=X).
  const href = `/product?id=${encodeURIComponent(product.id)}`;

  return `<a class="carousel-card carousel-card-product" href="${href}">
    <div class="carousel-card-image">
      ${badge ? `<span class="carousel-card-badge">${esc(badge)}</span>` : ''}
      <img src="${esc(product.imageDefault)}" alt="${esc(product.name)}"
        loading="lazy" width="300" height="225">
    </div>
    <div class="carousel-card-body">
      <span class="carousel-card-category">${esc(product.category)}</span>
      <h3 class="carousel-card-title">${esc(product.name)}</h3>
      <p class="carousel-card-desc">${esc(product.description)}</p>
      <span class="carousel-card-price">${money(product.basePrice)}</span>
    </div>
  </a>`;
}

/* ── Reviews Parser + Renderer ── */
function parseReviews(json) {
  // Shape: { data: [...] } — flat, array directly at .data
  const arr = json.data;
  if (!Array.isArray(arr)) return [];
  return arr.map((r) => ({
    author: r.author,
    review: r.review,
    product: r.product,
    category: r.category,
  }));
}

function renderReviewCard(review) {
  return `<div class="carousel-card carousel-card-review">
    <div class="carousel-card-stars">
      <span class="icon icon-star"></span>
      <span class="icon icon-star"></span>
      <span class="icon icon-star"></span>
      <span class="icon icon-star"></span>
      <span class="icon icon-star"></span>
    </div>
    <blockquote class="carousel-card-quote">
      <p>"${esc(review.review)}"</p>
    </blockquote>
    <div class="carousel-card-attribution">
      <span class="carousel-card-author">${esc(review.author)}</span>
      <span class="carousel-card-product">${esc(review.product)} · ${esc(review.category)}</span>
    </div>
  </div>`;
}

/* ── Scroll Controls ── */
function initScrollControls(block, track) {
  const prevBtn = block.querySelector('.carousel-btn-prev');
  const nextBtn = block.querySelector('.carousel-btn-next');
  if (!prevBtn || !nextBtn) return;

  const scrollAmount = () => {
    const card = track.querySelector('.carousel-card');
    return card ? card.offsetWidth + 24 : 300; // card width + gap
  };

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });

  // Update button states on scroll
  const updateButtons = () => {
    prevBtn.disabled = track.scrollLeft <= 0;
    nextBtn.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
  };

  track.addEventListener('scroll', updateButtons, { passive: true });
  updateButtons();
}

/* ── Main Decorate ── */
export default async function decorate(block) {
  const isProducts = block.classList.contains('products');
  const isReviews = block.classList.contains('reviews');

  // Extract authored content
  const rows = [...block.children];
  const headingCell = rows[0]?.children[1]; // second cell of row 1
  const linkCell = rows[1]?.querySelector('a');
  const jsonUrl = linkCell?.getAttribute('href') || '';

  // Extract heading HTML
  const headingHTML = headingCell?.innerHTML || '';

  // Clear block
  block.textContent = '';

  // Build header (heading + nav buttons)
  const header = document.createElement('div');
  header.className = 'carousel-header';
  header.innerHTML = `
    <div class="carousel-heading">${headingHTML}</div>
    <div class="carousel-nav">
      <button class="carousel-btn carousel-btn-prev" aria-label="Scroll left" type="button">
        <span class="icon icon-chevron-left"></span>
      </button>
      <button class="carousel-btn carousel-btn-next" aria-label="Scroll right" type="button">
        <span class="icon icon-chevron-right"></span>
      </button>
    </div>`;
  block.append(header);

  // Build track
  const track = document.createElement('div');
  track.className = 'carousel-track';
  block.append(track);

  // Decorate icons in the header (arrows)
  decorateIcons(header);

  // Fetch + render (non-blocking — don't await at top level if not needed,
  // but we do need to render content, so we await inside try/catch)
  try {
    const resp = await fetch(jsonUrl);
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    const json = await resp.json();

    let cards = '';

    if (isProducts) {
      const products = parseProducts(json);
      const featured = products.filter((p) => p.featured);
      const items = featured.length > 0 ? featured : products;
      cards = items.map(renderProductCard).join('');
    } else if (isReviews) {
      const reviews = parseReviews(json);
      cards = reviews.map(renderReviewCard).join('');
    }

    if (!cards) {
      track.innerHTML = '<p class="carousel-empty">No items available.</p>';
    } else {
      track.innerHTML = cards;
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Carousel: failed to load data', err);
    track.innerHTML = '<p class="carousel-empty">Unable to load content.</p>';
  }

  // Decorate icons inside cards (star ratings in reviews)
  decorateIcons(track);

  // Init scroll controls
  initScrollControls(block, track);
}
