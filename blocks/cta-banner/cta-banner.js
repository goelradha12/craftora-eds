/**
 * CTA Banner Block — Craftora EDS
 * Centered call-to-action section with heading, description, and button.
 *
 * Authored as a table:
 * | CTA Banner |
 * | --- |
 * | [heading] |
 * | [description] |
 * | [cta link] |
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'cta-banner-content';

  rows.forEach((row) => {
    const cell = row.children[0];
    if (cell) {
      while (cell.firstChild) wrapper.append(cell.firstChild);
    }
  });

  // Style the CTA link as a button
  const link = wrapper.querySelector('a');
  if (link) {
    link.classList.add('cta-banner-btn');
    // Remove button-wrapper class if EDS added it
    const p = link.closest('p');
    if (p) p.classList.add('cta-banner-btn-wrapper');
  }

  block.append(wrapper);
}
