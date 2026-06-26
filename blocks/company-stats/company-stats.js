/**
 * Company Stats Block — Craftora EDS
 * Dark background stats grid with large numbers + labels.
 *
 * Authored as a table:
 * | Company Stats |   |
 * | ---           | --- |
 * | 12K+          | Happy Customers |
 * | 50K+          | Products Shipped |
 * | 98%           | Satisfaction Rate |
 * | 4+            | Years in Business |
 */
export default function decorate(block) {
  const rows = [...block.children];
  block.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'stats-grid';

  rows.forEach((row) => {
    const cols = [...row.children];
    const number = cols[0]?.textContent?.trim() || '';
    const label = cols[1]?.textContent?.trim() || '';

    const item = document.createElement('div');
    item.className = 'stats-item';
    item.innerHTML = `
      <span class="stats-number">${number}</span>
      <span class="stats-label">${label}</span>`;
    grid.append(item);
  });

  block.append(grid);
}
