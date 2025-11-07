// ===== CONFIGURAÇÃO DO BACKEND REAL =====
const BACKEND_URL = "https://techparts-pro-v2.onrender.com";

// ===== SISTEMA DE AUTENTICAÇÃO =====
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Verificar se usuário está logado ao carregar a página
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }
    }

    async register(email, password, name) {
        try {
            // Simular registro (em produção, integrar com backend)
            const user = {
                id: Date.now(),
                email: email,
                name: name,
                createdAt: new Date().toISOString()
            };
            
            // Salvar no localStorage
            localStorage.setItem('user_' + email, JSON.stringify({
                email: email,
                password: password, // Em produção, isso seria hash
                userData: user
            }));
            
            // Fazer login automático
            this.login(email, password);
            
            return { success: true, user: user };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    async login(email, password) {
        try {
            // Verificar credenciais
            const userStorage = localStorage.getItem('user_' + email);
            
            if (!userStorage) {
                return { success: false, message: 'Usuário não encontrado' };
            }

            const userData = JSON.parse(userStorage);
            
            if (userData.password !== password) {
                return { success: false, message: 'Senha incorreta' };
            }

            // Login bem-sucedido
            this.currentUser = userData.userData;
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
            this.updateUI();
            
            return { success: true, user: this.currentUser };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
        this.showNotification('Logout realizado com sucesso!', 'success');
    }

    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');
        const logoutBtn = document.getElementById('logoutBtn');

        if (this.currentUser) {
            // Usuário logado
            if (loginBtn) loginBtn.style.display = 'none';
            if (userMenu) userMenu.style.display = 'block';
            if (userName) userName.textContent = this.currentUser.name;
            
            // Adicionar evento de logout
            if (logoutBtn) {
                logoutBtn.onclick = () => this.logout();
            }
        } else {
            // Usuário não logado
            if (loginBtn) loginBtn.style.display = 'block';
            if (userMenu) userMenu.style.display = 'none';
        }
    }

    isLoggedIn() {
        return this.currentUser !== null;
    }

    showNotification(message, type = 'info') {
        // Criar notificação
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;
        
        // Estilos da notificação
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            max-width: 400px;
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover após 5 segundos
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// ===== SISTEMA DE PAGAMENTO =====
class PaymentSystem {
    constructor() {
        this.backendUrl = BACKEND_URL;
    }

    async processPayment(paymentData) {
        try {
            console.log('💰 Iniciando pagamento:', paymentData);
            
            const response = await fetch(`${this.backendUrl}/api/payment/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    payment_method: paymentData.method,
                    amount: paymentData.amount,
                    items: JSON.stringify(paymentData.items),
                    customer_name: paymentData.customer_name || 'Cliente TechParts',
                    customer_email: paymentData.customer_email || 'cliente@techparts.com'
                })
            });

            const result = await response.json();
            console.log('📦 Resposta do pagamento:', result);

            return result;
        } catch (error) {
            console.error('💥 Erro no pagamento:', error);
            return {
                success: false,
                message: 'Erro de conexão: ' + error.message
            };
        }
    }
}

// ===== SISTEMA PRINCIPAL =====
class TechPartsApp {
    constructor() {
        this.auth = new AuthSystem();
        this.payment = new PaymentSystem();
        this.cart = JSON.parse(localStorage.getItem('techparts_cart')) || [];
        this.products = [];
        this.init();
    }

    init() {
        this.loadProducts();
        this.setupEventListeners();
        this.updateCartCount();
        console.log('🛒 Carrinho inicial:', this.cart);
    }

    setupEventListeners() {
        // Login/Logout
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showAuthModal('login'));
        }

        // Modal de autenticação
        this.setupAuthModal();
        
        // Fechar modal quando clicar fora
        const modal = document.getElementById('authModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAuthModal();
                }
            });
        }
    }

    setupAuthModal() {
        // Criar modal de autenticação se não existir
        if (!document.getElementById('authModal')) {
            const modalHTML = `
                <div id="authModal" class="modal">
                    <div class="modal-content">
                        <span class="close">&times;</span>
                        <div id="authForms">
                            <!-- Login Form -->
                            <div id="loginForm" class="auth-form">
                                <h2>Login</h2>
                                <form id="loginFormElement">
                                    <input type="email" placeholder="E-mail" required>
                                    <input type="password" placeholder="Senha" required>
                                    <button type="submit">Entrar</button>
                                </form>
                                <p>Não tem conta? <a href="#" onclick="app.showAuthModal('register')">Cadastre-se</a></p>
                            </div>
                            
                            <!-- Register Form -->
                            <div id="registerForm" class="auth-form" style="display: none;">
                                <h2>Cadastro</h2>
                                <form id="registerFormElement">
                                    <input type="text" placeholder="Nome completo" required>
                                    <input type="email" placeholder="E-mail" required>
                                    <input type="password" placeholder="Senha" required>
                                    <button type="submit">Cadastrar</button>
                                </form>
                                <p>Já tem conta? <a href="#" onclick="app.showAuthModal('login')">Faça login</a></p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Adicionar eventos aos formulários
            document.getElementById('loginFormElement').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin(e);
            });
            
            document.getElementById('registerFormElement').addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleRegister(e);
            });
            
            // Fechar modal
            document.querySelector('#authModal .close').addEventListener('click', () => {
                this.hideAuthModal();
            });
        }
    }

    showAuthModal(type = 'login') {
        const modal = document.getElementById('authModal');
        const loginForm = document.getElementById('loginForm');
        const registerForm = document.getElementById('registerForm');
        
        if (type === 'login') {
            loginForm.style.display = 'block';
            registerForm.style.display = 'none';
        } else {
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        }
        
        modal.style.display = 'block';
    }

    hideAuthModal() {
        const modal = document.getElementById('authModal');
        modal.style.display = 'none';
        
        // Limpar formulários
        document.querySelectorAll('#authForms input').forEach(input => {
            input.value = '';
        });
    }

    async handleLogin(e) {
        const formData = new FormData(e.target);
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        
        const result = await this.auth.login(email, password);
        
        if (result.success) {
            this.auth.showNotification(`Bem-vindo, ${result.user.name}!`, 'success');
            this.hideAuthModal();
        } else {
            this.auth.showNotification(result.message, 'error');
        }
    }

    async handleRegister(e) {
        const name = e.target.querySelector('input[type="text"]').value;
        const email = e.target.querySelector('input[type="email"]').value;
        const password = e.target.querySelector('input[type="password"]').value;
        
        const result = await this.auth.register(email, password, name);
        
        if (result.success) {
            this.auth.showNotification(`Conta criada com sucesso! Bem-vindo, ${result.user.name}!`, 'success');
            this.hideAuthModal();
        } else {
            this.auth.showNotification(result.message, 'error');
        }
    }

    loadProducts() {
        this.products = [
            {
                id: 1,
                name: "Intel Core i9-14900K",
                category: "Processadores",
                price: 3299.99,
                rating: 4.9,
                description: "24 núcleos, 32 threads, até 6.0GHz - O melhor para gaming e produtividade",
                features: ["24 Núcleos", "32 Threads", "Até 6.0GHz"]
            },
            {
                id: 2,
                name: "AMD Ryzen 9 7950X", 
                category: "Processadores",
                price: 2899.99,
                rating: 4.8,
                description: "16 núcleos, 32 threads, 5.7GHz - Performance excepcional",
                features: ["16 Núcleos", "32 Threads", "5.7GHz"]
            },
            {
                id: 3,
                name: "NVIDIA RTX 4090",
                category: "Placas de Vídeo", 
                price: 8999.99,
                rating: 4.9,
                description: "24GB GDDR6X, DLSS 3, Ray Tracing - A mais poderosa do mundo",
                features: ["24GB GDDR6X", "DLSS 3", "Ray Tracing"]
            },
            {
                id: 4,
                name: "Corsair Vengeance RGB 32GB",
                category: "Memórias RAM",
                price: 899.99,
                rating: 4.7,
                description: "32GB DDR5 5600MHz - RGB Sync - Latência ultra-baixa", 
                features: ["32GB DDR5", "5600MHz", "RGB Sync"]
            },
            {
                id: 5,
                name: "Intel Core i7-14700K",
                category: "Processadores",
                price: 2499.99,
                rating: 4.7,
                description: "20 núcleos, 28 threads - Excelente custo-benefício",
                features: ["20 Núcleos", "28 Threads", "Alta Performance"]
            },
            {
                id: 6, 
                name: "AMD Ryzen 7 7800X3D",
                category: "Processadores",
                price: 2199.99,
                rating: 4.8,
                description: "8 núcleos com tecnologia 3D V-Cache - Ideal para gaming",
                features: ["8 Núcleos", "16 Threads", "3D V-Cache"]
            }
        ];
        
        this.renderProducts();
    }

    renderProducts() {
        const container = document.getElementById('productsContainer');
        if (!container) return;

        const productsHTML = this.products.map(product => `
            <div class="product-card">
                <div class="product-rating">⭐ ${product.rating}</div>
                <h3>${product.name}</h3>
                <span class="product-category">${product.category}</span>
                <p>${product.description}</p>
                <div class="product-features">
                    ${product.features.map(feat => `<span>${feat}</span>`).join('')}
                </div>
                <div class="product-price">
                    <strong>R$ ${product.price.toFixed(2)}</strong>
                    <button class="add-to-cart" onclick="app.addToCart(${product.id})">
                        Adicionar
                    </button>
                </div>
            </div>
        `).join('');

        container.innerHTML = productsHTML;
    }

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
        this.updateCartCount();
        this.showNotification(`${product.name} adicionado ao carrinho!`, 'success');
    }

    removeFromCart(productId) {
        this.cart = this.cart.filter(item => item.id !== productId);
        this.saveCart();
        this.updateCartCount();
        this.showCartModal();
    }

    updateCartCount() {
        const count = this.cart.reduce((total, item) => total + item.quantity, 0);
        const cartCount = document.getElementById('cartCount');
        if (cartCount) {
            cartCount.textContent = count;
            cartCount.style.display = count > 0 ? 'flex' : 'none';
        }
    }

    saveCart() {
        localStorage.setItem('techparts_cart', JSON.stringify(this.cart));
    }

    showCartModal() {
        // Criar ou atualizar modal do carrinho
        let modal = document.getElementById('cartModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'cartModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Meu Carrinho</h2>
                    <div id="cartItems"></div>
                    <div class="cart-total">
                        <strong>Total: R$ <span id="cartTotal">0.00</span></strong>
                    </div>
                    <button id="checkoutBtn" class="checkout-btn">Finalizar Compra</button>
                </div>
            `;
            document.body.appendChild(modal);

            // Fechar modal
            modal.querySelector('.close').addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Finalizar compra
            modal.querySelector('#checkoutBtn').addEventListener('click', () => {
                this.showPaymentModal();
            });

            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Atualizar itens do carrinho
        this.updateCartItems();
        
        // Mostrar modal
        modal.style.display = 'block';
    }

    updateCartItems() {
        const container = document.getElementById('cartItems');
        const totalElement = document.getElementById('cartTotal');
        
        if (!container) return;

        if (this.cart.length === 0) {
            container.innerHTML = '<p class="empty-cart">Seu carrinho está vazio</p>';
            if (totalElement) totalElement.textContent = '0.00';
            return;
        }

        const itemsHTML = this.cart.map(item => `
            <div class="cart-item">
                <div class="cart-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.description}</p>
                    <span class="cart-item-price">R$ ${item.price.toFixed(2)}</span>
                </div>
                <div class="cart-item-controls">
                    <div class="quantity-controls">
                        <button onclick="app.updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="app.updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="app.removeFromCart(${item.id})">🗑️</button>
                </div>
            </div>
        `).join('');

        container.innerHTML = itemsHTML;

        // Calcular total
        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (totalElement) {
            totalElement.textContent = total.toFixed(2);
        }
    }

    updateQuantity(productId, change) {
        const item = this.cart.find(item => item.id === productId);
        if (!item) return;

        item.quantity += change;

        if (item.quantity <= 0) {
            this.removeFromCart(productId);
        } else {
            this.saveCart();
            this.updateCartCount();
            this.updateCartItems();
        }
    }

    showPaymentModal() {
        if (this.cart.length === 0) {
            this.showNotification('Adicione produtos ao carrinho primeiro!', 'error');
            return;
        }

        const total = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        
        let modal = document.getElementById('paymentModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'paymentModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Finalizar Compra</h2>
                    <div class="payment-methods">
                        <div class="payment-method" data-method="pix">
                            <span>📱</span>
                            <div>
                                <strong>PIX</strong>
                                <small>Pagamento instantâneo</small>
                            </div>
                        </div>
                        <div class="payment-method" data-method="card">
                            <span>💳</span>
                            <div>
                                <strong>Cartão</strong>
                                <small>Crédito ou Débito</small>
                            </div>
                        </div>
                        <div class="payment-method" data-method="boleto">
                            <span>📄</span>
                            <div>
                                <strong>Boleto</strong>
                                <small>Pagamento em 1-2 dias</small>
                            </div>
                        </div>
                    </div>
                    <div class="payment-total">
                        <strong>Total: R$ ${total.toFixed(2)}</strong>
                    </div>
                    <button id="confirmPayment" class="checkout-btn">Confirmar Pagamento</button>
                </div>
            `;
            document.body.appendChild(modal);

            // Fechar modal
            modal.querySelector('.close').addEventListener('click', () => {
                modal.style.display = 'none';
            });

            // Selecionar método de pagamento
            modal.querySelectorAll('.payment-method').forEach(method => {
                method.addEventListener('click', () => {
                    modal.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
                    method.classList.add('selected');
                });
            });

            // Confirmar pagamento
            modal.querySelector('#confirmPayment').addEventListener('click', () => {
                const selectedMethod = modal.querySelector('.payment-method.selected');
                if (!selectedMethod) {
                    this.showNotification('Selecione um método de pagamento!', 'error');
                    return;
                }
                
                const method = selectedMethod.dataset.method;
                this.processPayment(method, total);
            });

            // Fechar ao clicar fora
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Atualizar total
        modal.querySelector('.payment-total strong').textContent = `Total: R$ ${total.toFixed(2)}`;
        
        // Mostrar modal
        modal.style.display = 'block';
    }

    async processPayment(method, amount) {
        this.showNotification('Conectando com GhostsPay...', 'info');

        try {
            const paymentData = {
                method: method,
                amount: amount,
                items: this.cart,
                customer_name: this.auth.currentUser ? this.auth.currentUser.name : 'Cliente TechParts',
                customer_email: this.auth.currentUser ? this.auth.currentUser.email : 'cliente@techparts.com'
            };

            const result = await this.payment.processPayment(paymentData);
            
            if (result.success) {
                this.showPaymentResult(result, method);
            } else {
                this.showNotification(`Erro no pagamento: ${result.message}`, 'error');
            }
        } catch (error) {
            this.showNotification('Erro de conexão com o servidor', 'error');
            console.error('Erro:', error);
        }
    }

    showPaymentResult(result, method) {
        const modal = document.getElementById('paymentModal');
        if (modal) modal.style.display = 'none';

        let resultHTML = '';
        
        if (method === 'pix' && result.qr_code) {
            resultHTML = `
                <div class="payment-result">
                    <h2>Pagamento via PIX</h2>
                    <div class="pix-container">
                        <img src="${result.qr_code}" alt="QR Code PIX" class="qr-code">
                        <p class="pix-code-label">Código PIX (Copie e Cole):</p>
                        <div class="pix-code-container">
                            <code class="pix-code">${result.pix_code || 'Código não disponível'}</code>
                            <button onclick="app.copyPixCode('${result.pix_code}')">Copiar</button>
                        </div>
                    </div>
                    <p>Escaneie o QR code ou copie o código para pagar no seu app bancário</p>
                    <button onclick="this.closest('.modal').style.display='none'" class="checkout-btn">Fechar</button>
                </div>
            `;
        } else {
            resultHTML = `
                <div class="payment-result">
                    <h2>Pagamento Processado!</h2>
                    <p>ID da Transação: ${result.transaction_id}</p>
                    <p>Valor: R$ ${result.amount}</p>
                    <button onclick="this.closest('.modal').style.display='none'" class="checkout-btn">Fechar</button>
                </div>
            `;
        }

        const resultModal = document.createElement('div');
        resultModal.className = 'modal';
        resultModal.innerHTML = `
            <div class="modal-content">
                <span class="close">&times;</span>
                ${resultHTML}
            </div>
        `;

        document.body.appendChild(resultModal);
        resultModal.style.display = 'block';

        // Fechar modal
        resultModal.querySelector('.close').addEventListener('click', () => {
            resultModal.style.display = 'none';
            resultModal.remove();
        });

        resultModal.addEventListener('click', (e) => {
            if (e.target === resultModal) {
                resultModal.style.display = 'none';
                resultModal.remove();
            }
        });

        // Limpar carrinho se pagamento for bem-sucedido
        if (result.success) {
            this.cart = [];
            this.saveCart();
            this.updateCartCount();
        }
    }

    copyPixCode(code) {
        if (!code || code === 'Código não disponível') {
            this.showNotification('Código PIX não disponível para copiar', 'error');
            return;
        }

        navigator.clipboard.writeText(code).then(() => {
            this.showNotification('Código PIX copiado!', 'success');
        }).catch(() => {
            // Fallback para navegadores mais antigos
            const textArea = document.createElement('textarea');
            textArea.value = code;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showNotification('Código PIX copiado!', 'success');
        });
    }

    showNotification(message, type = 'info') {
        this.auth.showNotification(message, type);
    }
}

// ===== ESTILOS CSS DINÂMICOS =====
const injectStyles = () => {
    const styles = `
        <style>
            .notification {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #4CAF50;
                color: white;
                padding: 15px 20px;
                border-radius: 5px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 10px;
                max-width: 400px;
                animation: slideIn 0.3s ease;
            }
            
            .notification.error { background: #f44336; }
            .notification.info { background: #2196F3; }
            .notification.warning { background: #ff9800; }
            
            .notification button {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
            }
            
            .modal-content {
                background-color: white;
                margin: 5% auto;
                padding: 30px;
                border-radius: 10px;
                width: 90%;
                max-width: 500px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            }
            
            .close {
                position: absolute;
                right: 15px;
                top: 15px;
                font-size: 28px;
                font-weight: bold;
                cursor: pointer;
                color: #666;
            }
            
            .close:hover {
                color: #000;
            }
            
            .auth-form h2 {
                margin-bottom: 20px;
                text-align: center;
            }
            
            .auth-form input {
                width: 100%;
                padding: 12px;
                margin: 8px 0;
                border: 1px solid #ddd;
                border-radius: 5px;
                box-sizing: border-box;
            }
            
            .auth-form button {
                width: 100%;
                padding: 12px;
                background: #2563eb;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
                margin-top: 10px;
            }
            
            .auth-form button:hover {
                background: #1d4ed8;
            }
            
            .auth-form p {
                text-align: center;
                margin-top: 15px;
            }
            
            .auth-form a {
                color: #2563eb;
                text-decoration: none;
            }
            
            .auth-form a:hover {
                text-decoration: underline;
            }
            
            .user-menu {
                display: none;
                align-items: center;
                gap: 10px;
            }
            
            .user-info {
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .logout-btn {
                background: #dc2626;
                color: white;
                border: none;
                padding: 8px 12px;
                border-radius: 5px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .logout-btn:hover {
                background: #b91c1c;
            }
            
            .payment-methods {
                margin: 20px 0;
            }
            
            .payment-method {
                display: flex;
                align-items: center;
                gap: 15px;
                padding: 15px;
                border: 2px solid #e5e7eb;
                border-radius: 8px;
                margin-bottom: 10px;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .payment-method:hover {
                border-color: #2563eb;
            }
            
            .payment-method.selected {
                border-color: #2563eb;
                background-color: #f0f7ff;
            }
            
            .payment-method span {
                font-size: 24px;
            }
            
            .qr-code {
                width: 200px;
                height: 200px;
                margin: 0 auto;
                display: block;
            }
            
            .pix-code-container {
                display: flex;
                gap: 10px;
                align-items: center;
                margin: 15px 0;
            }
            
            .pix-code {
                flex: 1;
                background: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
                font-family: monospace;
                word-break: break-all;
            }
            
            .pix-code-container button {
                background: #2563eb;
                color: white;
                border: none;
                padding: 10px 15px;
                border-radius: 5px;
                cursor: pointer;
            }
        </style>
    `;
    
    document.head.insertAdjacentHTML('beforeend', styles);
};

// ===== INICIALIZAÇÃO =====
let app;

document.addEventListener('DOMContentLoaded', () => {
    injectStyles();
    app = new TechPartsApp();
    
    // Cart button event listener
    const cartBtn = document.getElementById('cartBtn');
    if (cartBtn) {
        cartBtn.addEventListener('click', () => app.showCartModal());
    }
});

// Make app globally available
window.app = app;
