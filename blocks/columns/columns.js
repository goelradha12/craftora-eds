import { esc, getOrders } from '../../scripts/cart-utils.js';

/**
 * `thank-you` variant — order confirmation card.
 * Authored rows: [heading + message] · [detail labels] · [CTA] · [CTA].
 * Order data comes from ?orderId= → localStorage.lastOrderId → latest order,
 * via the shared cart-utils; missing data falls back gracefully.
 */
function decorateThankYou(block) {
  const rows = [...block.children];
  const heading = block.querySelector('h1, h2')?.textContent?.trim() || 'Thank You for Your Order!';
  const message = rows[0]?.querySelector('p')?.textContent?.trim()
    || 'Your order has been placed successfully.';
  const labels = [...(rows[1]?.querySelectorAll('p') || [])].map((p) => p.textContent.trim()).filter(Boolean);
  const detailLabels = labels.length ? labels : ['Order ID', 'Estimated Delivery', 'Payment'];
  const ctas = [...block.querySelectorAll('a')]
    .map((a) => ({ href: a.getAttribute('href') || '#', text: a.textContent.trim() }));

  // Resolve the order via shared utilities (no duplicated storage logic).
  const orderId = new URLSearchParams(window.location.search).get('orderId')
    || localStorage.getItem('lastOrderId') || '';
  let order = null;
  try {
    const orders = getOrders();
    order = (orderId && orders.find((o) => String(o.id) === String(orderId))) || orders[0] || null;
  } catch { order = null; }

  const resolvedId = order?.id || orderId;
  const values = {
    id: resolvedId ? `#${resolvedId}` : '—',
    delivery: '5–7 Business Days',
    payment: order?.payment?.label || 'Confirmed',
  };
  const valueFor = (label) => {
    const k = label.toLowerCase();
    if (k.includes('order')) return values.id;
    if (k.includes('deliver')) return values.delivery;
    if (k.includes('payment')) return values.payment;
    return '—';
  };

  const check = '<svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>';
  const detailsHTML = detailLabels.map((label) => `<div class="columns-thankyou-row">
      <span class="columns-thankyou-label">${esc(label)}</span>
      <span class="columns-thankyou-value">${esc(valueFor(label))}</span>
    </div>`).join('');
  const actionsHTML = ctas.length
    ? `<div class="columns-thankyou-actions">${ctas.map((c, i) => `<a class="columns-thankyou-btn ${i === 0 ? 'primary' : 'secondary'}" href="${esc(c.href)}">${esc(c.text)}</a>`).join('')}</div>`
    : '';

  block.innerHTML = `<div class="columns-thankyou">
    <div class="columns-thankyou-icon">${check}</div>
    <h1 class="columns-thankyou-heading">${esc(heading)}</h1>
    <p class="columns-thankyou-message">${esc(message)}</p>
    <div class="columns-thankyou-details">${detailsHTML}</div>
    ${actionsHTML}
  </div>`;
}

/**
 * `form-right` variant — contact page.
 * Authored rows:
 *   [Contact Information col, first contact-method col]
 *   [contact-method col] · ... (middle rows, one card each)
 *   [Send us a message col]   (last row — will hold the nested contact-form block)
 *
 * Left = intro content + stacked contact-method cards.
 * Right = the form intro column, preserved as authored (a future contact-form
 * block nested in that cell renders itself independently).
 */
function decorateFormRight(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  const firstRow = rows[0];
  const lastRow = rows[rows.length - 1];
  const middleRows = rows.slice(1, -1);

  const firstRowCols = [...firstRow.children];
  const content = firstRowCols.shift();
  const cardCols = [...firstRowCols, ...middleRows.flatMap((row) => [...row.children])];
  const formIntroCols = [...lastRow.children];

  const grid = document.createElement('div');
  grid.className = 'columns-form-right-grid';

  const left = document.createElement('div');
  left.className = 'columns-form-left';
  if (content) {
    content.classList.add('columns-form-content');
    left.append(content);
  }

  const cardsWrap = document.createElement('div');
  cardsWrap.className = 'columns-form-cards';
  cardCols.forEach((col) => {
    col.classList.add('columns-form-card');
    cardsWrap.append(col);
  });
  left.append(cardsWrap);

  const right = document.createElement('div');
  right.className = 'columns-form-right-col';
  formIntroCols.forEach((col) => {
    col.classList.add('columns-form-content');
    right.append(col);
  });

  grid.append(left, right);
  block.replaceChildren(grid);
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

export default function decorate(block) {
  if (block.classList.contains('thank-you')) {
    decorateThankYou(block);
    return;
  }

  if (block.classList.contains('form-right')) {
    decorateFormRight(block);
    return;
  }

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
