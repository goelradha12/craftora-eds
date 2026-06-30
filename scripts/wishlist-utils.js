/**
 * wishlist-utils.js — Craftora EDS Shared Wishlist Utilities
 * localStorage-based wishlist CRUD.
 * Matches legacy craftora/scripts/wishlist.js logic.
 *
 * Wishlist item shape: { id, name, category, price, image }
 */

const WISHLIST_KEY = 'craftora_wishlist';

export function getWishlist() {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]');
  } catch { return []; }
}

export function saveWishlist(list) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(list));
}

export function addToWishlist(item) {
  const list = getWishlist();
  if (!list.find((i) => i.id === item.id)) {
    list.push(item);
    saveWishlist(list);
  }
}

export function removeFromWishlist(id) {
  saveWishlist(getWishlist().filter((i) => i.id !== id));
}

/**
 * Toggle wishlist: add if absent, remove if present.
 * @returns {boolean} true if item is now IN the wishlist
 */
export function toggleWishlist(item) {
  const list = getWishlist();
  const idx = list.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
    saveWishlist(list);
    return false;
  }
  list.push(item);
  saveWishlist(list);
  return true;
}

export function isWishlisted(id) {
  return getWishlist().some((i) => i.id === id);
}
