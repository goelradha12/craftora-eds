/**
 * Columns Block — Craftora EDS
 *
 * Standard variant: generic 2+ column layout (image/text, text/map, etc.)
 * Contact variant:  triggered when block has class "contact"
 *   Row 1 → [Left heading+desc] [Right heading+desc]
 *   Rows 2+ → [Label] [Value] ([Note]) → rendered as info cards on the left
 *   Right column → JS-injected contact form
 */

/**
 * Extracts a search query from a Google Maps URL.
 */
function extractMapQuery(url) {
  try {
    const u = new URL(url);
    const q = u.searchParams.get('q');
    if (q) return q;
    const placeMatch = u.pathname.match(/\/place\/([^/]+)/);
    if (placeMatch) return decodeURIComponent(placeMatch[1].replace(/\+/g, ' '));
    return url;
  } catch {
    return url;
  }
}

/* ── Icons (inline SVG for contact info cards) ── */
const CONTACT_ICONS = {
  email: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.18 2 2 0 0 1 3.6 1h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.6a16 16 0 0 0 6.06 6.06l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  address: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>`,
  default: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>`,
};

function pickIcon(label) {
  const l = label.toLowerCase();
  if (l.includes('email') || l.includes('mail')) return CONTACT_ICONS.email;
  if (l.includes('phone') || l.includes('tel') || l.includes('call')) return CONTACT_ICONS.phone;
  if (l.includes('address') || l.includes('studio') || l.includes('location')) return CONTACT_ICONS.address;
  return CONTACT_ICONS.default;
}

/* ── Contact form builder ── */
function buildContactForm() {
  const form = document.createElement('form');
  form.className = 'columns-contact-form';
  form.noValidate = true;
  form.innerHTML = `
    <div class="ccf-row ccf-row-2">
      <div class="ccf-field">
        <label for="ccf-name">Full Name</label>
        <input id="ccf-name" name="name" type="text" placeholder="Jane Smith" required>
        <span class="ccf-error" aria-live="polite"></span>
      </div>
      <div class="ccf-field">
        <label for="ccf-email">Email Address</label>
        <input id="ccf-email" name="email" type="email" placeholder="jane@example.com" required>
        <span class="ccf-error" aria-live="polite"></span>
      </div>
    </div>
    <div class="ccf-field">
      <label for="ccf-subject">Subject</label>
      <select id="ccf-subject" name="subject" required>
        <option value="" disabled selected>Select a topic...</option>
        <option value="general">General Inquiry</option>
        <option value="order">Order Status</option>
        <option value="bulk">Bulk / Corporate Order</option>
        <option value="design">Design Help</option>
        <option value="returns">Returns &amp; Refunds</option>
        <option value="other">Other</option>
      </select>
      <span class="ccf-error" aria-live="polite"></span>
    </div>
    <div class="ccf-field">
      <label for="ccf-message">Message</label>
      <textarea id="ccf-message" name="message" placeholder="Tell us how we can help you…" rows="5" required></textarea>
      <span class="ccf-error" aria-live="polite"></span>
    </div>
    <div class="ccf-actions">
      <button type="submit" class="ccf-submit button accent">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/></svg>
        Send Message
      </button>
    </div>
    <div class="ccf-success" hidden aria-live="polite">
      <div class="ccf-success-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
      </div>
      <h3>Message Sent!</h3>
      <p>Thanks for reaching out. We'll get back to you within 24 hours.</p>
      <button type="button" class="ccf-reset button secondary">Send another message</button>
    </div>`;

  // Validation + submit
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    let valid = true;

    form.querySelectorAll('[required]').forEach((field) => {
      const err = field.closest('.ccf-field')?.querySelector('.ccf-error');
      if (!field.value.trim()) {
        if (err) err.textContent = 'This field is required.';
        field.classList.add('ccf-invalid');
        valid = false;
      } else if (field.type === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value)) {
        if (err) err.textContent = 'Enter a valid email address.';
        field.classList.add('ccf-invalid');
        valid = false;
      } else {
        if (err) err.textContent = '';
        field.classList.remove('ccf-invalid');
      }
    });

    if (!valid) return;

    const btn = form.querySelector('.ccf-submit');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    // Simulate submission
    setTimeout(() => {
      form.querySelector('.ccf-success').hidden = false;
      form.querySelectorAll('.ccf-row, .ccf-field, .ccf-actions').forEach((el) => {
        el.style.display = 'none';
      });
    }, 900);
  });

  // Reset
  form.querySelector('.ccf-reset')?.addEventListener('click', () => {
    form.reset();
    form.querySelectorAll('.ccf-row, .ccf-field, .ccf-actions').forEach((el) => {
      el.style.display = '';
    });
    form.querySelector('.ccf-success').hidden = true;
    const btn = form.querySelector('.ccf-submit');
    if (btn) { btn.disabled = false; btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7z"/></svg> Send Message`; }
  });

  // Live inline validation
  form.querySelectorAll('[required]').forEach((field) => {
    field.addEventListener('blur', () => {
      const err = field.closest('.ccf-field')?.querySelector('.ccf-error');
      if (!field.value.trim()) {
        if (err) err.textContent = 'This field is required.';
        field.classList.add('ccf-invalid');
      } else {
        if (err) err.textContent = '';
        field.classList.remove('ccf-invalid');
      }
    });
  });

  return form;
}

/* ── Contact variant decorator ── */
function decorateContactVariant(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  // Row 0 → headings for left and right panels
  const headerRow = rows[0];
  const [leftHead, rightHead] = [...headerRow.children];

  // Rows 1+ → contact info items [label, value, note?]
  const infoRows = rows.slice(1);

  // Build the contact layout wrapper
  const layout = document.createElement('div');
  layout.className = 'columns-contact-layout';

  // ── LEFT PANEL ──
  const leftPanel = document.createElement('div');
  leftPanel.className = 'columns-contact-left';

  // Left heading content
  if (leftHead) {
    const leftMeta = document.createElement('div');
    leftMeta.className = 'columns-contact-left-meta';
    leftMeta.append(...leftHead.childNodes);
    leftPanel.append(leftMeta);
  }

  // Info cards
  const cards = document.createElement('div');
  cards.className = 'columns-contact-cards';

  infoRows.forEach((row) => {
    const cells = [...row.children];
    if (!cells.length) return;

    const label = cells[0]?.textContent.trim() || '';
    const valueEl = cells[1];
    const noteEl = cells[2];

    const card = document.createElement('div');
    card.className = 'columns-contact-card';

    const iconWrap = document.createElement('div');
    iconWrap.className = 'columns-contact-card-icon';
    iconWrap.innerHTML = pickIcon(label);

    const content = document.createElement('div');
    content.className = 'columns-contact-card-content';

    const labelEl = document.createElement('span');
    labelEl.className = 'columns-contact-card-label';
    labelEl.textContent = label;

    const val = document.createElement('div');
    val.className = 'columns-contact-card-value';
    if (valueEl) val.append(...valueEl.cloneNode(true).childNodes);

    content.append(labelEl, val);

    if (noteEl && noteEl.textContent.trim()) {
      const note = document.createElement('span');
      note.className = 'columns-contact-card-note';
      note.textContent = noteEl.textContent.trim();
      content.append(note);
    }

    card.append(iconWrap, content);
    cards.append(card);
  });

  leftPanel.append(cards);

  // ── RIGHT PANEL ──
  const rightPanel = document.createElement('div');
  rightPanel.className = 'columns-contact-right';

  if (rightHead) {
    const rightMeta = document.createElement('div');
    rightMeta.className = 'columns-contact-right-meta';
    rightMeta.append(...rightHead.childNodes);
    rightPanel.append(rightMeta);
  }

  rightPanel.append(buildContactForm());

  layout.append(leftPanel, rightPanel);

  block.textContent = '';
  block.append(layout);
}

/* ── Main decorate ── */
export default function decorate(block) {
  // Contact variant
  if (block.classList.contains('contact')) {
    decorateContactVariant(block);
    return;
  }

  // Standard columns
  const cols = [...block.firstElementChild.children];
  block.classList.add(`columns-${cols.length}-cols`);

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
