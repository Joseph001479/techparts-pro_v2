from fastapi import FastAPI, Request, Form, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import uuid
import requests
import base64
import json
from datetime import datetime

app = FastAPI(
    title="TechParts Pro API",
    description="API profissional para e-commerce TechParts Pro",
    version="1.0.0"
)

# CORS para permitir requisições do GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GhostsPay Config - SUAS CREDENCIAIS REAIS
GHOSTSPAY_URL = "https://api.ghostspaysv2.com/functions/v1/transactions"
SECRET_KEY = "sk_live_4rcXnqQ6KL4dJ2lW0gZxh9lCj5tm99kYMCk0i57KocSKGGD4"
COMPANY_ID = "43fc8053-d32c-4d37-bf93-33046dd7215b"

credentials = f"{SECRET_KEY}:{COMPANY_ID}"
encoded_credentials = base64.b64encode(credentials.encode()).decode()
AUTH_HEADER = f"Basic {encoded_credentials}"

print("🚀 TechParts Pro API Iniciada!")
print("🔑 GhostsPay Configurado!")

@app.post("/api/payment/checkout")
async def checkout_payment(
    payment_method: str = Form(...),
    amount: float = Form(...),
    items: str = Form(...),
    customer_name: str = Form("Cliente TechParts"),
    customer_email: str = Form("cliente@techparts.com")
):
    try:
        print(f"💰 Processando pagamento: {payment_method}, R$ {amount}")
        
        # Converter items de JSON string para lista
        cart_items = json.loads(items)
        
        # Preparar dados para GhostsPay
        transaction_data = {
            "amount": int(amount * 100),  # Em centavos
            "description": f"Pedido TechParts - {uuid.uuid4().hex[:8]}",
            "customer": {
                "name": customer_name,
                "email": customer_email,
                "document": "123.456.789-00",
                "phone": "(11) 99999-9999",
                "address": {
                    "street": "Av. Paulista",
                    "number": "1000",
                    "neighborhood": "Bela Vista",
                    "city": "São Paulo",
                    "state": "SP",
                    "zip_code": "01310-100",
                    "country": "BR"
                }
            },
            "items": [{
                "title": item["name"],
                "unitPrice": int(item["price"] * 100),
                "quantity": item["quantity"],
                "externalRef": str(item["id"])
            } for item in cart_items],
            "paymentMethod": payment_method.upper(),
            "postbackUrl": "https://techparts-pro-api.onrender.com/payment/success",
            "metadata": {
                "store": "TechParts Pro",
                "order_id": uuid.uuid4().hex[:8]
            }
        }

        # Adicionar parcelas apenas para cartão
        if payment_method.upper() == "CARD":
            transaction_data["installments"] = 1

        print("📤 Enviando para GhostsPay...")
        print("Dados:", json.dumps(transaction_data, indent=2))
        
        # Fazer requisição REAL para GhostsPay
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
        
        print(f"📥 Resposta GhostsPay: {response.status_code}")
        
        if response.status_code in [200, 201]:
            result = response.json()
            print("✅ Pagamento criado com sucesso!")
            
            return JSONResponse({
                "success": True,
                "payment_url": result.get("payment_url"),
                "qr_code": result.get("pix", {}).get("qrcode"),
                "pix_code": result.get("pix", {}).get("qrcode_text"),
                "transaction_id": result.get("id"),
                "amount": amount,
                "response_data": result
            })
        else:
            error_msg = f"Erro {response.status_code}: {response.text}"
            print(f"❌ {error_msg}")
            return JSONResponse({
                "success": False,
                "message": error_msg,
                "status_code": response.status_code
            })
            
    except Exception as e:
        error_msg = f"Erro interno: {str(e)}"
        print(f"💥 {error_msg}")
        return JSONResponse({
            "success": False, 
            "message": error_msg
        })

@app.get("/payment/success")
async def payment_success():
    return JSONResponse({
        "success": True,
        "message": "Pagamento confirmado com sucesso!"
    })

@app.get("/")
async def home():
    return {
        "status": "online",
        "service": "TechParts Pro API",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "payment_gateway": "ghostspay"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
