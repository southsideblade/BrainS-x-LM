import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    # 기본 설정
    PROJECT_NAME: str = "BrainS(x)LM"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    
    # 환경
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "production")
    DEBUG: bool = os.getenv("DEBUG", "false").lower() == "true"
    
    # 서버
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # 데이터베이스
    DATABASE_URL: str = os.getenv("DATABASE_URL", "")
    
    # Weaviate
    WEAVIATE_URL: str = os.getenv("WEAVIATE_URL", "")
    WEAVIATE_API_KEY: str = os.getenv("WEAVIATE_API_KEY", "")
    
    # OpenAI
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    EMBEDDING_MODEL: str = "text-embedding-3-small"
    GPT_MODEL: str = "gpt-4o-mini"
    
    # CORS
    BACKEND_CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://brainsxlm.vercel.app",
        os.getenv("FRONTEND_URL", ""),
    ]
    
    # 보안
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30 * 24 * 60  # 30 days
    
    # 제한
    MAX_NOTES_PER_USER: int = 1000
    MAX_CONTENT_LENGTH: int = 50000  # characters
    
    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

settings = Settings()
