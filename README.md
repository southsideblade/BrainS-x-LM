# 🧠 BrainS(x)LM - Production Deployment Guide

## 🚀 배포 옵션

BrainS(x)LM은 다양한 클라우드 플랫폼에 배포할 수 있습니다:

- **Frontend**: Vercel (추천), Netlify, Cloudflare Pages
- **Backend**: Railway (추천), Render, Fly.io, Heroku
- **Database**: Supabase (추천), Neon, PlanetScale, Railway PostgreSQL
- **Vector DB**: Weaviate Cloud (추천), Pinecone, Qdrant Cloud

## 📋 전체 아키텍처

```
[Vercel Frontend] <---> [Railway Backend API]
                              |
                    +---------+---------+
                    |                   |
            [Supabase DB]      [Weaviate Cloud]
```

## 🔧 Step-by-Step 배포 가이드

### 1️⃣ Weaviate Cloud 설정

1. [Weaviate Cloud](https://console.weaviate.cloud) 가입
2. 새 클러스터 생성 (Free tier 가능)
3. API Key와 Cluster URL 복사

### 2️⃣ Supabase 데이터베이스 설정

1. [Supabase](https://supabase.com) 가입
2. 새 프로젝트 생성
3. Settings > Database에서 Connection String 복사
4. SQL Editor에서 테이블 자동 생성됨 (SQLAlchemy가 처리)

### 3️⃣ Backend 배포 (Railway)

#### Railway 사용

1. [Railway](https://railway.app) 가입
2. GitHub 연동
3. "New Project" > "Deploy from GitHub repo"
4. 환경변수 설정:
   ```
   DATABASE_URL=postgresql://...  # Supabase URL
   OPENAI_API_KEY=sk-...
   WEAVIATE_URL=https://your-cluster.weaviate.network
   WEAVIATE_API_KEY=your-api-key
   ENVIRONMENT=production
   ```
5. 자동 배포 시작

#### 또는 Render 사용

1. [Render](https://render.com) 가입
2. "New Web Service" 클릭
3. GitHub repo 연결
4. 환경변수 설정 (Railway와 동일)
5. Deploy 클릭

### 4️⃣ Frontend 배포 (Vercel)

1. [Vercel](https://vercel.com) 가입
2. "Import Project" > GitHub repo 선택
3. Framework: Next.js 자동 감지
4. 환경변수 설정:
   ```
   NEXT_PUBLIC_API_URL=https://your-api.railway.app
   ```
5. Deploy 클릭

### 5️⃣ 도메인 설정 (선택사항)

#### Custom Domain 연결
- Vercel: Settings > Domains에서 도메인 추가
- Railway: Settings > Domains에서 도메인 추가

#### SSL 인증서
- 모든 플랫폼에서 자동으로 Let's Encrypt SSL 제공

## 🔐 환경변수 체크리스트

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql://user:password@host:5432/dbname

# OpenAI
OPENAI_API_KEY=sk-...

# Weaviate
WEAVIATE_URL=https://your-cluster.weaviate.network
WEAVIATE_API_KEY=your-weaviate-api-key

# Environment
ENVIRONMENT=production
SECRET_KEY=your-secret-key-here

# Frontend URL (CORS)
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env.production)
```bash
# API URL
NEXT_PUBLIC_API_URL=https://your-backend.railway.app

# Optional Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

## 💰 비용 예상 (월간)

### 무료 티어로 시작 가능:
- **Vercel**: 무료 (개인 프로젝트)
- **Railway**: $5 크레딧/월 무료
- **Supabase**: 500MB DB 무료
- **Weaviate Cloud**: 100k 객체 무료
- **총 비용**: $0/월 (시작 단계)

### 프로덕션 추천:
- **Vercel Pro**: $20/월
- **Railway**: ~$10/월
- **Supabase Pro**: $25/월
- **Weaviate**: $25/월
- **총 비용**: ~$80/월

## 🎯 성능 최적화

### Frontend
- Image optimization with Next.js Image
- Code splitting & lazy loading
- Static generation where possible
- CDN caching with Vercel Edge Network

### Backend
- Database connection pooling
- Redis caching (optional)
- Rate limiting
- Async processing

### Database
- Proper indexing
- Query optimization
- Connection pooling

## 📊 모니터링

### 추천 도구:
- **Vercel Analytics**: Frontend 성능
- **Railway Metrics**: Backend 모니터링
- **Sentry**: 에러 추적
- **LogDNA/Datadog**: 로그 관리

## 🔄 CI/CD 설정

### GitHub Actions (.github/workflows/deploy.yml)
```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          cd backend && pip install -r requirements.txt
          python -m pytest
          cd ../frontend && npm install && npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Railway
        run: railway up
      - name: Deploy to Vercel
        run: vercel --prod
```

## 🚨 트러블슈팅

### 일반적인 문제들:

1. **CORS 에러**
   - Backend의 FRONTEND_URL 환경변수 확인
   - CORS 미들웨어 설정 확인

2. **Database 연결 실패**
   - DATABASE_URL 형식 확인
   - SSL 설정 확인 (production은 SSL 필수)

3. **Weaviate 연결 실패**
   - API Key와 URL 확인
   - 네트워크 정책 확인

4. **빌드 실패**
   - Node/Python 버전 확인
   - 환경변수 누락 확인

## 📱 모바일 앱 (향후)

React Native 버전 개발 예정:
- Expo 사용
- 동일 API 사용
- 오프라인 지원

## 🔗 유용한 링크

- [Railway 문서](https://docs.railway.app)
- [Vercel 문서](https://vercel.com/docs)
- [Supabase 문서](https://supabase.com/docs)
- [Weaviate 문서](https://weaviate.io/developers/weaviate)

## 📞 지원

문제가 있으시면:
1. GitHub Issues 생성
2. Discord 커뮤니티 참여
3. 이메일: support@brainsxlm.com

---

**Happy Deploying! 🚀**
