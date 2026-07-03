/**
 * product-data.js — Craftora EDS shared product catalog access.
 *
 * Centralizes fetching, sheet-shape extraction, per-page caching, and field
 * normalization for the products endpoint, so blocks (product-list,
 * product-detail, custom, header search) don't each re-implement it.
 */

const cache = new Map();

/**
 * Resolve a data-authored asset path ("./assets/x.webp") to a site-root path.
 * Absolute URLs and data: URIs are returned unchanged.
 * @param {string} path
 * @returns {string}
 */
export function resolveAssetPath(path) {
  if (!path) return '';
  if (/^(https?:)?\/\//.test(path) || path.startsWith('data:')) return path;
  return `/${path.replace(/^\.?\/+/, '')}`;
}

/**
 * Extract the product-rows array from any supported published shape:
 *  - multi-sheet:  { data: { data: [...] } }
 *  - single sheet: { data: [...] }
 *  - bare wrapper: { products: [...] }
 * @param {object} json
 * @returns {Array}
 */
function extractRows(json) {
  if (json?.data?.data && Array.isArray(json.data.data)) return json.data.data;
  if (Array.isArray(json?.data)) return json.data;
  if (Array.isArray(json?.products)) return json.products;
  return [];
}

/* Prettify a camelCase spec key ("microwaveSafe" → "Microwave Safe"). */
function prettyLabel(label) {
  return String(label || '')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (c) => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim();
}

/* Attach per-product spec rows from the multi-sheet `data-2` sheet
   ({ id, label, value }) onto each product as `productDetails`. */
function attachDetails(rows, json) {
  const specs = Array.isArray(json?.['data-2']?.data) ? json['data-2'].data : null;
  if (!specs) return rows;
  rows.forEach((p) => {
    p.productDetails = specs
      .filter((s) => String(s.id) === String(p.id))
      .map((s) => ({ label: prettyLabel(s.label), value: s.value }));
  });
  return rows;
}

/**
 * Fetch the product catalog from `url`, returning the rows array (with any
 * `data-2` spec rows attached as each product's `productDetails`).
 * Successful results are cached per-URL for the page session; failures throw
 * (and are not cached) so callers can render their own error state.
 * @param {string} url
 * @returns {Promise<Array>}
 */
export async function fetchProducts(url = '/library/products.json') {
  if (cache.has(url)) return cache.get(url);
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const json = await resp.json();
  const rows = attachDetails(extractRows(json), json);
  cache.set(url, rows);
  return rows;
}

/**
 * Find a single product by exact (case-sensitive) id match.
 * @param {string} id
 * @param {string} url
 * @returns {Promise<object|null>}
 */
export async function getProductById(id, url = '/library/products.json') {
  if (!id) return null;
  const rows = await fetchProducts(url);
  return rows.find((p) => String(p.id) === String(id)) || null;
}

/**
 * Normalize a raw product row into consistent types (returns a shallow copy;
 * never mutates the cached row):
 *  - basePrice → Number
 *  - sizes → array (from a "A, B, C" comma string)
 *  - imageDefault → site-root asset path
 * @param {object} p
 * @returns {object}
 */
export function normalizeProduct(p) {
  if (!p) return p;
  let { sizes } = p;
  if (typeof sizes === 'string') sizes = sizes.split(',').map((s) => s.trim()).filter(Boolean);
  else if (!Array.isArray(sizes)) sizes = [];
  return {
    ...p,
    basePrice: Number(p.basePrice) || 0,
    sizes,
    imageDefault: resolveAssetPath(p.imageDefault || p.images?.default || ''),
  };
}
