// ══════════════════════════════════════════════════
//  CONSTANTS & DATA
// ══════════════════════════════════════════════════
const ADMIN_PASSWORD = 'admin123';

// ── Default categories (shared source of truth with script.js via localStorage)
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

// ── Runtime category helpers
function getCategories() {
    const s = localStorage.getItem('affiliateCategories');
    return s ? JSON.parse(s) : DEFAULT_CATEGORIES;
}
function saveCategories(cats) {
    localStorage.setItem('affiliateCategories', JSON.stringify(cats));
}
function getCatColor(catId) {
    const cat = getCategories().find(c => c.id === catId);
    if (cat) return { bg: cat.c1, light: cat.c1 + '22', label: cat.label || cat.name };
    return { bg: '#6366F1', light: '#6366F122', label: catId };
}
function getNextColor() {
    const used = new Set(getCategories().map(c => c.c1));
    return COLOR_PALETTE.find(p => !used.has(p.c1)) || COLOR_PALETTE[getCategories().length % COLOR_PALETTE.length];
}

let products  = JSON.parse(localStorage.getItem('affiliateProducts'))  || [];
let analytics = JSON.parse(localStorage.getItem('affiliateAnalytics')) || {
    totalClicks: 0, clicksToday: 0, clicks: [], categoryClicks: {}, productClicks: {}
};

let sortMode = 'new';
let chartLine, chartDoughnut, chartBar, chartHBar;

// ══════════════════════════════════════════════════
//  AUTH
// ══════════════════════════════════════════════════
function doLogin(e) {
    e.preventDefault();
    const pw  = document.getElementById('pwInput').value;
    const err = document.getElementById('loginError');

    if (pw === ADMIN_PASSWORD) {
        document.getElementById('loginScreen').style.display = 'none';
        document.getElementById('adminPanel').classList.add('visible');
        err.style.display = 'none';
        // Ensure categories exist in localStorage (initialises defaults on first login)
        if (!localStorage.getItem('affiliateCategories')) {
            saveCategories(DEFAULT_CATEGORIES);
        }
        initDashboard();
        renderProductsGrid();
        renderCatSelector();
    } else {
        err.style.display = 'flex';
        err.style.animation = 'none';
        void err.offsetWidth;
        err.style.animation = 'shake .4s ease';
        document.getElementById('pwInput').value = '';
    }
}

function doLogout() {
    document.getElementById('adminPanel').classList.remove('visible');
    document.getElementById('loginScreen').style.display = '';
    document.getElementById('pwInput').value = '';
    document.getElementById('loginError').style.display = 'none';
}

// ══════════════════════════════════════════════════
//  TABS
// ══════════════════════════════════════════════════
function switchTab(name, btn) {
    document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.getElementById('tab-' + name).classList.add('active');
    btn.classList.add('active');

    if (name === 'dashboard')  initDashboard();
    if (name === 'products')   renderProductsGrid();
    if (name === 'analytics')  initAnalytics();
    if (name === 'categories') initCategoriesTab();
}

// ══════════════════════════════════════════════════
//  CATEGORY SELECTOR (form)
// ══════════════════════════════════════════════════
function selectCat(btn) {
    document.querySelectorAll('.cat-opt').forEach(o => {
        o.classList.remove('selected');
        const icon = o.querySelector('.cat-opt-icon');
        const name = o.querySelector('.cat-opt-name');
        if (icon) icon.style.background = '#E5E7EB';
        if (name) { name.style.color = ''; name.style.fontWeight = ''; }
        o.style.borderColor = '';
    });

    btn.classList.add('selected');
    const val = btn.dataset.val;
    const col = CAT_COLORS[val];
    if (col) {
        const icon = btn.querySelector('.cat-opt-icon');
        const name = btn.querySelector('.cat-opt-name');
        if (icon) icon.style.background = col.bg;
        if (name) { name.style.color = col.bg; name.style.fontWeight = '800'; }
        btn.style.borderColor = col.bg;
    }
    document.getElementById('pCategory').value = val;
}

function initCatSelector() {
    const selected = document.querySelector('.cat-opt.selected');
    if (selected) selectCat(selected);
}

// ══════════════════════════════════════════════════
//  IMAGE PREVIEW
// ══════════════════════════════════════════════════
function previewImg(url) {
    const box = document.getElementById('imgPreview');
    if (!box) return;
    if (url && (url.startsWith('http://') || url.startsWith('https://'))) {
        box.innerHTML = `<img src="${escH(url)}" alt="Preview"
            onerror="this.parentElement.innerHTML='<div class=img-preview-placeholder><svg viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke-width=\\'1.5\\'><rect x=\\'3\\' y=\\'3\\' width=\\'18\\' height=\\'18\\' rx=\\'2\\'/></svg>Could not load image</div>';this.parentElement.classList.remove('has-img')">`;
        box.classList.add('has-img');
    } else {
        box.innerHTML = `<div class="img-preview-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            Image preview</div>`;
        box.classList.remove('has-img');
    }
}

// ══════════════════════════════════════════════════
//  FORM SUBMIT
// ══════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
    initCatSelector();

    document.getElementById('addForm').addEventListener('submit', function (e) {
        e.preventDefault();
        const name  = document.getElementById('pName').value.trim();
        const price = parseFloat(document.getElementById('pPrice').value);
        const link  = document.getElementById('pLink').value.trim();
        const cat   = document.getElementById('pCategory').value;
        const img   = document.getElementById('pImage').value.trim();
        const desc  = document.getElementById('pDesc').value.trim();

        if (!name || !price || !link || !cat) {
            showToast('Please fill in all required fields.', 'err');
            return;
        }

        const product = {
            id:      'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            name, price, link,
            category: cat,
            image:    img  || '',
            desc:     desc || '',
            addedAt:  new Date().toISOString(),
        };

        products.unshift(product);
        saveProducts();
        renderProductsGrid();
        updateDashboardStats();
        showFormStatus();
        showToast('Product added successfully!', 'ok');
        clearForm();
    });
});

function clearForm() {
    document.getElementById('pName').value  = '';
    document.getElementById('pPrice').value = '';
    document.getElementById('pLink').value  = '';
    document.getElementById('pImage').value = '';
    document.getElementById('pDesc').value  = '';
    const first = document.querySelector('.cat-opt[data-val="Electronics"]');
    if (first) selectCat(first);
    previewImg('');
}

function showFormStatus() {
    const el = document.getElementById('formStatus');
    if (!el) return;
    el.style.display = 'flex';
    setTimeout(() => { el.style.display = 'none'; }, 2500);
}

// ══════════════════════════════════════════════════
//  PRODUCT GRID RENDER
// ══════════════════════════════════════════════════
function renderProductsGrid() {
    const grid    = document.getElementById('productsGrid');
    const countEl = document.getElementById('prodCount');
    if (!grid) return;

    let list = [...products];
    if (sortMode === 'clicks') {
        list.sort((a, b) => (analytics.productClicks[b.id] || 0) - (analytics.productClicks[a.id] || 0));
    }

    if (countEl) countEl.textContent = list.length;

    if (list.length === 0) {
        grid.innerHTML = `<div class="no-data" style="grid-column:1/-1">
            <svg viewBox="0 0 24 24" fill="none" stroke-width="1.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
            No products yet. Add your first product above!</div>`;
        return;
    }

    const maxClicks = Math.max(...list.map(p => analytics.productClicks[p.id] || 0), 1);
    grid.innerHTML = '';

    list.forEach((p, idx) => {
        const col     = getCatColor(p.category);
        const clicks  = analytics.productClicks[p.id] || 0;
        const fillPct = Math.round((clicks / maxClicks) * 100);
        const imgHtml = p.image
            ? `<img src="${escH(p.image)}" alt="${escH(p.name)}" loading="lazy"
                   onerror="this.parentElement.classList.add('pc-img-ph');this.remove()">`
            : `<div class="pc-img-ph"><svg viewBox="0 0 24 24" fill="none" stroke-width="1.2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg></div>`;

        const card = document.createElement('div');
        card.className = 'pcard';
        card.style.animationDelay = `${idx * 0.04}s`;
        card.innerHTML = `
            <div class="pc-img-wrap">
                ${imgHtml}
                <span class="pc-cat-tag" style="background:${col.bg}">${escH(p.category)}</span>
                <div class="pc-actions">
                    <a href="${escH(p.link)}" target="_blank" rel="noopener" class="pc-act-btn pc-act-link" title="Open link">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2"><path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                    </a>
                    <button class="pc-act-btn pc-act-del" title="Delete" onclick="deleteProduct('${escH(p.id)}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6M14 11v6"/></svg>
                    </button>
                </div>
            </div>
            <div class="pc-body">
                <div class="pc-name">${escH(p.name)}</div>
                <div class="pc-meta">
                    <div class="pc-price">$${parseFloat(p.price).toFixed(2)}</div>
                    <div class="pc-clicks">
                        <svg viewBox="0 0 24 24" fill="none" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                        ${clicks} click${clicks !== 1 ? 's' : ''}
                    </div>
                </div>
                <div class="click-track"><div class="click-fill" style="width:${fillPct}%"></div></div>
            </div>`;
        grid.appendChild(card);
    });
}

function sortProducts(mode, btn) {
    sortMode = mode;
    document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    renderProductsGrid();
}

function deleteProduct(id) {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    products = products.filter(p => p.id !== id);
    saveProducts();
    renderProductsGrid();
    updateDashboardStats();
    showToast('Product deleted.', 'ok');
}

// ══════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════
function initDashboard() {
    updateDashboardStats();
    renderRecentClicks();
    renderChartLine();
    renderChartDoughnut();
}

function updateDashboardStats() {
    const pc     = analytics.productClicks || {};
    const topVal = Object.values(pc).length ? Math.max(...Object.values(pc)) : 0;
    setText('s-products', products.length);
    setText('s-clicks',   analytics.totalClicks  || 0);
    setText('s-today',    analytics.clicksToday  || 0);
    setText('s-top',      topVal);
}

function renderRecentClicks() {
    const tbody = document.getElementById('recentBody');
    const badge = document.getElementById('d-recent-count');
    if (!tbody) return;

    const recent = [...(analytics.clicks || [])].reverse().slice(0, 20);
    if (badge) badge.textContent = recent.length;

    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" class="no-data">No clicks recorded yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = recent.map(c => {
        const col = getCatColor(c.category);
        const ts  = c.timestamp ? new Date(c.timestamp).toLocaleString() : '—';
        return `<tr>
            <td>${escH(c.productName || '—')}</td>
            <td><span class="cat-badge" style="background:${col.light};color:${col.bg}">${escH(c.category || '—')}</span></td>
            <td style="color:var(--muted);font-size:.78rem">${ts}</td>
        </tr>`;
    }).join('');
}

// ── Line chart — 7-day clicks
function renderChartLine() {
    const ctx = document.getElementById('chartLine');
    if (!ctx) return;

    const labels = [], data = [];
    const today  = new Date();
    for (let i = 6; i >= 0; i--) {
        const d   = new Date(today);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        labels.push(d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        data.push((analytics.clicks || []).filter(c => c.date === key).length);
    }

    if (chartLine) chartLine.destroy();
    chartLine = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Clicks',
                data,
                borderColor: '#6366F1',
                backgroundColor: 'rgba(99,102,241,.12)',
                borderWidth: 2.5,
                pointBackgroundColor: '#6366F1',
                pointRadius: 4,
                pointHoverRadius: 6,
                tension: 0.4,
                fill: true,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#9CA3AF', font: { size: 11 } }, grid: { color: '#F3F4F6' } },
                x: { ticks: { color: '#9CA3AF', font: { size: 11 } }, grid: { display: false } }
            }
        }
    });
}

// ── Doughnut — category breakdown
function renderChartDoughnut() {
    const ctx = document.getElementById('chartDoughnut');
    if (!ctx) return;

    const cats   = getCategories();
    const labels = cats.map(c => c.label || c.name);
    const data   = cats.map(c => analytics.categoryClicks[c.id] || 0);
    const colors = cats.map(c => c.c1);

    if (chartDoughnut) chartDoughnut.destroy();
    chartDoughnut = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{ data, backgroundColor: colors, borderWidth: 2, borderColor: '#fff', hoverOffset: 6 }]
        },
        options: {
            responsive: true,
            cutout: '65%',
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 10, padding: 12, font: { size: 11 }, color: '#374151' } }
            }
        }
    });
}

// ══════════════════════════════════════════════════
//  ANALYTICS TAB
// ══════════════════════════════════════════════════
function initAnalytics() {
    renderFullLog();
    renderChartBar();
    renderChartHBar();
}

function renderFullLog() {
    const tbody = document.getElementById('fullLog');
    const badge = document.getElementById('logCount');
    if (!tbody) return;

    const all = [...(analytics.clicks || [])].reverse();
    if (badge) badge.textContent = `${all.length} entr${all.length !== 1 ? 'ies' : 'y'}`;

    if (all.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="no-data">No click data yet.</td></tr>`;
        return;
    }
    tbody.innerHTML = all.map((c, i) => {
        const col = getCatColor(c.category);
        const ts  = c.timestamp ? new Date(c.timestamp).toLocaleString() : '—';
        return `<tr>
            <td style="color:var(--muted)">${all.length - i}</td>
            <td>${escH(c.productName || '—')}</td>
            <td><span class="cat-badge" style="background:${col.light};color:${col.bg}">${escH(c.category || '—')}</span></td>
            <td style="color:var(--muted);font-size:.78rem">${ts}</td>
        </tr>`;
    }).join('');
}

// ── Bar — category clicks
function renderChartBar() {
    const ctx = document.getElementById('chartBar');
    if (!ctx) return;

    const cats   = getCategories();
    const labels = cats.map(c => c.label || c.name);
    const data   = cats.map(c => analytics.categoryClicks[c.id] || 0);
    const colors = cats.map(c => c.c1);

    if (chartBar) chartBar.destroy();
    chartBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Clicks',
                data,
                backgroundColor: colors.map(c => c + 'CC'),
                borderColor:     colors,
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { stepSize: 1, color: '#9CA3AF', font: { size: 11 } }, grid: { color: '#F3F4F6' } },
                x: { ticks: { color: '#374151', font: { size: 11, weight: '600' } }, grid: { display: false } }
            }
        }
    });
}

// ── Horizontal bar — top 5 products
function renderChartHBar() {
    const ctx = document.getElementById('chartHBar');
    if (!ctx) return;

    const sorted = Object.entries(analytics.productClicks || {})
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);

    const labels  = sorted.map(([id]) => {
        const p = products.find(pr => pr.id === id);
        const n = p ? p.name : id;
        return n.length > 24 ? n.slice(0, 24) + '…' : n;
    });
    const data    = sorted.map(([, v]) => v);
    const palette = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

    if (chartHBar) chartHBar.destroy();
    chartHBar = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: 'Clicks',
                data,
                backgroundColor: palette.map(c => c + 'CC'),
                borderColor:     palette,
                borderWidth: 2,
                borderRadius: 8,
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, ticks: { stepSize: 1, color: '#9CA3AF', font: { size: 11 } }, grid: { color: '#F3F4F6' } },
                y: { ticks: { color: '#374151', font: { size: 11, weight: '600' } }, grid: { display: false } }
            }
        }
    });
}

// ══════════════════════════════════════════════════
//  CATEGORY MANAGEMENT
// ══════════════════════════════════════════════════
const ADMIN_CAT_SVG = {
    'Electronics': `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>`,
    'Fashion':     `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20.38 3.46L16 2a4 4 0 01-8 0L3.62 3.46a2 2 0 00-1.34 2.23l.58 3.57a1 1 0 00.99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 002-2V10h2.15a1 1 0 00.99-.84l.58-3.57a2 2 0 00-1.34-2.23z"/></svg>`,
    'Home':        `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    'Books':       `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 016.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/></svg>`,
    'Sports':      `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/><path d="M19.07 4.93L4.93 19.07"/></svg>`,
    '__default__': `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>`,
};

function renderCatSelector() {
    const container = document.getElementById('catSelector');
    if (!container) return;
    const cats = getCategories();
    container.innerHTML = '';
    // Update grid columns (max 5 per row)
    container.style.gridTemplateColumns = `repeat(${Math.min(cats.length, 5)}, 1fr)`;

    cats.forEach((cat, i) => {
        const svg = ADMIN_CAT_SVG[cat.id] || ADMIN_CAT_SVG['__default__'];
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'cat-opt' + (i === 0 ? ' selected' : '');
        btn.dataset.val = cat.id;
        const iconBg = i === 0 ? cat.c1 : '#E5E7EB';
        btn.innerHTML = `
            <div class="cat-opt-icon" style="background:${iconBg}">${svg}</div>
            <span class="cat-opt-name" style="${i === 0 ? `color:${cat.c1};font-weight:800` : ''}">${escH(cat.label || cat.name)}</span>`;
        btn.addEventListener('click', function () { selectCat(this); });
        container.appendChild(btn);
    });

    if (cats.length > 0) {
        document.getElementById('pCategory').value = cats[0].id;
    }
}

function initCategoriesTab() {
    renderAdminCats();
    updateCatColorPreview();
}

function updateCatColorPreview() {
    const dot = document.getElementById('newCatColorDot');
    if (!dot) return;
    const col = getNextColor();
    dot.style.background = `linear-gradient(135deg,${col.c1},${col.c2})`;
}

function renderAdminCats() {
    const list    = document.getElementById('adminCatList');
    const countEl = document.getElementById('adminCatCount');
    if (!list) return;

    const cats = getCategories();
    if (countEl) countEl.textContent = cats.length;

    list.innerHTML = '';
    cats.forEach((cat, idx) => {
        const prodCount = products.filter(p => p.category === cat.id).length;
        const card = document.createElement('div');
        card.className = 'cat-admin-card';
        card.style.animationDelay = `${idx * 0.04}s`;
        card.innerHTML = `
            <div class="cat-swatch" style="background:linear-gradient(135deg,${escH(cat.c1)},${escH(cat.c2)})"></div>
            <div class="cat-admin-info">
                <div class="cat-admin-name">${escH(cat.label || cat.name)}</div>
                <div class="cat-admin-meta">${prodCount} product${prodCount !== 1 ? 's' : ''}</div>
            </div>
            <button class="cat-del-btn" onclick="deleteCategoryFromAdmin('${escH(cat.id)}')" title="Delete">
                <svg viewBox="0 0 24 24" fill="none" stroke-width="2.2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            </button>`;
        list.appendChild(card);
    });
    updateCatColorPreview();
}

function addCategoryFromAdmin() {
    const input = document.getElementById('newCatName');
    const name  = (input?.value || '').trim();
    if (!name) { showToast('Enter a category name.', 'err'); return; }

    const cats = getCategories();
    if (cats.some(c => c.name.toLowerCase() === name.toLowerCase())) {
        showToast('This category already exists.', 'err'); return;
    }

    const col = getNextColor();
    cats.push({ id: name, name, label: name, c1: col.c1, c2: col.c2 });
    saveCategories(cats);

    if (input) input.value = '';
    renderAdminCats();
    renderCatSelector();
    showToast(`Category "${name}" added!`, 'ok');
}

function deleteCategoryFromAdmin(id) {
    const using = products.filter(p => p.category === id).length;
    const msg   = using > 0
        ? `${using} product(s) use "${id}". Delete category anyway?`
        : `Delete category "${id}"?`;
    if (!confirm(msg)) return;

    saveCategories(getCategories().filter(c => c.id !== id));
    renderAdminCats();
    renderCatSelector();
    showToast('Category deleted.', 'ok');
}

function resetToDefaultCategories() {
    if (!confirm('Reset to 5 default categories? Custom categories will be removed.')) return;
    saveCategories([...DEFAULT_CATEGORIES]);
    renderAdminCats();
    renderCatSelector();
    showToast('Categories reset to defaults.', 'ok');
}

// ══════════════════════════════════════════════════
//  SAMPLE PRODUCTS
// ══════════════════════════════════════════════════
function addSampleProducts() {
    const samples = [
        { name: 'Sony WH-1000XM5 Headphones',      price: 279.99, category: 'Electronics', link: 'https://amazon.com', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400', desc: 'Industry-leading noise canceling.' },
        { name: 'Apple AirPods Pro (2nd Gen)',       price: 199.00, category: 'Electronics', link: 'https://amazon.com', image: 'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400', desc: 'Adaptive audio, ANC.' },
        { name: 'Nike Air Max 270 Sneakers',         price: 120.00, category: 'Fashion',     link: 'https://amazon.com', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', desc: 'Max air cushioning.' },
        { name: 'Instant Pot Duo 7-in-1',            price: 79.95,  category: 'Home',        link: 'https://amazon.com', image: 'https://images.unsplash.com/photo-1585515320310-259814833e62?w=400', desc: 'Multi-use pressure cooker.' },
        { name: 'Atomic Habits — James Clear',       price: 14.99,  category: 'Books',       link: 'https://amazon.com', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400', desc: 'Build good habits.' },
        { name: 'Fitbit Charge 6 Fitness Tracker',   price: 159.95, category: 'Sports',      link: 'https://amazon.com', image: 'https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=400', desc: 'GPS + heart rate.' },
        { name: 'Samsung 4K Smart TV 55"',           price: 549.99, category: 'Electronics', link: 'https://amazon.com', image: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400', desc: 'Crystal-clear 4K UHD.' },
        { name: "Levi's Classic 501 Jeans",          price: 59.50,  category: 'Fashion',     link: 'https://amazon.com', image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400', desc: 'Iconic straight fit.' },
    ];

    let added = 0;
    samples.forEach(s => {
        if (!products.some(p => p.name === s.name)) {
            products.unshift({
                ...s,
                id:      'p_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
                addedAt: new Date().toISOString(),
            });
            added++;
        }
    });

    if (added > 0) {
        saveProducts();
        renderProductsGrid();
        updateDashboardStats();
        showToast(`${added} sample product${added > 1 ? 's' : ''} added!`, 'ok');
    } else {
        showToast('Sample products already exist.', '');
    }
}

// ══════════════════════════════════════════════════
//  EXPORT / IMPORT / CLEAR
// ══════════════════════════════════════════════════
function exportData() {
    const blob = new Blob([JSON.stringify({ products, analytics }, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `bestdeals-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Backup exported!', 'ok');
}

function importData() {
    document.getElementById('importFile').click();
}

function handleImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
        try {
            const data = JSON.parse(ev.target.result);
            if (data.products)  { products  = data.products;  saveProducts(); }
            if (data.analytics) { analytics = data.analytics; saveAnalytics(); }
            renderProductsGrid();
            initDashboard();
            initAnalytics();
            showToast('Backup imported successfully!', 'ok');
        } catch {
            showToast('Invalid backup file.', 'err');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function clearAnalytics() {
    if (!confirm('Clear all analytics data? This cannot be undone.')) return;
    analytics = { totalClicks: 0, clicksToday: 0, clicks: [], categoryClicks: {}, productClicks: {} };
    saveAnalytics();
    initDashboard();
    initAnalytics();
    showToast('Analytics cleared.', 'ok');
}

// ══════════════════════════════════════════════════
//  PERSISTENCE
// ══════════════════════════════════════════════════
function saveProducts() {
    localStorage.setItem('affiliateProducts', JSON.stringify(products));
}
function saveAnalytics() {
    localStorage.setItem('affiliateAnalytics', JSON.stringify(analytics));
}

// ══════════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════════
let _toastTimer;
function showToast(msg, type) {
    const old = document.querySelector('.toast');
    if (old) old.remove();
    clearTimeout(_toastTimer);

    const iconOk   = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    const iconErr  = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    const iconInfo = `<svg viewBox="0 0 24 24" fill="none" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

    const toast = document.createElement('div');
    toast.className = `toast${type === 'ok' ? ' ok' : type === 'err' ? ' err' : ''}`;
    toast.innerHTML = (type === 'ok' ? iconOk : type === 'err' ? iconErr : iconInfo) + escH(msg);
    document.body.appendChild(toast);

    _toastTimer = setTimeout(() => {
        toast.style.transition = 'opacity .3s ease, transform .3s ease';
        toast.style.opacity    = '0';
        toast.style.transform  = 'translateY(8px)';
        setTimeout(() => toast.remove(), 300);
    }, 2800);
}

// ══════════════════════════════════════════════════
//  UTILS
// ══════════════════════════════════════════════════
function escH(t) {
    if (t === null || t === undefined) return '';
    return String(t).replace(/[&<>"']/g,
        m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}
function setText(id, val) {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
}
