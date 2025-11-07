// ===== TECHPARTS PRO - SISTEMA COMPLETO =====

class TechPartsPro {
    constructor() {
        this.init();
    }

    init() {
        console.log('🚀 TechParts Pro - Sistema inicializado');
        
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        this.setupLoadingScreen();
        this.setupEventListeners();
        this.setupScrollEffects();
        this.setupCart();
        this.setupModals();
        this.checkAuthStatus();
        
        // Inicializar componentes após um breve delay
        setTimeout(() => {
            this.setupAnimations();
        }, 100);
    }

    // ===== LOADING SCREEN =====
    setupLoadingScreen() {
        const loadingScreen = document.getElementById('loading');
        if (!loadingScreen) return;

        // Simular carregamento de recursos
        setTimeout(() => {
            loadingScreen.classList.add('loaded');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1200);
    }

    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Header scroll effect
        window.addEventListener('scroll', this.throttle(this.handleScroll.bind(this), 100));
        
        // Form submissions
        this.setupFormHandlers();
        
        // Touch events para mobile
        this.setupTouchEvents();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Resize handler
        window.addEventListener('resize', this.debounce(this.handleResize.bind(this), 250));
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

    handleResize() {
        // Fechar menu mobile se aberto durante resize
        if (window.innerWidth >= 768) {
            this.closeMobileMenu();
        }
    }

    setupFormHandlers() {
        // Forms de autenticação
        document.querySelectorAll('.auth-form-content').forEach(form => {
            form.addEventListener('submit', this.handleAuthForm.bind(this));
        });

        // Forms de carrinho
        document.querySelectorAll('.add-to-cart-form').forEach(form => {
            form.addEventListener('submit', this.handleAddToCart.bind(this));
        });
    }

    setupTouchEvents() {
        // Swipe para fechar menu mobile (apenas touch devices)
        if ('ontouchstart' in window) {
            let startX = 0;
            const mobileOverlay = document.getElementById('mobile-overlay');
            
            document.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
            });

            document.addEventListener('touchend', (e) => {
                if (!mobileOverlay?.classList.contains('active')) return;
                
                const endX = e.changedTouches[0].clientX;
                const diffX = startX - endX;

                // Swipe da direita para esquerda para fechar
                if (diffX > 50) {
                    this.toggleMobileMenu();
                }
            });
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // ESC - Fechar modais
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
            
            // Ctrl+/ - Abrir busca (futuro)
            if (e.ctrlKey && e.key === '/') {
                e.preventDefault();
                // this.openSearch();
            }
        });
    }

    // ===== ANIMAÇÕES =====
    setupAnimations() {
        // Intersection Observer para animações ao scroll
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observar elementos para animação
        document.querySelectorAll('.product-card, .stat, .category-btn').forEach(el => {
            observer.observe(el);
        });
    }

    setupScrollEffects() {
        // Smooth scroll para âncoras
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

    // ===== SISTEMA DE CARRINHO =====
    setupCart() {
        this.cart = {
            items: [],
            total: 0,
            count: 0
        };
        
        this.loadCart();
    }

    async loadCart() {
        try {
            const response = await fetch('/api/cart');
            
            if (response.status === 401) {
                // Usuário não logado - estado normal
                this.updateCartUI({ items: [], total: 0, count: 0 });
                return;
            }

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const cartData = await response.json();
            
            if (cartData.success) {
                this.updateCartUI(cartData);
            }
        } catch (error) {
            console.log('🔐 Carrinho não disponível - usuário não logado');
        }
    }

    updateCartUI(cartData) {
        const cartCount = document.getElementById('cart-count');
        const cartTotal = document.getElementById('cart-total');
        const cartItems = document.getElementById('cart-items');

        // Atualizar contador
        if (cartCount) {
            cartCount.textContent = cartData.count || 0;
        }

        // Atualizar total
        if (cartTotal) {
            cartTotal.textContent = `R$ ${(cartData.total || 0).toFixed(2)}`;
        }

        // Atualizar itens
        if (cartItems) {
            if (cartData.items && cartData.items.length > 0) {
                cartItems.innerHTML = this.generateCartItemsHTML(cartData.items);
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

    generateCartItemsHTML(items) {
        return items.map(item => {
            const product = item.product || item;
            const quantity = item.quantity || 1;
            const total = product.price * quantity;
            
            return `
                <div class="cart-item" data-product-id="${product.id}">
                    <div class="cart-item-content">
                        <div class="cart-item-image">
                            <img src="${product.image}" alt="${product.name}" loading="lazy">
                        </div>
                        <div class="cart-item-details">
                            <h4 class="cart-item-title">${product.name}</h4>
                            <p class="cart-item-price">R$ ${product.price.toFixed(2)}</p>
                            <p class="cart-item-quantity">Qtd: ${quantity}</p>
                            <p class="cart-item-total">Subtotal: R$ ${total.toFixed(2)}</p>
                        </div>
                        <button class="cart-item-remove" onclick="app.removeFromCart(${product.id})" aria-label="Remover item">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    async handleAddToCart(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Mostrar loading
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const response = await fetch('/api/cart/add', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('✅ ' + result.message, 'success');
                this.updateCartUI({
                    items: result.items || this.cart.items,
                    total: result.cart_total || this.cart.total,
                    count: result.cart_count || this.cart.count
                });
                
                // Feedback visual no botão
                submitBtn.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    submitBtn.innerHTML = originalText;
                }, 1000);
            } else {
                this.showNotification('❌ ' + result.message, 'error');
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Erro ao adicionar ao carrinho:', error);
            this.showNotification('❌ Erro de conexão', 'error');
            submitBtn.innerHTML = originalText;
        } finally {
            submitBtn.disabled = false;
        }
    }

    async removeFromCart(productId) {
        try {
            const response = await fetch(`/api/cart/${productId}`, {
                method: 'DELETE'
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('🗑️ Item removido do carrinho', 'success');
                this.loadCart(); // Recarregar carrinho
            } else {
                this.showNotification('❌ ' + result.message, 'error');
            }
        } catch (error) {
            console.error('Erro ao remover do carrinho:', error);
            this.showNotification('❌ Erro de conexão', 'error');
        }
    }

    // ===== SISTEMA DE AUTENTICAÇÃO =====
    async handleAuthForm(e) {
        e.preventDefault();
        
        const form = e.target;
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        try {
            // Mostrar loading
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;

            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification('✅ ' + result.message, 'success');
                
                // Fechar modal após sucesso
                setTimeout(() => {
                    this.closeAuthModal();
                    window.location.reload(); // Recarregar para atualizar estado
                }, 1500);
            } else {
                this.showNotification('❌ ' + result.message, 'error');
                submitBtn.innerHTML = originalText;
            }
        } catch (error) {
            console.error('Erro de autenticação:', error);
            this.showNotification('❌ Erro de conexão', 'error');
            submitBtn.innerHTML = originalText;
        } finally {
            submitBtn.disabled = false;
        }
    }

    checkAuthStatus() {
        const hasSession = document.cookie.includes('session_id');
        console.log(hasSession ? '🔐 Usuário autenticado' : '👤 Usuário não autenticado');
    }

    // ===== SISTEMA DE MODAIS =====
    setupModals() {
        // Overlay para fechar modais
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-overlay') || 
                e.target.classList.contains('cart-overlay') ||
                e.target.classList.contains('mobile-menu-overlay')) {
                this.closeAllModals();
            }
        });

        // Prevenir fechamento ao clicar dentro do modal
        document.querySelectorAll('.modal-container, .cart-sidebar, .mobile-menu').forEach(modal => {
            modal.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }

    showAuthModal(type) {
        const modal = document.getElementById('auth-modal');
        const loginForm = document.getElementById('login-form');
        const registerForm = document.getElementById('register-form');

        if (!modal || !loginForm || !registerForm) return;

        // Mostrar modal
        modal.classList.add('active');

        // Mostrar form correto
        if (type === 'login') {
            loginForm.classList.add('active');
            registerForm.classList.remove('active');
        } else {
            registerForm.classList.add('active');
            loginForm.classList.remove('active');
        }

        // Prevenir scroll do body
        document.body.style.overflow = 'hidden';
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
                this.loadCart(); // Recarregar carrinho ao abrir
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

    // ===== SISTEMA DE PAGAMENTO GHOSTSPAY =====
    async checkout() {
        const cartItems = document.getElementById('cart-items');
        const emptyCart = cartItems?.querySelector('.empty-cart');
        
        if (emptyCart) {
            this.showNotification('🛒 Seu carrinho está vazio', 'warning');
            return;
        }

        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked');
        if (!paymentMethod) {
            this.showNotification('💳 Selecione um método de pagamento', 'warning');
            return;
        }

        try {
            this.showNotification('⏳ Processando pagamento...', 'info');
            
            const formData = new FormData();
            formData.append('payment_method', paymentMethod.value);

            const response = await fetch('/api/payment/checkout', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.handlePaymentSuccess(result);
            } else {
                this.handlePaymentError(result);
            }
        } catch (error) {
            console.error('Erro no checkout:', error);
            this.showNotification('❌ Erro de conexão no pagamento', 'error');
        }
    }

    handlePaymentSuccess(result) {
        this.showNotification('✅ Pagamento processado com sucesso!', 'success');
        
        if (result.qr_code) {
            // Mostrar QR Code PIX
            this.showPixModal(result.qr_code, result.amount);
        } else if (result.payment_url) {
            // Redirecionar para página de pagamento
            window.open(result.payment_url, '_blank');
        } else {
            console.log('Pagamento criado:', result);
        }
        
        this.toggleCart();
        this.loadCart(); // Recarregar carrinho vazio
    }

    handlePaymentError(result) {
        console.error('Erro no pagamento:', result);
        
        let errorMessage = '❌ Erro no processamento do pagamento';
        if (result.message) {
            if (result.message.includes('401')) {
                errorMessage = '🔐 Erro de autenticação - contate o suporte';
            } else if (result.message.includes('400')) {
                errorMessage = '📋 Dados inválidos no pagamento';
            } else if (result.message.includes('422')) {
                errorMessage = '⚙️ Erro de validação dos dados';
            } else {
                errorMessage = `❌ ${result.message}`;
            }
        }
        
        this.showNotification(errorMessage, 'error');
    }

    showPixModal(qrCode, amount) {
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
                        <img src="${qrCode}" alt="QR Code PIX" 
                             style="max-width: 256px; width: 100%; border: 2px solid #e5e7eb; border-radius: 12px; padding: 1rem; background: white;">
                        <p style="margin-top: 1.5rem; color: #6b7280;">
                            Escaneie o QR Code com seu app bancário
                        </p>
                        <button onclick="this.closest('.modal-overlay').remove()" 
                                class="btn-auth-submit" style="margin-top: 2rem;">
                            <i class="fas fa-check"></i>
                            OK, entendi
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';
    }

    // ===== SISTEMA DE NOTIFICAÇÕES =====
    showNotification(message, type = 'info') {
        this.removeExistingNotifications();

        const notification = document.createElement('div');
        notification.className = `notification notification-${type} slide-in-right`;
        notification.setAttribute('aria-live', 'polite');
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()" aria-label="Fechar notificação">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;

        // Adicionar estilos
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
            maxWidth: 'min(400px, calc(100vw - 40px))',
            animation: 'slideInRight 0.3s ease-out'
        });

        document.body.appendChild(notification);

        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideOutRight 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
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

    removeExistingNotifications() {
        document.querySelectorAll('.notification').forEach(notification => {
            notification.remove();
        });
    }

    // ===== FUNÇÕES UTILITÁRIAS =====
    scrollToProducts() {
        const productsSection = document.getElementById('products');
        if (productsSection) {
            productsSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
        }
    }

    quickView(productId) {
        // Implementação futura para visualização rápida
        this.showNotification('👀 Visualização rápida em desenvolvimento', 'info');
    }

    // ===== PERFORMANCE OPTIMIZATION =====
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

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

    // ===== ANALYTICS E MONITORAMENTO =====
    trackEvent(category, action, label) {
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                event_category: category,
                event_label: label
            });
        }
        console.log(`📊 Analytics: ${category} - ${action} - ${label}`);
    }
}

// ===== INICIALIZAÇÃO DA APLICAÇÃO =====
const app = new TechPartsPro();

// ===== FUNÇÕES GLOBAIS PARA HTML =====
window.showAuthModal = (type) => app.showAuthModal(type);
window.closeAuthModal = () => app.closeAuthModal();
window.toggleCart = () => app.toggleCart();
window.toggleMobileMenu = () => app.toggleMobileMenu();
window.scrollToProducts = () => app.scrollToProducts();
window.quickView = (productId) => app.quickView(productId);
window.checkout = () => app.checkout();

// Exportar para uso global
window.app = app;

console.log('🎉 TechParts Pro - Sistema carregado com sucesso!');