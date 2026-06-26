# Craftora → Edge Delivery Services Migration Plan

## 1. Legacy Project Overview

### 1.1 Pages & Routing

| Legacy Page | URL | Purpose |
|---|---|---|
| `index.html` | `/` | Homepage — hero, category grid, featured carousel, how-it-works, reviews, CTA |
| `products.html` | `/products` | Product listing with category filter tabs |
| `product.html` | `/product?id=X` | Product detail — gallery, color picker, size, design toggle, add-to-cart |
| `customize.html` | `/customize?id=X` | Design studio — canvas-based text/image/template editor |
| `cart.html` | `/cart` | Cart items list + order summary sidebar |
| `checkout.html` | `/checkout` | Contact info, shipping address, payment, order placement |
| `wishlist.html` | `/wishlist` | Saved products grid |
| `account.html` | `/account` | Profile info, order history (accordion), sidebar nav |
| `login.html` | `/login` | Phone + password login form |
| `signup.html` | `/signup` | Registration form (name, phone, password) |
| `about.html` | `/about` | Brand story page |
| `contact.html` | `/contact` | Contact form / info |
| `thank-you.html` | `/thank-you` | Order confirmation |

**Routing model:** Static HTML pages, no SPA router. Query params (`?id=`, `?category=`) drive dynamic rendering via JS.

---

### 1.2 Layout Architecture

**Header/Nav** — Injected via `layout.js` into `<div id="header">`. Includes:
- Desktop: logo, nav links (Home, Shop, About, Contact), global search, profile dropdown/guest CTA, wishlist icon, cart icon + badge
- Mobile: logo, search toggle, cart icon, hamburger → slide-in drawer

**Footer** — Injected via `layout.js` into `<div id="footer">`. Four-column grid: brand info + address, quick links, shop categories, account links.

**Scroll-to-top button** — Appended by `layout.js`.

---

### 1.3 CSS Architecture

| File | Role |
|---|---|
| `tokens.css` | Design system — colors, typography, spacing, shadows, transitions, z-index, layout tokens |
| `typography.css` | Font definitions (Inter, Lato, Fraunces) |
| `components.css` | Shared UI components (buttons, cards, badges, qty selectors) |
| `style.css` | Global layout, nav, footer, sections, hero-content, search, toast system |
| `home.css` | Homepage-specific (hero, categories, featured, how-it-works, reviews, CTA) |
| `products.css` | Product listing grid, filter tabs, product cards |
| `product.css` | Product detail page layout, gallery, pricing, color picker, design toggle |
| `cart.css` | Cart items, summary sidebar |
| `checkout.css` | Checkout forms, payment options, order summary |
| `login.css` | Auth pages (login + signup) |

**Key design tokens:**
- Brand colors: `--primary: #111827`, `--secondary: #2563EB`, `--accent: #FF6609`, `--bg: #F9FAF8`
- Fonts: `Fraunces` (display), `Inter` (headings/UI), `Lato` (body)
- Breakpoints: 768px (mobile), 900px (tablet), 1200px (desktop)
- Container: `min(90%, 1200px)` centered

---

### 1.4 JavaScript Architecture

| File | Role | Dependencies |
|---|---|---|
| `layout.js` | Nav/footer injection, search, mobile menu, cart badge, logout | None (self-contained) |
| `auth.js` | localStorage auth: login, signup, getUser, validatePhone/Password | None |
| `cart.js` | Cart CRUD, render, order ID generation, checkout redirect | `pricing.js`, `design_preview.js` |
| `checkout.js` | Form validation, order creation, localStorage save, redirect | `pricing.js` |
| `pricing.js` | Design fee calculator by category | None |
| `product.js` | Product detail page: gallery, color picker, size selector, design toggle, add-to-cart/buy-now, related products | `pricing.js`, `design_preview.js` |
| `products.js` | Product listing: fetch JSON, filter, render cards, wishlist | `wishlist.js` |
| `wishlist.js` | Wishlist CRUD (localStorage), page renderer | None |
| `design_preview.js` | Design preview modal for customized items | None |
| `account.js` | Account page: profile display, order history render | `auth.js` |
| `index.js` | Homepage: featured carousel, reviews carousel | None |

**Data storage:** All state in `localStorage`:
- `craftora_user` — logged-in user session
- `craftora_accounts` — registered accounts
- `cart` — cart items array
- `craftora_wishlist` — wishlist items
- `craftora_orders` — order history
- `designData_{productId}` — saved customizations

**Data source:** `content/products.json` — 12 products (Diary, Bottle, Tshirt, Cup categories), `content/templates.json` — design templates, `content/reviews.json` — testimonials.

---

### 1.5 Product Flow

1. User browses `/products` → category filter or search
2. Clicks product card → `/product?id=X`
3. On detail page: selects color, size, quantity
4. Optionally enables "Custom Design" toggle → opens `/customize?id=X`
5. In design studio: add text, upload image, choose template, pick color → saves to localStorage
6. Returns to product page → design status shown, add-to-cart enabled
7. Cart → Checkout → Order placed (localStorage)

---

### 1.6 Customization Flow (Design Studio)

The design studio (`customize.html`) is a **standalone single-page app** with:
- Top bar with product name and cart badge
- Left sidebar with collapsible panels: Color, Text (add multiple), Templates, Upload Image
- Center canvas area with draggable/resizable overlays on a product silhouette
- Status bar with dimensions and save status
- Saves design data (texts, images, template, color, preview image) to `localStorage`

This is the **most complex feature** and doesn't map neatly to authored CMS content.

---

### 1.7 Cart & Checkout

- **Cart:** Reads `localStorage['cart']`, renders items with qty controls, shows order summary, navigates to checkout
- **Checkout:** Reads from `sessionStorage['craftora_checkout']` (supports cart and buy-now flows), validates form, creates order in localStorage, redirects to thank-you
- **Pricing:** Base price + optional design fee (₹99–₹199 depending on category)

---

### 1.8 Authentication

- Phone-number based (10-digit Indian mobile)
- localStorage "database" of accounts
- Password stored in plain text (demo purposes)
- Session stored in `craftora_user`
- Protected flows: wishlist (guest state shown if not logged in), account page

---

## 2. EDS Migration Strategy

### 2.1 Guiding Principles

1. **CMS-authored content** for marketing/informational pages (home, about, contact, products catalog)
2. **Client-side JavaScript blocks** for interactive/transactional features (cart, checkout, customizer, auth)
3. **No build tools** — all vanilla JS, modular via EDS block system
4. **Progressive enhancement** — content visible without JS, enhanced with interactivity
5. **Performance first** — leverage EDS three-phase loading (eager → lazy → delayed)
6. **Products as CMS content** — migrate from JSON to spreadsheet-backed data (or keep JSON as a content source fetched from EDS)

---

### 2.2 Content Strategy

#### CMS-Authored (in da.live / Google Docs)
- Homepage sections (hero, categories, how-it-works, CTA)
- Product catalog data (spreadsheet → JSON endpoint)
- Reviews/testimonials
- About page
- Contact page
- Nav (`/nav`)
- Footer (`/footer`)

#### Code-Driven (blocks with JS logic)
- Product listing with filters
- Product detail page
- Design studio (customizer)
- Cart
- Checkout
- Wishlist
- Account/Auth

---

### 2.3 Page-to-URL Mapping in EDS

| Legacy | EDS Path | Content Source |
|---|---|---|
| `index.html` | `/` | Authored (homepage doc) |
| `products.html` | `/products` | Authored page with `product-listing` block |
| `product.html` | `/product` | Code-driven block, reads query param |
| `customize.html` | `/customize` | Code-driven block (standalone layout) |
| `cart.html` | `/cart` | Minimal authored page with `cart` block |
| `checkout.html` | `/checkout` | Minimal authored page with `checkout` block |
| `wishlist.html` | `/wishlist` | Minimal authored page with `wishlist` block |
| `account.html` | `/account` | Minimal authored page with `account` block |
| `login.html` | `/login` | Minimal authored page with `login` block |
| `signup.html` | `/signup` | Minimal authored page with `signup` block |
| `about.html` | `/about` | Fully authored |
| `contact.html` | `/contact` | Authored with `contact-form` block |
| `thank-you.html` | `/thank-you` | Authored page with `order-confirmation` block |

---

## 3. Block Design

### 3.1 Blocks to Create

| Block Name | Type | Purpose | Priority |
|---|---|---|---|
| `hero` | Authored | Homepage hero with headline, text, CTA button, image | P0 |
| `category-grid` | Authored | Product category cards (image + title + link) | P0 |
| `featured-products` | Hybrid | Carousel of featured products (data from spreadsheet) | P1 |
| `how-it-works` | Authored | Steps grid with icons/images and descriptions | P1 |
| `reviews` | Hybrid | Customer testimonial carousel (data from spreadsheet) | P1 |
| `cta-banner` | Authored | Call-to-action section with heading, text, button | P0 |
| `product-listing` | JS-heavy | Category filters + product card grid (fetches product data) | P0 |
| `product-detail` | JS-heavy | Full product page (gallery, colors, sizes, pricing, add-to-cart) | P0 |
| `design-studio` | JS-heavy | Canvas-based customization tool | P2 |
| `cart` | JS-heavy | Cart display + summary | P0 |
| `checkout` | JS-heavy | Multi-section checkout form | P1 |
| `wishlist` | JS-heavy | Wishlist grid with remove/navigate actions | P1 |
| `account` | JS-heavy | Profile info + order history | P1 |
| `login` | JS-heavy | Login form with validation | P1 |
| `signup` | JS-heavy | Registration form with validation | P1 |
| `order-confirmation` | JS-heavy | Thank-you page with order details | P1 |

### 3.2 Existing Boilerplate Blocks to Reuse/Extend

| Block | Current Use | Adaptation |
|---|---|---|
| `hero` | Basic hero | Extend for Craftora hero layout (split text/image) |
| `cards` | Generic cards | Could adapt for category grid |
| `columns` | Multi-column layout | Useful for how-it-works steps |
| `header` | Site header | Customize for Craftora nav (search, auth, cart) |
| `footer` | Site footer | Customize for Craftora footer (4-column) |

---

## 4. Shared Utilities (scripts/)

### 4.1 New Utility Files

| File | Purpose |
|---|---|
| `scripts/auth.js` | Auth helpers (getUser, login, signup, logout, localStorage CRUD) |
| `scripts/cart-utils.js` | Cart CRUD, badge update, pricing calculations |
| `scripts/pricing.js` | Design fee logic |
| `scripts/wishlist-utils.js` | Wishlist CRUD helpers |
| `scripts/product-data.js` | Fetch + cache product catalog from EDS endpoint |

### 4.2 Integration with `scripts.js`

- Register decorateBlock hooks for JS-heavy blocks
- Add cart badge updater to `loadLazy()` or `loadDelayed()`
- Global search can live in the header block
- Auth state checks in header block for profile dropdown

---

## 5. Styles Migration

### 5.1 Global Styles Mapping

| Legacy | EDS Target | Notes |
|---|---|---|
| `tokens.css` | `styles/styles.css` (CSS custom properties section) | Port all custom properties into `:root` |
| `typography.css` | `styles/fonts.css` + `styles/styles.css` | Font face definitions + base type rules |
| `components.css` | `styles/styles.css` or `styles/lazy-styles.css` | Shared button/badge/input styles |
| `style.css` (layout) | `styles/styles.css` | Container, section, base resets |
| `style.css` (nav/footer) | `blocks/header/header.css` + `blocks/footer/footer.css` | Scoped to blocks |
| `style.css` (toast) | `styles/lazy-styles.css` | Loaded lazily |

### 5.2 Page-Specific Styles → Block CSS

| Legacy | EDS Block CSS |
|---|---|
| `home.css` | Split across `blocks/hero/`, `blocks/category-grid/`, `blocks/featured-products/`, etc. |
| `products.css` | `blocks/product-listing/product-listing.css` |
| `product.css` | `blocks/product-detail/product-detail.css` |
| `cart.css` | `blocks/cart/cart.css` |
| `checkout.css` | `blocks/checkout/checkout.css` |
| `login.css` | `blocks/login/login.css` + `blocks/signup/signup.css` |

---

## 6. Data & Content Sources

### 6.1 Product Catalog

**Current:** `content/products.json` (12 products, static file)

**EDS approach:** Use a spreadsheet (Google Sheets or SharePoint) published as a JSON endpoint via EDS:
- URL: `/products.json` (auto-generated from spreadsheet)
- Columns: id, name, category, basePrice, description, sizes, images, badges, featured, stock, productDetails
- Complex fields (sizes, images, productDetails) can use pipe-delimited values or nested sheet tabs

**Alternative:** Keep `products.json` as a committed file in the repo (simpler for MVP, less author-friendly).

### 6.2 Templates

**Current:** `content/templates.json` (design templates for the customizer)

**EDS approach:** Spreadsheet or committed JSON. Since templates rarely change and are developer-managed, a committed JSON file is appropriate.

### 6.3 Reviews

**Current:** `content/reviews.json`

**EDS approach:** Spreadsheet-backed for easy author updates. Columns: author, product, category, review.

---

## 7. Assets Strategy

### 7.1 Product Images

- Move optimized product images to EDS repo under `assets/products/`
- Ensure WebP format, reasonable file sizes
- EDS auto-optimizes author-uploaded images, but committed assets need manual optimization

### 7.2 Design Templates

- Move template images to `assets/templates/{category}/`
- Keep WebP format

### 7.3 Icons

- Convert inline SVGs to icon files where reusable → `icons/{name}.svg`
- EDS provides `decorateIcons()` utility for `<span class="icon icon-{name}">` pattern

### 7.4 Backgrounds & Process Images

- Move to `assets/` in EDS repo
- Optimize before committing

---

## 8. Feature Migration Priority

### Phase 1 — Foundation (P0)
1. Global styles (tokens, typography, base layout)
2. Header block (nav, search, auth state, cart badge)
3. Footer block
4. Homepage (hero, category grid, CTA)
5. Product listing block (with filters)
6. Product detail block (gallery, pricing, add-to-cart)
7. Cart block
8. Basic product data endpoint

### Phase 2 — Commerce (P1)
9. Checkout block
10. Login + Signup blocks
11. Account block (profile + orders)
12. Wishlist block
13. Featured products carousel
14. Reviews carousel
15. How-it-works block
16. Order confirmation block

### Phase 3 — Advanced (P2)
17. Design studio (customizer) block
18. Design preview integration in cart/product
19. Global search refinements
20. Toast notification system
21. Performance optimization pass
22. About + Contact pages

---

## 9. Key Architectural Decisions

### 9.1 Authentication

The legacy app uses localStorage-only auth (demo/prototype level). For EDS:
- **Option A (recommended for MVP):** Keep localStorage auth as-is — no backend changes needed, works client-side
- **Option B (production):** Integrate with a backend auth service (Firebase Auth, Auth0, custom API)

**Recommendation:** Start with Option A for feature parity, plan Option B as a future enhancement.

### 9.2 Product Data Fetching

- Use EDS spreadsheet → JSON pattern for product catalog
- Cache fetched data in sessionStorage to avoid refetching on navigation
- Use `fetch()` in block JS, not at page load

### 9.3 Cart/Order State

- Keep localStorage approach (no backend)
- Cart badge updated via custom events or `storage` event listener
- Checkout session via sessionStorage (same as legacy)

### 9.4 Design Studio

This is the most complex migration. Options:
- **Option A:** Port the entire customizer as a single self-contained block with its own layout
- **Option B:** Load it as an iframe/overlay from a separate route
- **Option C:** Rebuild with a lightweight canvas library

**Recommendation:** Option A — create a `design-studio` block that takes over the page layout when activated. The authored page at `/customize` would be minimal (just the block reference), and the block JS handles the full UI.

### 9.5 Navigation Between Pages

Legacy uses `window.location.href` for navigation. In EDS:
- Standard `<a href>` links work fine (no SPA)
- Query params (`?id=`, `?category=`) continue to work
- Use `window.location` for programmatic navigation (post-checkout redirect, etc.)

---

## 10. Testing Strategy

1. **Local dev server:** `aem up` with drafted HTML content in `drafts/` folder
2. **Lint:** `npm run lint` before every commit
3. **Manual testing:** All user flows (browse → customize → cart → checkout → order)
4. **Performance:** PageSpeed Insights against preview URL, target score of 100
5. **Accessibility:** Keyboard navigation, screen reader, WCAG 2.1 AA
6. **Cross-browser:** Chrome, Firefox, Safari, Edge
7. **Responsive:** Mobile (320px+), tablet (600px+), desktop (1200px+)

---

## 11. File Structure After Migration

```
craftora-eds/
├── blocks/
│   ├── header/              # Nav with search, auth, cart
│   ├── footer/              # 4-column footer
│   ├── hero/                # Homepage hero (extended)
│   ├── category-grid/       # Product categories with images
│   ├── featured-products/   # Carousel of featured items
│   ├── how-it-works/        # Steps grid
│   ├── reviews/             # Testimonial carousel
│   ├── cta-banner/          # Call-to-action section
│   ├── product-listing/     # Filterable product grid
│   ├── product-detail/      # Full PDP
│   ├── design-studio/       # Customization canvas
│   ├── cart/                # Cart items + summary
│   ├── checkout/            # Checkout forms
│   ├── wishlist/            # Wishlist grid
│   ├── account/             # Profile + orders
│   ├── login/               # Login form
│   ├── signup/              # Registration form
│   └── order-confirmation/  # Thank-you block
├── scripts/
│   ├── aem.js              # Core EDS library (DO NOT MODIFY)
│   ├── scripts.js          # Main decoration entry point
│   ├── delayed.js          # Delayed loading
│   ├── auth.js             # Authentication utilities
│   ├── cart-utils.js       # Cart CRUD + pricing
│   ├── wishlist-utils.js   # Wishlist CRUD
│   └── product-data.js     # Product fetch + cache
├── styles/
│   ├── styles.css          # Global tokens + base styles (LCP)
│   ├── lazy-styles.css     # Below-fold global styles
│   └── fonts.css           # Font definitions
├── assets/
│   ├── products/           # Product images
│   ├── templates/          # Design templates
│   ├── process/            # How-it-works images
│   └── backgrounds/        # Hero/page backgrounds
├── icons/                  # SVG icons
├── content/                # JSON data files (if not using spreadsheets)
├── drafts/                 # Test HTML for local dev
├── docs/
│   └── migration-plan.md   # This document
├── head.html
└── 404.html
```

---

## 12. Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Design studio complexity | High dev effort | Defer to Phase 3, port as-is without refactoring |
| localStorage auth not production-ready | Security concern | Document as demo-only, plan backend auth for production |
| Large product images committed to repo | Performance/repo size | Optimize aggressively, consider CDN for production |
| No real backend for orders | Orders lost on localStorage clear | Accept for MVP, plan API integration |
| Complex inline styles in some pages (customize, account) | Hard to extract to block CSS | Move inline styles to block CSS files during migration |

---

## 13. Summary

The Craftora legacy project is a **feature-rich custom merchandise e-commerce site** with:
- 12 products across 4 categories
- A full design customization studio
- Cart + checkout flow
- localStorage-based auth and order management
- Responsive, accessible UI with a design token system

The migration to EDS will:
1. Preserve all existing functionality
2. Make marketing content (hero, about, categories) author-editable via CMS
3. Keep interactive features (cart, customizer, auth) as self-contained blocks
4. Improve performance via EDS three-phase loading
5. Follow Franklin conventions for maintainability

**Estimated blocks to create:** 17
**Estimated utility scripts:** 4
**Priority order:** Foundation → Commerce → Advanced features
