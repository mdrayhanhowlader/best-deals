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
let filteredList  = [];
let pageIndex     = 0;
const CARDS_PER_PAGE = 8; // 4 cols × 2 rows

// ═══════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    resetClicksIfNewDay();
    buildCategoryPills();
    bindNavBtns();
    applyFilter('all');
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
    filteredList  = filter === 'all'
        ? products
        : products.filter(p => p.category === filter);
    pageIndex = 0;

    updateLeftPanel(filter, filteredList.length);
    buildCarousel();
    updatePageIndicator();
    updateNavBtns();
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

    // ── Image container (built via DOM to avoid quote-in-attribute bugs)
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

    const pill = document.createElement('span');
    pill.className = 'pc-pill';
    pill.style.background = cfg.c1;
    pill.textContent = p.category || 'Deal';
    imgWrap.appendChild(pill);

    // ── Body
    const safeName = esc(p.name);
    const safeLink = esc(p.link);

    const body = document.createElement('div');
    body.className = 'pc-body';
    body.innerHTML = `
        <div class="pc-name">${safeName}</div>
        <div class="pc-footer">
            <div class="pc-price">$${parseFloat(p.price).toFixed(2)}</div>
            <a href="${safeLink}" target="_blank" rel="noopener noreferrer"
               class="pc-buy" style="background:${cfg.c1}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
            </a>
        </div>`;

    // Attach click tracking cleanly (no inline onclick)
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
