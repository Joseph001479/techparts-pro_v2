// ===== CONFIGURAÇÃO DO BACKEND =====
const BACKEND_URL = "https://techparts-pro-v2.onrender.com";

// ===== SISTEMA PRINCIPAL =====
class TechPartsApp {
    constructor() {
        this.cart = JSON.parse(localStorage.getItem('techparts_cart')) || [];
        this.products = [];
        this.init();
    }

    init() {
        console.log('🚀 TechParts App Iniciado');
        this.loadProducts();
        this.setupEventListeners();
        this.updateCartCount();
    }

    setupEventListeners() {
        // Botão do carrinho
        const cartBtn = document.getElementById('cartBtn');
        if (cartBtn) {
            cartBtn.addEventListener('click', () => this.showCartModal());
        }

        // Botão de login
        const loginBtn = document.getElementById('loginBtn');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showLoginModal());
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
                description: "24 núcleos, 32 threads, até 6.0GHz",
                features: ["24 Núcleos", "32 Threads", "Até 6.0GHz"]
            },
            {
                id: 2,
                name: "AMD Ryzen 9 7950X", 
                category: "Processadores",
                price: 2899.99,
                rating: 4.8,
                description: "16 núcleos, 32 threads, 5.7GHz",
                features: ["16 Núcleos", "32 Threads", "5.7GHz"]
            },
            {
                id: 3,
                name: "NVIDIA RTX 4090",
                category: "Placas de Vídeo", 
                price: 8999.99,
                rating: 4.9,
                description: "24GB GDDR6X, DLSS 3, Ray Tracing",
                features: ["24GB GDDR6X", "DLSS 3", "Ray Tracing"]
            },
            {
                id: 4,
                name: "Corsair Vengeance RGB 32GB",
                category: "Memórias RAM",
                price: 899.99,
                rating: 4.7,
                description: "32GB DDR5 5600MHz - RGB Sync", 
                features: ["32GB DDR5", "5600MHz", "RGB Sync"]
            },
            {
                id: 5,
                name: "Intel Core i7-14700K",
                category: "Processadores",
                price: 2499.99,
                rating: 4.7,
                description: "20 núcleos, 28 threads",
                features: ["20 Núcleos", "28 Threads", "Alta Performance"]
            },
            {
                id: 6, 
                name: "AMD Ryzen 7 7800X3D",
                category: "Processadores",
                price: 2199.99,
                rating: 4.8,
                description: "8 núcleos com tecnologia 3D V-Cache",
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
        this.showNotification(`${product.name} adicionado ao carrinho!`);
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

        this.updateCartItems();
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
            this.showNotification('Adicione produtos ao carrinho primeiro!');
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
                    this.showNotification('Selecione um método de pagamento!');
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
        this.showNotification('Processando pagamento...');

        try {
            const paymentData = {
                method: method,
                amount: amount,
                items: this.cart,
                customer_name: 'Cliente TechParts',
                customer_email: 'cliente@techparts.com'
            };

            const response = await fetch(`${BACKEND_URL}/api/payment/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    payment_method: paymentData.method,
                    amount: paymentData.amount,
                    items: JSON.stringify(paymentData.items),
                    customer_name: paymentData.customer_name,
                    customer_email: paymentData.customer_email
                })
            });

            const result = await response.json();
            
            if (result.success) {
                this.showPaymentResult(result, method);
            } else {
                this.showNotification(`Erro: ${result.message}`);
            }
        } catch (error) {
            this.showNotification('Erro de conexão');
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
                        <p class="pix-code-label">Código PIX:</p>
                        <div class="pix-code-container">
                            <code class="pix-code">${result.pix_code || 'Código PIX'}</code>
                            <button onclick="app.copyPixCode('${result.pix_code}')">Copiar</button>
                        </div>
                    </div>
                    <p>Escaneie o QR code para pagar</p>
                    <button onclick="this.closest('.modal').style.display='none'" class="checkout-btn">Fechar</button>
                </div>
            `;
        } else {
            resultHTML = `
                <div class="payment-result">
                    <h2>Pagamento Processado!</h2>
                    <p>ID: ${result.transaction_id}</p>
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

        // Limpar carrinho
        if (result.success) {
            this.cart = [];
            this.saveCart();
            this.updateCartCount();
        }
    }

    copyPixCode(code) {
        if (!code) return;
        
        navigator.clipboard.writeText(code).then(() => {
            this.showNotification('Código copiado!');
        });
    }

    showLoginModal() {
        let modal = document.getElementById('loginModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'loginModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Login</h2>
                    <div class="login-form">
                        <input type="email" placeholder="E-mail" id="loginEmail">
                        <input type="password" placeholder="Senha" id="loginPassword">
                        <button onclick="app.handleLogin()">Entrar</button>
                        <p style="text-align: center; margin-top: 15px;">
                            Não tem conta? <a href="#" onclick="app.showRegisterModal()">Cadastre-se</a>
                        </p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.close').addEventListener('click', () => {
                modal.style.display = 'none';
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        modal.style.display = 'block';
    }

    showRegisterModal() {
        let modal = document.getElementById('registerModal');
        
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'registerModal';
            modal.className = 'modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <span class="close">&times;</span>
                    <h2>Cadastro</h2>
                    <div class="register-form">
                        <input type="text" placeholder="Nome completo" id="registerName">
                        <input type="email" placeholder="E-mail" id="registerEmail">
                        <input type="password" placeholder="Senha" id="registerPassword">
                        <button onclick="app.handleRegister()">Cadastrar</button>
                        <p style="text-align: center; margin-top: 15px;">
                            Já tem conta? <a href="#" onclick="app.showLoginModal()">Faça login</a>
                        </p>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            modal.querySelector('.close').addEventListener('click', () => {
                modal.style.display = 'none';
            });

            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Fechar login modal
        const loginModal = document.getElementById('loginModal');
        if (loginModal) loginModal.style.display = 'none';
        
        modal.style.display = 'block';
    }

    handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        
        if (!email || !password) {
            this.showNotification('Preencha todos os campos');
            return;
        }

        // Simular login
        localStorage.setItem('user', JSON.stringify({ email, name: 'Usuário' }));
        this.showNotification('Login realizado com sucesso!');
        
        const modal = document.getElementById('loginModal');
        if (modal) modal.style.display = 'none';
    }

    handleRegister() {
        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;
        
        if (!name || !email || !password) {
            this.showNotification('Preencha todos os campos');
            return;
        }

        // Simular registro
        localStorage.setItem('user', JSON.stringify({ email, name }));
        this.showNotification('Cadastro realizado com sucesso!');
        
        const modal = document.getElementById('registerModal');
        if (modal) modal.style.display = 'none';
    }

    showNotification(message) {
        // Criar notificação simples
        const notification = document.createElement('div');
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 300px;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 3000);
    }
}

// ===== INICIALIZAÇÃO =====
let app;

document.addEventListener('DOMContentLoaded', () => {
    app = new TechPartsApp();
});

// Tornar app global
window.app = app;
