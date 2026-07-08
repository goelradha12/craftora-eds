/**
 * Hero Block — Craftora EDS
 * Merges the former `hero` (full-bleed image hero) and `hero-pages`
 * (inner-page banner / CTA card) blocks into one, split by variant:
 *
 * - Image variant (row 0 has an image in col 2): two-column hero with
 *   text + full-bleed image. Authored as:
 *     | Hero |
 *     | --- |
 *     | [heading] | [image] |
 *     | [description] | |
 *     | [cta link] | |
 *
 * - No-image variant (default `hero-pages` behaviour): inner-page banner,
 *   or `.cta` for the centered call-to-action card variant. Authored as:
 *     | Hero |
 *     | --- |
 *     | [heading] |
 *     | [description] |
 */

function decorateImageHero(block, rows, imageCol) {
  block.classList.add('has-image');

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-inner';

  const content = document.createElement('div');
  content.className = 'hero-content';

  // Move all rows' first-column content into text area
  rows.forEach((row) => {
    const firstCol = row.children[0];
    if (firstCol) {
      while (firstCol.firstChild) content.append(firstCol.firstChild);
    }
  });

  // Style the CTA link as a button
  const ctaLink = content.querySelector('a');
  if (ctaLink) {
    ctaLink.classList.add('hero-btn');
    const p = ctaLink.closest('p');
    if (p) p.classList.add('hero-btn-wrapper');
  }

  // Style emphasized text as highlight
  content.querySelectorAll('em').forEach((em) => {
    const span = document.createElement('span');
    span.className = 'hero-highlight';
    span.textContent = em.textContent;
    em.replaceWith(span);
  });

  wrapper.append(content);

  const imageDiv = document.createElement('div');
  imageDiv.className = 'hero-image';
  const img = imageCol.querySelector('img') || imageCol.querySelector('picture');
  if (img) imageDiv.append(img);
  wrapper.append(imageDiv);

  block.append(wrapper);

  const section = block.closest('.section');
  if (section) {
    section.classList.remove('section');
  }
}

function decoratePagesHero(block, rows) {
  block.classList.add('no-image');

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-banner-content';

  rows.forEach((row) => {
    const cell = row.children[0];
    if (cell) {
      while (cell.firstChild) wrapper.append(cell.firstChild);
    }
  });

  block.append(wrapper);
}

export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const row0 = rows[0];
  const cols = [...row0.children];
  const imageCol = cols[1];
  const hasImage = imageCol && (imageCol.querySelector('img') || imageCol.querySelector('picture'));

  block.textContent = '';

  if (hasImage) {
    decorateImageHero(block, rows, imageCol);
  } else {
    decoratePagesHero(block, rows);
  }
}
