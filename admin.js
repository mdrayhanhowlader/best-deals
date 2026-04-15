// Admin Password (Simple protection - change this to something more secure in production)
const ADMIN_PASSWORD = 'admin123';

// Initialize admin page
document.addEventListener('DOMContentLoaded', () => {
    checkIfLoggedIn();
});

// Check if user is logged in
function checkIfLoggedIn() {
    const isLoggedIn = sessionStorage.getItem('adminLoggedIn') === 'true';
    if (isLoggedIn) {
        showAdminPanel();
    } else {
        showLoginForm();
    }
}

// Check password
function checkPassword(event) {
    event.preventDefault();
    const password = document.getElementById('passwordInput').value;
    
    if (password === ADMIN_PASSWORD) {
        sessionStorage.setItem('adminLoggedIn', 'true');
        showAdminPanel();
    } else {
        document.getElementById('loginError').style.display = 'block';
        document.getElementById('passwordInput').value = '';
        setTimeout(() => {
            document.getElementById('loginError').style.display = 'none';
        }, 3000);
    }
}

// Show login form
function showLoginForm() {
    document.getElementById('adminWrapper').classList.add('locked');
    document.getElementById('loginCard').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
}

// Show admin panel
function showAdminPanel() {
    document.getElementById('adminWrapper').classList.remove('locked');
    document.getElementById('loginCard').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
    
    // Load data
    loadAdminData();
    setupAdminForm();
    displayAdminProducts();
    updateAdminStats();
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.removeItem('adminLoggedIn');
        document.getElementById('adminWrapper').classList.add('locked');
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('loginCard').style.display = 'block';
        document.getElementById('passwordInput').value = '';
        document.getElementById('loginCard').scrollIntoView();
    }
}

// Load admin data from localStorage
let adminProducts = JSON.parse(localStorage.getItem('affiliateProducts')) || [];
let adminAnalytics = JSON.parse(localStorage.getItem('affiliateAnalytics')) || {
    totalClicks: 0,
    clicksToday: 0,
    clicks: [],
    categoryClicks: {},
    productClicks: {}
};

// Load admin data
function loadAdminData() {
    adminProducts = JSON.parse(localStorage.getItem('affiliateProducts')) || [];
    adminAnalytics = JSON.parse(localStorage.getItem('affiliateAnalytics')) || {
        totalClicks: 0,
        clicksToday: 0,
        clicks: [],
        categoryClicks: {},
        productClicks: {}
    };
}

// Setup admin product form
function setupAdminForm() {
    const form = document.getElementById('productForm');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();

            const newProduct = {
                id: Date.now(),
                name: document.getElementById('productName').value,
                price: document.getElementById('productPrice').value,
                link: document.getElementById('productLink').value,
                category: document.getElementById('productCategory').value,
                image: document.getElementById('productImage').value,
                description: document.getElementById('productDesc').value,
                addedDate: new Date().toISOString()
            };

            adminProducts.push(newProduct);
            saveAdminProducts();
            displayAdminProducts();
            updateAdminStats();
            
            form.reset();
            alert('✅ Product added successfully!');
        });
    }
}

// Save admin products
function saveAdminProducts() {
    localStorage.setItem('affiliateProducts', JSON.stringify(adminProducts));
}

// Display all admin products
function displayAdminProducts() {
    const container = document.getElementById('adminProductsList');
    if (!container) return;

    if (adminProducts.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">No products yet. Add one above!</p>';
        return;
    }

    container.innerHTML = adminProducts.map(product => `
        <div class="admin-product-item">
            <div class="admin-product-info">
                <h4>${escapeHtml(product.name)}</h4>
                <p><strong>Price:</strong> $ ${parseFloat(product.price).toFixed(2)}</p>
                <p><strong>Category:</strong> ${product.category}</p>
                <p><strong>Link:</strong> <a href="${product.link}" target="_blank" style="color: #667eea; text-decoration: none;">View</a></p>
                <p><strong>Clicks:</strong> ${adminAnalytics.productClicks[product.id] || 0}</p>
            </div>
            <div class="admin-product-actions">
                <button class="admin-btn admin-btn-delete" onclick="adminDeleteProduct(${product.id})">🗑️ Delete</button>
            </div>
        </div>
    `).join('');
}

// Admin delete product
function adminDeleteProduct(id) {
    if (confirm('Are you sure you want to delete this product?')) {
        adminProducts = adminProducts.filter(p => p.id !== id);
        saveAdminProducts();
        displayAdminProducts();
        updateAdminStats();
        alert('✅ Product deleted!');
    }
}

// Update admin statistics
function updateAdminStats() {
    document.getElementById('adminTotalProducts').innerText = adminProducts.length;
    document.getElementById('adminTotalClicks').innerText = adminAnalytics.totalClicks || 0;
    document.getElementById('adminClickToday').innerText = adminAnalytics.clicksToday || 0;

    // Top product
    if (adminAnalytics.productClicks && Object.keys(adminAnalytics.productClicks).length > 0) {
        const topProductId = Object.keys(adminAnalytics.productClicks).reduce((a, b) =>
            adminAnalytics.productClicks[a] > adminAnalytics.productClicks[b] ? a : b
        );
        const topProduct = adminProducts.find(p => p.id == topProductId);
        if (topProduct) {
            document.getElementById('adminTopProduct').innerHTML = 
                `${adminAnalytics.productClicks[topProductId]}`;
        }
    }

    // Most active category
    if (adminAnalytics.categoryClicks && Object.keys(adminAnalytics.categoryClicks).length > 0) {
        const activeCategory = Object.keys(adminAnalytics.categoryClicks).reduce((a, b) =>
            adminAnalytics.categoryClicks[a] > adminAnalytics.categoryClicks[b] ? a : b
        );
        document.getElementById('adminActiveCategory').innerHTML = 
            `<strong>${activeCategory}</strong><br>(${adminAnalytics.categoryClicks[activeCategory]} clicks)`;
    }

    // Last click
    if (adminAnalytics.clicks && adminAnalytics.clicks.length > 0) {
        const lastClick = adminAnalytics.clicks[adminAnalytics.clicks.length - 1];
        const clickTime = new Date(lastClick.timestamp);
        document.getElementById('adminLastClick').innerText = 
            `${lastClick.productName}\n${clickTime.toLocaleString()}`;
    }
}

// Clear analytics
function clearAllAnalytics() {
    if (confirm('This will clear ALL analytics data. This cannot be undone. Are you sure?')) {
        adminAnalytics = {
            totalClicks: 0,
            clicksToday: 0,
            clicks: [],
            categoryClicks: {},
            productClicks: {}
        };
        localStorage.setItem('affiliateAnalytics', JSON.stringify(adminAnalytics));
        updateAdminStats();
        alert('✅ Analytics cleared!');
    }
}

// Export data as JSON
function exportData() {
    const data = {
        products: adminProducts,
        analytics: adminAnalytics,
        exportDate: new Date().toISOString()
    };

    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `affiliate-backup-${new Date().getTime()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    alert('✅ Data exported successfully!');
}

// Add sample products
function addSampleProducts() {
    const samples = [
        {
            id: Date.now() + 1,
            name: 'Premium Wireless Headphones',
            price: 89.99,
            category: 'Electronics',
            description: 'High-quality sound with 30-hour battery life and noise cancellation',
            link: 'https://amazon.com/',
            image: 'https://via.placeholder.com/300x300?text=Wireless+Headphones',
            addedDate: new Date().toISOString()
        },
        {
            id: Date.now() + 2,
            name: 'Waterproof Bluetooth Speaker',
            price: 49.99,
            category: 'Electronics',
            description: 'Portable speaker with amazing sound quality',
            link: 'https://amazon.com/',
            image: 'https://via.placeholder.com/300x300?text=Speaker',
            addedDate: new Date().toISOString()
        },
        {
            id: Date.now() + 3,
            name: 'Professional Camera Tripod',
            price: 34.99,
            category: 'Electronics',
            description: 'Adjustable tripod for cameras and smartphones',
            link: 'https://amazon.com/',
            image: 'https://via.placeholder.com/300x300?text=Tripod',
            addedDate: new Date().toISOString()
        },
        {
            id: Date.now() + 4,
            name: 'Stylish Laptop Backpack',
            price: 59.99,
            category: 'Fashion',
            description: 'Durable and water-resistant design with multiple compartments',
            link: 'https://amazon.com/',
            image: 'https://via.placeholder.com/300x300?text=Backpack',
            addedDate: new Date().toISOString()
        },
        {
            id: Date.now() + 5,
            name: 'Smart LED Light Bulbs',
            price: 19.99,
            category: 'Home',
            description: '16 million color options, voice controlled, energy efficient',
            link: 'https://amazon.com/',
            image: 'https://via.placeholder.com/300x300?text=LED+Bulbs',
            addedDate: new Date().toISOString()
        }
    ];

    adminProducts = [...adminProducts, ...samples];
    saveAdminProducts();
    displayAdminProducts();
    updateAdminStats();
    alert('✅ Sample products added!');
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
    return String(text).replace(/[&<>"']/g, m => map[m]);
}
