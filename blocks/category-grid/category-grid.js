/**
 * Category Grid Block — Craftora EDS
 * Renders a responsive grid of linked category cards.
 *
 * Authored as a table:
 * | Category Grid |
 * | --- |
 * | [image] | [link with category name as text] |
 * | [image] | [link] |
 * | ... | ... |
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  block.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'category-grid-cards';

  rows.forEach((row) => {
    const cols = [...row.children];
    const imageCol = cols[0];
    const linkCol = cols[1];

    const card = document.createElement('a');
    card.className = 'category-card';

    // Get link destination
    const link = linkCol?.querySelector('a');
    card.href = link?.href || '#';

    // Image
    const img = imageCol?.querySelector('img') || imageCol?.querySelector('picture');
    if (img) {
      const imgWrap = document.createElement('div');
      imgWrap.className = 'category-card-image';
      imgWrap.append(img);
      card.append(imgWrap);
    }

    // Title (from link text)
    const title = document.createElement('div');
    title.className = 'category-card-title';
    const h3 = document.createElement('h3');
    h3.textContent = link?.textContent || linkCol?.textContent?.trim() || '';
    title.append(h3);
    card.append(title);

    grid.append(card);
  });

  block.append(grid);
}
