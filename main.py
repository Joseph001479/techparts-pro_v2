from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
import uuid
import requests
import base64
import json
from datetime import datetime
from typing import Dict, Optional

app = FastAPI(
    title="TechParts Pro",
    description="Sistema profissional de e-commerce",
    version="2.0.0"
)

# Configurar para servir da raiz
app.mount("/static", StaticFiles(directory="."), name="static")
templates = Jinja2Templates(directory=".")

# Configurações GhostsPay
GHOSTSPAY_URL = "https://api.ghostspaysv2.com/functions/v1/transactions"
SECRET_KEY = "sk_live_4rcXnqQ6KL4dJ2lW0gZxh9lCj5tm99kYMCk0i57KocSKGGD4"
COMPANY_ID = "43fc8053-d32c-4d37-bf93-33046dd7215b"

# Autenticação GhostsPay
credentials = f"{SECRET_KEY}:{COMPANY_ID}"
encoded_credentials = base64.b64encode(credentials.encode()).decode()
AUTH_HEADER = f"Basic {encoded_credentials}"

# Database
class Database:
    def __init__(self):
        self.users = {}
        self.sessions = {}
        self.carts = {}
        self.products = {
            1: {
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
            2: {
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
            3: {
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
            4: {
                "id": 4,
                "name": "Corsair Vengeance RGB 32GB",
                "price": 899.99,
                "category": "memorias",
                "image": "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=400&q=80",
                "description": "32GB DDR5 5600MHz - RGB Sync - Latência ultra-baixa",
                "specs": ["32GB DDR5", "5600MHz", "RGB Sync", "Latência CL36"],
                "stock": 25,
                "rating": 4.7
            }
        }

db = Database()

def get_current_user(request: Request):
    session_id = request.cookies.get("session_id")
    return db.sessions.get(session_id)

# Rotas Principais
@app.get("/")
async def home(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "current_user": get_current_user(request),
        "products": list(db.products.values())[:3],
        "current_category": "home",
        "page_title": "TechParts Pro - Performance Máxima"
    })

@app.get("/products")
async def products_page(request: Request, category: str = "all"):
    if category == "all":
        products = list(db.products.values())
    else:
        products = [p for p in db.products.values() if p["category"] == category]
    
    return templates.TemplateResponse("index.html", {
        "request": request,
        "current_user": get_current_user(request),
        "products": products,
        "current_category": category,
        "page_title": f"TechParts Pro - {category.title()}"
    })

# API - Autenticação
@app.post("/api/auth/register")
async def register_user(
    name: str = Form(...),
    email: str = Form(...),
    password: str = Form(...)
):
    if email in db.users:
        return JSONResponse({"success": False, "message": "E-mail já cadastrado"}, status_code=400)
    
    user_data = {
        "id": str(uuid.uuid4()),
        "name": name,
        "email": email,
        "password": password,
        "created_at": datetime.now().isoformat()
    }
    
    db.users[email] = user_data
    session_id = str(uuid.uuid4())
    db.sessions[session_id] = user_data
    db.carts[email] = []
    
    response = JSONResponse({"success": True, "message": "Cadastro realizado!"})
    response.set_cookie("session_id", session_id)
    return response

@app.post("/api/auth/login")
async def login_user(
    email: str = Form(...),
    password: str = Form(...)
):
    user = db.users.get(email)
    if not user or user["password"] != password:
        return JSONResponse({"success": False, "message": "Credenciais inválidas"}, status_code=401)
    
    session_id = str(uuid.uuid4())
    db.sessions[session_id] = user
    
    response = JSONResponse({"success": True, "message": "Login realizado!"})
    response.set_cookie("session_id", session_id)
    return response

@app.post("/api/auth/logout")
async def logout_user(request: Request):
    session_id = request.cookies.get("session_id")
    if session_id in db.sessions:
        del db.sessions[session_id]
    
    response = JSONResponse({"success": True, "message": "Logout realizado!"})
    response.delete_cookie("session_id")
    return response

# API - Carrinho
@app.post("/api/cart/add")
async def add_to_cart(
    request: Request,
    product_id: int = Form(...),
    quantity: int = Form(1)
):
    user = get_current_user(request)
    if not user:
        return JSONResponse({"success": False, "message": "Faça login primeiro"}, status_code=401)
    
    product = db.products.get(product_id)
    if not product:
        return JSONResponse({"success": False, "message": "Produto não encontrado"}, status_code=404)
    
    email = user["email"]
    if email not in db.carts:
        db.carts[email] = []
    
    # Verificar se já existe no carrinho
    cart_item = next((item for item in db.carts[email] if item["product"]["id"] == product_id), None)
    if cart_item:
        cart_item["quantity"] += quantity
    else:
        db.carts[email].append({
            "product": product,
            "quantity": quantity,
            "added_at": datetime.now().isoformat()
        })
    
    cart_total = sum(item["product"]["price"] * item["quantity"] for item in db.carts[email])
    
    return JSONResponse({
        "success": True,
        "message": f"{product['name']} adicionado ao carrinho",
        "cart_count": len(db.carts[email]),
        "cart_total": cart_total
    })

@app.get("/api/cart")
async def get_cart(request: Request):
    user = get_current_user(request)
    if not user:
        return JSONResponse({"success": False, "message": "Não logado"}, status_code=401)
    
    email = user["email"]
    cart_items = db.carts.get(email, [])
    total = sum(item["product"]["price"] * item["quantity"] for item in cart_items)
    
    return JSONResponse({
        "items": cart_items,
        "total": total,
        "count": len(cart_items),
        "success": True
    })

@app.delete("/api/cart/{product_id}")
async def remove_from_cart(request: Request, product_id: int):
    user = get_current_user(request)
    if not user:
        return JSONResponse({"success": False, "message": "Não logado"}, status_code=401)
    
    email = user["email"]
    if email in db.carts:
        db.carts[email] = [item for item in db.carts[email] if item["product"]["id"] != product_id]
    
    return JSONResponse({"success": True, "message": "Item removido do carrinho"})

# API - Pagamento com GhostsPay
@app.post("/api/payment/checkout")
async def checkout_payment(
    request: Request,
    payment_method: str = Form(...)
):
    user = get_current_user(request)
    if not user:
        return JSONResponse({"success": False, "message": "Faça login primeiro"}, status_code=401)
    
    email = user["email"]
    cart_items = db.carts.get(email, [])
    
    if not cart_items:
        return JSONResponse({"success": False, "message": "Carrinho vazio"}, status_code=400)
    
    try:
        # Calcular total
        total = sum(item["product"]["price"] * item["quantity"] for item in cart_items)
        
        # Preparar dados para GhostsPay
        transaction_data = {
            "amount": int(total * 100),  # Em centavos
            "description": f"Pedido TechParts - {uuid.uuid4().hex[:8]}",
            "customer": {
                "name": user["name"],
                "email": user["email"],
                "document": "123.456.789-00",  # Em produção, usar CPF real
                "phone": "(11) 99999-9999",    # Em produção, usar telefone real
                "address": {
                    "street": "Rua Exemplo",
                    "number": "123",
                    "neighborhood": "Centro",
                    "city": "São Paulo",
                    "state": "SP",
                    "zip_code": "01001000",
                    "country": "BR"
                }
            },
            "items": [
                {
                    "title": item["product"]["name"],
                    "unitPrice": int(item["product"]["price"] * 100),
                    "quantity": item["quantity"],
                    "externalRef": str(item["product"]["id"])
                }
                for item in cart_items
            ],
            "paymentMethod": payment_method.upper(),
            "postbackUrl": f"{request.base_url}payment/success",
            "metadata": {
                "store": "TechParts",
                "user_email": email,
                "order_id": uuid.uuid4().hex[:8]
            }
        }

        # Adicionar parcelas apenas para cartão
        if payment_method.upper() == "CARD":
            transaction_data["installments"] = 1

        print("📤 Enviando para Ghosts Pay:", json.dumps(transaction_data, indent=2))

        # Fazer requisição para Ghosts Pay
        headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": AUTH_HEADER
        }

        response = requests.post(
            GHOSTSPAY_URL,
            json=transaction_data,
            headers=headers,
            timeout=30
        )
        
        print(f"📥 Resposta Ghosts Pay: {response.status_code}")
        print(f"📥 Conteúdo: {response.text}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            
            # Limpar carrinho após pagamento bem-sucedido
            db.carts[email] = []
            
            return {
                "success": True,
                "payment_url": result.get("payment_url"),
                "qr_code": result.get("pix", {}).get("qrcode"),
                "transaction_id": result.get("id"),
                "amount": total,
                "response_data": result
            }
        else:
            error_detail = f"Erro {response.status_code}: {response.text}"
            return {
                "success": False,
                "message": error_detail,
                "status_code": response.status_code
            }
            
    except Exception as e:
        error_msg = f"Erro interno: {str(e)}"
        print(f"❌ {error_msg}")
        return {
            "success": False, 
            "message": error_msg
        }

@app.get("/payment/success")
async def payment_success(request: Request, transaction_id: str = None):
    return JSONResponse({
        "success": True,
        "message": "Pagamento confirmado!",
        "transaction_id": transaction_id
    })

# Health Check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "2.0.0",
        "services": {
            "database": "operational",
            "authentication": "operational", 
            "cart": "operational",
            "payment": "operational"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8000,
        reload=True
    )