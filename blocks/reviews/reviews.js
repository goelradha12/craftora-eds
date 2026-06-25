/**
 * Reviews Block — Craftora EDS
 * Testimonial carousel with prev/next navigation and touch-swipe.
 *
 * Authored as a table:
 * | Reviews |
 * | --- |
 * | [quote text] | [author name] | [location] |
 * | [quote text] | [author name] | [location] |
 * | ... |
 */

function createStars(count = 5) {
  const star = '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>';
  return star.repeat(count);
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  block.textContent = '';

  // Navigation
  const nav = document.createElement('div');
  nav.className = 'reviews-nav';
  nav.innerHTML = `
    <button class="reviews-btn reviews-btn-prev" aria-label="Previous review" type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
    <button class="reviews-btn reviews-btn-next" aria-label="Next review" type="button">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
    </button>`;
  block.append(nav);

  // Track
  const track = document.createElement('div');
  track.className = 'reviews-track';

  rows.forEach((row) => {
    const cols = [...row.children];
    const quoteText = cols[0]?.textContent?.trim() || '';
    const authorName = cols[1]?.textContent?.trim() || '';
    const location = cols[2]?.textContent?.trim() || '';

    const card = document.createElement('div');
    card.className = 'reviews-card';
    card.innerHTML = `
      <div class="reviews-stars" aria-label="5 out of 5 stars">${createStars(5)}</div>
      <p class="reviews-quote">"${quoteText}"</p>
      <div class="reviews-author">
        <span class="reviews-author-name">${authorName}</span>
        ${location ? `<span class="reviews-author-location">${location}</span>` : ''}
      </div>`;
    track.append(card);
  });

  const wrapper = document.createElement('div');
  wrapper.className = 'reviews-track-wrapper';
  wrapper.append(track);
  block.append(wrapper);

  // Carousel logic
  let currentIndex = 0;
  const cards = track.querySelectorAll('.reviews-card');
  const total = cards.length;
  const prevBtn = nav.querySelector('.reviews-btn-prev');
  const nextBtn = nav.querySelector('.reviews-btn-next');

  function getVisible() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 960) return 2;
    return 3;
  }

  function update() {
    const visible = getVisible();
    const max = Math.max(0, total - visible);
    currentIndex = Math.max(0, Math.min(currentIndex, max));
    if (cards.length > 0) {
      const cardWidth = cards[0].offsetWidth;
      const gap = 24;
      track.style.transform = `translateX(-${currentIndex * (cardWidth + gap)}px)`;
    }
    prevBtn.disabled = currentIndex <= 0;
    nextBtn.disabled = currentIndex >= Math.max(0, total - getVisible());
  }

  prevBtn.addEventListener('click', () => { currentIndex -= 1; update(); });
  nextBtn.addEventListener('click', () => { currentIndex += 1; update(); });

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(update, 100);
  });

  // Touch swipe
  let startX = 0;
  track.addEventListener('touchstart', (e) => { startX = e.changedTouches[0].screenX; }, { passive: true });
  track.addEventListener('touchend', (e) => {
    const diff = e.changedTouches[0].screenX - startX;
    if (diff < -50) { currentIndex += 1; update(); }
    if (diff > 50) { currentIndex -= 1; update(); }
  }, { passive: true });

  update();
}
