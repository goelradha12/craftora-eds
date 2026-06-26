# Craftora Legacy — Reusable UI Components

## Summary Table

| # | Component | Files Used | Dependencies | EDS Block? | Recommended Block Name |
|---|-----------|-----------|--------------|------------|----------------------|
| 1 | Header / Navigation | `layout.js`, `style.css` | `auth.js` (getUser), `content/products.json` (search), localStorage | Yes | `header` |
| 2 | Footer | `layout.js`, `style.css` | `auth.js` (getUser) | Yes | `footer` |
| 3 | Hero (Homepage) | `index.html`, `home.css` | None | Yes | `hero` |
| 4 | Hero Banner (Inner Pages) | Multiple pages, `style.css` | None | No (default content) | — |
| 5 | Product Card | `products.js`, `index.js`, `products.css`, `home.css` | `wishlist.js`, `content/products.json` | Yes | `product-listing` (part of) |
| 6 | Category Card | `index.html`, `home.css` | None | Yes | `category-grid` |
| 7 | Featured Products Carousel | `index.js`, `home.css` | `content/products.json` | Yes | `featured-products` |
| 8 | Reviews Carousel | `index.js`, `home.css` | Hardcoded review data in JS | Yes | `reviews` |
| 9 | How-It-Works Steps | `index.html`, `index.js`, `home.css` | None | Yes | `how-it-works` |
| 10 | CTA Section | `index.html`, `home.css` | None | Yes | `cta-banner` |
| 11 | Category Filter Tabs | `products.js`, `products.css` | URL params | No (part of `product-listing`) | — |
| 12 | Global Search | `layout.js`, `style.css` | `content/products.json` | No (part of `header`) | — |
| 13 | Product Gallery | `product.js`, `product.css` | None | No (part of `product-detail`) | — |
| 14 | Color Picker | `product.js`, `product.css` | 60+ color palette object | No (part of `product-detail`) | — |
| 15 | Size Selector | `product.js`, `product.css` | Product sizes array | No (part of `product-detail`) | — |
| 16 | Quantity Selector | `product.js`, `cart.js`, `product.css`, `cart.css` | None | No (shared sub-component) | — |
| 17 | Design Toggle | `product.js`, `product.css` | `pricing.js` | No (part of `product-detail`) | — |
| 18 | Customization Status Card | `product.js`, `product.css` | localStorage (`designData_*`) | No (part of `product-detail`) | — |
| 19 | Related Products Grid | `product.js`, `product.css` | `content/products.json` | No (part of `product-detail`) | — |
| 20 | Breadcrumbs | `product.js`, `product.css` | URL params | No (part of `product-detail`) | — |
| 21 | Trust Badges | `product.js`, `product.css` | None | No (part of `product-detail`) | — |
| 22 | Product Details Accordion | `product.js`, `product.css` | Product details array | No (part of `product-detail`) | — |
| 23 | Design Studio Topbar | `customize.html` (inline) | localStorage (`cart`) | No (part of `design-studio`) | — |
| 24 | Design Studio Sidebar | `customize.html` (inline) | `content/templates.json` | No (part of `design-studio`) | — |
| 25 | Design Studio Canvas | `customize.html` (inline) | DOM manipulation, drag/resize | No (part of `design-studio`) | — |
| 26 | Cart Item Card | `cart.js`, `cart.css` | `pricing.js`, `design_preview.js` | No (part of `cart`) | — |
| 27 | Order Summary Sidebar | `cart.html`, `cart.css` | Cart data calculations | No (part of `cart`) | — |
| 28 | Checkout Form (Contact) | `checkout.html`, `checkout.css` | localStorage (`craftora_user`) | No (part of `checkout`) | — |
| 29 | Checkout Form (Shipping) | `checkout.html`, `checkout.css` | localStorage (`craftora_user`) | No (part of `checkout`) | — |
| 30 | Payment Method Selector | `checkout.js`, `checkout.css` | None | No (part of `checkout`) | — |
| 31 | Checkout Summary | `checkout.js`, `checkout.css` | sessionStorage (`craftora_checkout`) | No (part of `checkout`) | — |
| 32 | Wishlist Card | `wishlist.js`, `wishlist.html` (inline CSS) | localStorage (`craftora_wishlist`) | No (part of `wishlist`) | — |
| 33 | Account Sidebar | `account.html` (inline CSS) | `auth.js` (getUser) | No (part of `account`) | — |
| 34 | Order History Accordion | `account.js`, `account.html` (inline CSS) | localStorage (`craftora_orders`) | No (part of `account`) | — |
| 35 | Login Form | `login.html`, `auth.js`, `login.css` | localStorage (`craftora_accounts`) | Yes | `login` |
| 36 | Signup Form | `signup.html`, `auth.js`, `login.css` | localStorage (`craftora_accounts`) | Yes | `signup` |
| 37 | Auth Split Layout | `login.html`, `signup.html`, `login.css` | None (decorative image + form) | No (part of `login`/`signup`) | — |
| 38 | Contact Form | `contact.html` (inline JS + CSS) | None | Yes | `contact-form` |
| 39 | FAQ Accordion | `contact.html` (inline CSS) | None | Yes | `faq` |
| 40 | Design Preview Modal | `design_preview.js` | localStorage (`designData_*`, `cart`) | No (utility script) | — |
| 41 | Toast Notification | `style.css` | None (CSS-only structure) | No (global utility) | — |
| 42 | Scroll-to-Top Button | `layout.js`, `style.css` (inline in JS) | None | No (global utility) | — |
| 43 | Profile Dropdown | `layout.js`, `style.css` | `auth.js` (getUser) | No (part of `header`) | — |
| 44 | Mobile Nav Drawer | `layout.js`, `style.css` | None | No (part of `header`) | — |
| 45 | Empty State | Multiple pages | None | No (pattern within blocks) | — |
| 46 | Guest State | `wishlist.html`, `account.html` | `auth.js` (getUser) | No (pattern within blocks) | — |
| 47 | Stats Bar | `about.html` (inline CSS) | None | Yes | `stats-bar` |
| 48 | Values Grid | `about.html` (inline CSS) | None | Yes | `cards` (variant) |
| 49 | Order Confirmation Card | `thank-you.html` (inline CSS/JS) | URL params, localStorage | Yes | `order-confirmation` |
| 50 | Error Banner | `login.html`, `signup.html`, `login.css` | None | No (pattern within blocks) | — |

---

## Detailed Component Descriptions

### 1. Header / Navigation

**Files:** `scripts/layout.js` (buildHeader, initGlobalSearch, mobile menu, badge updater), `styles/style.css` (nav, dropdown, search, mobile drawer, cart badge)

**Dependencies:** `auth.js` getUser() for profile/guest state, `content/products.json` for global search autocomplete, localStorage for cart count

**Sub-components included:**
- Logo + home link
- Desktop nav links (Home, Shop, About, Contact) with active indicator
- Global product search with dropdown results
- Profile dropdown (logged in) or Sign In button (guest)
- Wishlist icon link
- Cart icon + badge counter
- Mobile: hamburger → slide-in drawer with same links
- Mobile: search bar toggle (slides below nav)
- Skip-to-content link (a11y)

**EDS Block:** Yes — `header` (loaded from authored `/nav` document)

---

### 2. Footer

**Files:** `scripts/layout.js` (buildFooterHTML), `styles/style.css` (footer section)

**Dependencies:** `auth.js` getUser() for dynamic account links

**Sub-components included:**
- Brand column (logo, tagline, address, social icons)
- Quick Links column
- Shop column (category links)
- Account column (context-aware: logged-in vs guest links)
- Bottom bar (copyright, legal links)

**EDS Block:** Yes — `footer` (loaded from authored `/footer` document)

---

### 3. Hero (Homepage)

**Files:** `index.html` (HTML structure), `styles/home.css` (hero styles)

**Dependencies:** None

**Description:** Two-column split — left: heading with highlighted keyword, paragraph, CTA button; right: full-bleed image. Responsive stacks vertically.

**EDS Block:** Yes — `hero`

---

### 4. Hero Banner (Inner Pages)

**Files:** Multiple pages (products, cart, about, contact), `styles/style.css` (.hero-content)

**Dependencies:** None

**Description:** Full-width blue background section with SVG pattern. Contains h1 + description paragraph. Used as page title area on inner pages.

**EDS Block:** No — maps to default section content in EDS (heading + paragraph styled via section metadata)

---

### 5. Product Card

**Files:** `scripts/products.js` (renderProducts), `scripts/index.js` (initFeaturedProducts), `styles/products.css`, `styles/home.css`

**Dependencies:** `wishlist.js` for heart toggle, `content/products.json` for data

**Description:** Card with background-image wrapper, badge overlay, content area (category, title, description, price), footer with wishlist button. Entire card is clickable (navigates to product detail).

**EDS Block:** Yes (as part of `product-listing` and `featured-products` blocks)

---

### 6. Category Card

**Files:** `index.html` (static HTML), `styles/home.css`

**Dependencies:** None (static links)

**Description:** Linked card with product category image + title overlay. 4 cards in a responsive grid (Diary, Bottle, T-shirt, Cup). Each links to products page filtered by category.

**EDS Block:** Yes — `category-grid`

---

### 7. Featured Products Carousel

**Files:** `scripts/index.js` (initFeaturedProducts), `styles/home.css`

**Dependencies:** `content/products.json` (filters by `featured: true`)

**Description:** Horizontal scroll carousel with prev/next arrow buttons. Renders product cards for featured items. Touch-swipe support. Responsive (1/2/3 visible cards). Empty state fallback.

**EDS Block:** Yes — `featured-products`

---

### 8. Reviews Carousel

**Files:** `scripts/index.js` (initReviewsCarousel), `styles/home.css`

**Dependencies:** Hardcoded review data in JS (5 reviews with name, location, text, rating, avatar color)

**Description:** Horizontal carousel with star ratings, quote text, author name + location. Prev/next buttons. Touch-swipe. Responsive visible count.

**EDS Block:** Yes — `reviews`

---

### 9. How-It-Works Steps

**Files:** `index.html` (static HTML), `styles/home.css`

**Dependencies:** None (static content)

**Description:** 4-step grid with image + title for each step (Pick a Product → Design it → Place your order → We deliver). Section heading + subtitle above.

**EDS Block:** Yes — `how-it-works`

---

### 10. CTA Section

**Files:** `index.html` (static HTML), `styles/home.css`

**Dependencies:** None

**Description:** Centered section with heading, paragraph, and accent-colored CTA button linking to products page.

**EDS Block:** Yes — `cta-banner`

---

### 11. Category Filter Tabs

**Files:** `scripts/products.js` (setupEventListeners, applyFilters), `styles/products.css`

**Dependencies:** URL param `?category=` for initial state

**Description:** Horizontal row of pill buttons (All Category, Diary, Bottle, Tshirt, Cup). Active state styling. Click toggles filter and re-renders product grid.

**EDS Block:** No — sub-component of `product-listing` block

---

### 12. Global Search

**Files:** `scripts/layout.js` (initGlobalSearch), `styles/style.css`

**Dependencies:** `content/products.json` (fetched and cached on first search)

**Description:** Input with search icon. Debounced query filters products by name/category. Dropdown shows image, name, category for each result. Keyboard nav support. Mobile variant: toggleable search bar below nav.

**EDS Block:** No — part of `header` block

---

### 13. Product Gallery

**Files:** `scripts/product.js` (renderGallery), `styles/product.css`

**Dependencies:** Product images array from JSON

**Description:** Main image (large, fetchpriority high) + horizontal thumbnail strip. Clicking thumbnail swaps main image. Badge overlays. Wishlist button overlay.

**EDS Block:** No — sub-component of `product-detail` block

---

### 14. Color Picker

**Files:** `scripts/product.js` (renderColorPicker, COLOR_PALETTE object), `styles/product.css`

**Dependencies:** 60+ color palette defined in JS object

**Description:** Dropdown trigger showing selected color dot + name. Expands to reveal a swatch grid of 60+ colors. Click selects color. Light colors get a visible border.

**EDS Block:** No — sub-component of `product-detail` block

---

### 15. Size Selector

**Files:** `scripts/product.js` (renderProductInfo), `styles/product.css`

**Dependencies:** Product `sizes` array from JSON

**Description:** Radio button group styled as pill buttons. First option pre-selected. Disabled when out of stock.

**EDS Block:** No — sub-component of `product-detail` block

---

### 16. Quantity Selector

**Files:** `scripts/product.js`, `scripts/cart.js`, `styles/product.css`, `styles/cart.css`

**Dependencies:** None

**Description:** Minus/plus buttons flanking a numeric output. Minus disabled at qty 1. Used on product detail page and in cart items. Accessible role="group" with aria-labels.

**EDS Block:** No — shared pattern (CSS class `.product__qty`)

---

### 17. Design Toggle

**Files:** `scripts/product.js` (renderDesignToggle, updateUI), `styles/product.css`

**Dependencies:** `pricing.js` for design fee display

**Description:** "Custom Design?" label with Yes/No radio buttons. Toggling "Yes" shows customization card + fee breakdown, enables/disables cart buttons based on whether design is saved.

**EDS Block:** No — sub-component of `product-detail` block

---

### 18. Customization Status Card

**Files:** `scripts/product.js` (renderCustomizationCard, updateCustomizationUI), `styles/product.css`

**Dependencies:** localStorage `designData_{id}`

**Description:** Conditional card showing design state: "missing" (prompt to open studio), "ready" (preview image + saved confirmation), or "out of stock". Includes preview image thumbnail and "Edit Design" / "Open Design Studio" button label toggle.

**EDS Block:** No — sub-component of `product-detail` block

---

### 19. Related Products Grid

**Files:** `scripts/product.js` (renderRelatedProducts), `styles/product.css`

**Dependencies:** `content/products.json` (same-category products, max 4)

**Description:** "You May Also Like" section with 4 linked cards (image, category, name, price). Filtered from same category, excluding current product.

**EDS Block:** No — sub-component of `product-detail` block

---

### 20. Breadcrumbs

**Files:** `scripts/product.js` (renderBreadcrumbs), `styles/product.css`

**Dependencies:** Product category + name from JSON, URL construction

**Description:** Ordered list: Shop / Category / Product Name. Each link navigates to appropriate filtered listing.

**EDS Block:** No — sub-component of `product-detail` block (could also be a global auto-block)

---

### 21. Trust Badges

**Files:** `scripts/product.js` (renderProductInfo), `styles/product.css`

**Dependencies:** None (static SVG icons + labels)

**Description:** Row of 3 icon+text badges: Free Shipping, Easy Returns, Secure Payment. Below action buttons on product detail.

**EDS Block:** No — sub-component (could be a reusable authored fragment)

---

### 22. Product Details Accordion

**Files:** `scripts/product.js` (renderProductDetails, bindEvents), `styles/product.css`

**Dependencies:** Product `productDetails` array from JSON

**Description:** Collapsible section with toggle button. Contains a definition list (dt/dd) of product specifications. Open by default, toggleable with aria-expanded.

**EDS Block:** No — sub-component of `product-detail` block

---

### 23. Design Studio Topbar

**Files:** `customize.html` (inline HTML + CSS + JS)

**Dependencies:** localStorage `cart` (badge count), product name from URL param

**Description:** Fixed top bar spanning full width. Contains: back link, product name, category badge, spacer, cart link with badge counter. Minimal branding (no full nav).

**EDS Block:** No — part of `design-studio` block

---

### 24. Design Studio Sidebar

**Files:** `customize.html` (inline HTML + CSS + JS)

**Dependencies:** `content/templates.json`, color palette constants

**Description:** 350px fixed sidebar with collapsible panel sections: Color (swatches + chip), Text (add layers, font controls, alignment), Templates (grid of category-filtered thumbnails), Upload (drag-drop area with preview). Scrollable with thin scrollbar.

**EDS Block:** No — part of `design-studio` block

---

### 25. Design Studio Canvas

**Files:** `customize.html` (inline HTML + CSS + JS)

**Dependencies:** Product silhouette SVG, DOM drag/resize APIs

**Description:** Central canvas area with product shape rendering. Overlay div for draggable/resizable layer objects (text, images, templates). Toolbar above with zoom, delete, save buttons. Resize handle on selected objects. Selection state with blue outline.

**EDS Block:** No — part of `design-studio` block

---

### 26. Cart Item Card

**Files:** `scripts/cart.js` (renderCart), `styles/cart.css`

**Dependencies:** `pricing.js` (money formatter), `design_preview.js` (view design button)

**Description:** Horizontal card: product image (left), details area (name, color dot + name, size, design preview button, design fee label), price (right), bottom row with qty selector + remove button. Clickable name navigates to product detail.

**EDS Block:** No — sub-component of `cart` block

---

### 27. Order Summary Sidebar

**Files:** `cart.html` (static HTML structure), `scripts/cart.js` (updateSummary), `styles/cart.css`

**Dependencies:** Cart data totals

**Description:** Sticky aside with: title, rows (items count, subtotal, shipping "Free", discounts), divider, total row, "Proceed to Checkout" button (disabled when empty), helper note text.

**EDS Block:** No — sub-component of `cart` block

---

### 28. Checkout Form — Contact Information

**Files:** `checkout.html`, `scripts/checkout.js`, `styles/checkout.css`

**Dependencies:** localStorage `craftora_user` (pre-fill)

**Description:** Section with icon+title header, two-column row (Full Name + Phone), single-column Email. Each field has label, input, error paragraph. Auto-filled from saved user data.

**EDS Block:** No — sub-component of `checkout` block

---

### 29. Checkout Form — Shipping Address

**Files:** `checkout.html`, `scripts/checkout.js`, `styles/checkout.css`

**Dependencies:** localStorage `craftora_user` addressObj (pre-fill)

**Description:** Section with icon+title header. Fields: Address Line 1, Address Line 2, City + State (row), PIN + Country (row). Validation for required fields and PIN format.

**EDS Block:** No — sub-component of `checkout` block

---

### 30. Payment Method Selector

**Files:** `checkout.html`, `scripts/checkout.js`, `styles/checkout.css`

**Dependencies:** None

**Description:** Radio button group styled as selectable cards: Cash on Delivery, Credit/Debit Card, UPI, Net Banking. Click highlights selection. Validated on submit.

**EDS Block:** No — sub-component of `checkout` block

---

### 31. Checkout Summary

**Files:** `checkout.html`, `scripts/checkout.js`, `styles/checkout.css`

**Dependencies:** sessionStorage `craftora_checkout` (items array)

**Description:** Sticky sidebar showing: item thumbnails with name/meta/price, subtotal row, shipping "Free", tax "Included", divider, total, "Place Order" button, trust text ("Secure, Free Shipping, Easy Returns").

**EDS Block:** No — sub-component of `checkout` block

---

### 32. Wishlist Card

**Files:** `scripts/wishlist.js` (renderWishlistPage), `wishlist.html` (inline CSS)

**Dependencies:** localStorage `craftora_wishlist`

**Description:** Card with: product image, absolute-positioned remove (X) button, body (category label, product name, price, "Customize" link button). Hover lifts card. Grid auto-fill layout (min 240px columns).

**EDS Block:** No — sub-component of `wishlist` block

---

### 33. Account Sidebar

**Files:** `account.html` (inline CSS), `scripts/account.js`

**Dependencies:** `auth.js` getUser() for avatar/name

**Description:** Sticky sidebar with: dark gradient header (avatar circle with initials, name, phone), nav list (My Account, My Orders, Wishlist, Cart, divider, Sign Out). Active state with accent left border.

**EDS Block:** No — sub-component of `account` block

---

### 34. Order History Accordion

**Files:** `scripts/account.js` (renderOrders), `account.html` (inline CSS)

**Dependencies:** localStorage `craftora_orders`

**Description:** `<details>` elements per order. Summary row: order ID, date, item count, total amount, status badge, chevron icon. Body: customer info card, delivery address card, order summary (subtotal, design fees, shipping, total, payment), product items list with images, color dots, size, customization tags.

**EDS Block:** No — sub-component of `account` block

---

### 35. Login Form

**Files:** `login.html`, `scripts/auth.js`, `styles/login.css`, inline `<script>`

**Dependencies:** localStorage `craftora_accounts` (read), `craftora_user` (write), URL param `?redirect=`

**Description:** Phone number input (with icon), password input (with visibility toggle), submit button with loading spinner, error banner, sign-up link. Form validation (phone format, required fields).

**EDS Block:** Yes — `login`

---

### 36. Signup Form

**Files:** `signup.html`, `scripts/auth.js`, `styles/login.css`, inline `<script>`

**Dependencies:** localStorage `craftora_accounts` (write), `craftora_user` (auto-login), URL param `?redirect=`

**Description:** Full name, phone, password + confirm password (side by side), real-time password requirements checklist, submit button with spinner, error banner, login link.

**EDS Block:** Yes — `signup`

---

### 37. Auth Split Layout

**Files:** `login.html`, `signup.html`, `styles/login.css`

**Dependencies:** None (decorative image asset)

**Description:** Full-viewport two-column layout: left half is a decorative product image (`t-shirt_blue_person.webp`), right half is the form area with logo link at top. Responsive collapses to form-only on mobile.

**EDS Block:** No — layout pattern within `login` / `signup` blocks

---

### 38. Contact Form

**Files:** `contact.html` (inline CSS + JS)

**Dependencies:** None (simulated submission)

**Description:** Sections: name + email (row), subject dropdown, message textarea, submit button with spinner. Client-side validation (required + email format). Success state replaces form with confirmation message + "Send another" reset link.

**EDS Block:** Yes — `contact-form`

---

### 39. FAQ Accordion

**Files:** `contact.html` (inline CSS)

**Dependencies:** None (static authored content)

**Description:** Stack of `<details>` elements with custom styled `<summary>`. Chevron rotates on open. 5 Q&A items with answers hidden by default.

**EDS Block:** Yes — `faq` (leverages native `<details>`/`<summary>`)

---

### 40. Design Preview Modal

**Files:** `scripts/design_preview.js` (IIFE module: `DesignPreview`)

**Dependencies:** localStorage `designData_*` (product designs), localStorage `cart` (cart item designs)

**Description:** Full-screen backdrop with centered card modal. Shows saved design preview image (or "no preview" state). Header with title + subtitle (product name · category). Footer with saved date + optional "Customize again" button. Closes on: backdrop click, close button, Escape key. Styles injected dynamically. Used by product detail page and cart page.

**EDS Block:** No — utility script (loaded within blocks that need it)

---

### 41. Toast Notification

**Files:** `styles/style.css` (.toast-region, .toast, .toast__body, .toast__close)

**Dependencies:** None (CSS structure only — no JS triggers observed in main pages)

**Description:** Fixed-position region (top-right desktop, top-center mobile). Toast cards with left color bar (variants: success, error, warning, info), title, message, close button. Enter/exit animations. Note: CSS defined but no JS utility to create toasts was found in the analyzed scripts; appears prepared for future use.

**EDS Block:** No — global CSS utility in `styles/lazy-styles.css`

---

### 42. Scroll-to-Top Button

**Files:** `scripts/layout.js` (injected HTML + inline styles + scroll listener)

**Dependencies:** None

**Description:** Fixed bottom-right circular button (44×44px). Shows after 350px scroll with opacity/transform transition. Smooth-scrolls to top on click. Injected into every page that loads `layout.js`.

**EDS Block:** No — global utility in `scripts/delayed.js` or `scripts/scripts.js`

---

### 43. Profile Dropdown

**Files:** `scripts/layout.js` (buildProfileMenuHTML, event handlers), `styles/style.css`

**Dependencies:** `auth.js` getUser() — renders initials avatar, user name, menu links

**Description:** Desktop trigger button: avatar circle + first name + chevron. Menu: account links, wishlist, cart, divider, sign out. Opens on click, closes on outside click or Escape. Animated opacity + transform.

**EDS Block:** No — sub-component of `header` block

---

### 44. Mobile Nav Drawer

**Files:** `scripts/layout.js` (openMenu, closeMenu), `styles/style.css`

**Dependencies:** None (uses same nav links + auth state)

**Description:** Fixed right-side slide-in drawer (max 360px). Contains: header with "Menu" label + close button, search input, nav links, profile dropdown (accordion-style on mobile) or sign-in link. Overlay backdrop with blur. Focus trap implicit (first element focused on open, Escape closes).

**EDS Block:** No — sub-component of `header` block

---

### 45. Empty State

**Files:** Multiple pages (`cart.js`, `wishlist.js`, `account.js`)

**Dependencies:** None

**Description:** Centered content block shown when a list has zero items. Includes: large muted SVG icon, heading ("Your cart is empty"), description paragraph, CTA link/button ("Continue Shopping" / "Browse Products"). Variations exist per page but follow same pattern.

**EDS Block:** No — repeated pattern within individual blocks (cart, wishlist, account)

---

### 46. Guest State

**Files:** `wishlist.html`, `account.html` (HTML + inline CSS), `wishlist.js`, `account.js`

**Dependencies:** `auth.js` getUser() — shown when no user session

**Description:** Centered card shown to unauthenticated users. Icon, heading ("Sign in to see your wishlist" / "You're not signed in"), description, action buttons (Sign In + secondary action). Hidden by default, revealed via JS when getUser() returns null.

**EDS Block:** No — pattern within `wishlist` and `account` blocks

---

### 47. Stats Bar

**Files:** `about.html` (inline CSS)

**Dependencies:** None (static authored numbers)

**Description:** Dark background section with centered stat items (number + label). Responsive grid. Used for: "12K+ Happy Customers", "50K+ Products Shipped", "98% Satisfaction Rate", "4+ Years in Business". Accent color on numbers.

**EDS Block:** Yes — `stats-bar` (authored content with dark section metadata)

---

### 48. Values Grid

**Files:** `about.html` (inline CSS)

**Dependencies:** None (static authored content)

**Description:** 4-column responsive card grid. Each card: colored icon container (accent subtle background), h3 title, paragraph description. Cards have white background, rounded corners, padding.

**EDS Block:** Yes — `cards` (using the existing boilerplate cards block with styling variant)

---

### 49. Order Confirmation Card

**Files:** `thank-you.html` (inline CSS + JS)

**Dependencies:** URL param `?orderId=`, localStorage `lastOrderId`

**Description:** Centered single-column layout: success icon (green circle + check), heading, message paragraph, details card (order ID, delivery estimate, payment status as rows), action buttons (Continue Shopping primary, View Orders secondary).

**EDS Block:** Yes — `order-confirmation`

---

### 50. Error Banner

**Files:** `login.html`, `signup.html`, `styles/login.css`

**Dependencies:** None (shown/hidden via JS)

**Description:** Alert banner with warning icon + error message text. Hidden by default (`hidden` attribute). Shown with red styling when authentication fails. Role="alert" for screen reader announcement.

**EDS Block:** No — pattern within `login` / `signup` blocks

---

## EDS Block Candidates — Final List

| Block Name | Source Components | Type | Priority |
|---|---|---|---|
| `header` | Header, Global Search, Profile Dropdown, Mobile Nav Drawer, Cart Badge | Hybrid (authored nav + JS) | P0 |
| `footer` | Footer | Authored | P0 |
| `hero` | Hero (Homepage) | Authored | P0 |
| `category-grid` | Category Card (×4) | Authored | P0 |
| `product-listing` | Category Filter Tabs, Product Card Grid | JS-heavy | P0 |
| `product-detail` | Gallery, Color Picker, Size Selector, Qty Selector, Design Toggle, Customization Card, Trust Badges, Details Accordion, Related Products, Breadcrumbs | JS-heavy | P0 |
| `featured-products` | Featured Products Carousel, Product Card | Hybrid | P1 |
| `how-it-works` | How-It-Works Steps | Authored | P1 |
| `reviews` | Reviews Carousel | Hybrid | P1 |
| `cta-banner` | CTA Section | Authored | P1 |
| `cart` | Cart Item Card, Order Summary Sidebar, Empty State | JS-heavy | P0 |
| `checkout` | Contact Form, Shipping Form, Payment Selector, Checkout Summary | JS-heavy | P1 |
| `wishlist` | Wishlist Card, Guest State, Empty State | JS-heavy | P1 |
| `account` | Account Sidebar, Profile Info Card, Order History Accordion, Guest State | JS-heavy | P1 |
| `login` | Auth Split Layout, Login Form, Error Banner | JS-heavy | P1 |
| `signup` | Auth Split Layout, Signup Form, Error Banner, Password Requirements | JS-heavy | P1 |
| `design-studio` | Topbar, Sidebar, Canvas, Status Bar | JS-heavy (standalone) | P2 |
| `contact-form` | Contact Form, Success State | JS-light | P1 |
| `faq` | FAQ Accordion | Authored | P1 |
| `stats-bar` | Stats Bar | Authored | P1 |
| `order-confirmation` | Order Confirmation Card | JS-light | P1 |
