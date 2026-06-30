# Craftora EDS — Project Roadmap

## Current Status

### Completed Pages
| Page | Status | Blocks Used |
|------|--------|-------------|
| Home (/) | ✅ Done | hero, cards (image-content), carousel (products), cards (image-content round), carousel (reviews), hero-pages (cta) |
| About (/about) | ✅ Done | hero-pages, columns (left-image), company-stats, cards (icon-content), columns (right-link + map) |
| Sign In (/login) | ✅ Done | auth (signin) |
| Sign Up (/signup) | ✅ Done | auth (signup) |

### Remaining Pages (10 total)

| # | Page | Priority | Complexity | Estimated Effort |
|---|------|----------|-----------|-----------------|
| 1 | Product Listing (/products) | P0 | Medium | 1 block |
| 2 | Product Detail (/product) | P0 | High | 1 block (large) |
| 3 | Cart (/cart) | P0 | Medium | 1 block |
| 4 | Checkout (/checkout) | P1 | High | 1 block |
| 5 | Thank You (/thank-you) | P1 | Low | Reuse hero-pages (confirmation variant) |
| 6 | Wishlist (/wishlist) | P1 | Medium | 1 block |
| 7 | Account (/account) | P1 | High | 1 block |
| 8 | Contact (/contact) | P1 | Medium | form block + accordion block |
| 9 | Design Studio (/customize) | P2 | Very High | 1 standalone block |
| 10 | Policy Pages (3 pages) | P2 | Low | Authored content only |

---

## Implementation Phases

### Phase 1 — Core Commerce (P0)
**Goal:** Users can browse, view, and add products to cart.

1. **Product Listing block** — category filter tabs + product grid from JSON
2. **Product Detail block** — gallery, options, pricing, add-to-cart/buy-now
3. **Cart block** — item list, qty controls, order summary, checkout redirect
4. **Shared utility scripts** — auth.js, cart-utils.js, wishlist-utils.js, pricing.js

### Phase 2 — Purchase Flow (P1)
**Goal:** Users can complete purchases and manage accounts.

5. **Checkout block** — contact/address forms, payment selection, place order
6. **Thank You page** — reuse hero-pages (confirmation variant)
7. **Wishlist block** — grid of saved products from localStorage
8. **Account block** — profile info + order history accordion
9. **Contact page** — form block + accordion (FAQ) block

### Phase 3 — Design & Polish (P2)
**Goal:** Full feature parity with legacy.

10. **Design Studio block** — canvas-based product customizer (standalone layout)
11. **Policy pages** — authored content, no custom blocks needed
12. **404 page** — authored content with hero-pages block

---

## Shared Utility Scripts (to create in scripts/)

| Script | Purpose | Dependencies |
|--------|---------|-------------|
| `scripts/auth.js` | getUser, logout, normalizePhone, isValidPhone, attemptLogin, attemptSignup, getAccounts | localStorage |
| `scripts/cart-utils.js` | getCart, addToCart, removeFromCart, updateQty, saveCart, getCartCount, updateCartBadges, money() | localStorage |
| `scripts/pricing.js` | DESIGN_FEES, getDesignFee, calculateItemPrice | None |
| `scripts/wishlist-utils.js` | getWishlist, toggleWishlist, isWishlisted, removeFromWishlist, saveWishlist | localStorage |
| `scripts/design-preview.js` | DesignPreview.show(), .showCartCustomization(), .exists(), .getData() | localStorage |

**Note:** The `auth` block already contains its own auth logic. These shared scripts are for OTHER blocks (header, product-detail, cart, checkout, account, wishlist) that also need auth/cart/wishlist access.

---

## Data Dependencies

| Endpoint | Format | Used By |
|----------|--------|---------|
| `/content/products.json` | JSON (multi-sheet) | product-listing, product-detail, carousel (products), header (search) |
| `/content/templates.json` | JSON (flat array) | design-studio |
| `/content/reviews.json` | JSON (sheet) | carousel (reviews) |

### localStorage Keys

| Key | Shape | Used By |
|-----|-------|---------|
| `craftora_user` | `{name, phone, email, address, addressObj, joinedAt}` | auth, header, checkout, account |
| `craftora_accounts` | `[{...user, password}]` | auth |
| `cart` | `[{key, id, name, image, price, qty, color, size, customized, ...}]` | header (badge), cart, product-detail, checkout |
| `craftora_wishlist` | `[{id, name, category, price, image}]` | wishlist, product-detail, product-listing |
| `craftora_orders` | `[{id, date, status, customer, shipping, items, summary, payment}]` | checkout, account |
| `designData_{id}` | `{productId, shirtColor, previewImage, ...}` | product-detail, design-studio, design-preview |
| `craftora_checkout` (session) | `{source, items}` | product-detail (buy-now), cart, checkout |
