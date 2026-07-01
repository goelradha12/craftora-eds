import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

/**
 * Craftora Header Block
 * Loads content from /nav and decorates it into the full site navigation.
 * Supports: logo, nav links, search, auth/profile, wishlist, cart, mobile menu.
 */

const MQ_DESKTOP = window.matchMedia('(min-width: 900px)');

/* ── Auth helpers ── */
function getUser() {
  try {
    return JSON.parse(localStorage.getItem('craftora_user') || 'null');
  } catch { return null; }
}

function logout() {
  localStorage.removeItem('craftora_user');
  window.location.href = '/';
}

/* ── Cart helpers ── */
function getCartCount() {
  try {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    return cart.reduce((sum, i) => sum + (i.qty ?? 1), 0);
  } catch { return 0; }
}

function updateCartBadges() {
  const count = getCartCount();
  document.querySelectorAll('.nav-cart-badge').forEach((badge) => {
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  });
}

/* ── Escape HTML ── */
function esc(str) {
  return String(str ?? '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[m]);
}

/* ── SVG icons (inline for performance, no extra requests) ── */
const ICON = {
  search: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  cart: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 3H5L5.4 5M5.4 5H21L19 14H7.2M5.4 5L7.2 14M7.2 14L6 16.5C5.6 17.3 6.2 18 7 18H19M9 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0ZM19 21a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
  wishlist: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  hamburger: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  close: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  chevron: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>',
};

/* ── Search component builder ── */
function createSearchHTML() {
  return `<div class="nav__search-wrap">
    ${ICON.search}
    <input class="nav__search-input" type="search" placeholder="Search products..." autocomplete="off" aria-label="Search products">
    <div class="nav__search-dropdown" role="listbox" aria-label="Search results" hidden></div>
  </div>`;
}

/* ── Search logic ── */
function initSearch(nav) {
  let products = null;
  let timer = null;

  async function loadProducts() {
    if (products) return products;
    try {
      const r = await fetch('/data/products.json');
      const d = await r.json();
      products = d.products || d.data || [];
    } catch { products = []; }
    return products;
  }

  function render(dropdown, query) {
    if (!query) { dropdown.hidden = true; return; }
    const q = query.toLowerCase();
    const hits = (products || [])
      .filter((p) => p.name.toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q))
      .slice(0, 6);

    if (!hits.length) {
      dropdown.innerHTML = '<div class="nav__search-empty">No products found</div>';
    } else {
      dropdown.innerHTML = hits.map((p) => `<a class="nav__search-item" href="/product?id=${encodeURIComponent(p.id)}">
        <img src="${esc(p.images?.default || '')}" alt="" width="40" height="40" loading="lazy">
        <span class="nav__search-info"><span class="nav__search-name">${esc(p.name)}</span><span class="nav__search-cat">${esc(p.category || '')}</span></span>
      </a>`).join('');
    }
    dropdown.hidden = false;
  }

  nav.querySelectorAll('.nav__search-input').forEach((input) => {
    const dropdown = input.closest('.nav__search-wrap').querySelector('.nav__search-dropdown');
    input.addEventListener('input', async () => {
      clearTimeout(timer);
      const q = input.value.trim();
      if (!q) { render(dropdown, ''); return; }
      await loadProducts();
      timer = setTimeout(() => render(dropdown, q), 200);
    });
    input.addEventListener('focus', async () => {
      if (input.value.trim()) { await loadProducts(); render(dropdown, input.value.trim()); }
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav__search-wrap')) {
      nav.querySelectorAll('.nav__search-dropdown').forEach((d) => { d.hidden = true; });
    }
  });
}

/* ── Profile dropdown builder ── */
function createProfileHTML(user) {
  if (!user) {
    return '<a class="nav__btn-solid" href="/login">Sign In</a>';
  }
  const initials = (user.name || user.phone || '?').split(' ').map((w) => w[0]).join('').slice(0, 2)
    .toUpperCase();
  const name = esc((user.name || user.phone || 'Account').split(' ')[0]);
  return `<div class="nav__dropdown" id="profileDropdown">
    <button class="nav__dropdown-trigger" aria-haspopup="true" aria-expanded="false">
      <span class="nav__avatar">${initials}</span>
      <span class="nav__profile-label">${name}</span>
      ${ICON.chevron}
    </button>
    <ul class="nav__dropdown-menu" role="menu">
      <li><a href="/account" role="menuitem">My Account</a></li>
      <li><a href="/account#my-orders" role="menuitem">My Orders</a></li>
      <li><a href="/wishlist" role="menuitem">Wishlist</a></li>
      <li><a href="/cart" role="menuitem">Cart</a></li>
      <li class="nav__dropdown-divider"></li>
      <li><button class="nav__logout-btn" role="menuitem">Sign Out</button></li>
    </ul>
  </div>`;
}

/* ── Mobile menu toggle ── */
function toggleMobileMenu(nav, open) {
  const isOpen = open ?? nav.getAttribute('aria-expanded') !== 'true';
  nav.setAttribute('aria-expanded', String(isOpen));
  document.body.classList.toggle('nav-open', isOpen);
}

/* ── Main decorate function ── */
export default async function decorate(block) {
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/nav';
  const fragment = await loadFragment(navPath);

  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  nav.className = 'nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');
  nav.setAttribute('aria-expanded', 'false');

  // Extract authored content (3 sections: brand, sections, tools)
  const sections = [...fragment.querySelectorAll(':scope > .section')];

  // ── Extract brand (logo) from first section ──
  const brandSection = sections[0];
  const logoLink = brandSection?.querySelector('a');
  const logoImg = brandSection?.querySelector('img');

  // ── Extract nav links from second section ──
  const linksSection = sections[1];
  const navLinks = linksSection?.querySelectorAll('a') || [];

  // ═══════════════════════════════════════════════════
  // BUILD DESKTOP NAV
  // ═══════════════════════════════════════════════════

  const desktopBar = document.createElement('div');
  desktopBar.className = 'nav--desktop';

  // Logo
  const brand = document.createElement('a');
  brand.className = 'nav__logo';
  brand.href = logoLink?.href || '/';
  brand.setAttribute('aria-label', 'Craftora – go to homepage');
  if (logoImg) {
    const img = logoImg.cloneNode(true);
    img.width = 116;
    img.height = 26;
    brand.append(img);
  }
  desktopBar.append(brand);

  // Nav links
  const linksList = document.createElement('ul');
  linksList.className = 'nav__links';
  linksList.setAttribute('role', 'list');
  navLinks.forEach((a) => {
    const li = document.createElement('li');
    const link = document.createElement('a');
    link.className = 'nav--link';
    link.href = a.href;
    link.textContent = a.textContent;
    li.append(link);
    linksList.append(li);
  });
  desktopBar.append(linksList);

  // Search (desktop)
  const desktopSearch = document.createElement('div');
  desktopSearch.className = 'nav__search';
  desktopSearch.setAttribute('role', 'search');
  desktopSearch.innerHTML = createSearchHTML();
  desktopBar.append(desktopSearch);

  // Actions area
  const actions = document.createElement('div');
  actions.className = 'nav__actions';

  // Profile/Auth
  const user = getUser();
  const authWrap = document.createElement('div');
  authWrap.innerHTML = createProfileHTML(user);
  actions.append(authWrap.firstElementChild || authWrap);

  // Wishlist
  const wishBtn = document.createElement('a');
  wishBtn.href = '/wishlist';
  wishBtn.className = 'nav__icon-btn';
  wishBtn.setAttribute('aria-label', 'View wishlist');
  wishBtn.innerHTML = ICON.wishlist;
  actions.append(wishBtn);

  // Cart
  const cartBtn = document.createElement('a');
  cartBtn.href = '/cart';
  cartBtn.className = 'nav__icon-btn';
  cartBtn.setAttribute('aria-label', 'View cart');
  cartBtn.innerHTML = `${ICON.cart}<span class="nav-cart-badge hidden" aria-live="polite">0</span>`;
  actions.append(cartBtn);

  desktopBar.append(actions);
  nav.append(desktopBar);

  // ═══════════════════════════════════════════════════
  // BUILD MOBILE TOP BAR
  // ═══════════════════════════════════════════════════

  const mobileBar = document.createElement('div');
  mobileBar.className = 'nav__phone';

  // Mobile logo
  const mobileLogo = brand.cloneNode(true);
  mobileLogo.className = 'nav__phone-logo';
  mobileBar.append(mobileLogo);

  const mobileActions = document.createElement('div');
  mobileActions.className = 'nav__phone-actions';

  // Mobile search toggle
  const searchToggle = document.createElement('button');
  searchToggle.className = 'nav__icon-btn';
  searchToggle.setAttribute('aria-label', 'Search products');
  searchToggle.innerHTML = ICON.search;
  mobileActions.append(searchToggle);

  // Mobile cart
  const mobileCart = cartBtn.cloneNode(true);
  mobileActions.append(mobileCart);

  // Hamburger
  const hamburger = document.createElement('button');
  hamburger.className = 'nav__icon-btn nav__hamburger-btn';
  hamburger.setAttribute('aria-label', 'Open navigation menu');
  hamburger.setAttribute('aria-expanded', 'false');
  hamburger.innerHTML = ICON.hamburger;
  mobileActions.append(hamburger);

  mobileBar.append(mobileActions);
  nav.append(mobileBar);

  // ═══════════════════════════════════════════════════
  // MOBILE SEARCH BAR (slides below nav)
  // ═══════════════════════════════════════════════════

  const mobileSearchBar = document.createElement('div');
  mobileSearchBar.className = 'nav__mobile-search-bar';
  mobileSearchBar.hidden = true;
  mobileSearchBar.innerHTML = `<div class="nav__search-wrap">
    ${ICON.search}
    <input class="nav__search-input" type="search" placeholder="Search products..." autocomplete="off" aria-label="Search products">
    <button class="nav__mobile-search-close" aria-label="Close search" type="button">${ICON.close}</button>
    <div class="nav__search-dropdown" role="listbox" hidden></div>
  </div>`;
  nav.append(mobileSearchBar);

  searchToggle.addEventListener('click', () => {
    mobileSearchBar.hidden = false;
    requestAnimationFrame(() => {
      mobileSearchBar.classList.add('active');
      mobileSearchBar.querySelector('.nav__search-input')?.focus();
    });
  });

  mobileSearchBar.querySelector('.nav__mobile-search-close')?.addEventListener('click', () => {
    mobileSearchBar.classList.remove('active');
    setTimeout(() => { mobileSearchBar.hidden = true; }, 200);
  });

  // ═══════════════════════════════════════════════════
  // MOBILE DRAWER
  // ═══════════════════════════════════════════════════

  const overlay = document.createElement('div');
  overlay.className = 'nav__overlay';
  overlay.hidden = true;
  nav.append(overlay);

  const drawer = document.createElement('div');
  drawer.className = 'nav__drawer';
  drawer.id = 'mobileNavMenu';
  drawer.hidden = true;
  drawer.innerHTML = `
    <div class="nav__drawer-header">
      <p class="nav__drawer-eyebrow">Menu</p>
      <button class="nav__drawer-close" aria-label="Close navigation">${ICON.close}</button>
    </div>
    <div class="nav__drawer-search" role="search">${createSearchHTML()}</div>
    <ul class="nav__drawer-list">
      ${[...navLinks].map((a) => `<li><a class="nav--link" href="${a.href}">${esc(a.textContent)}</a></li>`).join('')}
      <li>${user
    ? `<button class="nav__drawer-profile-btn">Hi, ${esc((user.name || user.phone || 'Account').split(' ')[0])} ${ICON.chevron}</button>
           <ul class="nav__drawer-submenu" hidden>
             <li><a href="/account">My Account</a></li>
             <li><a href="/account#my-orders">My Orders</a></li>
             <li><a href="/wishlist">Wishlist</a></li>
             <li><a href="/cart">Cart</a></li>
             <li><button class="nav__logout-btn">Sign Out</button></li>
           </ul>`
    : '<a class="nav--link" href="/login">Sign In</a>'}</li>
    </ul>`;
  nav.append(drawer);

  // ── Mobile menu open/close ──
  function openMenu() {
    drawer.hidden = false;
    overlay.hidden = false;
    requestAnimationFrame(() => {
      drawer.classList.add('active');
      overlay.classList.add('active');
    });
    toggleMobileMenu(nav, true);
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    drawer.classList.remove('active');
    overlay.classList.remove('active');
    toggleMobileMenu(nav, false);
    hamburger.setAttribute('aria-expanded', 'false');
    setTimeout(() => { drawer.hidden = true; overlay.hidden = true; }, 250);
  }

  hamburger.addEventListener('click', openMenu);
  overlay.addEventListener('click', closeMenu);
  drawer.querySelector('.nav__drawer-close')?.addEventListener('click', closeMenu);
  drawer.addEventListener('click', (e) => {
    if (e.target.closest('a[href]')) closeMenu();
  });

  // Drawer profile toggle
  const profileBtn = drawer.querySelector('.nav__drawer-profile-btn');
  if (profileBtn) {
    profileBtn.addEventListener('click', () => {
      const sub = profileBtn.nextElementSibling;
      sub.hidden = !sub.hidden;
    });
  }

  // ── Desktop profile dropdown ──
  const deskDropdown = nav.querySelector('#profileDropdown');
  if (deskDropdown) {
    const trigger = deskDropdown.querySelector('.nav__dropdown-trigger');
    trigger?.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = deskDropdown.classList.toggle('open');
      trigger.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', (e) => {
      if (!deskDropdown.contains(e.target)) {
        deskDropdown.classList.remove('open');
        trigger?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // ── Logout ──
  nav.addEventListener('click', (e) => {
    if (e.target.closest('.nav__logout-btn')) { e.preventDefault(); logout(); }
  });

  // ── Escape closes everything ──
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (nav.getAttribute('aria-expanded') === 'true') { closeMenu(); hamburger.focus(); }
    if (deskDropdown?.classList.contains('open')) {
      deskDropdown.classList.remove('open');
      deskDropdown.querySelector('.nav__dropdown-trigger')?.focus();
    }
  });

  // ── Desktop resize reset ──
  MQ_DESKTOP.addEventListener('change', () => { if (MQ_DESKTOP.matches) closeMenu(); });

  // ── Mark active link ──
  const currentPath = window.location.pathname;
  nav.querySelectorAll('.nav--link').forEach((link) => {
    if (link.getAttribute('href') === currentPath || link.getAttribute('href') === `${currentPath}/`) {
      link.classList.add('active');
    }
  });

  // ── Assemble ──
  const wrapper = document.createElement('div');
  wrapper.className = 'nav-wrapper';
  wrapper.append(nav);
  block.append(wrapper);

  // ── Init runtime features ──
  updateCartBadges();
  window.addEventListener('storage', updateCartBadges);
  initSearch(nav);
}
