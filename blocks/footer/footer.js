import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

export default async function decorate(block) {
  const footerMeta = getMetadata('footer');
  const footerPath = footerMeta ? new URL(footerMeta, window.location).pathname : '/footer';
  const fragment = await loadFragment(footerPath);

  if (!fragment) return;

  block.textContent = '';
  
  // Create main container
  const footer = document.createElement('div');
  footer.className = 'footer-container';

  const sections = fragment.querySelectorAll(':scope > .section');

  // ═══════════════════════════════════════════════
  // SECTION 1 → Footer Top (4-column grid)
  // ═══════════════════════════════════════════════
  const topSection = sections[0];
  if (topSection) {
    const topGrid = document.createElement('div');
    topGrid.className = 'footer-top container'; // Added .container class

    const wrapper = topSection.querySelector('.default-content-wrapper');
    if (wrapper) {
      const children = [...wrapper.children];
      let currentCol = document.createElement('div');
      currentCol.className = 'footer-brand';
      let foundFirstHeading = false;

      children.forEach((child) => {
        const isHeading = /^H[2-4]$/.test(child.tagName);

        if (isHeading && !foundFirstHeading) {
          // First heading found: decorate the brand column, then start a link column
          decorateBrandColumn(currentCol);
          topGrid.append(currentCol);
          foundFirstHeading = true;
          
          currentCol = document.createElement('div');
          currentCol.className = 'footer-links';
          currentCol.append(child);
        } else if (isHeading && foundFirstHeading) {
          // Subsequent heading: start a new link column
          topGrid.append(currentCol);
          currentCol = document.createElement('div');
          currentCol.className = 'footer-links';
          currentCol.append(child);
        } else {
          currentCol.append(child);
        }
      });

      // Append the final column
      if (currentCol.children.length > 0) {
        if (!foundFirstHeading) decorateBrandColumn(currentCol); // Failsafe
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
    bottomBar.className = 'footer-bottom container'; // Added .container class

    const wrapper = bottomSection.querySelector('.default-content-wrapper');
    if (wrapper) {
      const paragraphs = wrapper.querySelectorAll('p');
      
      // Copyright text
      if (paragraphs.length >= 1) {
        bottomBar.append(paragraphs[0]); 
      }
      
      // Legal Links (Split by '|')
      if (paragraphs.length >= 2) {
         const linksDiv = document.createElement('div');
         linksDiv.className = 'footer-bottom-links';
         
         const text = paragraphs[1].textContent;
         const items = text.split('|').map(s => s.trim());
         
         // Map the text to actual URLs matching your layout
         const linkMap = {
           'Return Policy': '/return-policy',
           'Privacy Policy': '/privacy-policy',
           'Terms & Conditions': '/terms'
         };
         
         items.forEach(item => {
            const a = document.createElement('a');
            a.href = linkMap[item] || '#';
            a.textContent = item;
            linksDiv.append(a);
         });
         bottomBar.append(linksDiv);
      }
    }

    footer.append(bottomBar);
  }

  block.append(footer);
}

/**
 * Decorates the brand column to match the original layout HTML structure
 */
function decorateBrandColumn(col) {
  const paragraphs = [...col.querySelectorAll('p')];

  // P1: Logo (Wrap picture in anchor tag)
  if (paragraphs[0] && paragraphs[0].querySelector('picture')) {
    const a = document.createElement('a');
    a.href = '/';
    a.setAttribute('aria-label', 'Craftora Home');
    a.className = 'footer-logo';
    col.replaceChild(a, paragraphs[0]);
    a.append(paragraphs[0].querySelector('picture'));
  }

  // P2: Tagline
  if (paragraphs[1]) {
    paragraphs[1].className = 'footer-tagline';
  }

  // P3+: Address
  if (paragraphs.length > 2) {
    const address = document.createElement('address');
    address.className = 'footer-address';
    for (let i = 2; i < paragraphs.length; i++) {
      address.append(paragraphs[i]);
    }
    col.append(address);
  }

  // Inject Hardcoded Socials
  const socials = document.createElement('div');
  socials.className = 'footer-socials';
  socials.innerHTML = `
    <a href="#" aria-label="Instagram">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
    </a>
    <a href="#" aria-label="Facebook">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
    </a>
    <a href="#" aria-label="X (Twitter)">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 4l11.733 16h4.267l-11.733 -16z"/><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"/></svg>
    </a>
    <a href="#" aria-label="Pinterest">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><line x1="12" y1="12" x2="12" y2="22"></line><path d="M12 2a8 8 0 0 0-8 8c0 2.8 1.5 5.2 3.8 6.5"></path><path d="M8 16.5c1.5-3.5 3-7 3-7"></path><path d="M11 9.5a2.5 2.5 0 0 1 5 0c0 3.5-2 6.5-5 6.5-1.5 0-2.5-1-2.5-2.5"></path></svg>
    </a>
    <a href="#" aria-label="YouTube">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33 2.78 2.78 0 0 0 1.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.33 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
    </a>
  `;
  col.append(socials);
}