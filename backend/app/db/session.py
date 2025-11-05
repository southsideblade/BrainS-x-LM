from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy.pool import NullPool
from app.core.config import settings

# 프로덕션 환경에 맞는 엔진 설정
engine_args = {}
if settings.is_production:
    # 프로덕션에서는 connection pooling 사용
    engine_args = {
        "pool_pre_ping": True,
        "pool_recycle": 300,
        "echo": False,
    }
else:
    # 개발 환경
    engine_args = {
        "echo": settings.DEBUG,
        "poolclass": NullPool,
    }

engine = create_engine(settings.DATABASE_URL, **engine_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
