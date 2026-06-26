import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Craftora Footer Block
 * Loads content from /footer and decorates it into a multi-column footer.
 *
 * Expected authored structure in /footer:
 *   Section 1: Brand paragraph(s) + multiple link groups (heading + ul each)
 *   ---
 *   Section 2: Copyright paragraph + legal links paragraph
 *
 * After loadFragment, EDS gives us:
 *   <main>
 *     <div class="section">
 *       <div class="default-content-wrapper">...all section 1 content...</div>
 *     </div>
 *     <div class="section">
 *       <div class="default-content-wrapper">...section 2 content...</div>
 *     </div>
 *   </main>
 */
export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  if (!fragment) return;

  block.textContent = '';
  const footer = document.createElement('div');
  footer.className = 'footer';

  // Get sections from the loaded fragment
  const sections = fragment.querySelectorAll(':scope > .section');

  // ═══════════════════════════════════════════════
  // SECTION 1 → Footer Top (4-column grid)
  // ═══════════════════════════════════════════════
  const topSection = sections[0];
  if (topSection) {
    const topGrid = document.createElement('div');
    topGrid.className = 'footer-top';

    // Get all content from the section's wrapper(s)
    const wrapper = topSection.querySelector('.default-content-wrapper');
    if (wrapper) {
      // Strategy: split content by <h3>/<h4> headings into columns
      // Everything before the first heading = brand column
      // Each heading + following content = a link column
      const children = [...wrapper.children];
      let currentCol = document.createElement('div');
      currentCol.className = 'footer-brand';
      let foundFirstHeading = false;

      children.forEach((child) => {
        const isHeading = /^H[2-4]$/.test(child.tagName);

        if (isHeading && !foundFirstHeading) {
          // First heading encountered — save brand column, start link column
          foundFirstHeading = true;
          topGrid.append(currentCol);
          currentCol = document.createElement('div');
          currentCol.className = 'footer-links';
          currentCol.append(child);
        } else if (isHeading && foundFirstHeading) {
          // Subsequent heading — new link column
          topGrid.append(currentCol);
          currentCol = document.createElement('div');
          currentCol.className = 'footer-links';
          currentCol.append(child);
        } else {
          currentCol.append(child);
        }
      });

      // Append the last column
      if (currentCol.children.length > 0) {
        topGrid.append(currentCol);
      }
    }

    footer.append(topGrid);
  }

  // ═══════════════════════════════════════════════
  // SECTION 2 → Footer Bottom (copyright + legal)
  // ═══════════════════════════════════════════════
  const bottomSection = sections[1];
  if (bottomSection) {
    const bottomBar = document.createElement('div');
    bottomBar.className = 'footer-bottom';

    const wrapper = bottomSection.querySelector('.default-content-wrapper');
    if (wrapper) {
      while (wrapper.firstChild) bottomBar.append(wrapper.firstChild);
    }

    footer.append(bottomBar);
  }

  block.append(footer);
}
