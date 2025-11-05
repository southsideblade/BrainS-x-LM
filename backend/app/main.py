from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
import logging
from app.core.config import settings
from app.db.session import Base, engine
from app.routers import health, notes
from app.services.vector_store import vector_store

# 로깅 설정
logging.basicConfig(level=logging.INFO if settings.is_production else logging.DEBUG)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """앱 시작/종료 시 실행할 이벤트"""
    # 시작 시
    logger.info(f"Starting {settings.PROJECT_NAME} API...")
    
    # DB 테이블 생성
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.error(f"Database initialization error: {e}")
    
    # Weaviate 연결
    try:
        vector_store.connect()
        logger.info("Vector store connected")
    except Exception as e:
        logger.warning(f"Vector store connection failed (will use fallback): {e}")
    
    yield
    
    # 종료 시
    logger.info(f"Shutting down {settings.PROJECT_NAME} API...")
    vector_store.close()

# FastAPI 앱 생성
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="당신의 사고방식을 학습하는 AI 세컨드 브레인",
    lifespan=lifespan,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
)

# Middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(health.router)
app.include_router(notes.router, prefix=settings.API_PREFIX)

# 루트 엔드포인트
@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "running",
        "environment": settings.ENVIRONMENT
    }

# 에러 핸들러
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return {"error": "Not found", "path": str(request.url)}

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"Internal error: {exc}")
    return {"error": "Internal server error"}
