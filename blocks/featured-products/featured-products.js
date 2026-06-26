/**
 * Featured Products Block — Craftora EDS
 * Carousel of featured products fetched from /content/products.json.
 *
 * Authored as a table (minimal — just the block name triggers it):
 * | Featured Products |
 * | --- |
 * | /content/products.json |
 *
 * Or simply placed as an empty block — defaults to /content/products.json.
 */

function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m]);
}

function money(n) {
  return `₹${Number(n || 0).toLocaleString('en-IN')}`;
}

export default async function decorate(block) {
  // Determine data source (authored or default)
  const firstCell = block.querySelector('div > div')?.textContent?.trim();
  const dataSource = (firstCell && firstCell.startsWith('/')) ? firstCell : '/content/products.json';

  block.textContent = '';

  // Header with nav buttons
  const header = document.createElement('div');
  header.className = 'fp-header';
  header.innerHTML = `
    <div class="fp-nav">
      <button class="fp-btn fp-btn-prev" aria-label="Previous" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button class="fp-btn fp-btn-next" aria-label="Next" type="button">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
      </button>
    </div>`;
  block.append(header);

  // Track wrapper
  const trackWrapper = document.createElement('div');
  trackWrapper.className = 'fp-track-wrapper';
  const track = document.createElement('div');
  track.className = 'fp-track';
  trackWrapper.append(track);
  block.append(trackWrapper);

  // Fetch products
  try {
    const resp = await fetch(dataSource);
    if (!resp.ok) throw new Error('fetch failed');
    const data = await resp.json();
    const featured = (data.products || data.data || []).filter((p) => p.featured === true);

    if (!featured.length) {
      track.innerHTML = '<div class="fp-empty">No featured products available.</div>';
      return;
    }

    track.innerHTML = featured.map((p) => `
      <a class="fp-card" href="/product?id=${encodeURIComponent(p.id)}">
        <div class="fp-card-image" style="background-image:url('${esc(p.images?.default || '')}')"></div>
        <div class="fp-card-body">
          <span class="fp-card-category">${esc(p.category)}</span>
          <h3 class="fp-card-title">${esc(p.name)}</h3>
          <p class="fp-card-desc">${esc(p.description)}</p>
          <span class="fp-card-price">${money(p.basePrice)}</span>
        </div>
      </a>`).join('');

    // Carousel logic
    let idx = 0;
    const cards = track.querySelectorAll('.fp-card');
    const total = cards.length;
    const prev = header.querySelector('.fp-btn-prev');
    const next = header.querySelector('.fp-btn-next');

    function getVisible() {
      if (window.innerWidth <= 600) return 1;
      if (window.innerWidth <= 960) return 2;
      return 3;
    }

    function update() {
      const vis = getVisible();
      const max = Math.max(0, total - vis);
      idx = Math.max(0, Math.min(idx, max));
      if (cards.length) {
        const w = cards[0].offsetWidth;
        const gap = 32;
        track.style.transform = `translateX(-${idx * (w + gap)}px)`;
      }
      prev.disabled = idx <= 0;
      next.disabled = idx >= Math.max(0, total - getVisible());
    }

    prev.addEventListener('click', () => { idx -= 1; update(); });
    next.addEventListener('click', () => { idx += 1; update(); });
    window.addEventListener('resize', () => setTimeout(update, 100));

    let startX = 0;
    track.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].screenX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const diff = e.changedTouches[0].screenX - startX;
      if (diff < -50) { idx += 1; update(); }
      if (diff > 50) { idx -= 1; update(); }
    }, { passive: true });

    update();
  } catch (err) {
    track.innerHTML = '<div class="fp-empty">Unable to load products.</div>';
  }
}
