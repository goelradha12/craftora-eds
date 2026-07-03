/**
 * Checkout Block — Craftora EDS
 *
 * One cohesive block that renders the whole checkout transaction: contact,
 * shipping-address and payment sections (fields are code-driven) plus an order
 * summary and the Place Order action. Section headings + icons are authored;
 * the fields, summary and order logic are code.
 *
 * Authored DOM (rows optional — sensible defaults are used if omitted):
 *   | Checkout |
 *   | icon | Contact Information |
 *   | icon | Shipping Address    |
 *   | icon | Payment Method      |
 *   | Place Order |
 *
 * Guards: requires a logged-in user (else → /login?redirect=/checkout) and a
 * checkout session from cart/buy-now (else → /cart).
 */

import {
  money, esc, getCheckoutSession, clearCheckoutSession, addOrder, generateOrderId, clearCart,
} from '../../scripts/cart-utils.js';
import {
  getUser, saveUser, isValidPhone, normalizePhone,
} from '../../scripts/auth.js';
import { formatAddressInline } from '../../scripts/helpers.js';

const CHECKOUT_PATH = '/checkout';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const DEFAULT_SECTIONS = [
  { key: 'contact', heading: 'Contact Information' },
  { key: 'address', heading: 'Shipping Address' },
  { key: 'payment', heading: 'Payment Method' },
];

const FIELD_SETS = {
  contact: [
    {
      field: 'name',
      label: 'Full Name',
      type: 'text',
      required: true,
      autocomplete: 'name',
      prefill: (u) => u?.name,
    },
    {
      field: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: true,
      autocomplete: 'tel',
      inputmode: 'numeric',
      prefill: (u) => u?.phone,
      validate: (v) => (isValidPhone(v) ? '' : 'Enter a valid 10-digit mobile number.'),
    },
    {
      field: 'email',
      label: 'Email Address (optional)',
      type: 'email',
      required: false,
      autocomplete: 'email',
      prefill: (u) => u?.email,
      validate: (v) => (!v || EMAIL_RE.test(v) ? '' : 'Enter a valid email address.'),
    },
  ],
  address: [
    {
      field: 'house',
      label: 'Address Line 1 (House / Flat / Building)',
      type: 'text',
      required: true,
      autocomplete: 'address-line1',
      prefill: (u) => u?.addressObj?.house,
    },
    {
      field: 'street',
      label: 'Address Line 2 (Street / Area) — optional',
      type: 'text',
      required: false,
      autocomplete: 'address-line2',
      prefill: (u) => u?.addressObj?.street,
    },
    {
      field: 'city',
      label: 'City',
      type: 'text',
      required: true,
      autocomplete: 'address-level2',
      prefill: (u) => u?.addressObj?.city,
    },
    {
      field: 'state',
      label: 'State',
      type: 'text',
      required: true,
      autocomplete: 'address-level1',
      prefill: (u) => u?.addressObj?.state,
    },
    {
      field: 'pincode',
      label: 'PIN Code',
      type: 'text',
      required: true,
      inputmode: 'numeric',
      autocomplete: 'postal-code',
      prefill: (u) => u?.addressObj?.pincode,
      validate: (v) => (/^\d{6}$/.test(v) ? '' : 'Enter a valid 6-digit PIN code.'),
    },
    {
      field: 'country',
      label: 'Country',
      type: 'text',
      required: true,
      prefill: (u) => u?.addressObj?.country || 'India',
    },
  ],
};

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery', desc: 'Pay when your order arrives' },
  { value: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay' },
  { value: 'upi', label: 'UPI', desc: 'GPay, PhonePe, Paytm & more' },
  { value: 'netbanking', label: 'Net Banking', desc: 'All major banks' },
];

/* Totals mirror the cart block: item.price already includes the design fee; shipping is free. */
function computeTotals(items) {
  return (items || []).reduce((acc, it) => {
    const qty = it.qty || 1;
    acc.count += qty;
    acc.subtotal += (it.price || 0) * qty;
    acc.designFees += (it.designFee || 0) * qty;
    acc.total = acc.subtotal;
    return acc;
  }, {
    count: 0, subtotal: 0, designFees: 0, total: 0,
  });
}

function fieldHTML(section, def, user) {
  const id = `co-${section}-${def.field}`;
  const value = def.prefill ? (def.prefill(user) || '') : '';
  return `<div class="checkout-field">
      <label for="${id}">${esc(def.label)}</label>
      <input id="${id}" type="${def.type}" value="${esc(value)}"
        data-checkout-section="${section}" data-checkout-field="${def.field}"
        ${def.required ? 'required aria-required="true"' : ''}
        ${def.autocomplete ? `autocomplete="${def.autocomplete}"` : ''}
        ${def.inputmode ? `inputmode="${def.inputmode}"` : ''}>
      <span class="checkout-error" aria-live="polite"></span>
    </div>`;
}

function paymentHTML() {
  const opts = PAYMENT_METHODS.map((m, i) => `<label class="checkout-payment-option">
      <input type="radio" name="checkout-payment" value="${m.value}"
        data-checkout-section="payment" data-checkout-field="method" ${i === 0 ? 'checked' : ''}>
      <span class="checkout-payment-body">
        <span class="checkout-payment-label">${esc(m.label)}</span>
        <span class="checkout-payment-desc">${esc(m.desc)}</span>
      </span>
    </label>`).join('');
  return `<div class="checkout-payment" role="radiogroup" aria-label="Payment method">${opts}</div>`;
}

function sectionHTML(section, user) {
  const headingId = `checkout-${section.key}`;
  const body = section.key === 'payment'
    ? paymentHTML()
    : `<div class="checkout-fields">${FIELD_SETS[section.key]
      .map((def) => fieldHTML(section.key, def, user)).join('')}</div>`;
  return `<section class="checkout-section checkout-section-${section.key}" aria-labelledby="${headingId}">
      <div class="checkout-section-head">${section.iconHTML || ''}<h2 id="${headingId}">${esc(section.heading)}</h2></div>
      ${body}
    </section>`;
}

function summaryItemHTML(item) {
  const meta = [
    item.size ? `Size ${esc(item.size)}` : '',
    item.colorName ? esc(item.colorName) : '',
    `Qty ${item.qty || 1}`,
  ].filter(Boolean).join(' · ');
  return `<li class="checkout-summary-item">
      <img class="checkout-summary-item-img" src="${esc(item.image || '')}" alt="${esc(item.name || '')}"
        width="56" height="56" loading="lazy">
      <div class="checkout-summary-item-info">
        <span class="checkout-summary-item-name">${esc(item.name || '')}</span>
        <span class="checkout-summary-item-meta">${meta}</span>
      </div>
      <span class="checkout-summary-item-price">${money((item.price || 0) * (item.qty || 1))}</span>
    </li>`;
}

function summaryHTML(items, placeLabel) {
  const t = computeTotals(items);
  return `<aside class="checkout-summary">
      <h2 class="checkout-summary-title">Order Summary</h2>
      <ul class="checkout-summary-items">${items.map(summaryItemHTML).join('')}</ul>
      <div class="checkout-summary-divider"></div>
      <div class="checkout-summary-row"><span>Items (${t.count})</span><span>${money(t.subtotal)}</span></div>
      ${t.designFees ? `<div class="checkout-summary-row checkout-summary-row-muted"><span>Incl. design fees</span><span>${money(t.designFees)}</span></div>` : ''}
      <div class="checkout-summary-row"><span>Shipping</span><span>Free</span></div>
      <div class="checkout-summary-divider"></div>
      <div class="checkout-summary-row checkout-summary-total"><span>Total</span><span>${money(t.total)}</span></div>
      <button class="checkout-place-btn" type="button">${esc(placeLabel)}</button>
      <p class="checkout-note">Your order is placed securely. Free shipping included.</p>
    </aside>`;
}

function collectFormData(root) {
  const data = { contact: {}, address: {}, payment: {} };
  root.querySelectorAll('[data-checkout-field]').forEach((el) => {
    const { checkoutSection: section, checkoutField: field } = el.dataset;
    if (!data[section]) return;
    if (el.type === 'radio') {
      if (el.checked) data[section][field] = el.value;
    } else {
      data[section][field] = el.value.trim();
    }
  });
  return data;
}

function setFieldError(root, section, field, msg) {
  const input = root.querySelector(
    `[data-checkout-section="${section}"][data-checkout-field="${field}"]`,
  );
  if (!input) return null;
  const errEl = input.closest('.checkout-field')?.querySelector('.checkout-error');
  if (errEl) errEl.textContent = msg;
  input.classList.toggle('invalid', !!msg);
  if (msg) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
  return msg ? input : null;
}

function validateAndMark(root, data) {
  let firstInvalid = null;
  Object.keys(FIELD_SETS).forEach((section) => {
    FIELD_SETS[section].forEach((def) => {
      const value = data[section]?.[def.field] || '';
      let msg = '';
      if (def.required && !value) msg = 'This field is required.';
      else if (def.validate) msg = def.validate(value);
      const invalid = setFieldError(root, section, def.field, msg);
      if (invalid && !firstInvalid) firstInvalid = invalid;
    });
  });
  return firstInvalid;
}

function buildOrder(data, items) {
  const totals = computeTotals(items);
  const method = data.payment.method || 'cod';
  const payMethod = PAYMENT_METHODS.find((m) => m.value === method) || PAYMENT_METHODS[0];
  const addressObj = { ...data.address };
  return {
    id: generateOrderId(),
    date: new Date().toISOString(),
    status: 'Confirmed',
    customer: {
      name: data.contact.name,
      phone: normalizePhone(data.contact.phone),
      email: data.contact.email || '',
    },
    shipping: addressObj,
    items,
    summary: {
      itemCount: totals.count,
      subtotal: totals.subtotal,
      designFees: totals.designFees,
      shipping: 0,
      total: totals.total,
    },
    payment: { method, label: payMethod.label },
  };
}

function placeOrder(root, session) {
  const user = getUser();
  const current = getCheckoutSession() || session;
  if (!user) {
    window.location.href = `/login?redirect=${encodeURIComponent(CHECKOUT_PATH)}`;
    return;
  }
  if (!current || !Array.isArray(current.items) || !current.items.length) {
    window.location.href = '/cart';
    return;
  }

  const data = collectFormData(root);
  const firstInvalid = validateAndMark(root, data);
  if (firstInvalid) {
    firstInvalid.focus();
    return;
  }

  const order = buildOrder(data, current.items);
  addOrder(order);
  saveUser({
    ...user,
    name: data.contact.name || user.name,
    email: data.contact.email || user.email || '',
    address: formatAddressInline(order.shipping),
    addressObj: order.shipping,
  });
  localStorage.setItem('lastOrderId', order.id);
  if (current.source === 'cart') clearCart();
  clearCheckoutSession();

  window.location.href = `/thank-you?orderId=${encodeURIComponent(order.id)}`;
}

/* Parse authored rows into section headings/icons + the Place Order label. */
function parseAuthored(block) {
  const parsed = [...block.children].map((row) => {
    const iconSpan = row.querySelector('span.icon');
    const cells = [...row.children];
    return {
      iconHTML: iconSpan ? iconSpan.outerHTML : '',
      text: (cells[cells.length - 1]?.textContent || '').trim(),
      hasIcon: !!iconSpan,
    };
  });
  const headerRows = parsed.filter((r) => r.hasIcon);
  const labelRow = parsed.find((r) => !r.hasIcon && r.text);
  const sections = DEFAULT_SECTIONS.map((s, i) => ({
    ...s,
    heading: headerRows[i]?.text || s.heading,
    iconHTML: headerRows[i]?.iconHTML || '',
  }));
  return { sections, placeLabel: labelRow?.text || 'Place Order' };
}

export default function decorate(block) {
  // ── Guards ──
  const user = getUser();
  if (!user) {
    window.location.href = `/login?redirect=${encodeURIComponent(CHECKOUT_PATH)}`;
    return;
  }
  const session = getCheckoutSession();
  if (!session || !Array.isArray(session.items) || !session.items.length) {
    window.location.href = '/cart';
    return;
  }

  const { sections, placeLabel } = parseAuthored(block);

  block.textContent = '';
  const layout = document.createElement('div');
  layout.className = 'checkout-layout';
  layout.innerHTML = `
    <div class="checkout-forms">
      ${sections.map((s) => sectionHTML(s, user)).join('')}
    </div>
    ${summaryHTML(session.items, placeLabel)}`;
  block.append(layout);

  block.querySelector('.checkout-place-btn')?.addEventListener('click', () => placeOrder(block, session));
}
