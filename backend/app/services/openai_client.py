import json
import re
from typing import List, Tuple, Optional
from openai import AsyncOpenAI
from app.core.config import settings

# OpenAI 클라이언트 초기화
client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)

async def embed_text(text: str) -> List[float]:
    """텍스트를 벡터로 임베딩"""
    try:
        response = await client.embeddings.create(
            model=settings.EMBEDDING_MODEL,
            input=text[:8000]  # 토큰 제한을 위한 텍스트 자르기
        )
        return response.data[0].embedding
    except Exception as e:
        print(f"Embedding error: {e}")
        # 에러 시 더미 임베딩 반환 (실제론 재시도 로직 필요)
        return [0.0] * 1536  # text-embedding-3-small의 차원

async def summarize_and_keywords(text: str) -> Tuple[str, List[str], List[str]]:
    """텍스트 요약, 키워드, 주제 추출"""
    try:
        prompt = f"""
다음 텍스트를 분석하여 JSON 형식으로 응답해주세요:
1. summary: 핵심 내용 2-3문장 요약
2. keywords: 핵심 키워드 5-7개
3. main_topics: 주요 주제나 개념 3-5개

텍스트:
{text[:3000]}

JSON 응답:
"""
        
        response = await client.chat.completions.create(
            model=settings.GPT_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that analyzes text and returns JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        
        # JSON 파싱
        try:
            data = json.loads(content)
            summary = data.get("summary", "")
            keywords = data.get("keywords", [])
            topics = data.get("main_topics", [])
            return summary, keywords, topics
        except json.JSONDecodeError:
            # 파싱 실패 시 정규식으로 추출 시도
            summary = re.search(r'"summary":\s*"([^"]+)"', content)
            summary = summary.group(1) if summary else "요약을 생성할 수 없습니다."
            return summary, [], []
            
    except Exception as e:
        print(f"Summarization error: {e}")
        return "요약 생성 실패", [], []

async def generate_insight(notes_content: List[str]) -> Tuple[str, List[str]]:
    """여러 노트를 기반으로 인사이트 생성"""
    try:
        combined_text = "\n\n---\n\n".join(notes_content[:5])  # 최대 5개 노트만
        
        prompt = f"""
다음은 사용자의 여러 노트입니다. 이들을 종합하여:
1. 노트들 간의 공통 주제나 연결점을 찾아 통찰력 있는 문장 1-2개를 생성하세요.
2. 추가로 탐구하면 좋을 관련 주제 3개를 제안하세요.

노트들:
{combined_text[:4000]}

JSON 형식으로 응답:
{{"insight": "통찰 문장", "related_topics": ["주제1", "주제2", "주제3"]}}
"""
        
        response = await client.chat.completions.create(
            model=settings.GPT_MODEL,
            messages=[
                {"role": "system", "content": "You are an insightful assistant that finds patterns and connections."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.5,
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        insight = data.get("insight", "패턴을 발견하지 못했습니다.")
        topics = data.get("related_topics", [])
        
        return insight, topics
        
    except Exception as e:
        print(f"Insight generation error: {e}")
        return "인사이트 생성 실패", []
