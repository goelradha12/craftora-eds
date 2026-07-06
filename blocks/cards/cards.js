import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  /* change to ul, li */
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-card-image';
      else div.className = 'cards-card-body';
    });
    ul.append(li);
  });
  ul.querySelectorAll('picture > img').forEach((img) => img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }])));
  block.replaceChildren(ul);

  // Image-content cards (e.g. category cards) are styled as fully clickable
  // (cursor: pointer on the whole li) but only wrap their title text in an
  // <a>. Make clicks anywhere on the card follow that link, matching the
  // legacy single-anchor category card.
  if (block.classList.contains('image-content')) {
    [...ul.children].slice(1).forEach((li) => {
      const link = li.querySelector('a[href]');
      if (!link) return;
      li.addEventListener('click', (e) => {
        if (e.target.closest('a')) return;
        window.location.href = link.href;
      });
    });
  }
}
