/**
 * pricing.js — Craftora EDS Centralized Pricing
 * Design fees by product category.
 * Matches legacy craftora/scripts/pricing.js exactly.
 */

const DESIGN_FEES = {
  Tshirt: 199,
  Diary: 149,
  Bottle: 149,
  Cup: 99,
};

export function getDesignFee(category) {
  return DESIGN_FEES[category] || 0;
}

export function calculateItemPrice(basePrice, category, designRequired) {
  return basePrice + (designRequired ? getDesignFee(category) : 0);
}
