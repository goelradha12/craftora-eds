import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';
import { getUser } from '../../scripts/auth.js';

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

  // Logged in: hide Sign In/Sign Up, show My Orders instead (legacy layout.js behavior)
  if (getUser()) {
    const signInLink = footer.querySelector('a[href="/login"]');
    const accountList = signInLink?.closest('ul');
    footer.querySelectorAll('a[href="/login"], a[href="/signup"]')
      .forEach((a) => a.closest('li')?.remove());

    if (accountList) {
      [['/account', 'My Account'], ['/account#my-orders', 'My Orders']].reverse().forEach(([href, label]) => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = href;
        a.textContent = label;
        li.append(a);
        accountList.prepend(li);
      });
    }
  }

  block.append(footer);
}

/**
 * Decorates the brand column to match the original layout HTML structure.
 * Social links are authored in DA Live as icon-shorthand paragraphs, e.g.
 * ":instagram: [Instagram](https://instagram.com/craftora)" — decorateIcons()
 * (run earlier via decorateMain on the fragment) turns ":instagram:" into
 * <span class="icon icon-instagram"><img></span> alongside the link.
 */
function decorateBrandColumn(col) {
  const paragraphs = [...col.querySelectorAll('p')];
  const socialParagraphs = paragraphs.filter((p) => p.querySelector('a') && p.querySelector('.icon'));
  const contentParagraphs = paragraphs.filter((p) => !socialParagraphs.includes(p));

  // P1: Logo (Wrap picture in anchor tag)
  if (contentParagraphs[0] && contentParagraphs[0].querySelector('picture')) {
    const a = document.createElement('a');
    a.href = '/';
    a.setAttribute('aria-label', 'Craftora Home');
    a.className = 'footer-logo';
    col.replaceChild(a, contentParagraphs[0]);
    a.append(contentParagraphs[0].querySelector('picture'));
  }

  // P2: Tagline
  if (contentParagraphs[1]) {
    contentParagraphs[1].className = 'footer-tagline';
  }

  // P3+: Address
  if (contentParagraphs.length > 2) {
    const address = document.createElement('address');
    address.className = 'footer-address';
    for (let i = 2; i < contentParagraphs.length; i++) {
      address.append(contentParagraphs[i]);
    }
    col.append(address);
  }

  // Social links: use the authored link + icon directly, no JS-generated hrefs
  if (socialParagraphs.length) {
    const socials = document.createElement('div');
    socials.className = 'footer-socials';
    socialParagraphs.forEach((p) => {
      const a = p.querySelector('a');
      const icon = p.querySelector('.icon');
      a.setAttribute('aria-label', a.textContent.trim());
      a.textContent = '';
      a.append(icon);
      socials.append(a);
    });
    col.append(socials);
  }
}