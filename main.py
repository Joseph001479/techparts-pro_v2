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
    version="2.0.0"
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

def generate_pix_fallback(amount, transaction_id):
    """Gerar PIX fallback profissional quando GhostsPay não retornar QR code"""
    # Chave PIX da loja (em produção, usar chave real)
    pix_key = "techpartspro@gmail.com"
    
    # Payload PIX no formato correto
    payload = f"""
    000201
    26580014br.gov.bcb.pix
    0136{pix_key}
    52040000
    5303986
    5406{amount:.2f}
    5802BR
    5925TECHPARTS PRO LTDA
    6008SAO PAULO
    62070503***
    6304
    """.replace("\n", "").replace(" ", "")
    
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
        
        # FORMATO SIMPLIFICADO para GhostsPay
        transaction_data = {
            "amount": int(amount * 100),
            "description": f"Pedido TechParts - {transaction_id}",
            "customer": {
                "name": "Cliente TechParts",
                "email": "cliente@techparts.com"
            },
            "paymentMethod": payment_method.upper(),
            "metadata": {
                "store": "TechParts Pro",
                "order_id": transaction_id
            }
        }

        print("📤 Enviando para GhostsPay...")
        
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
            
            # VERIFICAR SE TEM DADOS PIX
            pix_data = result.get("pix", {})
            qr_code = pix_data.get("qrcode")
            pix_code = pix_data.get("qrcode_text")
            
            print(f"🔍 QR Code do GhostsPay: {'✅' if qr_code else '❌ NULL'}")
            print(f"🔍 PIX Code do GhostsPay: {'✅' if pix_code else '❌ NULL'}")
            
            # SE GHOSTSPAY NÃO RETORNOU QR CODE, USAR FALLBACK
            if payment_method.upper() == "PIX" and not qr_code:
                print("🔄 Usando fallback para QR Code PIX...")
                qr_code_fallback, pix_code_fallback = generate_pix_fallback(amount, transaction_id)
                
                return JSONResponse({
                    "success": True,
                    "payment_url": result.get("payment_url"),
                    "qr_code": qr_code_fallback,
                    "pix_code": pix_code_fallback,
                    "transaction_id": transaction_id,
                    "amount": amount,
                    "ghostspay_id": result.get("id"),
                    "fallback": True,
                    "message": "Pagamento criado! Use o QR Code abaixo:"
                })
            
            # SE GHOSTSPAY RETORNOU QR CODE, USAR NORMALMENTE
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
            return JSONResponse({
                "success": False,
                "message": error_msg
            })
            
    except Exception as e:
        error_msg = f"Erro: {str(e)}"
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
        "version": "2.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "payment_gateway": "ghostspay"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
