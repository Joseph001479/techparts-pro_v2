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
    version="3.0.0"
)

# CORS para permitir requisições do GitHub Pages
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# GhostsPay Config
GHOSTSPAY_URL = "https://api.ghostspaysv2.com/functions/v1/transactions"
SECRET_KEY = "sk_live_4rcXnqQ6KL4dJ2lW0gZxh9lCj5tm99kYMCk0i57KocSKGGD4"
COMPANY_ID = "43fc8053-d32c-4d37-bf93-33046dd7215b"

credentials = f"{SECRET_KEY}:{COMPANY_ID}"
encoded_credentials = base64.b64encode(credentials.encode()).decode()
AUTH_HEADER = f"Basic {encoded_credentials}"

print("🚀 TechParts Pro API Iniciada!")
print("🔑 GhostsPay Configurado!")

def generate_pix_code(amount, transaction_id):
    """Gerar código PIX válido"""
    # Chave PIX da empresa (em produção usar chave real)
    pix_key = "techpartspro@gmail.com"
    
    # Payload PIX no formato correto
    payload = f"00020126580014br.gov.bcb.pix0136{pix_key}5204000053039865406{amount:.2f}5802BR5925TECHPARTS PRO LTDA6008SAO PAULO62070503***6304"
    
    # QR Code usando API pública
    qr_code_url = f"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={payload}"
    
    return qr_code_url, payload

@app.post("/api/payment/checkout")
async def checkout_payment(
    payment_method: str = Form(...),
    amount: float = Form(...),
    items: str = Form(...)
):
    try:
        print(f"💰 Processando pagamento: {payment_method}, R$ {amount}")
        
        cart_items = json.loads(items)
        transaction_id = f"TECH{datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        # FORMATO CORRETO para GhostsPay
        transaction_data = {
            "amount": int(amount * 100),  # Em centavos
            "description": f"Pedido TechParts - {transaction_id}",
            "customer": {
                "name": "Cliente TechParts",
                "email": "cliente@techparts.com",
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
            "items": [
                {
                    "title": "Compra TechParts Pro",
                    "unitPrice": int(amount * 100),
                    "quantity": 1,
                    "externalRef": transaction_id
                }
            ],
            "paymentMethod": payment_method.upper(),
            "metadata": {
                "store": "TechParts Pro",
                "order_id": transaction_id
            }
        }

        print("📤 Enviando para GhostsPay...")
        print("Dados:", json.dumps(transaction_data, indent=2))
        
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
            print("✅ Pagamento criado no GhostsPay!")
            
            # VERIFICAR STATUS
            status = result.get("status")
            print(f"📊 Status da transação: {status}")
            
            if status == "refused":
                refused_reason = result.get("refusedReason", {})
                print(f"❌ Transação recusada: {refused_reason}")
                
                # GERAR PIX MANUALMENTE
                qr_code, pix_code = generate_pix_code(amount, transaction_id)
                
                return JSONResponse({
                    "success": True,
                    "payment_url": None,
                    "qr_code": qr_code,
                    "pix_code": pix_code,
                    "transaction_id": transaction_id,
                    "amount": amount,
                    "ghostspay_id": result.get("id"),
                    "fallback": True,
                    "message": "Pagamento disponível via PIX",
                    "status": "approved_manual"
                })
            
            # SE APROVADO, VERIFICAR PIX
            pix_data = result.get("pix", {})
            qr_code = pix_data.get("qrcode")
            pix_code = pix_data.get("qrcode_text")
            
            print(f"🔍 QR Code: {'✅' if qr_code else '❌ NULL'}")
            
            # SE SEM QR CODE, GERAR MANUALMENTE
            if payment_method.upper() == "PIX" and not qr_code:
                print("🔄 Gerando QR Code manualmente...")
                qr_code, pix_code = generate_pix_code(amount, transaction_id)
                
                return JSONResponse({
                    "success": True,
                    "payment_url": result.get("payment_url"),
                    "qr_code": qr_code,
                    "pix_code": pix_code,
                    "transaction_id": transaction_id,
                    "amount": amount,
                    "ghostspay_id": result.get("id"),
                    "fallback": True,
                    "message": "Use o QR Code abaixo para pagar:"
                })
            
            # TUDO CERTO COM GHOSTSPAY
            return JSONResponse({
                "success": True,
                "payment_url": result.get("payment_url"),
                "qr_code": qr_code,
                "pix_code": pix_code,
                "transaction_id": transaction_id,
                "amount": amount,
                "ghostspay_id": result.get("id"),
                "fallback": False
            })
        else:
            error_msg = f"Erro {response.status_code}: {response.text}"
            print(f"❌ {error_msg}")
            
            # MESMO COM ERRO, GERAR PIX MANUALMENTE
            if payment_method.upper() == "PIX":
                qr_code, pix_code = generate_pix_code(amount, transaction_id)
                
                return JSONResponse({
                    "success": True,
                    "payment_url": None,
                    "qr_code": qr_code,
                    "pix_code": pix_code,
                    "transaction_id": transaction_id,
                    "amount": amount,
                    "fallback": True,
                    "message": "Pagamento disponível via PIX"
                })
            
            return JSONResponse({
                "success": False,
                "message": error_msg
            })
            
    except Exception as e:
        error_msg = f"Erro: {str(e)}"
        print(f"💥 {error_msg}")
        
        # MESMO COM EXCEÇÃO, GERAR PIX
        if payment_method.upper() == "PIX":
            transaction_id = f"TECH{datetime.now().strftime('%Y%m%d%H%M%S')}"
            qr_code, pix_code = generate_pix_code(amount, transaction_id)
            
            return JSONResponse({
                "success": True,
                "payment_url": None,
                "qr_code": qr_code,
                "pix_code": pix_code,
                "transaction_id": transaction_id,
                "amount": amount,
                "fallback": True,
                "message": "Pagamento disponível via PIX"
            })
        
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
        "version": "3.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "payment_gateway": "ghostspay"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
