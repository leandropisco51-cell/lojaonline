// VALLORA - Application Core Logic & Server API Integration

// Initial Products Data (aligned with server db.json)
const INITIAL_PRODUCTS = [
    {
        id: 1,
        name: "Vestido Premium Vallora Champagne",
        description: "Vestido confeccionado em crepe de seda premium na cor champagne. Modelagem impecável e caimento refinado para ocasiões especiais.",
        price: 389.90,
        category: "Vestidos",
        sizes: ["P", "M", "G"],
        colors: ["#F1DBC8", "#ffffff"],
        colorsNames: ["Champagne", "Branco"],
        stock: 15,
        image: "https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800&q=80"
    },
    {
        id: 2,
        name: "Blazer Vallora Alfaiataria Bronze",
        description: "Blazer estruturado em alfaiataria clássica de tom bronze/taupe. Abotoamento duplo e forro acetinado de alto padrão.",
        price: 299.90,
        category: "Blazers",
        sizes: ["P", "M", "G", "GG"],
        colors: ["#998675", "#000000"],
        colorsNames: ["Bronze", "Preto"],
        stock: 8,
        image: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800&q=80"
    },
    {
        id: 3,
        name: "Bolsa de Couro Vallora Classic",
        description: "Bolsa tiracolo em couro legítimo texturizado. Detalhes em metal dourado e compartimentos internos inteligentes.",
        price: 189.90,
        category: "Acessórios",
        sizes: ["P"],
        colors: ["#998675", "#000000"],
        colorsNames: ["Bronze", "Preto"],
        stock: 22,
        image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&q=80"
    },
    {
        id: 4,
        name: "Camisa Satin Vallora Elegance",
        description: "Camisa de cetim brilhante com toque de seda. Gola clássica e punhos alongados, ideal para looks sofisticados.",
        price: 159.90,
        category: "Camisas",
        sizes: ["P", "M", "G"],
        colors: ["#F1DBC8", "#ffffff"],
        colorsNames: ["Champagne", "Branco"],
        stock: 25,
        image: "https://images.unsplash.com/photo-1603252109303-2751441dd157?w=800&q=80"
    }
];

class AppStore {
    constructor() {
        this.products = [];
        this.orders = [];
        this.cart = [];
        this.notifications = [];
        
        // Active selections
        this.selectedFilters = {
            category: "",
            sizes: [],
            colors: [],
            maxPrice: 1000
        };
        this.currentSort = "recent";
        
        // Checkout state
        this.paymentMethod = "PIX";
        this.redeemedPoints = 0; // points applied as discount in current checkout
        
        // Current view detail product ID
        this.selectedProductId = null;
        
        // Active Admin Tab
        this.activeAdminTab = "dash";
        this.isAdminAuthenticated = sessionStorage.getItem('sw_admin_auth') === 'true';
    }

    async syncProducts() {
        try {
            const res = await fetch('/api/products');
            this.products = await res.json();
        } catch(e) {
            this.products = JSON.parse(localStorage.getItem('sw_products')) || INITIAL_PRODUCTS;
        }
    }

    async syncOrders() {
        try {
            const res = await fetch('/api/orders');
            this.orders = await res.json();
        } catch(e) {
            this.orders = JSON.parse(localStorage.getItem('sw_orders')) || [];
        }
    }

    async syncCart() {
        try {
            const res = await fetch('/api/cart');
            this.cart = await res.json();
        } catch(e) {
            this.cart = JSON.parse(localStorage.getItem('sw_cart')) || [];
        }
    }

    async syncNotifications() {
        try {
            const res = await fetch('/api/notifications');
            this.notifications = await res.json();
        } catch(e) {
            this.notifications = [];
        }
    }

    async saveCart() {
        localStorage.setItem('sw_cart', JSON.stringify(this.cart));
        try {
            await fetch('/api/cart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.cart)
            });
        } catch(e) {
            console.error("Cart sync failed:", e);
        }
    }

    async saveProducts() {
        localStorage.setItem('sw_products', JSON.stringify(this.products));
        try {
            await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.products)
            });
        } catch(e) {
            console.error("Products sync failed:", e);
        }
    }

    async addOrder(order) {
        this.orders.unshift(order);
        localStorage.setItem('sw_orders', JSON.stringify(this.orders));
        try {
            await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(order)
            });
        } catch(e) {
            console.error("Order sync failed:", e);
        }
    }

    async addNotification(note) {
        this.notifications.unshift(note);
        try {
            await fetch('/api/notifications', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(note)
            });
        } catch(e) {
            console.error("Notification sync failed:", e);
        }
    }
}

// Instantiate Global State
const store = new AppStore();

// UI & Logic Controller
const app = {
    async init() {
        // Load data from server
        await store.syncProducts();
        await store.syncCart();
        await store.syncOrders();
        await store.syncNotifications();

        this.navigate('home');
        this.updateCartBadge();
        this.renderCategoryCounts();
        this.renderFeaturedProducts();
        this.renderRecommendedProducts();
        
        // Dynamic loading of colors into catalog filter
        this.renderCatalogFilterColors();
        this.renderCatalogFilterCategories();
        this.renderNotifications();
        
        // Auto-check if there is a previously searched phone for loyalty card on home
        const savedPhone = localStorage.getItem('vallora_loyalty_phone');
        if (savedPhone) {
            document.getElementById('history-phone-input').value = savedPhone;
            this.lookupPurchaseHistory(false);
        }
        
        // Polling products, cart and orders every 5 seconds for real-time multiplayer sync
        setInterval(async () => {
            const currentView = document.querySelector('.app-view[style*="display: block"]');
            const viewId = currentView ? currentView.id : 'view-home';
            
            await store.syncProducts();
            await store.syncCart();
            await store.syncOrders();
            
            this.updateCartBadge();
            
            if (viewId === 'view-checkout') {
                this.renderCheckout();
            } else if (viewId === 'view-admin') {
                this.renderAdmin();
            } else if (viewId === 'view-catalog') {
                this.renderCatalog();
            } else if (viewId === 'view-home') {
                this.renderFeaturedProducts();
                this.renderRecommendedProducts();
            }
        }, 5000);

        lucide.createIcons();
    },

    // Navigation SPA
    navigate(view) {
        document.querySelectorAll('.app-view').forEach(el => el.style.display = 'none');
        document.querySelectorAll('.nav-link').forEach(el => el.classList.remove('active'));
        
        const targetView = document.getElementById(`view-${view}`);
        if (targetView) {
            targetView.style.display = 'block';
        }
        
        const navLink = document.querySelector(`.nav-link[data-view="${view}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // Update bottom navigation active class
        document.querySelectorAll('.bottom-nav-item').forEach(el => el.classList.remove('active'));
        const bottomNavLink = document.getElementById(`bottom-nav-${view}`);
        if (bottomNavLink) {
            bottomNavLink.classList.add('active');
        }

        // Close filters drawer when navigating
        const filtersSidebar = document.getElementById('filters-sidebar-el');
        if (filtersSidebar) {
            filtersSidebar.classList.remove('open');
        }

        // View specific triggers
        if (view === 'catalog') {
            this.renderCatalog();
        } else if (view === 'admin') {
            this.renderAdmin();
        } else if (view === 'checkout') {
            this.renderCheckout();
        } else if (view === 'home') {
            this.renderFeaturedProducts();
            this.renderRecommendedProducts();
        }
        
        window.scrollTo(0, 0);
        lucide.createIcons();
    },

    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', nextTheme);
        
        const toggleBtn = document.getElementById('theme-toggle');
        toggleBtn.innerHTML = nextTheme === 'dark' ? '<i data-lucide="sun"></i>' : '<i data-lucide="moon"></i>';
        lucide.createIcons();
    },

    // Home view logic
    renderCategoryCounts() {
        const categories = ["Vestidos", "Blazers", "Acessórios", "Camisas"];
        categories.forEach(cat => {
            const count = store.products.filter(p => p.category === cat).length;
            const el = document.getElementById(`count-${cat}`);
            if (el) el.textContent = `${count} ${count === 1 ? 'Item' : 'Itens'}`;
        });
    },

    renderFeaturedProducts() {
        const featuredEl = document.getElementById('home-featured-products');
        if (!featuredEl) return;
        
        // Pick the first 3 products for featured list
        const items = store.products.slice(0, 3);
        featuredEl.innerHTML = items.map(p => this.createProductCardHtml(p)).join('');
        lucide.createIcons();
    },

    renderRecommendedProducts() {
        const recEl = document.getElementById('home-recommended-products');
        if (!recEl) return;
        
        // Select products (e.g. reverse list or random ones)
        const items = store.products.slice().reverse().slice(0, 4);
        recEl.innerHTML = items.map(p => this.createProductCardHtml(p)).join('');
        lucide.createIcons();
    },

    createProductCardHtml(p) {
        return `
            <div class="product-card" onclick="app.viewProductDetail(${p.id})">
                ${p.stock <= 5 ? '<span class="product-badge">Pouco Estoque</span>' : ''}
                <div class="product-img-wrapper">
                    <img src="${p.image}" alt="${p.name}" loading="lazy">
                </div>
                <div class="product-info">
                    <span class="product-cat">${p.category}</span>
                    <h3 class="product-name">${p.name}</h3>
                    <div class="product-footer">
                        <span class="product-price">R$ ${p.price.toFixed(2).replace('.', ',')}</span>
                        <span style="color: var(--primary); font-size: 0.9rem; font-weight: 600; display: flex; align-items: center; gap: 0.25rem;">
                            Ver Detalhes <i data-lucide="arrow-up-right" style="width: 16px; height: 16px;"></i>
                        </span>
                    </div>
                </div>
            </div>
        `;
    },

    // Catalog & Filters View Logic
    renderCatalogFilterColors() {
        const colorsContainer = document.getElementById('filter-colors-list');
        if (!colorsContainer) return;
        
        // Extract all unique colors
        const allColors = [...new Set(store.products.flatMap(p => p.colors))];
        colorsContainer.innerHTML = allColors.map(c => `
            <div class="color-dot ${store.selectedFilters.colors.includes(c) ? 'active' : ''}" 
                 style="background-color: ${c};" 
                 onclick="app.toggleFilterColor('${c}')"
                 title="${c}"></div>
        `).join('');
    },

    renderCatalogFilterCategories() {
        const container = document.getElementById('filter-categories-list');
        if (!container) return;
        
        const categories = ["Todos", "Vestidos", "Blazers", "Acessórios", "Camisas"];
        container.innerHTML = categories.map(cat => {
            const isChecked = cat === "Todos" ? !store.selectedFilters.category : store.selectedFilters.category === cat;
            return `
                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                    <input type="radio" name="cat-filter" value="${cat === "Todos" ? "" : cat}" ${isChecked ? 'checked' : ''} onchange="app.setFilterCategory(this.value)">
                    ${cat}
                </label>
            `;
        }).join('');
    },

    filterByCategory(cat) {
        store.selectedFilters.category = cat;
        this.renderCatalogFilterCategories();
        this.navigate('catalog');
    },

    setFilterCategory(value) {
        store.selectedFilters.category = value;
        this.renderCatalog();
    },

    toggleFilterSize(size) {
        const idx = store.selectedFilters.sizes.indexOf(size);
        if (idx > -1) {
            store.selectedFilters.sizes.splice(idx, 1);
        } else {
            store.selectedFilters.sizes.push(size);
        }
        
        // Update styling of buttons
        document.querySelectorAll('#filter-sizes-list .size-btn').forEach(btn => {
            if (store.selectedFilters.sizes.includes(btn.textContent)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.renderCatalog();
    },

    toggleFilterColor(color) {
        const idx = store.selectedFilters.colors.indexOf(color);
        if (idx > -1) {
            store.selectedFilters.colors.splice(idx, 1);
        } else {
            store.selectedFilters.colors.push(color);
        }
        
        this.renderCatalogFilterColors();
        this.renderCatalog();
    },

    updatePriceFilter(value) {
        store.selectedFilters.maxPrice = parseFloat(value);
        document.getElementById('price-filter-value').textContent = `R$ ${value}`;
        this.renderCatalog();
    },

    clearFilters() {
        store.selectedFilters = {
            category: "",
            sizes: [],
            colors: [],
            maxPrice: 1000
        };
        
        // Reset inputs
        const rangeEl = document.getElementById('filter-price-range');
        if (rangeEl) {
            rangeEl.value = 1000;
        }
        document.getElementById('price-filter-value').textContent = `R$ 1000`;
        
        document.querySelectorAll('#filter-sizes-list .size-btn').forEach(btn => btn.classList.remove('active'));
        
        this.renderCatalogFilterColors();
        this.renderCatalogFilterCategories();
        this.renderCatalog();
    },

    handleSort(sortType) {
        store.currentSort = sortType;
        this.renderCatalog();
    },

    renderCatalog() {
        const grid = document.getElementById('catalog-products-list');
        if (!grid) return;
        
        // Filtering
        let filtered = store.products.filter(p => {
            if (store.selectedFilters.category && p.category !== store.selectedFilters.category) return false;
            if (store.selectedFilters.maxPrice && p.price > store.selectedFilters.maxPrice) return false;
            
            if (store.selectedFilters.sizes.length > 0) {
                const hasSize = p.sizes.some(s => store.selectedFilters.sizes.includes(s));
                if (!hasSize) return false;
            }
            
            if (store.selectedFilters.colors.length > 0) {
                const hasColor = p.colors.some(c => store.selectedFilters.colors.includes(c));
                if (!hasColor) return false;
            }
            
            return true;
        });

        // Sorting
        if (store.currentSort === 'price-asc') {
            filtered.sort((a, b) => a.price - b.price);
        } else if (store.currentSort === 'price-desc') {
            filtered.sort((a, b) => b.price - a.price);
        } else {
            filtered.sort((a, b) => b.id - a.id);
        }

        document.getElementById('catalog-results-count').textContent = `${filtered.length} ${filtered.length === 1 ? 'produto encontrado' : 'produtos encontrados'}`;

        if (filtered.length === 0) {
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem 0; color: var(--text-secondary);">
                    <i data-lucide="frown" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--primary);"></i>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Tente alterar os filtros selecionados.</p>
                </div>
            `;
        } else {
            grid.innerHTML = filtered.map(p => this.createProductCardHtml(p)).join('');
        }
        
        lucide.createIcons();
    },

    // Product Detail Logic
    viewProductDetail(id) {
        store.selectedProductId = id;
        this.navigate('product-detail');
        this.renderProductDetail();
    },

    renderProductDetail() {
        const container = document.getElementById('product-detail-content');
        if (!container) return;
        
        const p = store.products.find(item => item.id === store.selectedProductId);
        if (!p) {
            container.innerHTML = `<div>Produto não encontrado.</div>`;
            return;
        }

        // Selected recommendations excluding current
        const recList = store.products.filter(item => item.id !== p.id).slice(0, 3);
        const recsHtml = recList.length > 0 ? `
            <div style="margin-top: 3rem; grid-column: span 2; border-top: 1px solid var(--border); padding-top: 2rem;">
                <h3 style="margin-bottom: 1.5rem;">Recomendado com Este Item</h3>
                <div class="products-grid">
                    ${recList.map(item => this.createProductCardHtml(item)).join('')}
                </div>
            </div>
        ` : '';

        container.innerHTML = `
            <div class="product-gallery">
                <div class="main-img-container" id="zoom-img-container" onmousemove="app.handleZoom(event)" onmouseleave="app.resetZoom()">
                    <img id="detail-main-img" src="${p.image}" alt="${p.name}">
                </div>
            </div>
            <div class="detail-info">
                <span class="product-cat" style="font-size: 1rem;">${p.category}</span>
                <h1 class="detail-title">${p.name}</h1>
                <div class="detail-price">R$ ${p.price.toFixed(2).replace('.', ',')}</div>
                
                <div style="border-top: 1px solid var(--border); padding-top: 1.5rem;">
                    <h4 style="margin-bottom: 0.5rem;">Selecione o Tamanho</h4>
                    <div style="display: flex; gap: 0.5rem;" id="detail-sizes">
                        ${p.sizes.map((s, i) => `
                            <button class="size-btn ${i === 0 ? 'active' : ''}" onclick="app.setDetailSize(this, '${s}')">${s}</button>
                        `).join('')}
                    </div>
                </div>

                <div style="padding-top: 1rem;">
                    <h4 style="margin-bottom: 0.5rem;">Selecione a Cor</h4>
                    <div class="color-dots" id="detail-colors">
                        ${p.colors.map((c, i) => `
                            <div class="color-dot ${i === 0 ? 'active' : ''}" style="background-color: ${c};" onclick="app.setDetailColor(this, '${c}', '${p.colorsNames[i]}')" title="${p.colorsNames[i]}"></div>
                        `).join('')}
                    </div>
                    <div id="selected-color-name" style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 0.25rem;">Cor: ${p.colorsNames[0] || ''}</div>
                </div>

                <p class="detail-description">${p.description}</p>

                <div style="display: flex; gap: 1.5rem; margin-top: 1rem; align-items: center;">
                    <div style="display: flex; align-items: center; border: 1px solid var(--border); border-radius: 12px; overflow: hidden; background-color: var(--bg-surface);">
                        <button class="btn-icon" style="background: none; border-radius: 0;" onclick="app.adjustDetailQty(-1)"><i data-lucide="minus"></i></button>
                        <span id="detail-qty" style="padding: 0 1.5rem; font-weight: 700; font-size: 1.1rem;">1</span>
                        <button class="btn-icon" style="background: none; border-radius: 0;" onclick="app.adjustDetailQty(1)"><i data-lucide="plus"></i></button>
                    </div>
                    <button class="btn-primary" style="flex-grow: 1; justify-content: center; height: 50px;" onclick="app.addToCart()">
                        Adicionar à Sacola <i data-lucide="shopping-bag"></i>
                    </button>
                </div>

                <div style="border-top: 1px solid var(--border); padding-top: 1.5rem; color: var(--text-secondary); font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem;">
                    <div><i data-lucide="truck" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem; color: var(--primary);"></i> Frete grátis para todo o Brasil.</div>
                    <div><i data-lucide="rotate-ccw" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i> Primeira troca gratuita em até 7 dias.</div>
                </div>
            </div>
            ${recsHtml}
        `;

        // Save selected size/color options
        this.detailSelectedSize = p.sizes[0] || "M";
        this.detailSelectedColor = p.colors[0] || "#000000";
        this.detailSelectedColorName = p.colorsNames[0] || "Preto";
        this.detailQty = 1;

        lucide.createIcons();
    },

    handleZoom(e) {
        const container = e.currentTarget;
        const img = container.querySelector('img');
        const rect = container.getBoundingClientRect();
        
        // Calculate mouse position relative to container in percentage
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        
        img.style.transformOrigin = `${x}% ${y}%`;
        img.style.transform = "scale(1.8)";
    },

    resetZoom() {
        const img = document.getElementById('detail-main-img');
        if (img) {
            img.style.transform = "scale(1)";
        }
    },

    setDetailSize(btn, size) {
        document.querySelectorAll('#detail-sizes .size-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.detailSelectedSize = size;
    },

    setDetailColor(dot, color, colorName) {
        document.querySelectorAll('#detail-colors .color-dot').forEach(d => d.classList.remove('active'));
        dot.classList.add('active');
        this.detailSelectedColor = color;
        this.detailSelectedColorName = colorName;
        document.getElementById('selected-color-name').textContent = `Cor: ${colorName}`;
    },

    adjustDetailQty(amount) {
        let newQty = this.detailQty + amount;
        if (newQty < 1) newQty = 1;
        this.detailQty = newQty;
        document.getElementById('detail-qty').textContent = newQty;
    },

    // Cart Logic
    async addToCart() {
        const p = store.products.find(item => item.id === store.selectedProductId);
        if (!p) return;

        // Check if item with same size/color is already in cart
        const existingIdx = store.cart.findIndex(item => 
            item.productId === p.id && 
            item.size === this.detailSelectedSize && 
            item.color === this.detailSelectedColor
        );

        if (existingIdx > -1) {
            store.cart[existingIdx].quantity += this.detailQty;
        } else {
            store.cart.push({
                productId: p.id,
                name: p.name,
                image: p.image,
                price: p.price,
                size: this.detailSelectedSize,
                color: this.detailSelectedColor,
                colorName: this.detailSelectedColorName,
                quantity: this.detailQty
            });
        }

        await store.saveCart();
        this.updateCartBadge();
        
        alert('Produto adicionado à sacola!');
        this.navigate('checkout');
    },

    async removeFromCart(idx) {
        store.cart.splice(idx, 1);
        await store.saveCart();
        this.updateCartBadge();
        this.renderCheckout();
    },

    async updateCartQty(idx, amount) {
        store.cart[idx].quantity += amount;
        if (store.cart[idx].quantity < 1) {
            this.removeFromCart(idx);
            return;
        }
        await store.saveCart();
        this.updateCartBadge();
        this.renderCheckout();
    },

    updateCartBadge() {
        const count = store.cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-badge').textContent = count;
        const bottomBadge = document.getElementById('bottom-cart-badge');
        if (bottomBadge) {
            bottomBadge.textContent = count;
        }
    },

    // Checkout Logic
    setPaymentMethod(method) {
        store.paymentMethod = method;
        
        // Update UI states
        document.querySelectorAll('.payment-method-card').forEach(card => card.classList.remove('active'));
        document.getElementById(`pay-method-${method === 'PIX' ? 'pix' : method === 'CreditCard' ? 'card' : 'boleto'}`).classList.add('active');

        // Toggle details panel
        document.getElementById('payment-panel-pix').style.display = method === 'PIX' ? 'block' : 'none';
        document.getElementById('payment-panel-card').style.display = method === 'CreditCard' ? 'grid' : 'none';
        document.getElementById('payment-panel-boleto').style.display = method === 'Boleto' ? 'block' : 'none';
        
        this.updateCheckoutTotals();
        lucide.createIcons();
    },

    // Loyalty point system calculations
    calculateClientPoints(phone) {
        if (!phone) return 0;
        const formattedPhone = phone.trim().replace(/\D/g, '');
        if (!formattedPhone) return 0;
        
        let earned = 0;
        let redeemed = 0;

        store.orders.forEach(o => {
            const orderPhone = o.customer.phone.trim().replace(/\D/g, '');
            if (orderPhone === formattedPhone) {
                // Earn 10% value in points on paid/shipped orders
                if (o.status === 'Pago' || o.status === 'Enviado') {
                    earned += Math.floor(o.total * 0.1);
                }
                // Check if they redeemed points in this order
                if (o.redeemedPoints) {
                    redeemed += o.redeemedPoints;
                }
            }
        });

        return Math.max(0, earned - redeemed);
    },

    applyLoyaltyDiscount() {
        const phone = document.getElementById('checkout-phone').value.trim();
        if (!phone) {
            alert('Por favor, informe seu telefone na seção Seus Dados primeiro.');
            return;
        }

        const availablePoints = this.calculateClientPoints(phone);
        if (availablePoints <= 0) {
            alert('Você ainda não possui pontos de fidelidade disponíveis.');
            return;
        }

        const subtotal = store.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        // Can only redeem up to 50% of subtotal
        const maxRedeemable = Math.floor(subtotal * 0.5);
        const pointsToRedeem = Math.min(availablePoints, maxRedeemable);

        if (store.redeemedPoints > 0) {
            // Cancel discount
            store.redeemedPoints = 0;
            document.getElementById('btn-apply-loyalty').textContent = "Resgatar Pontos";
            document.getElementById('loyalty-discount-row').style.display = 'none';
        } else {
            // Apply discount
            store.redeemedPoints = pointsToRedeem;
            document.getElementById('btn-apply-loyalty').textContent = "Remover Desconto";
            document.getElementById('loyalty-discount-row').style.display = 'flex';
            document.getElementById('summary-loyalty-discount').textContent = `- R$ ${pointsToRedeem.toFixed(2).replace('.', ',')}`;
        }

        this.updateCheckoutTotals();
    },

    renderCheckout() {
        const container = document.getElementById('checkout-cart-items');
        if (!container) return;

        if (store.cart.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem 0; color: var(--text-secondary);">
                    <i data-lucide="shopping-bag" style="width: 32px; height: 32px; margin-bottom: 0.5rem;"></i>
                    <p>Sua sacola está vazia.</p>
                </div>
            `;
            document.getElementById('checkout-loyalty-redeem').style.display = 'none';
            this.updateCheckoutTotals();
            return;
        }

        container.innerHTML = store.cart.map((item, idx) => `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}">
                <div class="cart-item-details">
                    <h4 style="font-size: 0.95rem; margin-bottom: 0.25rem;">${item.name}</h4>
                    <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.5rem;">
                        Tamanho: ${item.size} | Cor: ${item.colorName}
                    </div>
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="display: flex; align-items: center; border: 1px solid var(--border); border-radius: 6px; overflow: hidden; background-color: var(--bg-main);">
                            <button class="btn-icon" style="padding: 0.25rem; background: none; border-radius: 0;" onclick="app.updateCartQty(${idx}, -1)"><i data-lucide="minus" style="width:12px; height:12px;"></i></button>
                            <span style="padding: 0 0.75rem; font-weight: 600; font-size: 0.9rem;">${item.quantity}</span>
                            <button class="btn-icon" style="padding: 0.25rem; background: none; border-radius: 0;" onclick="app.updateCartQty(${idx}, 1)"><i data-lucide="plus" style="width:12px; height:12px;"></i></button>
                        </div>
                        <span style="font-weight: 700; font-size: 1rem;">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</span>
                    </div>
                </div>
                <button class="btn-icon" style="align-self: flex-start; background: none;" onclick="app.removeFromCart(${idx})">
                    <i data-lucide="trash-2" style="width:16px; height:16px;"></i>
                </button>
            </div>
        `).join('');

        // Sincroniza e mostra a área de pontos se houver telefone digitado
        const phoneInput = document.getElementById('checkout-phone');
        if (phoneInput) {
            phoneInput.oninput = () => {
                const phone = phoneInput.value.trim();
                const points = this.calculateClientPoints(phone);
                if (phone.length >= 8) {
                    document.getElementById('checkout-loyalty-redeem').style.display = 'block';
                    document.getElementById('checkout-loyalty-points-label').textContent = `Você possui ${points} pontos de fidelidade`;
                } else {
                    document.getElementById('checkout-loyalty-redeem').style.display = 'none';
                }
            };
        }

        this.updateCheckoutTotals();
        lucide.createIcons();
    },

    updateCheckoutTotals() {
        const subtotal = store.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const pixDiscount = store.paymentMethod === 'PIX' ? subtotal * 0.05 : 0;
        const loyaltyDiscount = store.redeemedPoints || 0;
        const total = Math.max(0, subtotal - pixDiscount - loyaltyDiscount);

        document.getElementById('summary-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        
        const discountRow = document.getElementById('pix-discount-row');
        if (store.paymentMethod === 'PIX') {
            discountRow.style.display = 'flex';
            document.getElementById('summary-discount').textContent = `- R$ ${pixDiscount.toFixed(2).replace('.', ',')}`;
        } else {
            discountRow.style.display = 'none';
        }

        document.getElementById('summary-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    },

    async submitOrder() {
        if (store.cart.length === 0) {
            alert('Adicione produtos à sua sacola antes de finalizar!');
            return;
        }

        // Validate personal data
        const name = document.getElementById('checkout-name').value.trim();
        const email = document.getElementById('checkout-email').value.trim();
        const phone = document.getElementById('checkout-phone').value.trim();
        const address = document.getElementById('checkout-address').value.trim();

        if (!name || !email || !phone || !address) {
            alert('Por favor, preencha todos os campos dos Seus Dados para entrega!');
            return;
        }

        // Validate Card if selected
        if (store.paymentMethod === 'CreditCard') {
            const num = document.getElementById('card-number').value.trim();
            const cName = document.getElementById('card-name').value.trim();
            const exp = document.getElementById('card-expiry').value.trim();
            const cvv = document.getElementById('card-cvv').value.trim();

            if (!num || !cName || !exp || !cvv) {
                alert('Preencha os dados do cartão de crédito!');
                return;
            }
        }

        // Create Order object
        const subtotal = store.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const pixDiscount = store.paymentMethod === 'PIX' ? subtotal * 0.05 : 0;
        const loyaltyDiscount = store.redeemedPoints || 0;
        const total = Math.max(0, subtotal - pixDiscount - loyaltyDiscount);

        const newOrder = {
            id: `PED-${Math.floor(100000 + Math.random() * 900000)}`,
            date: new Date().toLocaleDateString('pt-BR'),
            customer: { name, email, phone, address },
            items: [...store.cart],
            paymentMethod: store.paymentMethod,
            redeemedPoints: store.redeemedPoints,
            total: total,
            status: 'Pendente'
        };

        // Add order to server database
        await store.addOrder(newOrder);

        // Reduce stock in products list
        store.cart.forEach(cartItem => {
            const prodIndex = store.products.findIndex(p => p.id === cartItem.productId);
            if (prodIndex > -1) {
                store.products[prodIndex].stock = Math.max(0, store.products[prodIndex].stock - cartItem.quantity);
            }
        });
        await store.saveProducts();

        // Empty Cart on server
        store.cart = [];
        await store.saveCart();
        this.updateCartBadge();

        // Save phone to localStorage to quickly show loyalty card on Home
        localStorage.setItem('vallora_loyalty_phone', phone);
        
        // Reset discount points
        store.redeemedPoints = 0;

        // Trigger Success Payment / Instructions Modal
        this.openOrderModal(newOrder);
    },

    openOrderModal(order) {
        const overlay = document.getElementById('order-modal');
        const content = document.getElementById('order-modal-content');
        
        let paymentInstructions = '';
        if (order.paymentMethod === 'PIX') {
            paymentInstructions = `
                <div style="background-color: white; padding: 1rem; border-radius: 16px; margin: 0.5rem 0;">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=VALLORA-${order.id}-${order.total.toFixed(2)}" alt="PIX QR Code" style="display: block; width: 150px; height: 150px;">
                </div>
                <div style="width: 100%;">
                    <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.25rem;">Chave Copia e Cola:</p>
                    <div style="background-color: var(--bg-main); border: 1px solid var(--border); padding: 0.75rem; border-radius: 8px; font-family: monospace; font-size: 0.8rem; word-break: break-all; margin-bottom: 0.75rem;">
                        00020101021226830014br.gov.bcb.pix2561pix.vallora.com.br/qr/${order.id}5204000053039865405${order.total.toFixed(2)}5802BR5907Vallora6009SaoPaulo62070503***6304
                    </div>
                    <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="navigator.clipboard.writeText('00020101021226830014br.gov.bcb.pix2561pix.vallora.com.br/qr/${order.id}5204000053039865405${order.total.toFixed(2)}5802BR5907Vallora6009SaoPaulo62070503***6304'); alert('Código PIX copiado!');">Copiar Código PIX</button>
                </div>
            `;
        } else if (order.paymentMethod === 'Boleto') {
            paymentInstructions = `
                <div style="width: 100%; text-align: left; margin: 0.5rem 0;">
                    <p style="font-weight: 600; margin-bottom: 0.5rem; font-size: 0.9rem;">Código de Barras:</p>
                    <div style="background-color: var(--bg-main); border: 1px solid var(--border); padding: 0.75rem; border-radius: 8px; font-family: monospace; font-size: 0.8rem; word-break: break-all; margin-bottom: 0.75rem; text-align: center; letter-spacing: 1px;">
                        34191.79001 01043.513184 91020.150008 7 968700000${Math.floor(order.total)}
                    </div>
                    <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="navigator.clipboard.writeText('34191.79001 01043.513184 91020.150008 7 968700000${Math.floor(order.total)}'); alert('Linha digitável copiada!');">Copiar Código de Barras</button>
                </div>
            `;
        } else {
            paymentInstructions = `
                <div style="color: var(--secondary); display: flex; flex-direction: column; align-items: center; gap: 0.25rem; margin: 0.5rem 0;">
                    <i data-lucide="check-circle-2" style="width: 32px; height: 32px;"></i>
                    <p style="font-weight: 700;">Cartão de Crédito Aprovado!</p>
                </div>
            `;
        }

        // WhatsApp redirect string
        const textMsg = encodeURIComponent(`Obrigada por comprar na Vallora! 💕 Seu pedido ${order.id} foi recebido e será confirmado em breve pela nossa equipe. Valor total: R$ ${order.total.toFixed(2).replace('.', ',')}.`);
        const waLink = `https://api.whatsapp.com/send?phone=5551987654321&text=${textMsg}`; // Example merchant phone

        content.innerHTML = `
            <div style="color: var(--primary); background-color: rgba(153, 134, 117, 0.1); border-radius: 50%; width: 56px; height: 56px; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="shopping-bag" style="width: 28px; height: 28px;"></i>
            </div>
            <h2 style="font-size: 1.5rem; margin-bottom: 0.5rem;">Pedido Recebido!</h2>
            <div style="background-color: rgba(153, 134, 117, 0.08); border: 1px solid var(--border); border-radius: 12px; padding: 1rem; width: 100%; text-align: center; margin-bottom: 0.5rem;">
                <p style="color: var(--text-primary); font-weight: 600; font-size: 0.95rem; margin-bottom: 0.25rem;">
                    Obrigada por comprar na Vallora! 💕
                </p>
                <p style="color: var(--text-secondary); font-size: 0.85rem; line-height: 1.4;">
                    Seu pedido foi recebido e será confirmado em breve pela nossa equipe.
                </p>
            </div>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 0.5rem;">ID do Pedido: <strong style="color: var(--text-primary);">${order.id}</strong></p>
            
            ${paymentInstructions}

            <a href="${waLink}" target="_blank" class="btn-primary" style="margin-top: 1rem; width: 100%; justify-content: center; background-color: #25d366; border-color: #25d366;">
                <i data-lucide="message-circle"></i> Enviar Confirmação via WhatsApp
            </a>

            <button class="btn-secondary" style="margin-top: 0.5rem; width: 100%; justify-content: center;" onclick="app.closeOrderModal(); app.navigate('home');">Voltar para a Home</button>
        `;

        overlay.classList.add('open');
        lucide.createIcons();
    },

    closeOrderModal() {
        document.getElementById('order-modal').classList.remove('open');
    },

    // Lookup purchase history from phone
    lookupPurchaseHistory(shouldFocus = true) {
        const phone = document.getElementById('history-phone-input').value.trim();
        if (!phone) {
            alert('Digite um número de telefone para realizar a busca.');
            return;
        }

        const formattedPhone = phone.replace(/\D/g, '');
        if (formattedPhone.length < 8) {
            alert('Por favor, informe um número de telefone válido.');
            return;
        }

        // Save phone to quickly load points
        localStorage.setItem('vallora_loyalty_phone', phone);

        const clientOrders = store.orders.filter(o => o.customer.phone.replace(/\D/g, '') === formattedPhone);
        const points = this.calculateClientPoints(phone);

        // Update home loyalty card
        const cardEl = document.getElementById('loyalty-card-el');
        cardEl.style.display = 'flex';
        document.getElementById('loyalty-points-val').textContent = points;
        
        // Progress bar (cap at 500 points reward tier)
        const progressPercent = Math.min(100, (points / 500) * 100);
        document.getElementById('loyalty-progress-bar-el').style.style = `width: ${progressPercent}%;`;
        document.getElementById('loyalty-progress-bar-el').style.width = `${progressPercent}%`;
        document.getElementById('loyalty-progress-text').textContent = points >= 500 
            ? "Você atingiu o nível máximo de fidelidade! Resgate descontos na sacola." 
            : `${points}/500 pontos acumulados para o próximo prêmio.`;

        // Render History Items
        const resultsArea = document.getElementById('history-results-area');
        resultsArea.style.display = 'block';
        
        if (clientOrders.length === 0) {
            resultsArea.innerHTML = `
                <div style="text-align: center; padding: 1.5rem 0; color: var(--text-secondary); font-size: 0.9rem;">
                    Nenhum pedido encontrado para o telefone informado.
                </div>
            `;
        } else {
            resultsArea.innerHTML = `
                <h4 style="margin-bottom: 0.75rem; font-size: 0.95rem;">Histórico de Compras (${clientOrders.length})</h4>
                <div style="max-height: 300px; overflow-y: auto; padding-right: 0.25rem;">
                    ${clientOrders.map(o => `
                        <div class="history-item">
                            <div class="history-item-header">
                                <span>ID: ${o.id}</span>
                                <span class="status-badge ${o.status === 'Pendente' ? 'pending' : o.status === 'Pago' ? 'paid' : 'shipped'}">${o.status}</span>
                            </div>
                            <div class="history-item-body">
                                <div><strong>Data:</strong> ${o.date}</div>
                                <div><strong>Total:</strong> R$ ${o.total.toFixed(2).replace('.', ',')}</div>
                                <div style="margin-top: 0.25rem; font-size: 0.8rem; color: var(--text-secondary);">
                                    ${o.items.map(item => `${item.name} (${item.size}/${item.quantity}x)`).join(', ')}
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        if (shouldFocus) {
            resultsArea.scrollIntoView({ behavior: 'smooth' });
        }
        lucide.createIcons();
    },

    // Promotions Notifications Panel
    toggleNotificationsPanel() {
        const panel = document.getElementById('notifications-panel-el');
        if (panel) {
            panel.classList.toggle('active');
            
            // Hide badge once opened
            const badge = document.getElementById('notification-badge-el');
            if (badge) badge.style.display = 'none';
        }
    },

    renderNotifications() {
        const listContainer = document.getElementById('notifications-list');
        const badge = document.getElementById('notification-badge-el');
        if (!listContainer) return;

        if (store.notifications.length === 0) {
            listContainer.innerHTML = `
                <div style="text-align: center; padding: 1.5rem 0; color: var(--text-secondary); font-size: 0.85rem;">
                    Nenhuma notificação no momento.
                </div>
            `;
            if (badge) badge.style.display = 'none';
            return;
        }

        listContainer.innerHTML = store.notifications.map(n => `
            <div class="notification-item">
                <div class="notification-title">${n.title}</div>
                <div class="notification-message">${n.message}</div>
                <div class="notification-date">${n.date}</div>
            </div>
        `).join('');

        // Show active badge if notifications panel is closed
        const panel = document.getElementById('notifications-panel-el');
        if (panel && !panel.classList.contains('active') && badge) {
            badge.style.display = 'block';
        }
    },

    async sendPromoNotification(e) {
        e.preventDefault();
        const title = document.getElementById('promo-title').value.trim();
        const message = document.getElementById('promo-message').value.trim();

        if (!title || !message) return;

        const newNote = {
            title,
            message
        };

        await store.addNotification(newNote);
        await store.syncNotifications();
        this.renderNotifications();

        document.getElementById('admin-promo-form').reset();
        alert('Promoção enviada para todos os clientes!');
    },

    // CMS / Admin View Logic
    setAdminTab(tab) {
        store.activeAdminTab = tab;
        
        // Update menu active tabs
        document.querySelectorAll('.admin-menu-item').forEach(item => item.classList.remove('active'));
        const menuTab = document.getElementById(`admin-menu-${tab}`);
        if (menuTab) menuTab.classList.add('active');

        // Toggle panels
        document.getElementById('admin-tab-dash').style.display = tab === 'dash' ? 'block' : 'none';
        document.getElementById('admin-tab-inventory').style.display = tab === 'inventory' ? 'block' : 'none';
        document.getElementById('admin-tab-orders').style.display = tab === 'orders' ? 'block' : 'none';
        document.getElementById('admin-tab-promos').style.display = tab === 'promos' ? 'block' : 'none';

        this.renderAdmin();
    },

    renderAdmin() {
        const loginWall = document.getElementById('admin-login-wall');
        const mainArea = document.getElementById('admin-main-area');

        if (!store.isAdminAuthenticated) {
            loginWall.style.display = 'block';
            mainArea.style.display = 'none';
            return;
        }

        loginWall.style.display = 'none';
        mainArea.style.display = 'grid';

        if (store.activeAdminTab === 'dash') {
            this.renderAdminDashboard();
        } else if (store.activeAdminTab === 'inventory') {
            this.renderAdminInventory();
        } else if (store.activeAdminTab === 'orders') {
            this.renderAdminOrders();
        }
    },

    handleAdminLogin(e) {
        e.preventDefault();
        const user = document.getElementById('admin-user').value.trim();
        const pass = document.getElementById('admin-pass').value.trim();

        if (user === 'admin' && pass === 'admin') {
            store.isAdminAuthenticated = true;
            sessionStorage.setItem('sw_admin_auth', 'true');
            this.renderAdmin();
        } else {
            alert('Usuário ou senha inválidos! Use admin/admin');
        }
    },

    handleAdminLogout() {
        if (confirm('Deseja realmente sair do painel administrativo?')) {
            store.isAdminAuthenticated = false;
            sessionStorage.removeItem('sw_admin_auth');
            this.navigate('home');
        }
    },

    renderAdminDashboard() {
        // Stats calculations
        const totalRevenue = store.orders
            .filter(o => o.status === 'Pago' || o.status === 'Enviado')
            .reduce((sum, o) => sum + o.total, 0);

        const paidCount = store.orders.filter(o => o.status === 'Pago' || o.status === 'Enviado').length;
        const pendingCount = store.orders.filter(o => o.status === 'Pendente').length;
        const productsCount = store.products.length;

        document.getElementById('dash-revenue').textContent = `R$ ${totalRevenue.toFixed(2).replace('.', ',')}`;
        document.getElementById('dash-orders-count').textContent = paidCount;
        document.getElementById('dash-orders-pending').textContent = pendingCount;
        document.getElementById('dash-products-count').textContent = productsCount;

        // Render recent orders (up to 5)
        const recentOrdersEl = document.getElementById('dash-recent-orders-list');
        if (!recentOrdersEl) return;

        const sliceOrders = store.orders.slice(0, 5);
        if (sliceOrders.length === 0) {
            recentOrdersEl.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-secondary);">Nenhuma venda registrada ainda.</td></tr>`;
            return;
        }

        recentOrdersEl.innerHTML = sliceOrders.map(o => `
            <tr>
                <td style="font-weight: 700;">${o.id}</td>
                <td>${o.customer.name}</td>
                <td>R$ ${o.total.toFixed(2).replace('.', ',')}</td>
                <td>${o.paymentMethod}</td>
                <td>
                    <span class="status-badge ${o.status === 'Pendente' ? 'pending' : o.status === 'Pago' ? 'paid' : 'shipped'}">
                        ${o.status}
                    </span>
                </td>
            </tr>
        `).join('');
    },

    renderAdminInventory() {
        const inventoryEl = document.getElementById('admin-inventory-list');
        if (!inventoryEl) return;

        inventoryEl.innerHTML = store.products.map(p => `
            <tr>
                <td><img src="${p.image}" alt="${p.name}" style="width: 48px; height: 48px; object-fit: cover; border-radius: 8px;"></td>
                <td style="font-weight: 600;">${p.name}</td>
                <td>${p.category}</td>
                <td>R$ ${p.price.toFixed(2).replace('.', ',')}</td>
                <td>
                    <span style="font-weight: 700; color: ${p.stock <= 5 ? 'var(--primary)' : 'inherit'}">
                        ${p.stock} un
                    </span>
                </td>
                <td>
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="btn-icon" style="padding: 0.4rem;" onclick="app.openProductModal(${p.id})" title="Editar"><i data-lucide="edit-3" style="width:16px; height:16px;"></i></button>
                        <button class="btn-icon" style="padding: 0.4rem; background-color: rgba(239, 68, 68, 0.1); color: #ef4444;" onclick="app.deleteProduct(${p.id})" title="Excluir"><i data-lucide="trash-2" style="width:16px; height:16px;"></i></button>
                    </div>
                </td>
            </tr>
        `).join('');
        lucide.createIcons();
    },

    renderAdminOrders() {
        const listEl = document.getElementById('admin-orders-list');
        if (!listEl) return;

        if (store.orders.length === 0) {
            listEl.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-secondary);">Nenhum pedido efetuado ainda.</td></tr>`;
            return;
        }

        listEl.innerHTML = store.orders.map(o => {
            const itemsSummary = o.items.map(item => `${item.name} (${item.size}/${item.quantity}x)`).join(', ');
            return `
                <tr>
                    <td style="font-weight: 700;">${o.id}</td>
                    <td>
                        <div><strong>${o.customer.name}</strong></div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${o.customer.phone}</div>
                    </td>
                    <td style="max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${itemsSummary}">${itemsSummary}</td>
                    <td>R$ ${o.total.toFixed(2).replace('.', ',')}</td>
                    <td>
                        <span class="status-badge ${o.status === 'Pendente' ? 'pending' : o.status === 'Pago' ? 'paid' : 'shipped'}">
                            ${o.status}
                        </span>
                    </td>
                    <td>
                        <select class="sort-select" style="padding: 0.25rem 0.5rem; font-size: 0.85rem;" onchange="app.updateOrderStatus('${o.id}', this.value)">
                            <option value="Pendente" ${o.status === 'Pendente' ? 'selected' : ''}>Pendente</option>
                            <option value="Pago" ${o.status === 'Pago' ? 'selected' : ''}>Pago</option>
                            <option value="Enviado" ${o.status === 'Enviado' ? 'selected' : ''}>Enviado</option>
                        </select>
                    </td>
                </tr>
            `;
        }).join('');
    },

    async updateOrderStatus(orderId, newStatus) {
        const idx = store.orders.findIndex(o => o.id === orderId);
        if (idx > -1) {
            store.orders[idx].status = newStatus;
            
            // Re-save entire list on server
            localStorage.setItem('sw_orders', JSON.stringify(store.orders));
            try {
                // Sincroniza via POST order endpoint se houver suporte, ou apenas salvando no store do server.
                // Como não temos um endpoint direto de patch para order simples, usamos o save db do node.
                // Para simplificar, reenviamos a lista atualizada
                await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(store.orders[idx]) // adds/updates order
                });
                // Recarrega todos os pedidos
                await store.syncOrders();
            } catch(e) {
                console.error(e);
            }

            this.renderAdmin();
        }
    },

    async deleteProduct(id) {
        if (!confirm('Deseja realmente remover este produto do catálogo?')) return;
        
        store.products = store.products.filter(p => p.id !== id);
        await store.saveProducts();
        
        this.renderAdmin();
        this.renderCategoryCounts();
    },

    openProductModal(id = null) {
        const modal = document.getElementById('product-modal');
        const form = document.getElementById('product-form');
        form.reset();
        this.localImageBase64 = "";

        if (id) {
            document.getElementById('modal-product-title').textContent = "Editar Vestuário";
            const p = store.products.find(item => item.id === id);
            if (p) {
                document.getElementById('edit-product-id').value = p.id;
                document.getElementById('prod-name').value = p.name;
                document.getElementById('prod-desc').value = p.description;
                document.getElementById('prod-price').value = p.price;
                document.getElementById('prod-stock').value = p.stock;
                document.getElementById('prod-category').value = p.category;
                document.getElementById('prod-image').value = p.image;

                // Set size checkboxes
                form.querySelectorAll('input[name="prod-sizes"]').forEach(cb => {
                    cb.checked = p.sizes.includes(cb.value);
                });

                // Set colors checkboxes
                form.querySelectorAll('input[name="prod-colors"]').forEach(cb => {
                    cb.checked = p.colors.includes(cb.value);
                });
            }
        } else {
            document.getElementById('modal-product-title').textContent = "Cadastrar Produto";
            document.getElementById('edit-product-id').value = "";
        }

        modal.classList.add('open');
    },

    closeProductModal() {
        document.getElementById('product-modal').classList.remove('open');
    },

    async saveProduct(e) {
        e.preventDefault();
        
        const id = document.getElementById('edit-product-id').value;
        const name = document.getElementById('prod-name').value.trim();
        const desc = document.getElementById('prod-desc').value.trim();
        const price = parseFloat(document.getElementById('prod-price').value);
        const stock = parseInt(document.getElementById('prod-stock').value);
        const category = document.getElementById('prod-category').value;
        
        let image = document.getElementById('prod-image').value.trim();
        if (this.localImageBase64) {
            image = this.localImageBase64;
        }

        if (!image) {
            alert('Por favor, informe a URL da foto ou carregue um arquivo local!');
            return;
        }

        // Get sizes
        const sizes = Array.from(document.querySelectorAll('input[name="prod-sizes"]:checked')).map(cb => cb.value);
        // Get colors & color names map
        const colors = Array.from(document.querySelectorAll('input[name="prod-colors"]:checked')).map(cb => cb.value);
        
        const colorsNamesMap = {
            "#000000": "Preto",
            "#ffffff": "Branco",
            "#708090": "Chumbo",
            "#ff5a1f": "Laranja",
            "#FAF8F6": "Champagne",
            "#998675": "Bronze"
        };
        const colorsNames = colors.map(c => colorsNamesMap[c] || "Outro");

        if (sizes.length === 0) {
            alert('Selecione pelo menos um tamanho para a grade!');
            return;
        }
        if (colors.length === 0) {
            alert('Selecione pelo menos uma cor!');
            return;
        }

        if (id) {
            // Update
            const idx = store.products.findIndex(p => p.id === parseInt(id));
            if (idx > -1) {
                store.products[idx] = {
                    ...store.products[idx],
                    name,
                    description: desc,
                    price,
                    stock,
                    category,
                    image,
                    sizes,
                    colors,
                    colorsNames
                };
            }
        } else {
            // Create
            const newProd = {
                id: Math.max(...store.products.map(p => p.id), 0) + 1,
                name,
                description: desc,
                price,
                stock,
                category,
                image,
                sizes,
                colors,
                colorsNames
            };
            store.products.push(newProd);
        }

        await store.saveProducts();
        this.closeProductModal();
        this.renderAdmin();
        this.renderCategoryCounts();
        this.renderFeaturedProducts();
        this.renderRecommendedProducts();
        
        this.renderCatalogFilterColors();
    },

    handleLocalFileUpload(input) {
        const file = input.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            this.localImageBase64 = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    toggleMobileFilters() {
        const sidebar = document.getElementById('filters-sidebar-el');
        if (sidebar) {
            sidebar.classList.toggle('open');
        }
    }
};

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
