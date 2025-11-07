// ===== CONFIGURAÇÃO DO BACKEND REAL =====
const BACKEND_URL = "https://techparts-pro-v2.onrender.com";

// ===== TECHPARTS PRO - SISTEMA COMPLETO PARA GITHUB PAGES =====
class TechPartsPro {
    constructor() {
        this.products = [
            {
                "id": 1,
                "name": "Intel Core i9-14900K",
                "price": 3299.99,
                "category": "processadores",
                "image": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80",
                "description": "24 núcleos, 32 threads, até 6.0GHz - O melhor para gaming e produtividade",
                "specs": ["24 Núcleos", "32 Threads", "Até 6.0GHz", "Cache 36MB"],
                "stock": 15,
                "rating": 4.9
            },
            {
                "id": 2,
                "name": "AMD Ryzen 9 7950X",
                "price": 2899.99,
                "category": "processadores",
                "image": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400&q=80",
                "description": "16 núcleos, 32 threads, 5.7GHz - Performance excepcional",
                "specs": ["16 Núcleos", "32 Threads", "Até 5.7GHz", "Cache 80MB"],
                "stock": 12,
                "rating": 4.8
            },
            {
                "id": 3,
                "name": "NVIDIA RTX 4090",
                "price": 8999.99,
                "category": "placas-video",
                "image": "https://images.unsplash.com/photo-1591488320449-011701bb6704?w=400&q=80",
                "description": "24GB GDDR6X, DLSS 3, Ray Tracing - A mais poderosa do mundo",
                "specs": ["24GB GDDR6X", "DLSS 3", "Ray Tracing", "4K Ultra"],
                "stock": 8,
                "rating": 4.9
            },
            {
                "id": 4,
                "name": "Corsair Vengeance RGB 32GB",
                "price": 899.99,
                "category": "memorias",
                "image": "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&q=80",
                "description": "32GB DDR5 5600MHz - RGB Sync - Latência ultra-baixa",
                "specs": ["32GB DDR5", "5600MHz", "RGB Sync", "Latência CL36"],
                "stock": 25,
                "rating": 4.7
            },
            {
                "id": 5,
                "name": "Intel Core i7-14700K",
                "price": 2499.99,
                "category": "processadores",
                "image": "https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=400&q=80",
                "description": "20 núcleos, 28 threads - Excelente custo-benefício",
                "specs": ["20 Núcleos", "28 Threads", "Até 5.6GHz", "Cache 33MB"],
                "stock": 18,
                "rating": 4.7
            },
            {
                "id": 6,
                "name": "AMD Ryzen 7 7800X3D",
                "price": 2199.99,
                "category": "processadores",
                "image": "https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=400&q=80",
                "description": "8 núcleos com tecnologia 3D V-Cache - Ideal para gaming",
                "specs": ["8 Núcleos", "16 Threads", "Tecnologia 3D V-Cache", "Cache 104MB"],
                "stock": 10,
                "rating": 4.8
            }
        ];
        this.cart = JSON.parse(localStorage.getItem('techparts_cart')) || [];
        this.currentCategory = 'all';
        this.init();
    }

    init() {
        console.log('🚀 TechParts Pro - Sistema inicializado');
        this.setupLoadingScreen();
        this.setupEventListeners();
        this.setupScrollEffects();
        this.setupModals();
        this.renderProducts();
        this.updateCartUI();
        setTimeout(() => {
            this.setupAnimations();
        }, 100);
    }

    // ===== LOADING SCREEN =====
    setupLoadingScreen() {
        const loadingScreen = document.getElementById('loading');
        if (!loadingScreen) return;
        
        setTimeout(() => {
            loadingScreen.classList.add('loaded');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1200);
    }

    // ===== SISTEMA DE PRODUTOS =====
    renderProducts(category = 'all') {
        const grid = document.getElementById('products-grid');
        if (!grid) return;

        let filteredProducts = this.products;
        if (category !== 'all') {
            filteredProducts = this.products.filter(product => product.category === category);
        }

        if (filteredProducts.length === 0) {
            grid.innerHTML = `
                <div class="empty-products">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum produto encontrado</h3>
                    <p>Tente outra categoria ou volte mais tarde</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = filteredProducts.map(product => `
            <div class="product-card">
                <div class="product-badge">
                    <i class="fas fa-star"></i>
                    ${product.rating}
                </div>
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy">
                    <div class="product-overlay">
                        <button class="btn-quick-view" onclick="app.quickView(${product.id})">
                            <i class="fas fa-eye"></i>
                        </button>
                    </div>
                </div>
                <div class="product-content">
                    <div class="product-category">${this.formatCategory(product.category)}</div>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description}</p>
                    <div class="product-specs">
                        ${product.specs.slice(0, 2).map(spec => `
                            <span class="product-spec">${spec}</span>
                        `).join('')}
                    </div>
                    <div class="product-footer">
                        <div class="product-price">
                            <span class="price-currency">R$</span>
                            <span class="price-value">${product.price.toFixed(2)}</span>
                        </div>
                        <button class="btn-add-cart" onclick="app.addToCart(${product.id})">
                            <i class="fas fa-shopping-cart"></i>
                            Adicionar
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    formatCategory(category) {
        const categories = {
            'processadores': 'Processadores',
            'placas-video': 'Placas de Vídeo',
            'memorias': 'Memórias RAM'
        };
        return categories[category] || category;
    }

    // ===== SISTEMA DE CARRINHO =====
    addToCart(productId) {
        const product = this.products.find(p => p.id === productId);
        if (!product) return;

        const existingItem = this.cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            this.cart.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart();
        this.showNotification('✅ Produto adicionado ao carrinho!', 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.showNotification('🗑️ Item removido do carrinho', 'success');
    }

    saveCart() {
        localStorage.setItem('techparts_cart', JSON.stringify(this.cart));
        this.updateCartUI();
    }

    updateCartUI() {
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        const cartItems = document.getElementById('cart-items');

        // Atualizar contador
        if (cartCount) {
            cartCount.textContent = this.cart.reduce((total, item) => total + item.quantity, 0);
        }

        // Atualizar total
        if (cartTotal) {
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            cartTotal.textContent = `R$ ${total.toFixed(2)}`;
        }

        // Atualizar itens
        if (cartItems) {
            if (this.cart.length > 0) {
                cartItems.innerHTML = this.cart.map(item => `
                    <div class="cart-item" data-product-id="${item.id}">
                        <div class="cart-item-content">
                            <div class="cart-item-image">
                                <img src="${item.image}" alt="${item.name}" loading="lazy">
                            </div>
                            <div class="cart-item-details">
                                <h4 class="cart-item-title">${item.name}</h4>
                                <p class="cart-item-price">R$ ${item.price.toFixed(2)}</p>
                                <p class="cart-item-quantity">Qtd: ${item.quantity}</p>
                                <p class="cart-item-total">Subtotal: R$ ${(item.price * item.quantity).toFixed(2)}</p>
                            </div>
                            <button class="cart-item-remove" onclick="app.removeFromCart(${item.id})" aria-label="Remover item">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `).join('');
            } else {
                cartItems.innerHTML = `
                    <div class="empty-cart">
                        <i class="fas fa-shopping-cart"></i>
                        <p>Seu carrinho está vazio</p>
                    </div>
                `;
            }
        }
    }

    // ===== SISTEMA DE PAGAMENTO REAL COM GHOSTSPAY =====
    async checkout() {
        if (this.cart.length === 0) {
            this.showNotification('🛒 Seu carrinho está vazio!', 'warning');
            return;
        }

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (!paymentMethod) {
            this.showNotification('💳 Selecione um método de pagamento', 'warning');
            return;
        }

        try {
            this.showNotification('⏳ Conectando com GhostsPay...', 'info');

            // Calcular total
            const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

            const formData = new FormData();
            formData.append('payment_method', paymentMethod.value);
            formData.append('amount', total);
            formData.append('items', JSON.stringify(this.cart.map(item => ({
                id: item.id,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            }))));

            console.log('📤 Enviando para backend...', {
                payment_method: paymentMethod.value,
                amount: total,
                items: this.cart
            });

            const response = await fetch(`${BACKEND_URL}/api/payment/checkout`, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();
            console.log('📥 Resposta do backend:', result);

            if (result.success) {
                this.handleRealPaymentSuccess(result, paymentMethod.value, total);
            } else {
                this.showNotification(`❌ ${result.message}`, 'error');
                console.error('Erro no pagamento:', result);
            }
        } catch (error) {
            console.error('💥 Erro na requisição:', error);
            this.showNotification('❌ Erro de conexão com o servidor', 'error');
        }
    }

    // ===== MANIPULAR SUCESSO DO PAGAMENTO REAL =====
    handleRealPaymentSuccess(result, paymentMethod, amount) {
        this.showNotification('✅ Pagamento criado com sucesso!', 'success');
        
        if (paymentMethod.toUpperCase() === 'PIX' && result.qr_code) {
            this.showRealPixModal(result.qr_code, result.pix_code, amount);
        } else if (result.payment_url) {
            window.open(result.payment_url, '_blank');
            this.showNotification('🌐 Redirecionando para pagamento...', 'info');
        }

        // Limpar carrinho
        this.cart = [];
        this.saveCart();
        this.toggleCart();
    }

    // ===== MODAL PIX REAL =====
    showRealPixModal(qrCodeUrl, pixCode, amount) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.innerHTML = `
            <div class="modal-container">
                <div class="modal-content">
                    <div class="auth-header">
                        <h3>💰 Pagamento PIX</h3>
                        <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="pix-content" style="text-align: center; padding: 2rem;">
                        <p style="font-size: 1.2rem; margin-bottom: 1rem; font-weight: 600;">
                            Valor: <span style="color: #10b981;">R$ ${amount.toFixed(2)}</span>
                        </p>
                        
                        <!-- QR Code REAL do GhostsPay -->
                        <div style="margin: 1rem 0;">
                            <img src="${qrCodeUrl}" alt="QR Code PIX" style="max-width: 256px; width: 100%; border: 2px solid #e5e7eb; border-radius: 12px; padding: 1rem; background: white;">
                            <p style="font-size: 0.9rem; color: #6b7280; margin-top: 0.5rem;">
                                Escaneie com seu app bancário
                            </p>
                        </div>

                        <!-- Código PIX REAL -->
                        <div style="background: #f8fafc; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #e2e8f0;">
                            <p style="font-size: 0.8rem; color: #64748b; margin-bottom: 0.5rem;">Código PIX (copie e cole):</p>
                            <div style="display: flex; gap: 0.5rem;">
                                <input type="text" value="${pixCode}" readonly style="flex: 1; padding: 0.5rem; border: 1px solid #d1d5db; border-radius: 6px; font-family: monospace; font-size: 0.8rem;" id="pix-code-input">
                                <button onclick="app.copyPixCode()" style="padding: 0.5rem 1rem; background: #3b82f6; color: white; border: none; border-radius: 6px; cursor: pointer;">
                                    Copiar
                                </button>
                            </div>
                        </div>

                        <div style="background: #dcfce7; padding: 1rem; border-radius: 8px; margin: 1rem 0; border: 1px solid #22c55e;">
                            <p style="font-size: 0.8rem; color: #166534; margin: 0;">
                                ✅ <strong>PAGAMENTO REAL:</strong> QR Code válido gerado pelo GhostsPay
                            </p>
                        </div>

                        <button onclick="this.closest('.modal-overlay').remove()" class="btn-auth-submit" style="margin-top: 1rem;">
                            <i class="fas fa-check"></i>
                            Entendido
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    copyPixCode() {
        const pixInput = document.getElementById('pix-code-input');
        if (pixInput) {
            pixInput.select();
            pixInput.setSelectionRange(0, 99999);
            
            navigator.clipboard.writeText(pixInput.value)
                .then(() => {
                    this.showNotification('📋 Código PIX copiado!', 'success');
                })
                .catch(() => {
                    document.execCommand('copy');
                    this.showNotification('📋 Código PIX copiado!', 'success');
                });
        }
    }

    // ===== SISTEMA DE FILTROS =====
    setupEventListeners() {
        // Filtros de categoria
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const category = btn.getAttribute('href').replace('#', '');
                this.filterProducts(category);
                
                // Atualizar botões ativos
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });

        // Header scroll effect
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 100));

        // Auth forms
        document.querySelectorAll('.auth-form-content').forEach(form => {
            form.addEventListener('submit', this.handleAuthForm.bind(this));
        });
    }

    filterProducts(category) {
        this.currentCategory = category;
        this.renderProducts(category);
    }

    handleScroll() {
        const header = document.querySelector('.header');
        const scrollY = window.scrollY;
        
        if (scrollY > 50) {
            header?.classList.add('scrolled');
        } else {
            header?.classList.remove('scrolled');
        }
    }

    // ===== SISTEMA DE AUTENTICAÇÃO =====
    handleAuthForm(e) {
        e.preventDefault();
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        // Simular autenticação
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        submitBtn.disabled = true;

        setTimeout(() => {
            this.showNotification('✅ Login realizado com sucesso!', 'success');
            this.closeAuthModal();
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }, 1500);
    }

    // ===== SISTEMA DE MODAIS =====
    setupModals() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || 
                e.target.classList.contains('cart-overlay') || 
                e.target.classList.contains('mobile-menu-overlay')) {
                this.closeAllModals();
            }
        });
    }

    showAuthModal(type) {
        const modal = document.getElementById('auth-modal');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');
        
        if (!modal || !loginForm || !registerForm) return;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (type === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }
    }

    closeAuthModal() {
        const modal = document.getElementById('auth-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    toggleCart() {
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartSidebar && cartOverlay) {
            const isActive = cartSidebar.classList.contains('active');
            
            if (isActive) {
                cartSidebar.classList.remove('active');
                cartOverlay.classList.remove('active');
                document.body.style.overflow = '';
            } else {
                cartSidebar.classList.add('active');
                cartOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    }

    toggleMobileMenu() {
        const mobileOverlay = document.getElementById('mobile-overlay');
        if (mobileOverlay) {
            const isActive = mobileOverlay.classList.contains('active');
            
            if (isActive) {
                this.closeMobileMenu();
            } else {
                mobileOverlay.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }
    }

    closeMobileMenu() {
        const mobileOverlay = document.getElementById('mobile-overlay');
        if (mobileOverlay) {
            mobileOverlay.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    closeAllModals() {
        this.closeAuthModal();
        this.closeMobileMenu();
        
        const cartSidebar = document.getElementById('cart-sidebar');
        const cartOverlay = document.getElementById('cart-overlay');
        
        if (cartSidebar) cartSidebar.classList.remove('active');
        if (cartOverlay) cartOverlay.classList.remove('active');
        
        document.body.style.overflow = '';
    }

    // ===== UTILITÁRIOS =====
    setupScrollEffects() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }

    setupAnimations() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('.product-card, .stat, .category-btn').forEach(el => {
            observer.observe(el);
        });
    }

    showNotification(message, type = 'info') {
        // Remover notificações existentes
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: this.getNotificationColor(type),
            color: 'white',
            padding: '16px 20px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
            zIndex: '4000',
            maxWidth: '400px'
        });

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    quickView(productId) {
        this.showNotification('👀 Visualização rápida em desenvolvimento', 'info');
    }

    scrollToProducts() {
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    // ===== PERFORMANCE =====
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// ===== INICIALIZAÇÃO =====
const app = new TechPartsPro();

// ===== FUNÇÕES GLOBAIS =====
window.showAuthModal = (type) => app.showAuthModal(type);
window.closeAuthModal = () => app.closeAuthModal();
window.toggleCart = () => app.toggleCart();
window.toggleMobileMenu = () => app.toggleMobileMenu();
window.scrollToProducts = () => app.scrollToProducts();
window.checkout = () => app.checkout();

console.log('🎉 TechParts Pro - Sistema carregado com sucesso!');
