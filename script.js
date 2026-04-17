// ═══════════════════════════════════════════
//  DATA
// ═══════════════════════════════════════════
let products  = JSON.parse(localStorage.getItem('affiliateProducts'))  || [];
let analytics = JSON.parse(localStorage.getItem('affiliateAnalytics')) || {
    totalClicks: 0, clicksToday: 0,
    clicks: [], categoryClicks: {}, productClicks: {}
};

// ═══════════════════════════════════════════
//  DEFAULT CATEGORIES & COLOR PALETTE
// ═══════════════════════════════════════════
const DEFAULT_CATEGORIES = [
    { id:'Electronics', name:'Electronics', label:'Gadgets',  c1:'#3B82F6', c2:'#1D4ED8' },
    { id:'Fashion',     name:'Fashion',     label:'Fashion',  c1:'#EC4899', c2:'#BE185D' },
    { id:'Home',        name:'Home',        label:'Home',     c1:'#F97316', c2:'#C2410C' },
    { id:'Books',       name:'Books',       label:'Books',    c1:'#10B981', c2:'#065F46' },
    { id:'Sports',      name:'Sports',      label:'Sports',   c1:'#EF4444', c2:'#991B1B' },
];

const COLOR_PALETTE = [
    { c1:'#3B82F6', c2:'#1D4ED8' }, { c1:'#EC4899', c2:'#BE185D' },
    { c1:'#F97316', c2:'#C2410C' }, { c1:'#10B981', c2:'#065F46' },
    { c1:'#EF4444', c2:'#991B1B' }, { c1:'#8B5CF6', c2:'#6D28D9' },
    { c1:'#F59E0B', c2:'#B45309' }, { c1:'#06B6D4', c2:'#0E7490' },
    { c1:'#84CC16', c2:'#4D7C0F' }, { c1:'#F43F5E', c2:'#BE123C' },
    { c1:'#14B8A6', c2:'#0F766E' }, { c1:'#D946EF', c2:'#A21CAF' },
    { c1:'#0EA5E9', c2:'#0284C7' }, { c1:'#A78BFA', c2:'#5B21B6' },
];

// ── SVG icons (built-in categories + generic fallback)
const CAT_SVG_MAP = {
    'all':         `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
    'Electronics': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 9l2 2 5-5"/></svg>`,
    'Fashion':     `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>`,
    'Home':        `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    'Books':       `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/><line x1="10" y1="8" x2="16" y2="8"/><line x1="10" y1="12" x2="13" y2="12"/></svg>`,
    'Sports':      `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/><path d="M19.07 4.93L4.93 19.07"/></svg>`,
    '__default__': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
};

// ── Helpers
function getCategories() {
    const s = localStorage.getItem('affiliateCategories');
    return s ? JSON.parse(s) : DEFAULT_CATEGORIES;
}
function getCatConfig(id) {
    if (id === 'all') return { label: 'All Products', c1: '#6366F1', c2: '#4F46E5' };
    const cat = getCategories().find(c => c.id === id);
    return cat ? { label: cat.label || cat.name, c1: cat.c1, c2: cat.c2 }
               : { label: id, c1: '#6366F1', c2: '#4F46E5' };
}
function getCatSVG(id) {
    return CAT_SVG_MAP[id] || CAT_SVG_MAP['__default__'];
}

// ═══════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════
let currentFilter = 'all';
let searchQuery   = '';
let sortMode      = 'featured';
let filteredList  = [];
let pageIndex     = 0;
const CARDS_PER_PAGE = 8; // 4 cols × 2 rows

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    resetClicksIfNewDay();
    initDarkMode();
    initCookieConsent();
    buildCategoryPills();
    bindNavBtns();
    applyFilter('all');
    injectJSONLD();
    registerSW();
});

// ═══════════════════════════════════════════
//  CATEGORY PILLS  (dynamic, from localStorage)
// ═══════════════════════════════════════════
function buildCategoryPills() {
    const container = document.getElementById('catPills');
    if (!container) return;

    const cats  = getCategories();
    container.innerHTML = '';

    // "All" pill
    const allBtn = makePill('all', 'All', '#6366F1', '#4F46E5', CAT_SVG_MAP['all']);
    allBtn.classList.add('active');
    container.appendChild(allBtn);

    // One pill per category
    cats.forEach(cat => {
        container.appendChild(
            makePill(cat.id, cat.label || cat.name, cat.c1, cat.c2, getCatSVG(cat.id))
        );
    });

    // Click binding
    container.querySelectorAll('.cp').forEach(btn => {
        btn.addEventListener('click', () => {
            container.querySelectorAll('.cp').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            applyFilter(btn.dataset.filter);
        });
    });

    // Enable scroll when pills overflow (> 6 total including All)
    const lbottom = container.closest('.lp-bottom');
    if (lbottom) lbottom.classList.toggle('overflows', cats.length >= 6);
}

function makePill(filterId, label, c1, c2, svgStr) {
    const btn = document.createElement('button');
    btn.className = 'cp';
    btn.dataset.filter = filterId;
    btn.dataset.c1 = c1;
    btn.dataset.c2 = c2;
    btn.innerHTML = svgStr + `<span>${label}</span>`;
    return btn;
}

// ═══════════════════════════════════════════
//  APPLY FILTER
// ═══════════════════════════════════════════
function applyFilter(filter) {
    currentFilter = filter;

    // 1. Category filter
    let list = filter === 'all' ? [...products] : products.filter(p => p.category === filter);

    // 2. Scheduling: hide products outside their date window
    const today = new Date().toISOString().split('T')[0];
    list = list.filter(p => {
        if (p.startDate && p.startDate > today) return false;
        if (p.endDate   && p.endDate   < today) return false;
        return true;
    });

    // 3. Search filter
    if (searchQuery) {
        const q = searchQuery.toLowerCase();
        list = list.filter(p =>
            (p.name     || '').toLowerCase().includes(q) ||
            (p.desc     || '').toLowerCase().includes(q) ||
            (p.category || '').toLowerCase().includes(q)
        );
    }

    // 4. Sort
    if (sortMode === 'featured') {
        list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    } else if (sortMode === 'newest') {
        list.sort((a, b) => new Date(b.addedAt || 0) - new Date(a.addedAt || 0));
    } else if (sortMode === 'price-asc') {
        list.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortMode === 'price-desc') {
        list.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    }

    filteredList = list;
    pageIndex    = 0;

    updateLeftPanel(filter, filteredList.length);
    buildCarousel();
    updatePageIndicator();
    updateNavBtns();
}

// ── Search & sort handlers ──
function onSearch(val) {
    searchQuery = val.trim();
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.style.display = searchQuery ? '' : 'none';
    applyFilter(currentFilter);
}

function clearSearch() {
    searchQuery = '';
    const input = document.getElementById('searchInput');
    if (input) input.value = '';
    const clearBtn = document.getElementById('searchClear');
    if (clearBtn) clearBtn.style.display = 'none';
    applyFilter(currentFilter);
}

function onSort(val) {
    sortMode = val;
    applyFilter(currentFilter);
}

// ═══════════════════════════════════════════
//  LEFT PANEL UPDATE
// ═══════════════════════════════════════════
function updateLeftPanel(filter, count) {
    const cfg = getCatConfig(filter);

    // Panel bg color
    document.getElementById('leftPanel').style.background = cfg.c1;
    document.documentElement.style.setProperty('--c1', cfg.c1);
    document.documentElement.style.setProperty('--c2', cfg.c2);

    // Big icon
    const iconEl = document.getElementById('catBigIcon');
    if (iconEl) {
        iconEl.style.animation = 'none';
        iconEl.innerHTML = getCatSVG(filter);
        // Re-trigger animation
        void iconEl.offsetWidth;
        iconEl.style.animation = '';
    }

    // Label & count
    const labelEl = document.getElementById('catBigLabel');
    const countEl = document.getElementById('catBigCount');
    if (labelEl) {
        labelEl.style.opacity = '0';
        labelEl.style.transform = 'translateY(8px)';
        setTimeout(() => {
            labelEl.textContent = cfg.label;
            labelEl.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
            labelEl.style.opacity = '1';
            labelEl.style.transform = 'translateY(0)';
        }, 60);
    }
    if (countEl) countEl.textContent = `${count} product${count !== 1 ? 's' : ''}`;

    // Right panel title
    const rpTitle = document.getElementById('rpTitle');
    if (rpTitle) rpTitle.textContent = cfg.label === 'All Products' ? 'Featured Deals' : cfg.label;

    const rpBadge = document.getElementById('rpBadge');
    if (rpBadge) rpBadge.textContent = `${count} item${count !== 1 ? 's' : ''}`;
}

// ═══════════════════════════════════════════
//  BUILD CAROUSEL (pages of 8 cards)
// ═══════════════════════════════════════════
function buildCarousel() {
    const track   = document.getElementById('carouselTrack');
    const empty   = document.getElementById('emptyState');
    const dots    = document.getElementById('carouselDots');
    if (!track) return;

    track.innerHTML = '';
    dots && (dots.innerHTML = '');

    if (filteredList.length === 0) {
        empty && empty.classList.add('show');
        return;
    }
    empty && empty.classList.remove('show');

    // Split into pages
    const pages = [];
    for (let i = 0; i < filteredList.length; i += CARDS_PER_PAGE) {
        pages.push(filteredList.slice(i, i + CARDS_PER_PAGE));
    }

    pages.forEach((pageProducts) => {
        const page = document.createElement('div');
        page.className = 'carousel-page';
        pageProducts.forEach(p => page.appendChild(makeCard(p)));
        track.appendChild(page);
    });

    // Dots
    pages.forEach((_, i) => {
        const d = document.createElement('button');
        d.className = 'cdot' + (i === 0 ? ' active' : '');
        d.setAttribute('aria-label', `Page ${i + 1}`);
        d.addEventListener('click', () => { pageIndex = i; scrollToPage(); });
        dots && dots.appendChild(d);
    });

    scrollToPage(false); // no animation on first build
}

// ═══════════════════════════════════════════
//  MAKE PRODUCT CARD
// ═══════════════════════════════════════════
function makeCard(p) {
    const cfg  = getCatConfig(p.category);
    const card = document.createElement('div');
    card.className = 'pcard';

    // Open modal on card click
    card.addEventListener('click', () => openModal(p));

    // ── Image container
    const imgWrap = document.createElement('div');
    imgWrap.className = 'pc-img';

    if (p.image) {
        const img   = document.createElement('img');
        img.loading = 'lazy';
        img.alt     = p.name;
        img.src     = p.image;
        img.onerror = function () {
            this.remove();
            const ph = document.createElement('div');
            ph.className = 'pc-img-ph';
            ph.innerHTML = bagSVGInline();
            imgWrap.prepend(ph);
        };
        imgWrap.appendChild(img);
    } else {
        const ph = document.createElement('div');
        ph.className = 'pc-img-ph';
        ph.innerHTML = bagSVGInline();
        imgWrap.appendChild(ph);
    }

    // Category pill
    const pill = document.createElement('span');
    pill.className = 'pc-pill';
    pill.style.background = cfg.c1;
    pill.textContent = p.category || 'Deal';
    imgWrap.appendChild(pill);

    // Deal badge
    if (p.badge) {
        const badgeMap = { Hot: 'hot', New: 'new', 'Best Seller': 'bestseller', Sale: 'sale' };
        const badge = document.createElement('span');
        badge.className = 'pc-badge pc-badge-' + (badgeMap[p.badge] || 'hot');
        badge.textContent = p.badge;
        imgWrap.appendChild(badge);
    }

    // Featured star
    if (p.featured) {
        const star = document.createElement('span');
        star.className = 'pc-featured-star';
        star.textContent = '⭐';
        imgWrap.appendChild(star);
    }

    // ── Body
    const safeName = esc(p.name);
    const safeLink = esc(p.link);

    // Discount calc for Sale badge
    let discountHtml = '';
    if (p.badge === 'Sale' && p.origPrice && p.origPrice > p.price) {
        discountHtml = `<span class="pc-orig-price">$${parseFloat(p.origPrice).toFixed(2)}</span>`;
    }

    const body = document.createElement('div');
    body.className = 'pc-body';
    body.innerHTML = `
        <div class="pc-name">${safeName}</div>
        <div class="pc-footer">
            <div style="display:flex;align-items:center;gap:5px;min-width:0">
                <div class="pc-price">$${parseFloat(p.price).toFixed(2)}</div>
                ${discountHtml}
            </div>
            <a href="${safeLink}" target="_blank" rel="noopener noreferrer"
               class="pc-buy" style="background:${cfg.c1}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
            </a>
        </div>`;

    body.querySelector('.pc-buy').addEventListener('click', function (e) {
        trackClick(p.id, p.name, p.category);
        e.stopPropagation();
    });

    card.appendChild(imgWrap);
    card.appendChild(body);
    return card;
}

function bagSVGInline() {
    // Uses single-quote attributes so it's safe inside any HTML context
    return `<svg viewBox='0 0 24 24' fill='none' stroke='#A1A1AA' stroke-width='1.5' style='width:32px;height:32px'><path d='M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z'/><line x1='3' y1='6' x2='21' y2='6'/><path d='M16 10a4 4 0 01-8 0'/></svg>`;
}

// ═══════════════════════════════════════════
//  CAROUSEL NAVIGATION
// ═══════════════════════════════════════════
function bindNavBtns() {
    document.getElementById('prevBtn')?.addEventListener('click', () => {
        if (pageIndex > 0) { pageIndex--; scrollToPage(); }
    });
    document.getElementById('nextBtn')?.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredList.length / CARDS_PER_PAGE);
        if (pageIndex < totalPages - 1) { pageIndex++; scrollToPage(); }
    });
}

function scrollToPage(animate = true) {
    const track = document.getElementById('carouselTrack');
    if (!track) return;
    if (!animate) track.style.transition = 'none';
    track.style.transform = `translateX(-${pageIndex * 100}%)`;
    if (!animate) void track.offsetWidth; // flush
    track.style.transition = '';

    updateNavBtns();
    updatePageIndicator();
    highlightDot(pageIndex);
}

function updateNavBtns() {
    const totalPages = Math.ceil(filteredList.length / CARDS_PER_PAGE) || 1;
    const prev = document.getElementById('prevBtn');
    const next = document.getElementById('nextBtn');
    if (prev) prev.disabled = pageIndex <= 0;
    if (next) next.disabled = pageIndex >= totalPages - 1;
}

function updatePageIndicator() {
    const el = document.getElementById('rpPage');
    if (!el) return;
    const totalPages = Math.ceil(filteredList.length / CARDS_PER_PAGE) || 1;
    el.textContent = `${pageIndex + 1} / ${totalPages}`;
}

function highlightDot(idx) {
    document.querySelectorAll('.cdot').forEach((d, i) =>
        d.classList.toggle('active', i === idx)
    );
}

// ═══════════════════════════════════════════
//  ANALYTICS
// ═══════════════════════════════════════════
function trackClick(productId, productName, category) {
    const now   = new Date();
    const today = now.toISOString().split('T')[0];
    analytics.totalClicks  = (analytics.totalClicks  || 0) + 1;
    analytics.clicksToday  = (analytics.clicksToday  || 0) + 1;
    analytics.clicks.push({ productId, productName, category, timestamp: now.toISOString(), date: today });
    analytics.categoryClicks[category] = (analytics.categoryClicks[category] || 0) + 1;
    analytics.productClicks[productId] = (analytics.productClicks[productId]  || 0) + 1;
    localStorage.setItem('affiliateAnalytics', JSON.stringify(analytics));
}

function resetClicksIfNewDay() {
    const last  = localStorage.getItem('lastCheckDate');
    const today = new Date().toISOString().split('T')[0];
    if (last !== today) {
        analytics.clicksToday = 0;
        localStorage.setItem('lastCheckDate', today);
        localStorage.setItem('affiliateAnalytics', JSON.stringify(analytics));
    }
}

// ═══════════════════════════════════════════
//  ADMIN COMPATIBILITY
// ═══════════════════════════════════════════
function saveProducts() {
    localStorage.setItem('affiliateProducts', JSON.stringify(products));
}
function deleteProduct(id) {
    if (confirm('Delete this product?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        location.reload();
    }
}
function clearAllData() {
    if (confirm('Clear all analytics data?')) {
        analytics = { totalClicks:0, clicksToday:0, clicks:[], categoryClicks:{}, productClicks:{} };
        localStorage.setItem('affiliateAnalytics', JSON.stringify(analytics));
    }
}
function shareOnFacebook() {
    window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(location.href)}`,
        'fb', 'width=800,height=600'
    );
}
function esc(t) {
    if (!t) return '';
    return String(t).replace(/[&<>"']/g,
        m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

// ═══════════════════════════════════════════
//  PRODUCT DETAIL MODAL
// ═══════════════════════════════════════════
function openModal(p) {
    const cfg    = getCatConfig(p.category);
    const box    = document.getElementById('modalBox');
    const overlay = document.getElementById('modalOverlay');
    if (!box || !overlay) return;

    // Image
    let imgHtml = '';
    if (p.image) {
        imgHtml = `<img src="${esc(p.image)}" alt="${esc(p.name)}" loading="lazy" onerror="this.parentElement.innerHTML='<div class=modal-img-ph><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'#C4C4CC\\' stroke-width=\\'1.5\\'><path d=\\'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z\\'/></svg></div>'">`;
    } else {
        imgHtml = `<div class="modal-img-ph"><svg viewBox='0 0 24 24' fill='none' stroke='#C4C4CC' stroke-width='1.5'><path d='M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z'/><line x1='3' y1='6' x2='21' y2='6'/><path d='M16 10a4 4 0 01-8 0'/></svg></div>`;
    }

    // Badge
    const badgeMap = { Hot:'pc-badge-hot', New:'pc-badge-new', 'Best Seller':'pc-badge-bestseller', Sale:'pc-badge-sale' };
    const badgeHtml = p.badge
        ? `<span class="modal-deal-badge ${badgeMap[p.badge] || 'pc-badge-hot'}" style="position:absolute;bottom:14px;right:14px;padding:4px 10px;border-radius:100px;font-size:.65rem;font-weight:800;color:#fff;text-transform:uppercase">${esc(p.badge)}</span>`
        : '';

    // Pricing
    let pricingHtml = `<div class="modal-price">$${parseFloat(p.price).toFixed(2)}</div>`;
    if (p.badge === 'Sale' && p.origPrice && p.origPrice > p.price) {
        const pct = Math.round((1 - p.price / p.origPrice) * 100);
        pricingHtml += `<div class="modal-orig-price">$${parseFloat(p.origPrice).toFixed(2)}</div>
            <div class="modal-discount-pill">-${pct}% OFF</div>`;
    }

    box.innerHTML = `
        <button class="modal-close" onclick="closeModal()" aria-label="Close modal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="modal-img">
            ${imgHtml}
            <span class="modal-cat-badge" style="background:${cfg.c1}">${esc(p.category)}</span>
            ${badgeHtml}
        </div>
        <div class="modal-content">
            <h2 class="modal-title">${esc(p.name)}</h2>
            <div class="modal-pricing-strip">${pricingHtml}</div>
            ${p.desc ? `<p class="modal-desc">${esc(p.desc)}</p>` : ''}
            <a href="${esc(p.link)}" target="_blank" rel="noopener noreferrer"
               class="modal-buy-btn" id="modalBuyBtn" style="background:linear-gradient(135deg,${cfg.c1},${cfg.c2})">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>
                Buy on Amazon
            </a>
            <div class="modal-share-row">
                <span class="modal-share-label">Share:</span>
                <button class="modal-share-btn" onclick="shareWhatsApp('${esc(p.name)}','${esc(p.link)}')">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="color:#25D366"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    WhatsApp
                </button>
                <button class="modal-share-btn" onclick="shareFacebook('${esc(p.link)}')">
                    <svg viewBox="0 0 24 24" fill="currentColor" style="color:#1877F2"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                    Facebook
                </button>
                <button class="modal-share-btn" id="copyLinkBtn" onclick="copyProductLink('${esc(p.link)}','copyLinkBtn')">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
                    Copy
                </button>
            </div>
        </div>`;

    // Track buy button click
    const buyBtn = box.querySelector('#modalBuyBtn');
    if (buyBtn) buyBtn.addEventListener('click', () => trackClick(p.id, p.name, p.category));

    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.classList.remove('open');
    document.body.style.overflow = '';
}

function closeModalOutside(e) {
    if (e.target === document.getElementById('modalOverlay')) closeModal();
}

// Keyboard ESC closes modal
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ═══════════════════════════════════════════
//  PER-PRODUCT SHARE
// ═══════════════════════════════════════════
function shareWhatsApp(name, link) {
    const text = encodeURIComponent(`Check out "${name}" — ${link}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function shareFacebook(link) {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`, 'fb', 'width=800,height=600');
}

function copyProductLink(link, btnId) {
    navigator.clipboard.writeText(link).then(() => {
        const btn = document.getElementById(btnId);
        if (!btn) return;
        const orig = btn.innerHTML;
        btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> Copied!`;
        btn.classList.add('copied');
        setTimeout(() => { btn.innerHTML = orig; btn.classList.remove('copied'); }, 2000);
    }).catch(() => {
        prompt('Copy this link:', link);
    });
}

// ═══════════════════════════════════════════
//  DARK MODE
// ═══════════════════════════════════════════
function initDarkMode() {
    const saved = localStorage.getItem('darkMode');
    if (saved === 'true' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
    }
}

function toggleDark() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('darkMode', isDark);
}

// ═══════════════════════════════════════════
//  COOKIE CONSENT
// ═══════════════════════════════════════════
function initCookieConsent() {
    if (!localStorage.getItem('cookieConsent')) {
        const bar = document.getElementById('cookieBar');
        if (bar) setTimeout(() => bar.classList.add('show'), 1200);
    }
}

function acceptCookies() {
    localStorage.setItem('cookieConsent', 'accepted');
    const bar = document.getElementById('cookieBar');
    if (bar) bar.classList.remove('show');
}

function declineCookies() {
    localStorage.setItem('cookieConsent', 'declined');
    const bar = document.getElementById('cookieBar');
    if (bar) bar.classList.remove('show');
}

// ═══════════════════════════════════════════
//  JSON-LD STRUCTURED DATA
// ═══════════════════════════════════════════
function injectJSONLD() {
    const el = document.getElementById('jsonld-store');
    if (!el) return;
    const data = {
        '@context': 'https://schema.org',
        '@type': 'Store',
        'name': 'BestDeals',
        'description': 'Curated Amazon affiliate products at the best prices',
        'url': location.href,
        'offers': products.slice(0, 10).map(p => ({
            '@type': 'Offer',
            'name': p.name,
            'price': p.price,
            'priceCurrency': 'USD',
            'url': p.link,
            'availability': 'https://schema.org/InStock',
        }))
    };
    el.textContent = JSON.stringify(data);
}

// ═══════════════════════════════════════════
//  SERVICE WORKER REGISTRATION
// ═══════════════════════════════════════════
function registerSW() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('sw.js').catch(() => {});
    }
}
