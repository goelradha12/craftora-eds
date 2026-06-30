# Shared Utilities — Architecture Review

## Summary

| Script | Functions | Issues | Verdict |
|--------|-----------|--------|---------|
| `auth.js` | 10 exports | 0 critical, 1 minor | ✅ Ship as-is |
| `cart-utils.js` | 14 exports | 1 moderate, 1 minor | ⚠️ 1 safe fix recommended |
| `pricing.js` | 2 exports | 0 issues | ✅ Ship as-is |
| `wishlist-utils.js` | 6 exports | 0 issues | ✅ Ship as-is |
| `design-preview.js` | 5 exports | 1 minor | ✅ Ship as-is |

**Overall: Solid architecture. One safe improvement to apply.**

---

## Strengths

1. **Clean separation** — each file owns one domain (auth, cart, pricing, wishlist, design). No cross-imports between them.
2. **No circular dependencies** — utilities are leaf modules. Blocks import from them, never the reverse.
3. **Consistent error handling** — all localStorage reads wrapped in try/catch with safe fallbacks (null, empty array).
4. **EDS compatible** — pure ES modules, no Node.js APIs, no build-time dependencies, works in any browser.
5. **Consistent naming** — `get*`, `save*`, `add*`, `remove*`, `clear*` patterns throughout.
6. **Consistent return values** — `attemptLogin`/`attemptSignup` both return `{ok, error?}`. Cart/wishlist functions return void or the list.
7. **Single responsibility** — each function does one thing. `addToCart` doesn't also update badges (delegated to `saveCart`).
8. **Proper storage keys** — match legacy exactly (`craftora_user`, `craftora_accounts`, `cart`, `craftora_wishlist`, `craftora_orders`, `designData_*`).

---

## Detailed Review

### 1. `auth.js` ✅

**API Design:** Clean. 10 exports, all necessary. `normalizePhone` and `isValidPhone` are properly separated.

**Minor note:** `PASSWORD_RULES` array is not exported but could be useful if the signup form wants to dynamically render requirements. However, `validatePassword()` already returns the rules with pass/fail status, so this is fine — the array stays private.

**No changes needed.**

---

### 2. `cart-utils.js` ⚠️

**API Design:** 14 exports covering cart CRUD, orders, checkout session, and formatting. Well-organized.

**Issue found — Redundant localStorage parse in `getCartCount`:**

```js
export function getCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return cart.reduce((sum, item) => sum + (item.qty ?? 1), 0);
  } catch { return 0; }
}
```

This re-parses localStorage independently instead of calling `getCart()`. The `updateCartBadges()` function calls `getCartCount()`, and blocks may also call `getCart()` separately — resulting in double-parsing on the same tick.

**Recommended fix:** Make `getCartCount` call `getCart()` internally:

```js
export function getCartCount() {
  return getCart().reduce((sum, item) => sum + (item.qty ?? 1), 0);
}
```

This is safe, backward-compatible, and eliminates duplicate parsing.

**Minor note:** `esc()` is exported from `cart-utils.js` but it's a generic HTML escape function. Multiple blocks also define their own `esc()`. This is acceptable for now — moving it to a separate `utils.js` would be over-engineering at this stage. If more shared utilities accumulate, consider a `scripts/helpers.js` later.

---

### 3. `pricing.js` ✅

**API Design:** Minimal and perfect. 2 exports, no unnecessary complexity.

**Scalability:** If pricing logic grows (discounts, tiers, tax), this is the right place. The `DESIGN_FEES` object is private — callers use `getDesignFee()` which allows future logic changes without breaking consumers.

**No changes needed.**

---

### 4. `wishlist-utils.js` ✅

**API Design:** 6 exports. Clean CRUD pattern. `toggleWishlist` returns a boolean indicating the new state — useful for UI updates.

**Note:** `saveWishlist` is exported. This is intentional — the wishlist page needs it for "Clear All" (saves empty array). Not an over-export.

**No changes needed.**

---

### 5. `design-preview.js` ✅

**API Design:** 5 exports (show, showCart, exists, getData, close). Clean.

**Minor note:** The inline CSS uses hardcoded color values (#e2e1dc, #0d0d0d, #f5f5f3, etc.) instead of CSS custom properties. This is intentional and correct — the modal is a self-contained overlay that must render consistently regardless of the page's theme/section context. Using design tokens here would risk the modal inheriting unintended colors from section backgrounds.

**Performance:** `injectStyles()` and `buildModal()` are gated by boolean flags — they only run once. Good.

**EDS compatibility:** The modal appends to `document.body` directly, not inside any block container. This is correct for modals in EDS — they need to escape block DOM boundaries.

**No changes needed.**

---

## Recommendations for Future

### Functions that will be needed (add when building the blocks, not now):

| Function | File | Needed By |
|----------|------|-----------|
| `getOrdersForUser(user)` | `cart-utils.js` | account block (filters orders by phone) |
| `formatDate(isoString)` | new `helpers.js` or inline | account, checkout, order confirmation |
| `formatAddress(addressObj)` | new `helpers.js` or inline | account, checkout |

These are simple enough to add inline in the consuming block, or added to `cart-utils.js` when the account block is built. No need to pre-build them.

### Recommended: Product data fetcher

When building product-listing and product-detail, you'll need a cached product fetcher. Consider adding:

```
scripts/product-data.js
  - fetchProducts(url) → cached product array
  - getProductById(id) → single product
```

This keeps the fetch + cache logic centralized rather than duplicated in product-listing, product-detail, carousel, and header search. **Build this when starting Phase 1 commerce blocks.**

---

## Safe Improvement to Apply Now

**One change:** Fix `getCartCount()` redundant parse.
