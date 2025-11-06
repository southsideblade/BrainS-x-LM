# Python 이미지 사용
FROM python:3.11-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# backend 폴더의 requirements.txt 복사
COPY backend/requirements.txt .

# Python 패키지 설치
RUN pip install --no-cache-dir -r requirements.txt

# backend 폴더 내용 복사
COPY backend/ .

EXPOSE 8000

# 서버 실행
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
