// Initialize products and analytics data from localStorage
let products = JSON.parse(localStorage.getItem('affiliateProducts')) || [];
let analytics = JSON.parse(localStorage.getItem('affiliateAnalytics')) || {
    totalClicks: 0,
    clicksToday: 0,
    clicks: [],
    categoryClicks: {},
    productClicks: {}
};

// Initialize the page
document.addEventListener('DOMContentLoaded', () => {
    loadProducts();
    setupFilters();
    updateStats();
    trackClicksToday();
});

// Save products to localStorage
function saveProducts() {
    localStorage.setItem('affiliateProducts', JSON.stringify(products));
}

// Load and display products
function loadProducts() {
    const grid = document.getElementById('productsGrid');
    const emptyMessage = document.getElementById('emptyMessage');

    if (products.length === 0) {
        grid.innerHTML = '';
        emptyMessage.style.display = 'block';
        return;
    }

    emptyMessage.style.display = 'none';
    displayProducts(products);
}

// Display products with filter
function displayProducts(productsToDisplay) {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    productsToDisplay.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });

    updateStats();
}

// Create product card element
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.setAttribute('data-category', product.category);

    const imageUrl = product.image || 'https://via.placeholder.com/250x200?text=Product+Image';
    const imageHtml = product.image 
        ? `<img src="${product.image}" alt="${product.name}" onerror="this.src='https://via.placeholder.com/250x200?text=Product+Image'">`
        : `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: linear-gradient(135deg, #FF9500 0%, #FFB84D 100%); font-size: 3rem;">📦</div>`;

    card.innerHTML = `
        <div class="product-image">
            ${imageHtml}
        </div>
        <div class="product-content">
            <span class="product-category">${product.category}</span>
            <h3 class="product-name">${escapeHtml(product.name)}</h3>
            <p class="product-description">${escapeHtml(product.description || 'Great product from Amazon')}</p>
            <div class="product-footer">
                <div class="product-price">$ ${parseFloat(product.price).toFixed(2)}</div>
            </div>
            <a href="${product.link}" target="_blank" rel="noopener noreferrer" class="buy-btn" onclick="trackClick('${product.id}', '${escapeHtml(product.name)}', '${product.category}')">
                🛒 Buy Now
            </a>
        </div>
    `;

    return card;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

// Track clicks for analytics
function trackClick(productId, productName, category) {
    const now = new Date();
    const today = now.toISOString().split('T')[0];

    // Update total clicks
    analytics.totalClicks += 1;

    // Update today's clicks
    if (!analytics.clicksToday) {
        analytics.clicksToday = 0;
    }
    analytics.clicksToday += 1;

    // Track individual clicks
    if (!analytics.clicks) {
        analytics.clicks = [];
    }
    analytics.clicks.push({
        productId,
        productName,
        category,
        timestamp: now.toISOString(),
        date: today
    });

    // Track category clicks
    if (!analytics.categoryClicks) {
        analytics.categoryClicks = {};
    }
    analytics.categoryClicks[category] = (analytics.categoryClicks[category] || 0) + 1;

    // Track product clicks
    if (!analytics.productClicks) {
        analytics.productClicks = {};
    }
    analytics.productClicks[productId] = (analytics.productClicks[productId] || 0) + 1;

    // Save analytics
    localStorage.setItem('affiliateAnalytics', JSON.stringify(analytics));
    updateStats();
}

// Delete product
function deleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        products = products.filter(p => p.id !== id);
        saveProducts();
        loadProducts();
        alert('✅ Product deleted!');
    }
}

// Setup filter buttons
function setupFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Filter products
            const filter = btn.getAttribute('data-filter');
            if (filter === 'all') {
                displayProducts(products);
            } else {
                const filtered = products.filter(p => p.category === filter);
                displayProducts(filtered);
            }
        });
    });
}

// Track clicks reset at midnight
function trackClicksToday() {
    const lastCheckDate = localStorage.getItem('lastCheckDate');
    const today = new Date().toISOString().split('T')[0];

    if (lastCheckDate !== today) {
        analytics.clicksToday = 0;
        localStorage.setItem('lastCheckDate', today);
        localStorage.setItem('affiliateAnalytics', JSON.stringify(analytics));
    }
}

// Clear all analytics data
function clearAllData() {
    if (confirm('This will clear all analytics data. Are you sure?')) {
        analytics = {
            totalClicks: 0,
            clicksToday: 0,
            clicks: [],
            categoryClicks: {},
            productClicks: {}
        };
        localStorage.setItem('affiliateAnalytics', JSON.stringify(analytics));
        updateStats();
        alert('✅ Analytics data cleared!');
    }
}

// Share on Facebook
function shareOnFacebook() {
    const pageUrl = window.location.href;
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
    window.open(facebookShareUrl, 'facebook-share-dialog', 'width=800,height=600');
}

// Demo products - for initial testing (remove if using real data)
function addDemoProducts() {
    if (products.length === 0) {
        const demoProducts = [
            {
                id: 1,
                name: 'Wireless Bluetooth Headphones',
                price: 2500,
                category: 'Electronics',
                description: 'High-quality sound with 20-hour battery life',
                link: 'https://amazon.com/',
                image: 'https://via.placeholder.com/600x400?text=Wireless+Headphones',
                addedDate: new Date().toISOString()
            },
            {
                id: 2,
                name: 'Premium Laptop Backpack',
                price: 1800,
                category: 'Fashion',
                description: 'Durable and water-resistant design',
                link: 'https://amazon.com/',
                image: 'https://via.placeholder.com/600x400?text=Backpack',
                addedDate: new Date().toISOString()
            },
            {
                id: 3,
                name: 'Smart Home LED Bulbs',
                price: 1200,
                category: 'Home',
                description: '16 million color options, voice controlled',
                link: 'https://amazon.com/',
                image: 'https://via.placeholder.com/600x400?text=LED+Bulbs',
                addedDate: new Date().toISOString()
            }
        ];

        products = demoProducts;
        saveProducts();
        loadProducts();
    }
}

// Optional: Uncomment the line below to add demo products on first load
// addDemoProducts();
