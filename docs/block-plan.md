# Craftora EDS — Block Architecture Plan

## Block Overview

| # | Block Name | Type | Priority | Pages Used |
|---|-----------|------|----------|------------|
| 1 | `header` | Hybrid (authored nav + JS) | P0 | All (except login, signup, customize) |
| 2 | `footer` | Authored + JS | P0 | All (except login, signup, customize) |
| 3 | `hero` | Authored | P0 | Homepage |
| 4 | `category-grid` | Authored | P0 | Homepage |
| 5 | `product-listing` | JS-heavy | P0 | /products |
| 6 | `product-detail` | JS-heavy | P0 | /product |
| 7 | `cart` | JS-heavy | P0 | /cart |
| 8 | `featured-products` | Hybrid | P1 | Homepage |
| 9 | `how-it-works` | Authored | P1 | Homepage |
| 10 | `reviews` | Hybrid | P1 | Homepage |
| 11 | `cta-banner` | Authored | P1 | Homepage |
| 12 | `checkout` | JS-heavy | P1 | /checkout |
| 13 | `wishlist` | JS-heavy | P1 | /wishlist |
| 14 | `account` | JS-heavy | P1 | /account |
| 15 | `login` | JS-heavy | P1 | /login |
| 16 | `signup` | JS-heavy | P1 | /signup |
| 17 | `contact-form` | JS-light | P1 | /contact |
| 18 | `faq` | Authored | P1 | /contact |
| 19 | `stats-bar` | Authored | P1 | /about |
| 20 | `order-confirmation` | JS-light | P1 | /thank-you |
| 21 | `design-studio` | JS-heavy (standalone) | P2 | /customize |

---

## Detailed Block Specifications

---

### 1. Header

**Purpose:** Site-wide navigation with logo, links, global product search, auth state (profile dropdown or sign-in CTA), wishlist icon, cart icon with badge count, and responsive mobile drawer.

**Authorable Fields:**
| Field | Type | Notes |
|-------|------|-------|
| Logo | Image | Site logo linking to homepage |
| Nav Links | Link list | Home, Shop, About, Contact |
| CTA Button Text | Text | e.g. "Sign In" |
| CTA Button Link | URL | e.g. /login |

**Example DA Table (authored in /nav):**

The `/nav` page is authored as simple content:

```
| Logo (image) | Craftora logo |
```

- Home (link to /)
- Shop (link to /products)
- About (link to /about)
- Contact (link to /contact)

Sign In (link to /login)

**Files:**
- `blocks/header/header.js`
- `blocks/header/header.css`

**Dependencies:**
- `scripts/auth.js` — getUser(), logout()
- `scripts/cart-utils.js` — getCartCount(), updateCartBadges()
- `scripts/product-data.js` — global search autocomplete
- localStorage: `craftora_user`, `cart`

---

### 2. Footer

**Purpose:** Four-column site footer with brand info, quick links, shop categories, account links, social icons, and legal links.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Logo | Image | Dark variant logo |
| Tagline | Text | Brand description |
| Address | Text (multi-line) | Physical address |
| Social Links | Link list | Icon + URL per platform |
| Quick Links | Link list | Site navigation |
| Shop Links | Link list | Category links |
| Account Links | Link list | Context-aware (JS enhances) |
| Legal Links | Link list | Return Policy, Privacy, Terms |
| Copyright | Text | e.g. "© 2026 Craftora" |

**Example DA Table (authored in /footer):**

```
| Footer |                          |
|--------|--------------------------|
| Logo   | /assets/dark_logo.webp   |
```

Columns authored as simple link lists under headings.

**Files:**
- `blocks/footer/footer.js`
- `blocks/footer/footer.css`

**Dependencies:**
- `scripts/auth.js` — getUser() for dynamic account links
- localStorage: `craftora_user`

---

### 3. Hero

**Purpose:** Homepage hero section with headline (including highlighted keyword), description, CTA button, and large product image. Two-column layout on desktop, stacked on mobile.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Headline | Rich text | Supports `<em>` for accent-colored keyword |
| Description | Text | Supporting paragraph |
| CTA Label | Text | Button text |
| CTA Link | URL | Button destination |
| Image | Image | Hero product photo |
| Image Alt | Text | Alt text for image |

**Example DA Table:**

```
| Hero                                                    |                                    |
|---------------------------------------------------------|------------------------------------|
| Where your ideas meet *#Design*                         | /assets/backgrounds/hero-products.jpg |
| Upload artwork, pick templates, or add text.            |                                    |
| Explore Products (link to /products)                    |                                    |
```

**Files:**
- `blocks/hero/hero.js`
- `blocks/hero/hero.css`

**Dependencies:** None

---

### 4. Category Grid

**Purpose:** Grid of 4 linked image cards representing product categories (Diary, Bottle, T-shirt, Cup). Each card links to the filtered products page.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Section Title | Text | e.g. "Search our catalogue" |
| Category Image | Image | Per card |
| Category Name | Text | Per card |
| Category Link | URL | Per card (e.g. /products?category=Diary) |

**Example DA Table:**

```
| Category Grid |                              |                                |
|---------------|------------------------------|--------------------------------|
| Image         | /assets/product-diary.jpg    | Diary (link to /products?category=Diary) |
| Image         | /assets/product-bottle.jpg   | Bottle (link to /products?category=Bottle) |
| Image         | /assets/product-tshirt.jpg   | T-shirt (link to /products?category=Tshirt) |
| Image         | /assets/product-mug.jpg      | Cup (link to /products?category=Cup) |
```

**Files:**
- `blocks/category-grid/category-grid.js`
- `blocks/category-grid/category-grid.css`

**Dependencies:** None

---

### 5. Product Listing

**Purpose:** Filterable product catalog page. Renders category filter tabs and a grid of product cards fetched from a data endpoint. URL param `?category=` sets initial filter.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Data Source | URL/Path | Path to products JSON endpoint |
| Categories | Text list | Filter tab labels (optional override) |

**Example DA Table:**

```
| Product Listing          |
|--------------------------|
| /content/products.json   |
```

(Block renders UI entirely via JS from data)

**Files:**
- `blocks/product-listing/product-listing.js`
- `blocks/product-listing/product-listing.css`

**Dependencies:**
- `scripts/product-data.js` — fetchProducts(), caching
- `scripts/wishlist-utils.js` — toggleWishlist(), isWishlisted()
- URL param: `?category=`

---

### 6. Product Detail

**Purpose:** Full product detail page. Renders image gallery, color picker (60+ colors), size selector, quantity, design toggle, customization status, add-to-cart, buy-now, trust badges, product specs accordion, and related products grid. All rendered from JSON data keyed by `?id=` URL param.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Data Source | URL/Path | Path to products JSON endpoint |

**Example DA Table:**

```
| Product Detail           |
|--------------------------|
| /content/products.json   |
```

(Block renders entirely via JS based on URL param `?id=`)

**Files:**
- `blocks/product-detail/product-detail.js`
- `blocks/product-detail/product-detail.css`

**Dependencies:**
- `scripts/product-data.js` — fetchProducts()
- `scripts/pricing.js` — getDesignFee(), calculateItemPrice()
- `scripts/cart-utils.js` — addToCart(), getCart()
- `scripts/wishlist-utils.js` — toggleWishlist(), isWishlisted()
- `scripts/design-preview.js` — DesignPreview.show()
- localStorage: `designData_*`, `cart`, `craftora_wishlist`
- URL param: `?id=`

---

### 7. Cart

**Purpose:** Shopping cart display. Renders cart items (from localStorage) with quantity controls, shows order summary sidebar (subtotal, shipping, total), provides checkout navigation. Empty state when no items.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Empty State Heading | Text | e.g. "Your cart is empty" |
| Empty State Message | Text | e.g. "Looks like you haven't added anything yet." |
| Empty State CTA | Link | e.g. "Continue Shopping" → /products |

**Example DA Table:**

```
| Cart                                         |
|----------------------------------------------|
| Your cart is empty                           |
| Looks like you haven't added anything yet.   |
| Continue Shopping (link to /products)        |
```

**Files:**
- `blocks/cart/cart.js`
- `blocks/cart/cart.css`

**Dependencies:**
- `scripts/cart-utils.js` — getCart(), updateQty(), removeItem(), saveCart()
- `scripts/pricing.js` — money formatter
- `scripts/design-preview.js` — DesignPreview.showCartCustomization()
- localStorage: `cart`
- sessionStorage: `craftora_checkout` (written on proceed)

---

### 8. Featured Products

**Purpose:** Carousel showcasing products marked as `featured: true`. Prev/next buttons, touch-swipe support, responsive visible count (1/2/3 cards). Links cards to product detail.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Title | Text | e.g. "Try Our Featured Products" |
| Data Source | URL/Path | Path to products JSON endpoint |

**Example DA Table:**

```
| Featured Products        |                        |
|--------------------------|------------------------|
| Try Our Featured Products | /content/products.json |
```

**Files:**
- `blocks/featured-products/featured-products.js`
- `blocks/featured-products/featured-products.css`

**Dependencies:**
- `scripts/product-data.js` — fetchProducts() (filters `featured: true`)

---

### 9. How It Works

**Purpose:** Four-step visual process grid showing how Craftora works (Pick → Design → Order → Deliver). Each step has an image and a title.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Section Title | Text | e.g. "Four simple steps to your perfect product" |
| Subtitle | Text | Supporting description |
| Step Image | Image | Per step |
| Step Title | Text | Per step |

**Example DA Table:**

```
| How It Works                                     |                                   |
|--------------------------------------------------|-----------------------------------|
| Four simple steps to your perfect product        |                                   |
| From browsing to doorstep — we make it simple.   |                                   |
| /assets/process/find_product.webp                | Pick a Product                    |
| /assets/process/design.webp                      | Design it                         |
| /assets/process/add_cart.webp                    | Place your order                  |
| /assets/process/deliever.webp                    | We deliver                        |
```

**Files:**
- `blocks/how-it-works/how-it-works.js`
- `blocks/how-it-works/how-it-works.css`

**Dependencies:** None

---

### 10. Reviews

**Purpose:** Customer testimonial carousel with star ratings, quote text, author name, and location. Prev/next navigation, touch-swipe, responsive visible count.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Section Title | Text | e.g. "That's what you said..." |
| Data Source | URL/Path | Path to reviews JSON (or inline rows) |

**Example DA Table (inline authoring):**

```
| Reviews                                                                                      |         |              |
|----------------------------------------------------------------------------------------------|---------|--------------|
| That's what you said...                                                                      |         |              |
| The print quality on my custom diary exceeded all expectations.                              | Sarah J. | London, UK   |
| These are by far the softest shirts and the most durable prints.                             | Marcus C. | Toronto, CA  |
| The design studio was so easy to use on my phone.                                            | Elena R. | Madrid, ES   |
| Excellent customer service. They caught my off-center design before printing.                | David S. | Sydney, AU   |
| Beautiful water bottles! The matte finish feels incredibly premium.                          | Aisha P. | New York, USA|
```

**Files:**
- `blocks/reviews/reviews.js`
- `blocks/reviews/reviews.css`

**Dependencies:** None (data authored inline or fetched from JSON)

---

### 11. CTA Banner

**Purpose:** Simple call-to-action section with centered heading, supporting text, and accent-colored button. Used at bottom of homepage.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Heading | Text | e.g. "Ready to get started?" |
| Description | Text | Supporting paragraph |
| CTA Label | Text | Button text |
| CTA Link | URL | Button destination |

**Example DA Table:**

```
| CTA Banner                                                                          |
|-------------------------------------------------------------------------------------|
| Ready to get started?                                                               |
| No signups required to start. Open the studio, play around, only pay when you love it. |
| Start Designing - It's free (link to /products)                                     |
```

**Files:**
- `blocks/cta-banner/cta-banner.js`
- `blocks/cta-banner/cta-banner.css`

**Dependencies:** None

---

### 12. Checkout

**Purpose:** Multi-section checkout form: contact info, shipping address, payment method selector, and order summary sidebar. Validates inputs, creates order, redirects to thank-you.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Trust Badges | Text list | "Secure", "Free Shipping", "Easy Returns" |

**Example DA Table:**

```
| Checkout |
|----------|
```

(Block is entirely JS-driven; authored content is minimal — just the block reference triggers the UI)

**Files:**
- `blocks/checkout/checkout.js`
- `blocks/checkout/checkout.css`

**Dependencies:**
- `scripts/auth.js` — getUser() for form pre-fill
- `scripts/cart-utils.js` — badge update, cart clear
- `scripts/pricing.js` — money formatter
- sessionStorage: `craftora_checkout`
- localStorage: `craftora_user`, `craftora_orders`, `cart`

---

### 13. Wishlist

**Purpose:** Grid of wishlisted products with remove button and "Customize" link per card. Shows guest state (sign-in prompt) when not logged in. Empty state when list is empty.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Guest Heading | Text | "Sign in to see your wishlist" |
| Guest Message | Text | Supporting text |
| Empty Heading | Text | "Your wishlist is empty" |
| Empty Message | Text | Supporting text |

**Example DA Table:**

```
| Wishlist                                      |
|-----------------------------------------------|
| Sign in to see your wishlist                  |
| Save your favourite products and come back.   |
```

**Files:**
- `blocks/wishlist/wishlist.js`
- `blocks/wishlist/wishlist.css`

**Dependencies:**
- `scripts/wishlist-utils.js` — getWishlist(), removeFromWishlist(), saveWishlist()
- `scripts/auth.js` — getUser()
- localStorage: `craftora_wishlist`

---

### 14. Account

**Purpose:** User account dashboard. Sidebar with avatar + nav, main area with personal info card and order history accordion. Guest state with sign-in CTA when not authenticated.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Guest Heading | Text | "You're not signed in" |
| Guest Message | Text | Supporting text |
| Guest CTA | Link | Sign In link |

**Example DA Table:**

```
| Account                                                                  |
|--------------------------------------------------------------------------|
| You're not signed in                                                     |
| Sign in to view your saved details, orders, and wishlist.                |
| Sign In (link to /login)                                                 |
```

**Files:**
- `blocks/account/account.js`
- `blocks/account/account.css`

**Dependencies:**
- `scripts/auth.js` — getUser(), logout()
- `scripts/pricing.js` — money formatter
- localStorage: `craftora_user`, `craftora_orders`

---

### 15. Login

**Purpose:** Authentication form with phone number + password. Split layout (decorative image left, form right). Validation, error display, loading state, post-login redirect.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Side Image | Image | Decorative product photo |
| Heading | Text | "Welcome Back!" |
| Signup Link Text | Text | "Don't have an account?" |
| Signup Link | URL | /signup |

**Example DA Table:**

```
| Login                                      |                                   |
|--------------------------------------------|-----------------------------------|
| /assets/t-shirt_blue_person.webp           | Welcome Back!                     |
| Don't have an account?                     | Sign up here (link to /signup)    |
```

**Files:**
- `blocks/login/login.js`
- `blocks/login/login.css`

**Dependencies:**
- `scripts/auth.js` — isValidPhone(), attemptLogin(), validatePassword()
- localStorage: `craftora_accounts`, `craftora_user`
- URL param: `?redirect=`

---

### 16. Signup

**Purpose:** Registration form with name, phone, password + confirm. Split layout matching login. Real-time password requirement indicator. Post-signup auto-login + redirect.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Side Image | Image | Decorative product photo |
| Heading | Text | "Create Account" |
| Subtitle | Text | "Join Craftora and start designing." |
| Login Link Text | Text | "Already have an account?" |
| Login Link | URL | /login |

**Example DA Table:**

```
| Signup                                     |                                       |
|--------------------------------------------|---------------------------------------|
| /assets/t-shirt_blue_person.webp           | Create Account                        |
| Join Craftora and start designing.         |                                       |
| Already have an account?                   | Sign in here (link to /login)         |
```

**Files:**
- `blocks/signup/signup.js`
- `blocks/signup/signup.css`

**Dependencies:**
- `scripts/auth.js` — isValidPhone(), validatePassword(), attemptSignup()
- localStorage: `craftora_accounts`, `craftora_user`
- URL param: `?redirect=`

---

### 17. Contact Form

**Purpose:** Contact message form with name, email, subject dropdown, message textarea. Client-side validation. Simulated submit with success state. Paired with contact info cards authored as default content alongside.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Heading | Text | "Send us a message" |
| Subtitle | Text | "We'll get back to you ASAP" |
| Subject Options | Text list | General, Order Status, Bulk Order |
| Success Heading | Text | "Message Sent!" |
| Success Message | Text | "Thanks for reaching out..." |

**Example DA Table:**

```
| Contact Form                           |
|----------------------------------------|
| Send us a message                      |
| We'll get back to you as soon as possible. |
| General Inquiry                        |
| Order Status                           |
| Bulk/Corporate Order                   |
```

**Files:**
- `blocks/contact-form/contact-form.js`
- `blocks/contact-form/contact-form.css`

**Dependencies:** None

---

### 18. FAQ

**Purpose:** Accordion of frequently asked questions using native `<details>`/`<summary>` elements. Each row becomes a Q&A pair.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Section Title | Text | "Frequently Asked Questions" |
| Question | Text | Per row |
| Answer | Text/Rich text | Per row |

**Example DA Table:**

```
| FAQ                                                |                                                               |
|----------------------------------------------------|---------------------------------------------------------------|
| Frequently Asked Questions                         |                                                               |
| How long does delivery take?                       | Standard delivery takes 5–7 business days.                    |
| Can I place a bulk order?                          | Yes, volume discounts starting at 20 units.                   |
| What's your return policy?                         | Custom products non-returnable unless defective.              |
| Do you ship internationally?                       | Currently India only. International coming soon.              |
| What's the minimum order quantity?                 | 1 unit. Volume discounts from 20 units.                       |
```

**Files:**
- `blocks/faq/faq.js`
- `blocks/faq/faq.css`

**Dependencies:** None

---

### 19. Stats Bar

**Purpose:** Dark-background section displaying key metrics (numbers + labels) in a responsive grid. Used on About page.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Stat Number | Text | Per item (e.g. "12K+") |
| Stat Label | Text | Per item (e.g. "Happy Customers") |

**Example DA Table:**

```
| Stats Bar          |                    |
|--------------------|--------------------|
| 12K+               | Happy Customers    |
| 50K+               | Products Shipped   |
| 98%                | Satisfaction Rate  |
| 4+                 | Years in Business  |
```

**Files:**
- `blocks/stats-bar/stats-bar.js`
- `blocks/stats-bar/stats-bar.css`

**Dependencies:** None

---

### 20. Order Confirmation

**Purpose:** Post-checkout success page showing confirmation icon, heading, message, order details card (order ID, delivery estimate, payment status), and navigation buttons (Continue Shopping, View Orders).

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Heading | Text | "Thank You for Your Order!" |
| Message | Text | "We've received your order..." |
| Delivery Estimate | Text | "3–5 business days" |
| Primary CTA | Link | Continue Shopping → /products |
| Secondary CTA | Link | View Orders → /account#my-orders |

**Example DA Table:**

```
| Order Confirmation                               |                                    |
|--------------------------------------------------|------------------------------------|
| Thank You for Your Order!                        |                                    |
| We've received your order and will process it shortly. |                              |
| 3 – 5 business days                             |                                    |
| Continue Shopping (link to /products)            | View Orders (link to /account)     |
```

**Files:**
- `blocks/order-confirmation/order-confirmation.js`
- `blocks/order-confirmation/order-confirmation.css`

**Dependencies:**
- URL param: `?orderId=`
- localStorage: `lastOrderId` (fallback)

---

### 21. Design Studio

**Purpose:** Full-page canvas-based product customization tool. Replaces standard page layout with its own topbar, sidebar (color/text/templates/upload panels), canvas stage, and status bar. Saves design data to localStorage.

**Authorable Fields:**

| Field | Type | Notes |
|-------|------|-------|
| Data Source | URL/Path | Products JSON |
| Templates Source | URL/Path | Templates JSON |

**Example DA Table:**

```
| Design Studio            |                          |
|--------------------------|--------------------------|
| /content/products.json   | /content/templates.json  |
```

(Block takes over the full page layout — no standard header/footer rendered)

**Files:**
- `blocks/design-studio/design-studio.js`
- `blocks/design-studio/design-studio.css`

**Dependencies:**
- `scripts/product-data.js` — product info (name, category, images)
- `scripts/cart-utils.js` — addToCart()
- `scripts/pricing.js` — getDesignFee()
- localStorage: `designData_*`, `cart`
- URL param: `?id=`

---

## Shared Utility Scripts

| File | Purpose | Used By |
|------|---------|---------|
| `scripts/aem.js` | Core EDS library (DO NOT MODIFY) | All |
| `scripts/scripts.js` | Page decoration entry, loadBlock, loadLazy, loadDelayed | All |
| `scripts/delayed.js` | Scroll-to-top, analytics, martech | All |
| `scripts/auth.js` | getUser, saveUser, logout, attemptLogin, attemptSignup, isValidPhone, validatePassword | header, footer, login, signup, account, checkout, wishlist |
| `scripts/cart-utils.js` | getCart, addToCart, updateQty, removeItem, saveCart, getCartCount, updateCartBadges, money() | header, cart, product-detail, checkout, design-studio |
| `scripts/pricing.js` | DESIGN_FEES, getDesignFee, calculateItemPrice | product-detail, cart, checkout, design-studio |
| `scripts/wishlist-utils.js` | getWishlist, toggleWishlist, isWishlisted, removeFromWishlist | product-listing, product-detail, wishlist |
| `scripts/product-data.js` | fetchProducts (with sessionStorage caching) | header (search), product-listing, product-detail, featured-products |
| `scripts/design-preview.js` | DesignPreview modal (show, showCartCustomization, exists) | product-detail, cart |

---

## Content Data Endpoints

| Path | Format | Purpose | Source |
|------|--------|---------|--------|
| `/content/products.json` | JSON | Product catalog (12 products) | Spreadsheet or committed file |
| `/content/templates.json` | JSON | Design templates (41 templates) | Committed file |
| `/content/reviews.json` | JSON | Customer reviews (5 reviews) | Spreadsheet or committed file |

---

## Section Metadata Variants

Blocks can be placed inside sections with metadata to control background styling:

| Metadata Style | CSS Class | Background |
|----------------|-----------|------------|
| (default) | — | `--color-background` (#F9FAF8) |
| `light` / `highlight` | `.light` | `--color-background` |
| `dark` | `.dark` | `--color-primary` (#111827) |
| `accent-bg` | `.accent-bg` | `--color-secondary-subtle` (#bedffe) |
| `warm` | `.warm` | `--color-surface-warm` (#faf9f7) |

---

## Page → Block Mapping

| Page | Blocks Used (in order) |
|------|------------------------|
| `/` (homepage) | `hero`, `category-grid`, `featured-products`, `how-it-works`, `reviews`, `cta-banner` |
| `/products` | `product-listing` |
| `/product` | `product-detail` |
| `/customize` | `design-studio` |
| `/cart` | `cart` |
| `/checkout` | `checkout` |
| `/wishlist` | `wishlist` |
| `/account` | `account` |
| `/login` | `login` |
| `/signup` | `signup` |
| `/about` | default content + `stats-bar` + `cards` (values) |
| `/contact` | `contact-form` + `faq` |
| `/thank-you` | `order-confirmation` |
