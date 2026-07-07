/**
 * Scroll-to-top button. Added once, site-wide, since this module is loaded
 * exactly once per page (see loadDelayed in scripts.js).
 */
function initScrollToTop() {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'scroll-to-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 19V5M5 12l7-7 7 7"/></svg>';
  document.body.append(btn);

  const updateVisibility = () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  };
  updateVisibility();
  window.addEventListener('scroll', updateVisibility, { passive: true });

  btn.addEventListener('click', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
}

initScrollToTop();
