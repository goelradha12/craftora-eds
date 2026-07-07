import { esc, getOrders } from '../../scripts/cart-utils.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
 * Builds the contact form markup + wires up its (client-side only — there's
 * no backend endpoint) submit/validate/success-swap behavior. Matches
 * legacy craftora/contact.html's simulated-submit UX.
 * @param {string} heading
 * @param {string} subheading
 * @returns {HTMLElement}
 */
function buildContactForm(heading, subheading) {
  const wrap = document.createElement('div');
  wrap.className = 'columns-form-form';
  wrap.innerHTML = `
    <h2 class="columns-form-heading">${esc(heading)}</h2>
    <p class="columns-form-subheading">${esc(subheading)}</p>
    <div class="columns-form-error" role="alert" hidden></div>
    <form class="columns-form-fields" novalidate>
      <div class="columns-form-row">
        <div class="columns-form-field">
          <label for="cf-name" class="columns-form-label-required">Name</label>
          <input type="text" id="cf-name" name="name" placeholder="Jane Doe" required>
        </div>
        <div class="columns-form-field">
          <label for="cf-email" class="columns-form-label-required">Email</label>
          <input type="email" id="cf-email" name="email" placeholder="jane@example.com" required>
        </div>
      </div>
      <div class="columns-form-field">
        <label for="cf-subject" class="columns-form-label-required">Subject</label>
        <select id="cf-subject" name="subject" required>
          <option value="">Select a subject</option>
          <option value="General">General Inquiry</option>
          <option value="Order">Order Status</option>
          <option value="Bulk">Bulk/Corporate Order</option>
        </select>
      </div>
      <div class="columns-form-field">
        <label for="cf-message" class="columns-form-label-required">Message</label>
        <textarea id="cf-message" name="message" placeholder="How can we help you?" rows="5" required></textarea>
      </div>
      <button type="submit" class="button accent columns-form-submit">
        <span class="columns-form-submit-text">Send Message</span>
      </button>
    </form>
    <div class="columns-form-success" hidden>
      <div class="columns-form-success-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      </div>
      <h3>Message Sent!</h3>
      <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
      <a href="#" class="columns-form-again">Send another message</a>
    </div>`;

  const heading$ = wrap.querySelector('.columns-form-heading');
  const subheading$ = wrap.querySelector('.columns-form-subheading');
  const form = wrap.querySelector('.columns-form-fields');
  const errorEl = wrap.querySelector('.columns-form-error');
  const successEl = wrap.querySelector('.columns-form-success');
  const submitBtn = wrap.querySelector('.columns-form-submit');
  const submitText = submitBtn.querySelector('.columns-form-submit-text');

  const showForm = (show) => {
    form.hidden = !show;
    heading$.hidden = !show;
    subheading$.hidden = !show;
    successEl.hidden = show;
  };

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    errorEl.hidden = true;

    const name = form.name.value.trim();
    const email = form.email.value.trim();
    const subject = form.subject.value;
    const message = form.message.value.trim();

    if (!name || !email || !subject || !message) {
      errorEl.textContent = 'Please fill in all required fields.';
      errorEl.hidden = false;
      return;
    }
    if (!EMAIL_RE.test(email)) {
      errorEl.textContent = 'Please enter a valid email address.';
      errorEl.hidden = false;
      return;
    }

    submitBtn.disabled = true;
    submitText.textContent = 'Sending…';
    setTimeout(() => {
      submitBtn.disabled = false;
      submitText.textContent = 'Send Message';
      showForm(false);
    }, 700);
  });

  wrap.querySelector('.columns-form-again').addEventListener('click', (e) => {
    e.preventDefault();
    form.reset();
    errorEl.hidden = true;
    showForm(true);
  });

  return wrap;
}

/**
 * `form-right` variant — contact page.
 * Authored rows:
 *   [Contact Information col, Send us a message col]   (row 0 — two columns)
 *   [contact-method col]                                (one row per card)
 *   ...
 *
 * Left = intro content (row 0, col 0) + stacked contact-method cards (every
 * row after row 0, each a single-column card).
 * Right = a fully rendered contact form seeded from row 0, col 1's
 * heading/paragraph (client-side only — no backend endpoint exists —
 * matches legacy's simulated-submit UX).
 */
function decorateFormRight(block) {
  const rows = [...block.children];
  if (rows.length < 1) return;

  const firstRow = rows[0];
  const cardRows = rows.slice(1);

  const [content, formIntroCol] = [...firstRow.children];
  const cardCols = cardRows.flatMap((row) => [...row.children]);

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

  const heading = formIntroCol?.querySelector('h1, h2, h3')?.textContent?.trim() || 'Send us a message';
  const subheading = formIntroCol?.querySelector('p')?.textContent?.trim()
    || "We'll get back to you as soon as possible.";

  const right = document.createElement('div');
  right.className = 'columns-form-right-col';
  right.append(buildContactForm(heading, subheading));

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
