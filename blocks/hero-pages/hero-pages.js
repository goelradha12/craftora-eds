/**
 * Hero Pages Block — Craftora EDS
 * Inner-page hero banner with heading + description.
 * Blue tinted background matching legacy .hero-content section.
 *
 * Authored as a table:
 * | Hero Pages |
 * | --- |
 * | [heading] |
 * | [description] |
 */
export default function decorate(block) {
  // Content is already in place from EDS decoration.
  // Just ensure correct structure — extract content from row/cell wrappers.
  const rows = [...block.children];
  block.textContent = '';

  const wrapper = document.createElement('div');
  wrapper.className = 'hero-pages-content';

  rows.forEach((row) => {
    const cell = row.children[0];
    if (cell) {
      while (cell.firstChild) wrapper.append(cell.firstChild);
    }
  });

  block.append(wrapper);
}
