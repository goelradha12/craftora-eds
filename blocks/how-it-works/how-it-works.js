/**
 * How It Works Block — Craftora EDS
 * 4-step process grid with circular images and titles.
 *
 * Authored as a table:
 * | How It Works |
 * | --- |
 * | [image] | [step title] |
 * | [image] | [step title] |
 * | [image] | [step title] |
 * | [image] | [step title] |
 */
export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  block.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'hiw-grid';

  rows.forEach((row) => {
    const cols = [...row.children];
    const imageCol = cols[0];
    const textCol = cols[1];

    const step = document.createElement('div');
    step.className = 'hiw-step';

    // Image
    const img = imageCol?.querySelector('img') || imageCol?.querySelector('picture');
    if (img) {
      img.classList.add('hiw-step-img');
      step.append(img);
    }

    // Title
    const title = document.createElement('h3');
    title.className = 'hiw-step-title';
    title.textContent = textCol?.textContent?.trim() || '';
    step.append(title);

    grid.append(step);
  });

  block.append(grid);
}
