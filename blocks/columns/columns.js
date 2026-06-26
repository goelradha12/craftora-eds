export default function decorate(block) {
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

  // setup image columns
  [...block.children].forEach((row) => {
    [...row.children].forEach((col) => {
      const pic = col.querySelector('picture');
      if (pic) {
        const picWrapper = pic.closest('div');
        if (picWrapper && picWrapper.children.length === 1) {
          picWrapper.classList.add('columns-img-col');
        }
      }

      // Convert Google Maps links into embedded iframes
      const mapLink = col.querySelector('a[href*="maps.google"], a[href*="google.com/maps"], a[href*="goo.gl/maps"]');
      if (mapLink) {
        const href = mapLink.getAttribute('href');
        const mapWrapper = document.createElement('div');
        mapWrapper.className = 'columns-map-col';

        const iframe = document.createElement('iframe');
        iframe.src = `https://maps.google.com/maps?q=${encodeURIComponent(extractMapQuery(href))}&output=embed`;
        iframe.setAttribute('loading', 'lazy');
        iframe.setAttribute('allowfullscreen', '');
        iframe.setAttribute('referrerpolicy', 'no-referrer-when-downgrade');
        iframe.setAttribute('aria-label', 'Location on Google Maps');
        iframe.style.border = 'none';
        iframe.style.width = '100%';
        iframe.style.height = '100%';

        mapWrapper.append(iframe);

        // Replace the paragraph containing the link with the map
        const linkParent = mapLink.closest('p') || mapLink.closest('div');
        if (linkParent) {
          linkParent.replaceWith(mapWrapper);
        } else {
          col.textContent = '';
          col.append(mapWrapper);
        }
      }
    });
  });
}

/**
 * Extracts a search query from a Google Maps URL.
 * Handles formats like:
 *   - https://maps.google.com/?q=address+text
 *   - https://www.google.com/maps/place/address
 */
function extractMapQuery(url) {
  try {
    const u = new URL(url);
    // ?q= parameter
    const q = u.searchParams.get('q');
    if (q) return q;
    // /maps/place/... format
    const placeMatch = u.pathname.match(/\/place\/([^/]+)/);
    if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    // Fallback: use full URL
    return url;
  } catch {
    return url;
  }
}
