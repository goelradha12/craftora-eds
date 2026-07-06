/**
 * helpers.js — Craftora EDS Shared Formatting Helpers
 * Broadly reusable utilities for dates, addresses, and display values.
 * These are NOT commerce-specific — they serve account, checkout, orders, and any future page.
 */

/**
 * Format an ISO date string or Date object into a readable format.
 * Returns "Not available" for invalid/missing values.
 * @param {string|Date|null|undefined} value
 * @returns {string}
 */
export function formatDate(value) {
  if (!value) return 'Not available';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return 'Not available';
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format an address object into an HTML string of <p> lines.
 * Compatible with the existing addressObj schema:
 *   { house, street, landmark?, city, state, pincode, country? }
 *
 * @param {object|null|undefined} addressObj
 * @returns {string} HTML string (multiple <p> tags) or empty string
 */
export function formatAddress(addressObj) {
  if (!addressObj) return '';
  const { house, street, landmark, city, state, pincode } = addressObj;

  const lines = [];
  if (house) lines.push(esc(house));
  if (street) lines.push(esc(street));
  if (landmark) lines.push(esc(landmark));

  const cityState = [city, state].filter(Boolean).join(', ');
  const lastLine = cityState + (pincode ? ` - ${pincode}` : '');
  if (lastLine.trim()) lines.push(esc(lastLine));

  return lines.map((l) => `<p>${l}</p>`).join('');
}

/**
 * Format an address object as a single-line string.
 * Useful for display fields (not multi-line HTML).
 * @param {object|null|undefined} addressObj
 * @returns {string}
 */
export function formatAddressInline(addressObj) {
  if (!addressObj) return '';
  const { house, street, city, state, pincode } = addressObj;
  const parts = [house, street, city, state].filter(Boolean);
  const line = parts.join(', ');
  return pincode ? `${line} - ${pincode}` : line;
}

/**
 * Escape HTML entities.
 * @param {string} str
 * @returns {string}
 */
export function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[m]);
}

/**
 * Display a value or a "Not provided" placeholder.
 * Returns safe HTML.
 * @param {string|null|undefined} value
 * @returns {string}
 */
export function displayValue(value) {
  return value
    ? `<span>${esc(value)}</span>`
    : '<span class="value-empty">Not provided</span>';
}

/**
 * Compute a 1-2 letter avatar initials string for a user.
 * Single source of truth for header + account-page avatars.
 * @param {{name?: string, phone?: string}|null|undefined} user
 * @returns {string}
 */
export function getInitials(user) {
  return (user?.name || user?.phone || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Resolve the display name for a user (falls back to phone, then a default).
 * @param {{name?: string, phone?: string}|null|undefined} user
 * @param {string} fallback
 * @returns {string}
 */
export function getDisplayName(user, fallback = 'Account') {
  return user?.name || user?.phone || fallback;
}
