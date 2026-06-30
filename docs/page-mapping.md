# Craftora EDS — Page Mapping

## Complete Page Inventory

### ✅ Implemented

| Page | URL | Blocks | DA Live Content | JS-Driven |
|------|-----|--------|----------------|-----------|
| Home | / | hero, cards (image-content), carousel (products), cards (round), carousel (reviews), hero-pages (cta) | Headings, images, CTA text | Product/review data from JSON |
| About | /about | hero-pages, columns (left-image), company-stats, cards (icon-content), columns (right-link) | All text, images, stats, values | Map embed from link |
| Login | /login | auth (signin) | Side image, heading, button label, switch link | Form rendering, validation, localStorage auth |
| Signup | /signup | auth (signup) | Side image, heading, button label, switch link | Form + validation + signup logic |

### 🔨 To Implement

| Page | URL | Blocks | DA Live Content | JS-Driven |
|------|-----|--------|----------------|-----------|
| Products | /products | hero-pages, product-listing | Hero heading/desc, JSON endpoint URL | Category filter, card grid, wishlist, URL params |
| Product | /product | product-detail | JSON endpoint URL | Entire page from ?id= param + JSON |
| Cart | /cart | hero-pages, cart | Hero heading/desc, empty state text | Cart items from localStorage, qty, summary |
| Checkout | /checkout | checkout | (minimal) | Entire form + validation + order creation |
| Thank You | /thank-you | hero-pages (confirmation) | Heading, message, delivery estimate, CTAs | Order ID from URL/localStorage |
| Wishlist | /wishlist | hero-pages, wishlist | Hero heading/desc, empty state text | Wishlist grid from localStorage |
| Account | /account | account | Guest state text | Profile + orders from localStorage |
| Contact | /contact | hero-pages, form (contact), accordion | Hero, form config, FAQ Q&As | Form validation + submit |
| Return Policy | /return-policy | (default content) | All authored text | None |
| Privacy Policy | /privacy-policy | (default content) | All authored text | None |
| Terms | /terms | (default content) | All authored text | None |
| 404 | /404 | hero-pages | Heading, message, CTA | None |

---

## Detailed Page Specifications

### /products — Product Listing

**Purpose:** Browse all products with category filtering.

**User Journey:** User clicks "Shop" in nav or category card on homepage → lands on filtered/unfiltered product grid → clicks product card → navigates to /product?id=X.

**Blocks:**
1. `hero-pages` — "All Products" title + description
2. `product-listing` — category tabs + product card grid

**Functionality:**
- Fetch `/content/products.json`
- Render category filter tabs (All, Diary, Bottle, Tshirt, Cup)
- Read `?category=` URL param for initial filter
- Render product cards (image, badge, category, title, desc, price, wishlist btn)
- Wishlist toggle (localStorage)
- Card click → navigate to product detail

**DA Live Content:**
- Hero heading: "All Products"
- Hero description: "Browse our catalogue..."
- Product-listing block: just the JSON endpoint URL

---

### /product — Product Detail

**Purpose:** View full product info, configure options, add to cart or buy now.

**User Journey:** User arrives from product listing or search → views gallery, selects color/size/qty → optionally customizes design → adds to cart OR buys now → redirected to cart/checkout.

**Blocks:**
1. `product-detail` — entire page content

**Functionality:**
- Read `?id=` URL param
- Fetch product from JSON
- Render: breadcrumbs, image gallery (main + thumbnails), category label, product name (h1), pricing (base + design fee), color picker (60+ swatches), size selector, quantity control, design toggle (yes/no), customization card (saved design status), Open Design Studio button, Add to Cart + Buy Now buttons, trust badges (shipping/returns/secure), product details accordion, related products (same category)
- All interactive: gallery switching, color selection, qty +/-, design radio, wishlist toggle
- Add to Cart: builds item object, saves to localStorage, shows toast
- Buy Now: creates checkout session, redirects to /checkout

**Dependencies:** pricing.js, cart-utils.js, wishlist-utils.js, design-preview.js

---

### /cart — Shopping Cart

**Purpose:** Review items before checkout. Adjust quantities, remove items.

**User Journey:** User clicks cart icon → sees items → adjusts qty or removes → clicks "Proceed to Checkout" → goes to /checkout.

**Blocks:**
1. `hero-pages` — "Your Cart" title
2. `cart` — items + summary

**Functionality:**
- Read localStorage `cart`
- Render each item (image, name, color dot, size, design preview btn, qty controls, line total, remove)
- Order summary sidebar (item count, subtotal, shipping free, discount, total)
- Checkout button: writes `craftora_checkout` to sessionStorage, navigates to /checkout
- Empty state when cart is empty
- Design preview modal via DesignPreview.showCartCustomization()

---

### /checkout — Checkout

**Purpose:** Collect shipping/payment info and place order.

**User Journey:** User arrives from cart or buy-now → fills contact info → fills address → selects payment → places order → redirected to /thank-you.

**Blocks:**
1. `checkout`

**Functionality:**
- Read sessionStorage `craftora_checkout` (redirect to /cart if empty)
- Pre-fill from localStorage `craftora_user`
- Sections: Contact Info (name, phone, email), Shipping Address (addr1, addr2, city, state, PIN, country), Payment Method (COD, Card, UPI, Netbanking)
- Right sidebar: order summary (item thumbnails, meta, subtotal, total)
- Validate all required fields
- Place Order: generate ID, save to `craftora_orders`, update user address, clear cart (if source=cart), redirect to /thank-you

---

### /thank-you — Order Confirmation

**Purpose:** Post-purchase success page.

**User Journey:** User places order → redirected here → sees confirmation → navigates to products or account.

**Blocks:**
1. `hero-pages` (confirmation variant)

**Functionality:**
- Read `?orderId=` param or localStorage `lastOrderId`
- Display: success icon, "Thank You" heading, order ID, delivery estimate, payment confirmed
- CTAs: Continue Shopping → /products, View Orders → /account

---

### /wishlist — Wishlist

**Purpose:** View saved/favorited products.

**User Journey:** User clicks wishlist icon → sees saved items → clicks product to view → or removes items.

**Blocks:**
1. `hero-pages` — title
2. `wishlist`

**Functionality:**
- Read localStorage `craftora_wishlist`
- Render grid of cards (image, category, name, price, remove btn, customize link)
- Clear all button (with confirm dialog)
- Empty state when no items
- Cross-tab sync via storage event

---

### /account — My Account

**Purpose:** User dashboard with profile info and order history.

**User Journey:** User navigates from profile dropdown → sees profile info + orders → expands order accordion for details.

**Blocks:**
1. `account`

**Functionality:**
- Read localStorage `craftora_user` (show guest state if null)
- Sidebar: avatar with initials, name, phone, nav links (Account, Orders, Wishlist, Cart, Sign Out)
- Profile card: name, email, phone, address, join date
- Order history: accordion per order (ID, date, status badge, items with images, delivery address, payment summary)
- Logout button

---

### /contact — Contact Us

**Purpose:** Contact information and message form.

**User Journey:** User navigates to contact → sees info cards → fills form → submits → sees success state.

**Blocks:**
1. `hero-pages` — "Get in Touch" title
2. `form` (contact variant) — name, email, subject, message
3. `accordion` — FAQ items

**Functionality:**
- Contact info cards (email, phone, address) as authored default content
- Form: validate required fields + email format, simulated submit, success/reset state
- FAQ: 5 Q&A pairs in native `<details>` elements

---

### Policy Pages (/return-policy, /privacy-policy, /terms)

**Purpose:** Legal/policy information.

**Blocks:** None — pure authored content (headings + paragraphs).
**DA Live:** Authors write policy text directly. No JS needed.

---

### /404 — Not Found

**Purpose:** Error page for missing URLs.

**Blocks:**
1. `hero-pages` — "Page Not Found" + message + CTA back to home

**DA Live:** Heading, message, link to homepage.

---

## Navigation Structure

```
Header Nav:  Home | Shop | About | Contact | [Search] | [Auth] | [Wishlist] | [Cart]
Footer:      Quick Links | Shop (categories) | Account | Policies
Mobile:      Hamburger → drawer with all links + auth
```

## URL Routing

| URL Pattern | Purpose |
|---|---|
| `/` | Homepage |
| `/products` | Product listing |
| `/products?category=X` | Filtered listing |
| `/product?id=X` | Product detail |
| `/customize?id=X` | Design studio |
| `/cart` | Shopping cart |
| `/checkout` | Checkout form |
| `/thank-you?orderId=X` | Order confirmation |
| `/wishlist` | Wishlist |
| `/account` | My Account |
| `/login` | Sign in |
| `/login?redirect=X` | Sign in with redirect |
| `/signup` | Create account |
| `/signup?redirect=X` | Create account with redirect |
| `/about` | About us |
| `/contact` | Contact page |
| `/return-policy` | Return policy |
| `/privacy-policy` | Privacy policy |
| `/terms` | Terms & conditions |
