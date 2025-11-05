import weaviate
from weaviate.auth import AuthApiKey
from typing import List, Tuple, Optional
import os
from app.core.config import settings

class VectorStore:
    def __init__(self):
        self.client = None
        self.collection_name = "NoteVector"
        
    def connect(self):
        """Weaviate 클라우드 연결"""
        try:
            if settings.WEAVIATE_API_KEY:
                # Weaviate Cloud 사용
                self.client = weaviate.connect_to_wcs(
                    cluster_url=settings.WEAVIATE_URL,
                    auth_credentials=AuthApiKey(settings.WEAVIATE_API_KEY),
                )
            else:
                # 로컬 Weaviate 사용 (개발용)
                self.client = weaviate.connect_to_local(
                    host=settings.WEAVIATE_URL.replace("http://", "").replace(":8080", ""),
                    port=8080
                )
            
            self._ensure_collection()
            return True
        except Exception as e:
            print(f"Weaviate connection error: {e}")
            # Fallback to in-memory storage
            return False
    
    def _ensure_collection(self):
        """컬렉션 생성 (이미 있으면 스킵)"""
        try:
            collections = self.client.collections.list_all()
            if self.collection_name not in [c.name for c in collections]:
                self.client.collections.create(
                    name=self.collection_name,
                    properties=[
                        {"name": "note_id", "dataType": ["int"]},
                        {"name": "user_id", "dataType": ["int"]},  
                        {"name": "title", "dataType": ["text"]},
                        {"name": "content", "dataType": ["text"]},
                        {"name": "summary", "dataType": ["text"]},
                    ]
                )
                print(f"Created collection: {self.collection_name}")
        except Exception as e:
            print(f"Collection creation error (may already exist): {e}")
    
    def close(self):
        """연결 종료"""
        if self.client:
            self.client.close()
    
    async def upsert_vector(
        self, 
        note_id: int, 
        user_id: int,
        title: str, 
        content: str,
        summary: str,
        vector: List[float]
    ) -> Optional[str]:
        """벡터 저장/업데이트"""
        if not self.client:
            return None
            
        try:
            collection = self.client.collections.get(self.collection_name)
            
            # 기존 노트 삭제
            collection.data.delete_many(
                where=collection.filter.by_property("note_id").equal(note_id)
            )
            
            # 새 데이터 삽입
            uuid_obj = collection.data.insert(
                properties={
                    "note_id": note_id,
                    "user_id": user_id,
                    "title": title,
                    "content": content[:1000],
                    "summary": summary or ""
                },
                vector=vector
            )
            
            return str(uuid_obj)
            
        except Exception as e:
            print(f"Vector upsert error: {e}")
            return None
    
    async def search_similar(
        self, 
        vector: List[float], 
        user_id: Optional[int] = None,
        limit: int = 5,
        min_score: float = 0.7
    ) -> List[Tuple[int, str, str, float]]:
        """유사한 노트 검색"""
        if not self.client:
            return []
            
        try:
            collection = self.client.collections.get(self.collection_name)
            
            # 벡터 유사도 검색
            query = collection.query.near_vector(
                near_vector=vector,
                limit=limit * 2,
                return_metadata=["distance"]
            )
            
            # 사용자 필터링
            if user_id:
                query = query.where(
                    collection.filter.by_property("user_id").equal(user_id)
                )
            
            results = query.do()
            
            # 결과 정리
            similar_notes = []
            for obj in results.objects:
                similarity = 1 - (obj.metadata.distance or 0)
                
                if similarity >= min_score:
                    similar_notes.append((
                        obj.properties["note_id"],
                        obj.properties["title"],
                        obj.properties.get("summary", ""),
                        similarity
                    ))
            
            similar_notes.sort(key=lambda x: x[3], reverse=True)
            return similar_notes[:limit]
            
        except Exception as e:
            print(f"Similar search error: {e}")
            return []
    
    async def delete_note_vector(self, note_id: int) -> bool:
        """노트 벡터 삭제"""
        if not self.client:
            return False
            
        try:
            collection = self.client.collections.get(self.collection_name)
            collection.data.delete_many(
                where=collection.filter.by_property("note_id").equal(note_id)
            )
            return True
        except Exception as e:
            print(f"Delete vector error: {e}")
            return False

# 싱글톤 인스턴스
vector_store = VectorStore()
