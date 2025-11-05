from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health():
    """헬스 체크 엔드포인트"""
    return {
        "status": "ok",
        "timestamp": datetime.now().isoformat(),
        "service": "BrainS(x)LM API"
    }

@router.get("/")
def root():
    """루트 엔드포인트"""
    return {
        "message": "Welcome to BrainS(x)LM API",
        "version": "0.1.0",
        "docs": "/docs"
    }
