/*
 * Fragment Block — Craftora EDS
 * Standard AEM EDS fragment loader used by header and footer blocks.
 * Fetches a content document path, decorates it, and returns it as an HTMLElement.
 */

import { decorateBlocks, decorateIcons, decorateSections } from '../../scripts/aem.js';

/**
 * Loads a fragment from the given path and returns the decorated HTML element.
 * @param {string} path The path to the fragment document (e.g. '/nav', '/footer')
 * @returns {Promise<HTMLElement|null>} The decorated fragment element, or null on failure
 */
export async function loadFragment(path) {
  if (path && path.startsWith('/')) {
    const resp = await fetch(`${path}.plain.html`);
    if (resp.ok) {
      const main = document.createElement('main');
      main.innerHTML = await resp.text();
      // Run core decoration pipeline (no auto-blocks needed for header/footer)
      decorateIcons(main);
      decorateSections(main);
      decorateBlocks(main);
      return main;
    }
  }
  return null;
}

/**
 * Default block decorator — replaces block content with the loaded fragment.
 * @param {HTMLElement} block The fragment block element
 */
export default async function decorate(block) {
  const link = block.querySelector('a');
  const path = link ? link.getAttribute('href') : block.textContent.trim();
  const fragment = await loadFragment(path);
  if (fragment) {
    const fragmentSection = fragment.querySelector(':scope > .section');
    if (fragmentSection) {
      block.closest('.section').classList.add(...fragmentSection.classList);
    }
    block.closest('.section').replaceWith(...fragment.childNodes);
  }
}
