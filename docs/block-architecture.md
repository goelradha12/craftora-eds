# Craftora EDS — Block Architecture

## Design Principles

1. **Prefer variants over new blocks** — one block with CSS class variants
2. **DA Live content drives structure** — headings, text, images from authors
3. **JavaScript handles dynamic data** — fetching JSON, localStorage, interactivity
4. **Scoped CSS** — every rule under `.blockname` selector
5. **No frameworks** — vanilla JS/CSS only

---

## Complete Block Registry

### 1. `hero` — Homepage Hero
**Purpose:** Full-bleed two-column hero with text + image

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Two-column: heading + CTA left, image right | Home |

**DA Live Table:**
```
| Hero | |
| heading + description + CTA link | image |
```

**JS:** Extract heading, description, CTA from col 1; image from col 2. Style `<em>` as highlight.
**CSS:** Full-bleed grid, image edge-to-edge, content aligned to page grid.

---

### 2. `hero-pages` — Inner Page Heroes + CTA
**Purpose:** Page title banners and call-to-action sections

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Blue banner with h1/h2 + description | About, Products, Cart, Contact |
| `cta` | Centered rounded card with blue bg + accent button | Home (bottom) |
| `confirmation` | Success icon + order ID + action links | Thank You |

**DA Live Table:**
```
| Hero Pages |
| heading |
| description |
```
For CTA variant: add link as third row.
For confirmation: add detail rows (order ID placeholder, delivery est).

**JS:** Extracts rows into structured content. CTA variant styles link as button. Confirmation variant reads `?orderId=` from URL.
**CSS:** Blue bg + SVG pattern (default), rounded card (cta), centered success layout (confirmation).

---

### 3. `cards` — Multi-Purpose Card Grid
**Purpose:** Flexible card grid supporting multiple content types

| Variant | Description | Pages |
|---------|-------------|-------|
| `image-content` | Category cards (image + linked title) | Home |
| `image-content round` | Process steps (circular images + title) | Home |
| `icon-content` | Value proposition cards (icon + title + desc) | About |
| (default) | Standard image + body cards | General use |

**DA Live Table (all variants):**
```
| Cards (variant-name) | | |
| cell 1 | cell 2 | cell 3 (optional) |
```
Row 1 is always "Heading" label + h2/subtitle.
Subsequent rows are content items (2 or 3 columns depending on variant).

**JS:** Existing boilerplate transforms rows into `<ul><li>` structure. No changes needed.
**CSS:** Grid layout with variant-specific sizing, hover effects, border-radius.

---

### 4. `carousel` — Scrollable Content Rows
**Purpose:** Horizontal scroll-snap carousel fetching from JSON endpoints

| Variant | Description | Pages |
|---------|-------------|-------|
| `products` | Product cards from products.json (featured filter) | Home |
| `reviews` | Testimonial cards from reviews.json | Home |

**DA Live Table:**
```
| Carousel (products) | |
| Heading | h2 text |
| link to JSON endpoint |
```

**JS:** Fetches JSON, parses per variant (products: nested `.data.data`, reviews: flat `.data`). Renders cards. Scroll-snap + prev/next buttons.
**CSS:** Hidden scrollbar, card sizing (31%/50%/85% responsive), variant card styles.

---

### 5. `columns` — Two-Column Layouts
**Purpose:** Side-by-side content (image + text, text + map)

| Variant | Description | Pages |
|---------|-------------|-------|
| `left-image` | Image left, text right | About (mission) |
| `right-link` | Text left, map/link right | About (contact) |
| (default) | Equal columns | General use |

**DA Live Table:**
```
| Columns (left-image) | |
| image | text content |
```

**JS:** Detects `<picture>` → adds `.columns-img-col`. Detects Google Maps links → converts to embedded iframe.
**CSS:** Flexbox, gap, image rounded, accent bar before h2. Map at 360px height.

---

### 6. `company-stats` — Stats Display
**Purpose:** Dark background grid of metric numbers + labels

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Horizontal stats grid | About |

**DA Live Table:**
```
| Company Stats | |
| 12K+ | Happy Customers |
| 50K+ | Products Shipped |
```

**JS:** Extracts number/label pairs into styled grid.
**CSS:** Dark bg (via container), accent-colored numbers, centered text.

---

### 7. `auth` — Authentication Forms
**Purpose:** Login and signup flows (standalone full-page layout)

| Variant | Description | Pages |
|---------|-------------|-------|
| `signin` | Phone + password login | /login |
| `signup` | Name + phone + password + confirm | /signup |

**DA Live Table:**
```
| Auth (signup) | |
| side image | |
| heading text | |
| button label | |
| switch link paragraph | |
```

**JS:** Detects variant, builds appropriate fields, wires validation, auth logic (localStorage), redirect support.
**CSS:** Full-page centered card layout, background image/texture, responsive.

---

### 8. `product-listing` — Product Catalog *(TO BUILD)*
**Purpose:** Filterable product grid with category tabs

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Category tabs + product card grid | /products |

**DA Live Table:**
```
| Product Listing |
| /library/products.json |
```
(Minimal authored input — block fetches all data from JSON)

**JS:** Fetch products.json, render category filter buttons, render product cards, handle ?category= URL param, wishlist toggle per card, card click → /product?id=X.
**CSS:** Filter tabs (pill buttons), responsive card grid (auto-fill minmax), product card styles (image, badge, category, title, desc, price, wishlist heart).

**Dependencies:** `scripts/wishlist-utils.js`

---

### 9. `product-detail` — Product Detail Page *(TO BUILD)*
**Purpose:** Full product page with all purchase options

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Complete PDP | /product |

**DA Live Table:**
```
| Product Detail |
| /library/products.json |
```

**JS:** Read `?id=` param, fetch product data, render: breadcrumbs, image gallery (main + thumbs), color picker (60+ swatches), size selector, qty control, design toggle, customization status card, add-to-cart + buy-now buttons, trust badges, product details accordion, related products grid.
**CSS:** Two-column layout (gallery left, info right), responsive stack, all sub-component styles.

**Dependencies:** `scripts/pricing.js`, `scripts/cart-utils.js`, `scripts/wishlist-utils.js`, `scripts/design-preview.js`

---

### 10. `cart` — Shopping Cart *(TO BUILD)*
**Purpose:** Cart items display + order summary + checkout navigation

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Two-column: items list + summary sidebar | /cart |

**DA Live Table:**
```
| Cart |
| empty state heading |
| empty state message |
| Continue Shopping (link to /products) |
```

**JS:** Read localStorage `cart`, render items (image, name, color, size, qty controls, price, remove), calculate totals, checkout button → writes sessionStorage and redirects.
**CSS:** Item cards, qty selector, sticky summary sidebar, empty state, responsive.

**Dependencies:** `scripts/cart-utils.js`, `scripts/pricing.js`, `scripts/design-preview.js`

---

### 11. `checkout` — Checkout Flow *(TO BUILD)*
**Purpose:** Multi-section form (contact, address, payment) + order summary

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Full checkout form | /checkout |

**DA Live Table:**
```
| Checkout |
```
(Entirely JS-driven — minimal authored content)

**JS:** Read sessionStorage `craftora_checkout`, pre-fill from `craftora_user`, render contact/address/payment forms, validate, create order object, save to `craftora_orders`, clear cart, redirect to /thank-you.
**CSS:** Two-column (forms left, summary right), form sections, payment radio cards, validation states.

**Dependencies:** `scripts/auth.js`, `scripts/cart-utils.js`, `scripts/pricing.js`

---

### 12. `wishlist` — Saved Products *(TO BUILD)*
**Purpose:** Grid of wishlisted products with remove/navigate

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Wishlist card grid | /wishlist |

**DA Live Table:**
```
| Wishlist |
| empty state heading |
| empty state message |
```

**JS:** Read localStorage `craftora_wishlist`, render grid (image, category, name, price, remove button, customize link), handle clear all, cross-tab sync.
**CSS:** Card grid (auto-fill), card hover lift, empty state.

**Dependencies:** `scripts/wishlist-utils.js`

---

### 13. `account` — User Dashboard *(TO BUILD)*
**Purpose:** Profile info + order history

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Sidebar + main area | /account |

**DA Live Table:**
```
| Account |
| guest heading |
| guest message |
| Sign In (link) |
```

**JS:** Read `craftora_user` (guest state if null), render sidebar nav (avatar, links), profile info card, order history accordion (from `craftora_orders`).
**CSS:** Two-column sidebar layout, dark sidebar header, order accordion, responsive stack.

**Dependencies:** `scripts/auth.js`

---

### 14. `form` — Contact & Newsletter Forms *(TO BUILD)*
**Purpose:** Generic form block for contact and newsletter

| Variant | Description | Pages |
|---------|-------------|-------|
| `contact` | Full contact form (name, email, subject, message) | /contact |
| `newsletter` | Email-only inline form | Footer (optional) |

**DA Live Table:**
```
| Form (contact) |
| heading |
| subtitle |
| subject option 1 |
| subject option 2 |
| subject option 3 |
```

**JS:** Build form fields from authored content, validate, show success state.
**CSS:** Form field styling, success state, error display.

---

### 15. `accordion` — Expandable Content *(TO BUILD)*
**Purpose:** FAQ and other collapsible content sections

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Question + answer pairs | /contact (FAQ) |

**DA Live Table:**
```
| Accordion |
| Question 1 | Answer 1 |
| Question 2 | Answer 2 |
```

**JS:** Convert rows to `<details>/<summary>` elements.
**CSS:** Styled details, chevron rotation, padding.

---

### 16. `design-studio` — Product Customizer *(TO BUILD — Phase 3)*
**Purpose:** Canvas-based design editor (standalone full-page layout)

| Variant | Description | Pages |
|---------|-------------|-------|
| (default) | Full design editor | /customize |

**DA Live Table:**
```
| Design Studio |
| /library/products.json |
| /library/templates.json |
```

**JS:** Complete standalone app — sidebar panels (color, text, templates, upload), canvas with draggable layers, save to localStorage, add-to-cart integration.
**CSS:** Grid layout (sidebar + canvas + toolbar), own design system variables.

**Dependencies:** `scripts/pricing.js`, `scripts/cart-utils.js`

---

## Block Count Summary

| Status | Count | Blocks |
|--------|-------|--------|
| ✅ Implemented | 8 | hero, hero-pages, cards, carousel, columns, company-stats, auth, header/footer |
| 🔨 To Build | 8 | product-listing, product-detail, cart, checkout, wishlist, account, form, accordion |
| 🔮 Phase 3 | 1 | design-studio |
| **Total** | **17** | |
