# Craftora Legacy — Page-by-Page Analysis

## Summary Table

| Page | Purpose | Dependencies | CSS Used | JavaScript Used | Reusable Sections | Candidate EDS Blocks |
|------|---------|--------------|----------|-----------------|-------------------|---------------------|
| `index.html` | Homepage — hero, category catalogue, featured products carousel, how-it-works steps, reviews carousel, CTA | `content/products.json`, `content/reviews.json` (unused — hardcoded in JS) | `tokens.css`, `typography.css`, `components.css`, `style.css`, `home.css` | `layout.js`, `wishlist.js`, `index.js` | Header, Footer, Hero, Category Grid, Featured Carousel, How-It-Works, Reviews Carousel, CTA Section | `hero`, `category-grid`, `featured-products`, `how-it-works`, `reviews`, `cta-banner` |
| `products.html` | Product listing with category filter tabs | `content/products.json` | `tokens.css`, `typography.css`, `components.css`, `style.css`, `products.css` | `layout.js`, `wishlist.js`, `products.js`, `index.js` | Header, Footer, Hero Banner, Category Filters, Product Card Grid | `product-listing` |
| `product.html` | Product detail — image gallery, color picker, size/qty selector, design toggle, add-to-cart, buy-now, related products | `content/products.json`, localStorage (`designData_*`, `cart`, `craftora_wishlist`) | `tokens.css`, `typography.css`, `components.css`, `style.css`, `product.css` | `layout.js`, `pricing.js`, `product.js`, `design_preview.js` | Header, Footer, Breadcrumbs, Gallery, Product Info Panel, Related Products | `product-detail` |
| `customize.html` | Design studio — canvas-based product customizer with sidebar panels (color, text, templates, upload) | `content/templates.json`, `content/products.json`, localStorage (`designData_*`) | `tokens.css`, inline `<style>` (≈950 lines) | Inline `<script>` (full app logic) | Topbar, Sidebar Panels, Canvas Stage, Status Bar | `design-studio` |
| `cart.html` | Shopping cart — item list with qty controls, order summary sidebar, checkout navigation | localStorage (`cart`) | `tokens.css`, `typography.css`, `components.css`, `style.css`, `cart.css` | `layout.js`, `pricing.js`, `cart.js`, `design_preview.js` | Header, Footer, Hero Banner, Cart Items List, Order Summary Sidebar | `cart` |
| `checkout.html` | Checkout — contact info, shipping address, payment method, order summary, place order | sessionStorage (`craftora_checkout`), localStorage (`craftora_user`, `craftora_orders`, `cart`) | `tokens.css`, `typography.css`, `components.css`, `style.css`, `checkout.css` | `layout.js`, `pricing.js`, `checkout.js` | Header, Footer, Contact Form, Address Form, Payment Options, Order Summary | `checkout` |
| `wishlist.html` | Wishlist grid — saved products with remove & navigate actions | localStorage (`craftora_wishlist`) | `tokens.css`, `typography.css`, `components.css`, `style.css`, inline `<style>` (≈200 lines) | `layout.js`, `wishlist.js` | Header, Footer, Guest State, Wishlist Grid, Empty State | `wishlist` |
| `account.html` | User account — profile info display, order history accordion with full details | localStorage (`craftora_user`, `craftora_orders`) | `tokens.css`, `typography.css`, `components.css`, `style.css`, inline `<style>` (≈500 lines) | `layout.js`, `account.js` | Header, Footer, Guest State, Sidebar Nav, Profile Info Card, Order History Accordion | `account` |
| `login.html` | Login form — phone + password authentication | localStorage (`craftora_accounts`, `craftora_user`) | `tokens.css`, `typography.css`, `components.css`, `style.css`, `login.css` | `auth.js`, inline `<script>` (form logic) | Split Layout (image + form), Error Banner, Phone Input, Password Input with Toggle | `login` |
| `signup.html` | Registration form — name, phone, password, confirm password | localStorage (`craftora_accounts`, `craftora_user`) | `tokens.css`, `typography.css`, `components.css`, `style.css`, `login.css` | `auth.js`, inline `<script>` (form logic + validation) | Split Layout (image + form), Error Banner, Password Requirements Indicator | `signup` |
| `about.html` | Brand story — mission, stats, values, contact/map | None | `tokens.css`, `typography.css`, `components.css`, `style.css`, inline `<style>` (≈130 lines) | `layout.js` | Header, Footer, Hero Banner, Mission (image + text), Stats Bar, Values Grid, Contact + Map | `columns` (mission), `stats-bar`, `values-grid`, `map-embed` |
| `contact.html` | Contact page — info sidebar, message form, FAQ accordion | None | `tokens.css`, `typography.css`, `components.css`, `style.css`, inline `<style>` (≈150 lines) | `layout.js`, inline `<script>` (form submit) | Header, Footer, Hero Banner, Contact Info Cards, Contact Form, FAQ Accordion | `contact-form`, `faq` |
| `thank-you.html` | Order confirmation — success icon, order ID, delivery estimate, navigation links | localStorage (`lastOrderId`), URL param `?orderId=` | `tokens.css`, `typography.css`, `components.css`, `style.css`, inline `<style>` (≈120 lines) | `layout.js`, inline `<script>` (order ID display) | Header, Footer, Confirmation Card | `order-confirmation` |

---

## Detailed Page Breakdown

### 1. `index.html` — Homepage

**Purpose:** Landing page showcasing the brand, product categories, featured items, process explanation, social proof, and call-to-action.

**Dependencies:**
- `content/products.json` — featured products data (fetched via JS)
- Reviews hardcoded in `index.js` (not from `reviews.json`)

**CSS Used:**
- `tokens.css` — design tokens (custom properties)
- `typography.css` — font definitions
- `components.css` — shared component styles
- `style.css` — global layout, nav, footer, sections
- `home.css` — homepage-specific hero, categories, featured carousel, process steps, reviews

**JavaScript Used:**
- `layout.js` — header/footer injection, nav interactions, search, cart badge
- `wishlist.js` — wishlist CRUD (used by featured product cards)
- `index.js` — hero button binding, how-it-works tabs, reviews carousel, featured products carousel

**Reusable Sections:**
- Header (nav with search, auth, cart)
- Hero (headline, description, CTA button, image)
- Category Grid (4 linked image cards)
- Featured Products Carousel (prev/next, touch-swipe)
- How-It-Works (4-step grid with images)
- Reviews Carousel (prev/next, touch-swipe)
- CTA Section (heading, text, button)
- Footer (4-column layout)

**Candidate EDS Blocks:**
- `hero` — two-column (text + image), authored
- `category-grid` — linked image cards, authored
- `featured-products` — carousel fetching product data
- `how-it-works` — steps grid, authored
- `reviews` — testimonial carousel (data-driven)
- `cta-banner` — simple authored section

---

### 2. `products.html` — Product Listing

**Purpose:** Browse all products with category filtering. Product cards link to detail pages.

**Dependencies:**
- `content/products.json` — full product catalog
- URL param `?category=` for initial filter state

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- `products.css` — grid layout, product cards, category filter tabs, badges

**JavaScript Used:**
- `layout.js` — header/footer
- `wishlist.js` — wishlist toggle on cards
- `products.js` — fetch products, handle URL params, category filter, render cards
- `index.js` — (loaded but mostly inactive on this page)

**Reusable Sections:**
- Header, Footer
- Hero Banner (title + description)
- Category Filter Tabs (All, Diary, Bottle, Tshirt, Cup)
- Product Card Grid (image, badge, category, title, description, price, wishlist button)

**Candidate EDS Blocks:**
- `product-listing` — JS-heavy block with category tabs + card grid

---

### 3. `product.html` — Product Detail

**Purpose:** Full product detail page — gallery, options (color, size, quantity), custom design toggle, add-to-cart / buy-now, related products.

**Dependencies:**
- `content/products.json` — product data
- URL param `?id=` — which product to display
- localStorage: `designData_{id}`, `cart`, `craftora_wishlist`

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- `product.css` — gallery, thumbnails, pricing, color picker, size selector, design toggle, customization card, trust badges, product details accordion, related products grid

**JavaScript Used:**
- `layout.js` — header/footer
- `pricing.js` — design fee calculations
- `product.js` — full page render: gallery, color picker (60+ color palette), size/qty, design toggle, wishlist, add-to-cart, buy-now, related products
- `design_preview.js` — modal to show saved design preview

**Reusable Sections:**
- Header, Footer
- Breadcrumbs
- Image Gallery (main image + thumbnails)
- Product Info (category, name, pricing, description)
- Color Picker Dropdown (60+ swatches)
- Size Selector (radio buttons)
- Quantity Selector
- Design Toggle (yes/no radio)
- Customization Status Card
- Action Buttons (Customize, Add to Cart, Buy Now)
- Trust Badges (Free Shipping, Easy Returns, Secure Payment)
- Product Details Accordion (specs table)
- Related Products Grid

**Candidate EDS Blocks:**
- `product-detail` — JS-heavy, self-contained, reads query param

---

### 4. `customize.html` — Design Studio

**Purpose:** Canvas-based product customization tool. Users add text, upload images, choose templates, select colors, position/resize elements on a product silhouette.

**Dependencies:**
- `content/products.json` — product metadata
- `content/templates.json` — design template images
- URL param `?id=` — product being customized
- localStorage: `designData_{id}` (read/write)

**CSS Used:**
- `tokens.css` — only base tokens imported
- Inline `<style>` (≈950 lines) — full standalone app UI: grid layout, sidebar, canvas, toolbar, panels, buttons, upload area, templates grid, color swatches, modals

**JavaScript Used:**
- No external script files linked (no `layout.js`)
- Full application logic in inline `<script>` (not shown in loaded portion but implied by HTML structure): sidebar panel toggling, text layer management, image upload, template selection, color picker, canvas drag/resize, save to localStorage, add-to-cart

**Reusable Sections:**
- Top Bar (product name, badge, cart link)
- Sidebar Panels (Color, Text, Templates, Upload)
- Canvas Stage (product silhouette + overlay layers)
- Status Bar

**Candidate EDS Blocks:**
- `design-studio` — standalone JS-heavy block, takes over page layout

**Notes:**
- This page has its own layout (no shared header/footer)
- Most complex feature in the project
- Self-contained — good candidate for a single block

---

### 5. `cart.html` — Shopping Cart

**Purpose:** Display cart items with quantity controls, show order summary, navigate to checkout.

**Dependencies:**
- localStorage: `cart`
- sessionStorage: `craftora_checkout` (written on checkout button click)

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- `cart.css` — cart item cards, quantity controls, summary sidebar, responsive layout

**JavaScript Used:**
- `layout.js` — header/footer
- `pricing.js` — (available but cart items already have final price stored)
- `cart.js` — cart CRUD, render items, quantity update, remove, summary calculation, checkout redirect
- `design_preview.js` — view saved design from cart items

**Reusable Sections:**
- Header, Footer
- Hero Banner (title + description)
- Cart Item Cards (image, name, meta, color, size, design badge, qty controls, price, remove)
- Order Summary Sidebar (item count, subtotal, shipping, discount, total, checkout button)
- Empty State

**Candidate EDS Blocks:**
- `cart` — JS-heavy, reads localStorage

---

### 6. `checkout.html` — Checkout

**Purpose:** Collect contact, shipping, payment info. Display order summary. Place order.

**Dependencies:**
- sessionStorage: `craftora_checkout` — items to purchase
- localStorage: `craftora_user` (pre-fill form), `craftora_orders` (save order)
- Redirects to `thank-you.html` on success

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- `checkout.css` — two-column layout, form sections, input styling, payment options, summary card, trust badges

**JavaScript Used:**
- `layout.js` — header/footer
- `pricing.js` — (loaded but items already priced)
- `checkout.js` — session retrieval, form pre-fill, validation, payment selection, order creation, localStorage persistence, redirect

**Reusable Sections:**
- Header, Footer
- Contact Information Form (name, phone, email)
- Shipping Address Form (address lines, city, state, PIN, country)
- Payment Method Selector (COD, card, UPI, net banking)
- Order Summary Sidebar (item thumbnails, subtotal, shipping, tax, total)
- Place Order Button
- Trust Badges

**Candidate EDS Blocks:**
- `checkout` — JS-heavy, multi-section form

---

### 7. `wishlist.html` — Wishlist

**Purpose:** Display saved/wishlisted products. Allow removal and navigation to product.

**Dependencies:**
- localStorage: `craftora_wishlist`

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- Inline `<style>` (≈200 lines) — wishlist card grid, card styling, empty state, guest state, responsive

**JavaScript Used:**
- `layout.js` — header/footer
- `wishlist.js` — CRUD + page renderer (renders grid, handles remove, clear all, cross-tab sync)

**Reusable Sections:**
- Header, Footer
- Guest State (sign-in prompt)
- Wishlist Header (title + count + clear all button)
- Wishlist Card Grid (image, category, name, price, remove button, customize link)
- Empty State

**Candidate EDS Blocks:**
- `wishlist` — JS-heavy, reads localStorage

---

### 8. `account.html` — My Account

**Purpose:** Display user profile information and order history with expandable details.

**Dependencies:**
- localStorage: `craftora_user`, `craftora_orders`

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- Inline `<style>` (≈500 lines) — account grid layout, sidebar with avatar, info cards, order accordion, order items, responsive

**JavaScript Used:**
- `layout.js` — header/footer (provides `getUser()` and `logout()`)
- `account.js` — profile rendering, order history (accordion with customer info, delivery address, summary, product items with tags)

**Reusable Sections:**
- Header, Footer
- Guest State (sign-in/sign-up prompt)
- Account Sidebar (avatar, name, nav links, logout)
- Personal Info Card (name, email, phone, address, join date)
- Order History Accordion (order ID, date, status badge, customer, address, summary, item cards)

**Candidate EDS Blocks:**
- `account` — JS-heavy, localStorage-driven

---

### 9. `login.html` — Login

**Purpose:** User authentication via phone number and password.

**Dependencies:**
- localStorage: `craftora_accounts` (lookup), `craftora_user` (write session)
- URL param `?redirect=` — post-login redirect target

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- `login.css` — split layout (image left, form right), form styling, error banner, input icons, password toggle, submit button with spinner

**JavaScript Used:**
- `auth.js` — `isValidPhone()`, `attemptLogin()`, `validatePassword()`
- Inline `<script>` — redirect handling, password toggle, form submission with validation and error display

**Reusable Sections:**
- Split Layout (decorative image | form panel)
- Logo Link
- Error Banner
- Phone Input with Icon
- Password Input with Visibility Toggle
- Submit Button with Loading Spinner
- Sign-up Link

**Candidate EDS Blocks:**
- `login` — JS-heavy form block

**Notes:**
- No shared header/footer (standalone auth page layout)
- Shares `login.css` with signup page

---

### 10. `signup.html` — Sign Up

**Purpose:** New user registration with name, phone, password, and confirmation.

**Dependencies:**
- localStorage: `craftora_accounts` (write), `craftora_user` (auto-login)
- URL param `?redirect=` — post-signup redirect target

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- `login.css` — shared auth page styles (same as login)

**JavaScript Used:**
- `auth.js` — `isValidPhone()`, `validatePassword()`, `attemptSignup()`
- Inline `<script>` — redirect handling, password toggle, real-time password requirement indicator, confirm password match, form validation, submission

**Reusable Sections:**
- Split Layout (decorative image | form panel)
- Logo Link
- Error Banner
- Name Input
- Phone Input
- Password + Confirm Password (side by side)
- Password Requirements Checklist (live updating)
- Submit Button with Loading Spinner
- Login Link

**Candidate EDS Blocks:**
- `signup` — JS-heavy form block

**Notes:**
- No shared header/footer (standalone auth page layout)

---

### 11. `about.html` — About Us

**Purpose:** Brand storytelling — mission, company stats, core values, physical location with map.

**Dependencies:**
- None (fully static content)
- Google Maps iframe embed

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- Inline `<style>` (≈130 lines) — about-specific: mission grid, stats bar, values card grid, contact + map section

**JavaScript Used:**
- `layout.js` — header/footer only

**Reusable Sections:**
- Header, Footer
- Hero Banner (title + description)
- Mission Section (image + text, two-column)
- Stats Bar (dark background, 4 stat items)
- Values Grid (4 icon cards with title + description)
- Contact + Map (address info + Google Maps iframe)

**Candidate EDS Blocks:**
- Default content (hero section with heading + paragraph)
- `columns` (mission image + text)
- `stats-bar` or authored section with dark background
- `cards` (values grid — 4 cards with icons)
- `map-embed` or default content with iframe

**Notes:**
- Highly CMS-authorable — mostly static text and images
- Good candidate for fully authored EDS page with minimal JS

---

### 12. `contact.html` — Contact Us

**Purpose:** Contact information display, message form, and FAQ section.

**Dependencies:**
- None (form submission is simulated client-side)

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- Inline `<style>` (≈150 lines) — contact grid, info cards, form styling, success state, FAQ accordion

**JavaScript Used:**
- `layout.js` — header/footer
- Inline `<script>` — form validation, simulated submission with loading state, success/reset toggle

**Reusable Sections:**
- Header, Footer
- Hero Banner (title + description)
- Contact Info Cards (email, phone, address — with icons)
- Contact Form (name, email, subject dropdown, message textarea, submit)
- Success State (confirmation message + reset link)
- FAQ Accordion (5 items with `<details>/<summary>`)

**Candidate EDS Blocks:**
- `contact-form` — form with validation + success state
- `faq` — accordion from authored content (could use `<details>` pattern)

**Notes:**
- FAQ content highly authorable
- Contact info could also be authored

---

### 13. `thank-you.html` — Order Confirmation

**Purpose:** Post-checkout success page showing order ID and next-step links.

**Dependencies:**
- URL param `?orderId=` or localStorage `lastOrderId`

**CSS Used:**
- `tokens.css`, `typography.css`, `components.css`, `style.css`
- Inline `<style>` (≈120 lines) — centered card with icon, details rows, action buttons

**JavaScript Used:**
- `layout.js` — header/footer
- Inline `<script>` (3 lines) — reads order ID from URL/localStorage, displays it

**Reusable Sections:**
- Header, Footer
- Success Icon
- Confirmation Heading + Message
- Order Details Card (order ID, delivery estimate, payment status)
- Action Buttons (Continue Shopping, View Orders)

**Candidate EDS Blocks:**
- `order-confirmation` — simple block reading URL param

**Notes:**
- Mostly static layout with one dynamic value (order ID)
- Could be authored page + tiny JS decoration

---

## Cross-Page Patterns

### Shared Layout Components (present on most pages)

| Component | Implementation | Injected By | EDS Equivalent |
|---|---|---|---|
| Header/Nav | JS-generated HTML string | `layout.js` → `#header` | `blocks/header/` (loaded from `/nav`) |
| Footer | JS-generated HTML string | `layout.js` → `#footer` | `blocks/footer/` (loaded from `/footer`) |
| Hero Banner | Static HTML section with class `.hero-content` | Author in HTML | Default section content (heading + paragraph) |
| Scroll-to-Top | JS-injected fixed button | `layout.js` | `scripts/scripts.js` (global decoration) |
| Toast Notifications | CSS-only system (no JS toast triggers found in main pages) | `style.css` | `styles/lazy-styles.css` |

### Shared JavaScript Utilities

| Utility | Used By | EDS Target |
|---|---|---|
| `getUser()` / `saveUser()` / `logout()` | `layout.js`, `auth.js`, `account.js`, `checkout.js` | `scripts/auth.js` |
| `getCartCount()` / `updateCartBadges()` | `layout.js`, `cart.js`, `product.js`, `checkout.js` | `scripts/cart-utils.js` |
| `getDesignFee()` / `calculateItemPrice()` | `pricing.js` → `product.js`, `cart.js`, `checkout.js` | `scripts/pricing.js` |
| `getWishlist()` / `toggleWishlist()` / `isWishlisted()` | `wishlist.js` → `products.js`, `product.js` | `scripts/wishlist-utils.js` |
| `DesignPreview.show()` / `.showCartCustomization()` | `design_preview.js` → `product.js`, `cart.js` | Modal utility in `scripts/` or within blocks |
| `escapeHTML()` / `money()` / `generateOrderId()` | Multiple files (duplicated) | Consolidate into `scripts/utils.js` |

### CSS Token Dependencies

All pages depend on `tokens.css` for the design system. The token file defines:
- 4 brand colors + semantic variants
- 3 font families (Fraunces, Inter, Lato)
- 15-step spacing scale
- 6-step radius scale
- 12 shadow definitions
- 5 transition presets
- 6 z-index layers
- Layout constraints (container width, nav height)

---

## Pages Without Shared Header/Footer

| Page | Reason |
|---|---|
| `login.html` | Full-bleed split layout (image + form) — no nav needed |
| `signup.html` | Same as login |
| `customize.html` | Standalone app with its own topbar — no standard nav/footer |

---

## Inline Style Counts

| Page | Inline `<style>` Lines | Notes |
|---|---|---|
| `customize.html` | ≈950 | Full standalone app CSS |
| `account.html` | ≈500 | Complex account dashboard |
| `wishlist.html` | ≈200 | Wishlist cards + states |
| `contact.html` | ≈150 | Form + FAQ + info cards |
| `about.html` | ≈130 | Mission, stats, values, map |
| `thank-you.html` | ≈120 | Confirmation card |
| `login.html` | 0 | Uses `login.css` |
| `signup.html` | 0 | Uses `login.css` |
| `index.html` | 0 | Uses `home.css` |
| `products.html` | 0 | Uses `products.css` |
| `product.html` | 0 | Uses `product.css` |
| `cart.html` | 0 | Uses `cart.css` |
| `checkout.html` | 0 | Uses `checkout.css` |

All inline styles will be extracted into their respective block CSS files during migration.
