import os
from fastapi import FastAPI, Depends, HTTPException, Security
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from routers import triage, maps

# Load monorepo root environment variables
load_dotenv(dotenv_path="../../.env")

app = FastAPI(title="Emergix AI Operations Service")

# 1. Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Add API Key Security Middleware globally required for these critical AI endpoints
API_KEY_NAME = "X-API-Key"
api_key_header = APIKeyHeader(name=API_KEY_NAME, auto_error=True)

async def get_api_key(api_key_header: str = Security(api_key_header)):
    # You can set a strict default API_KEY in the .env like API_KEY=emergix_service_secret
    expected_api_key = os.getenv("API_KEY", "emergix_service_secret") 
    if api_key_header != expected_api_key:
        raise HTTPException(
            status_code=403, detail="Could not validate API Key required for AI Operations"
        )
    return api_key_header

# Register routing instances mapping base domain requirements
app.include_router(triage.router, prefix="/ai", dependencies=[Depends(get_api_key)])
app.include_router(maps.router, prefix="/ai", dependencies=[Depends(get_api_key)])

@app.get("/")
def health_check():
    return {"status": "ok", "service": "emergix-ai-service"}
