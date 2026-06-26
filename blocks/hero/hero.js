/**
 * Hero Block — Craftora EDS
 * Two-column hero: text (heading, description, CTA) + image.
 *
 * Authored as a table:
 * | Hero |
 * | --- |
 * | [heading] | [image] |
 * | [description] | |
 * | [cta link] | |
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Row 0: heading (col1) + image (col2)
  const row0 = rows[0];
  const cols = [...row0.children];
  const textCol = cols[0];
  const imageCol = cols[1];

  // Build structure
  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-wrapper';

  // Text content
  const content = document.createElement('div');
  content.className = 'hero-content';

  // Move all rows' first-column content into text area
  rows.forEach((row, i) => {
    const firstCol = row.children[0];
    if (i === 0 && firstCol) {
      // Heading — style em/strong as highlight
      while (firstCol.firstChild) content.append(firstCol.firstChild);
    } else if (firstCol) {
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

  // Image
  if (imageCol) {
    const imageDiv = document.createElement('div');
    imageDiv.className = 'hero-image';
    const img = imageCol.querySelector('img') || imageCol.querySelector('picture');
    if (img) imageDiv.append(img);
    wrapper.append(imageDiv);
  }

  block.append(wrapper);
}
