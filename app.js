// STREETWEAR LAB - Application Core Logic

// Initial Products Data
const INITIAL_PRODUCTS = [
    {
        id: 1,
        name: "Camiseta Heavyweight Oversized Black",
        description: "Camiseta de algodão premium 260g/m² com caimento oversized perfeito. Encolhimento zero, gola de 3cm e costuras reforçadas.",
        price: 129.90,
        category: "Camisetas",
        sizes: ["P", "M", "G", "GG"],
        colors: ["#000000", "#708090"],
        colorsNames: ["Preto", "Chumbo"],
        stock: 45,
        image: "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&q=80"
    },
    {
        id: 2,
        name: "Moletom Canguru Off-White 'STREETS'",
        description: "Moletom feito de algodão de alta gramatura com felpa interna super macia. Capuz ajustável com forro duplo e estampa minimalista em silk.",
        price: 249.90,
        category: "Moletons",
        sizes: ["M", "G", "GG"],
        colors: ["#ffffff", "#000000"],
        colorsNames: ["Branco", "Preto"],
        stock: 20,
        image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80"
    },
    {
        id: 3,
        name: "Shoulder Bag Impermeável Techwear",
        description: "Bolsa de ombro transversal com 3 bolsos organizadores. Zíper selado resistente à água e alça com regulador rápido de tamanho.",
        price: 89.90,
        category: "Acessórios",
        sizes: ["P"],
        colors: ["#000000", "#ff5a1f"],
        colorsNames: ["Preto", "Laranja"],
        stock: 35,
        image: "https://images.unsplash.com/photo-1576243345690-4e4b79b63288?w=800&q=80"
    },
    {
        id: 4,
        name: "Camiseta Cyberpunk Acid Wash",
        description: "Lavagem estonada ácida exclusiva em cinza escuro. Estampa frontal e traseira no estilo cyberpunk industrial com tintas de alta fixação.",
        price: 139.90,
        category: "Camisetas",
        sizes: ["P", "M", "G"],
        colors: ["#708090"],
        colorsNames: ["Chumbo"],
        stock: 12,
        image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=800&q=80"
    },
    {
        id: 5,
        name: "Moletom Acid Wash Cyber",
        description: "Moletom canguru com capuz e lavagem estonada premium. Estampas nas mangas e caimento despojado urbano de alto conforto.",
        price: 279.90,
        category: "Moletons",
        sizes: ["P", "M", "G", "GG"],
        colors: ["#708090", "#000000"],
        colorsNames: ["Chumbo", "Preto"],
        stock: 8,
        image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800&q=80"
    },
    {
        id: 6,
        name: "Boné Strapback Velvet Bordado",
        description: "Boné aba curva em veludo cotelê de alta durabilidade com ajuste strapback. Bordado frontal STREETWEARLAB em relevo.",
        price: 79.90,
        category: "Acessórios",
        sizes: ["P"],
        colors: ["#000000", "#ff5a1f"],
        colorsNames: ["Preto", "Laranja"],
        stock: 50,
        image: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&q=80"
    }
];

class AppStore {
    constructor() {
        this.products = JSON.parse(localStorage.getItem('sw_products')) || INITIAL_PRODUCTS;
        this.orders = JSON.parse(localStorage.getItem('sw_orders')) || [];
        this.cart = JSON.parse(localStorage.getItem('sw_cart')) || [];
        
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
        
        // Current view detail product ID
        this.selectedProductId = null;
        
        // Active Admin Tab
        this.activeAdminTab = "dash";
        this.isAdminAuthenticated = sessionStorage.getItem('sw_admin_auth') === 'true';
        
        // Save initial to localStorage if not exists
        if (!localStorage.getItem('sw_products')) {
            this.saveProductsToStorage();
        }
    }

    saveProductsToStorage() {
        localStorage.setItem('sw_products', JSON.stringify(this.products));
    }

    saveOrdersToStorage() {
        localStorage.setItem('sw_orders', JSON.stringify(this.orders));
    }

    saveCartToStorage() {
        localStorage.setItem('sw_cart', JSON.stringify(this.cart));
    }
}

// Instantiate Global State
const store = new AppStore();

// UI & Logic Controller
const app = {
    init() {
        this.navigate('home');
        this.updateCartBadge();
        this.renderCategoryCounts();
        this.renderFeaturedProducts();
        
        // Dynamic loading of colors into catalog filter
        this.renderCatalogFilterColors();
        this.renderCatalogFilterCategories();
        
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

        // View specific triggers
        if (view === 'catalog') {
            this.renderCatalog();
        } else if (view === 'admin') {
            this.renderAdmin();
        } else if (view === 'checkout') {
            this.renderCheckout();
        } else if (view === 'home') {
            this.renderFeaturedProducts();
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
        const categories = ["Camisetas", "Moletons", "Acessórios"];
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
        
        const categories = ["Todos", "Camisetas", "Moletons", "Acessórios"];
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
            // "recent" or default: sorted by reverse id
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
                    <div><i data-lucide="truck" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem; color: var(--secondary);"></i> Frete grátis para todo o Brasil.</div>
                    <div><i data-lucide="rotate-ccw" style="width: 16px; height: 16px; vertical-align: middle; margin-right: 0.5rem;"></i> Primeira troca gratuita em até 7 dias.</div>
                </div>
            </div>
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
    addToCart() {
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

        store.saveCartToStorage();
        this.updateCartBadge();
        
        // Show subtle notification and go to Checkout
        alert('Produto adicionado à sacola!');
        this.navigate('checkout');
    },

    removeFromCart(idx) {
        store.cart.splice(idx, 1);
        store.saveCartToStorage();
        this.updateCartBadge();
        this.renderCheckout();
    },

    updateCartQty(idx, amount) {
        store.cart[idx].quantity += amount;
        if (store.cart[idx].quantity < 1) {
            this.removeFromCart(idx);
            return;
        }
        store.saveCartToStorage();
        this.updateCartBadge();
        this.renderCheckout();
    },

    updateCartBadge() {
        const count = store.cart.reduce((total, item) => total + item.quantity, 0);
        document.getElementById('cart-badge').textContent = count;
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

        this.updateCheckoutTotals();
        lucide.createIcons();
    },

    updateCheckoutTotals() {
        const subtotal = store.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const discount = store.paymentMethod === 'PIX' ? subtotal * 0.05 : 0;
        const total = subtotal - discount;

        document.getElementById('summary-subtotal').textContent = `R$ ${subtotal.toFixed(2).replace('.', ',')}`;
        
        const discountRow = document.getElementById('pix-discount-row');
        if (store.paymentMethod === 'PIX') {
            discountRow.style.display = 'flex';
            document.getElementById('summary-discount').textContent = `- R$ ${discount.toFixed(2).replace('.', ',')}`;
        } else {
            discountRow.style.display = 'none';
        }

        document.getElementById('summary-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    },

    submitOrder() {
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
        const discount = store.paymentMethod === 'PIX' ? subtotal * 0.05 : 0;
        const total = subtotal - discount;

        const newOrder = {
            id: `PED-${Math.floor(100000 + Math.random() * 900000)}`,
            date: new Date().toLocaleDateString('pt-BR'),
            customer: { name, email, phone, address },
            items: [...store.cart],
            paymentMethod: store.paymentMethod,
            total: total,
            status: 'Pendente'
        };

        // Add order to local list
        store.orders.unshift(newOrder);
        store.saveOrdersToStorage();

        // Reduce stock in products list
        store.cart.forEach(cartItem => {
            const prodIndex = store.products.findIndex(p => p.id === cartItem.productId);
            if (prodIndex > -1) {
                store.products[prodIndex].stock = Math.max(0, store.products[prodIndex].stock - cartItem.quantity);
            }
        });
        store.saveProductsToStorage();

        // Empty Cart
        store.cart = [];
        store.saveCartToStorage();
        this.updateCartBadge();

        // Trigger Success Payment / Instructions Modal
        this.openOrderModal(newOrder);
    },

    openOrderModal(order) {
        const overlay = document.getElementById('order-modal');
        const content = document.getElementById('order-modal-content');
        
        let paymentInstructions = '';
        if (order.paymentMethod === 'PIX') {
            paymentInstructions = `
                <div style="background-color: white; padding: 1.5rem; border-radius: 16px; margin: 1rem 0;">
                    <!-- Simulating QR Code -->
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=STREETWEARLAB-${order.id}-${order.total.toFixed(2)}" alt="PIX QR Code" style="display: block;">
                </div>
                <div style="width: 100%;">
                    <p style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Chave Copia e Cola:</p>
                    <div style="background-color: var(--bg-main); border: 1px solid var(--border); padding: 0.75rem; border-radius: 8px; font-family: monospace; font-size: 0.85rem; word-break: break-all; margin-bottom: 1rem;">
                        00020101021226830014br.gov.bcb.pix2561pix.streetwearlab.com.br/qr/${order.id}5204000053039865405${order.total.toFixed(2)}5802BR5915StreetwearLab6009SaoPaulo62070503***6304
                    </div>
                    <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="navigator.clipboard.writeText('00020101021226830014br.gov.bcb.pix2561pix.streetwearlab.com.br/qr/${order.id}5204000053039865405${order.total.toFixed(2)}5802BR5915StreetwearLab6009SaoPaulo62070503***6304'); alert('Código PIX copiado!');">Copiar Código PIX</button>
                </div>
            `;
        } else if (order.paymentMethod === 'Boleto') {
            paymentInstructions = `
                <div style="width: 100%; text-align: left; margin: 1rem 0;">
                    <p style="font-weight: 600; margin-bottom: 0.5rem;">Código de Barras:</p>
                    <div style="background-color: var(--bg-main); border: 1px solid var(--border); padding: 0.75rem; border-radius: 8px; font-family: monospace; font-size: 0.85rem; word-break: break-all; margin-bottom: 1rem; text-align: center; letter-spacing: 1px;">
                        34191.79001 01043.513184 91020.150008 7 968700000${Math.floor(order.total)}
                    </div>
                    <button class="btn-primary" style="width: 100%; justify-content: center;" onclick="navigator.clipboard.writeText('34191.79001 01043.513184 91020.150008 7 968700000${Math.floor(order.total)}'); alert('Linha digitável copiada!');">Copiar Código de Barras</button>
                </div>
            `;
        } else {
            paymentInstructions = `
                <div style="color: var(--secondary); display: flex; flex-direction: column; align-items: center; gap: 0.5rem; margin: 1rem 0;">
                    <i data-lucide="check-circle-2" style="width: 48px; height: 48px;"></i>
                    <p style="font-weight: 700;">Cartão de Crédito Aprovado!</p>
                </div>
                <p style="color: var(--text-secondary); text-align: center;">Sua operadora de cartão de crédito confirmou a transação de forma imediata.</p>
            `;
        }

        content.innerHTML = `
            <div style="color: var(--secondary); background-color: rgba(16, 185, 129, 0.1); border-radius: 50%; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="shopping-bag" style="width: 32px; height: 32px;"></i>
            </div>
            <h2>Pedido Recebido!</h2>
            <p style="color: var(--text-secondary);">ID do Pedido: <strong style="color: var(--text-primary);">${order.id}</strong></p>
            
            ${paymentInstructions}

            <button class="btn-secondary" style="margin-top: 1.5rem; width: 100%; justify-content: center;" onclick="app.closeOrderModal(); app.navigate('home');">Voltar para a Home</button>
        `;

        overlay.classList.add('open');
        lucide.createIcons();
    },

    closeOrderModal() {
        document.getElementById('order-modal').classList.remove('open');
    },

    // CMS / Admin View Logic
    setAdminTab(tab) {
        store.activeAdminTab = tab;
        
        // Update menu active tabs
        document.querySelectorAll('.admin-menu-item').forEach(item => item.classList.remove('active'));
        document.getElementById(`admin-menu-${tab === 'dash' ? 'dash' : tab === 'inventory' ? 'inventory' : 'orders'}`).classList.add('active');

        // Toggle panels
        document.getElementById('admin-tab-dash').style.display = tab === 'dash' ? 'block' : 'none';
        document.getElementById('admin-tab-inventory').style.display = tab === 'inventory' ? 'block' : 'none';
        document.getElementById('admin-tab-orders').style.display = tab === 'orders' ? 'block' : 'none';

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
                        <div style="font-size: 0.8rem; color: var(--text-secondary);">${o.customer.email}</div>
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

    updateOrderStatus(orderId, newStatus) {
        const idx = store.orders.findIndex(o => o.id === orderId);
        if (idx > -1) {
            store.orders[idx].status = newStatus;
            store.saveOrdersToStorage();
            this.renderAdmin();
        }
    },

    deleteProduct(id) {
        if (!confirm('Deseja realmente remover este produto do catálogo?')) return;
        
        store.products = store.products.filter(p => p.id !== id);
        store.saveProductsToStorage();
        
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

    saveProduct(e) {
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
            "#ff5a1f": "Laranja"
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

        store.saveProductsToStorage();
        this.closeProductModal();
        this.renderAdmin();
        this.renderCategoryCounts();
        this.renderFeaturedProducts();
        
        // Refresh catalog sidebar filter if open
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
    }
};

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
