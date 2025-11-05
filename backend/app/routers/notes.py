from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from app.db.session import get_db
from app.db import models
from app.schemas.note import (
    NoteCreate, NoteUpdate, NoteOut, NoteWithConnections,
    AnalyzeRequest, AnalyzeResponse,
    SimilarNote, SimilarNotesResponse,
    GraphData, GraphNode, GraphEdge,
    InsightRequest, InsightResponse
)
from app.services.openai_client import embed_text, summarize_and_keywords, generate_insight
from app.services.vector_store import vector_store

router = APIRouter(prefix="/notes", tags=["notes"])

# 더미 사용자 ID (실제로는 인증 시스템 필요)
DUMMY_USER_ID = 1

@router.post("/create", response_model=NoteOut)
async def create_note(
    payload: NoteCreate,
    db: Session = Depends(get_db)
):
    """새 노트 생성"""
    try:
        # 사용자 확인 또는 생성 (임시)
        user = db.query(models.User).filter(models.User.id == DUMMY_USER_ID).first()
        if not user:
            user = models.User(
                id=DUMMY_USER_ID,
                email="demo@brainsxlm.com",
                name="Demo User"
            )
            db.add(user)
            db.commit()
        
        # 노트 생성
        note = models.Note(
            user_id=user.id,
            title=payload.title,
            content=payload.content
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        
        # AI 분석 및 벡터 저장 (비동기 처리)
        try:
            # 요약 및 키워드 추출
            summary, keywords, topics = await summarize_and_keywords(payload.content)
            
            # 노트 업데이트
            note.summary = summary
            note.tags = keywords + topics
            db.commit()
            db.refresh(note)
            
            # 벡터 임베딩 생성 및 저장
            vector = await embed_text(f"{payload.title}\n{payload.content}")
            if vector:
                embedding_id = await vector_store.upsert_vector(
                    note_id=note.id,
                    user_id=user.id,
                    title=payload.title,
                    content=payload.content,
                    summary=summary,
                    vector=vector
                )
                if embedding_id:
                    note.embedding_id = embedding_id
                    db.commit()
                    db.refresh(note)
            
            # 유사한 노트 찾아서 연결 생성
            if vector:
                similar_results = await vector_store.search_similar(
                    vector=vector,
                    user_id=user.id,
                    limit=5,
                    min_score=0.7
                )
                
                for sim_note_id, _, _, sim_score in similar_results:
                    if sim_note_id != note.id:  # 자기 자신 제외
                        connection = models.NoteConnection(
                            source_note_id=note.id,
                            target_note_id=sim_note_id,
                            similarity_score=sim_score
                        )
                        db.add(connection)
                
                db.commit()
                
        except Exception as e:
            print(f"AI processing error: {e}")
            # AI 처리 실패해도 노트는 저장
        
        return note
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list", response_model=List[NoteOut])
def list_notes(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """노트 목록 조회"""
    notes = db.query(models.Note)\
        .filter(models.Note.user_id == DUMMY_USER_ID)\
        .order_by(models.Note.created_at.desc())\
        .offset(skip)\
        .limit(limit)\
        .all()
    return notes

@router.get("/{note_id}", response_model=NoteWithConnections)
def get_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    """특정 노트 조회 (연결 포함)"""
    note = db.query(models.Note)\
        .filter(models.Note.id == note_id)\
        .filter(models.Note.user_id == DUMMY_USER_ID)\
        .first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # 연결된 노트 정보 가져오기
    connections = []
    for conn in note.connections:
        target = db.query(models.Note).filter(models.Note.id == conn.target_note_id).first()
        if target:
            connections.append({
                "id": target.id,
                "title": target.title,
                "similarity_score": conn.similarity_score
            })
    
    result = NoteWithConnections.model_validate(note)
    result.connections = connections
    
    return result

@router.put("/{note_id}", response_model=NoteOut)
async def update_note(
    note_id: int,
    payload: NoteUpdate,
    db: Session = Depends(get_db)
):
    """노트 수정"""
    note = db.query(models.Note)\
        .filter(models.Note.id == note_id)\
        .filter(models.Note.user_id == DUMMY_USER_ID)\
        .first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # 업데이트
    if payload.title is not None:
        note.title = payload.title
    if payload.content is not None:
        note.content = payload.content
        
        # 내용 변경 시 재분석
        summary, keywords, topics = await summarize_and_keywords(payload.content)
        note.summary = summary
        note.tags = keywords + topics
        
        # 벡터 재생성
        vector = await embed_text(f"{note.title}\n{note.content}")
        if vector:
            embedding_id = await vector_store.upsert_vector(
                note_id=note.id,
                user_id=DUMMY_USER_ID,
                title=note.title,
                content=note.content,
                summary=summary,
                vector=vector
            )
            if embedding_id:
                note.embedding_id = embedding_id
    
    db.commit()
    db.refresh(note)
    
    return note

@router.delete("/{note_id}")
def delete_note(
    note_id: int,
    db: Session = Depends(get_db)
):
    """노트 삭제"""
    note = db.query(models.Note)\
        .filter(models.Note.id == note_id)\
        .filter(models.Note.user_id == DUMMY_USER_ID)\
        .first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    
    # 벡터 저장소에서도 삭제
    vector_store.delete_note_vector(note_id)
    
    db.delete(note)
    db.commit()
    
    return {"message": "Note deleted successfully"}

@router.post("/analyze", response_model=AnalyzeResponse)
async def analyze_text(payload: AnalyzeRequest):
    """텍스트 AI 분석 (저장 없이)"""
    try:
        summary, keywords, topics = await summarize_and_keywords(payload.content)
        return AnalyzeResponse(
            summary=summary,
            keywords=keywords,
            main_topics=topics
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/similar", response_model=SimilarNotesResponse)
async def find_similar(
    query: str,
    limit: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db)
):
    """유사한 노트 검색"""
    try:
        # 쿼리 벡터화
        vector = await embed_text(query)
        
        if not vector:
            return SimilarNotesResponse(query=query, similar_notes=[])
        
        # 유사도 검색
        results = await vector_store.search_similar(
            vector=vector,
            user_id=DUMMY_USER_ID,
            limit=limit,
            min_score=0.6
        )
        
        # 노트 정보 조회
        similar_notes = []
        for note_id, title, summary, score in results:
            note = db.query(models.Note).filter(models.Note.id == note_id).first()
            if note:
                similar_notes.append(SimilarNote(
                    id=note.id,
                    title=note.title,
                    summary=note.summary,
                    similarity_score=score,
                    tags=note.tags or []
                ))
        
        return SimilarNotesResponse(
            query=query,
            similar_notes=similar_notes
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/graph/data", response_model=GraphData)
def get_graph_data(
    limit: int = Query(50, ge=10, le=200),
    db: Session = Depends(get_db)
):
    """그래프 시각화용 데이터"""
    # 최근 노트들
    notes = db.query(models.Note)\
        .filter(models.Note.user_id == DUMMY_USER_ID)\
        .order_by(models.Note.created_at.desc())\
        .limit(limit)\
        .all()
    
    # 노드 생성
    nodes = []
    node_ids = set()
    for note in notes:
        nodes.append(GraphNode(
            id=f"note_{note.id}",
            label=note.title[:50],  # 제목 길이 제한
            group=note.tags[0] if note.tags else "default",
            size=1.0 + len(note.connections) * 0.2  # 연결 수에 따른 크기
        ))
        node_ids.add(note.id)
    
    # 엣지 생성
    edges = []
    seen_edges = set()
    
    for note in notes:
        for conn in note.connections:
            # 양방향 중복 방지
            edge_key = tuple(sorted([note.id, conn.target_note_id]))
            
            if edge_key not in seen_edges and conn.target_note_id in node_ids:
                edges.append(GraphEdge(
                    source=f"note_{note.id}",
                    target=f"note_{conn.target_note_id}",
                    weight=conn.similarity_score
                ))
                seen_edges.add(edge_key)
    
    return GraphData(nodes=nodes, edges=edges)

@router.post("/insight", response_model=InsightResponse)
async def generate_insight_from_notes(
    payload: InsightRequest,
    db: Session = Depends(get_db)
):
    """선택된 노트들로부터 인사이트 생성"""
    try:
        # 노트 내용 가져오기
        notes = db.query(models.Note)\
            .filter(models.Note.id.in_(payload.note_ids))\
            .filter(models.Note.user_id == DUMMY_USER_ID)\
            .all()
        
        if not notes:
            raise HTTPException(status_code=404, detail="No notes found")
        
        # 노트 내용 추출
        notes_content = [f"{note.title}\n{note.content}" for note in notes]
        
        # 인사이트 생성
        insight, topics = await generate_insight(notes_content)
        
        # 추천 연결 찾기
        suggested_connections = []
        for note in notes[:3]:  # 최대 3개 노트만
            # 각 노트의 유사 노트 찾기
            if note.embedding_id:
                vector = await vector_store.get_note_vector(note.id)
                if vector:
                    similar = await vector_store.search_similar(
                        vector=vector,
                        user_id=DUMMY_USER_ID,
                        limit=2,
                        min_score=0.6
                    )
                    for sim_id, sim_title, _, sim_score in similar:
                        if sim_id != note.id and sim_id not in payload.note_ids:
                            suggested_connections.append({
                                "from_note_id": note.id,
                                "to_note_id": sim_id,
                                "to_note_title": sim_title,
                                "score": sim_score
                            })
        
        return InsightResponse(
            insight=insight,
            related_topics=topics,
            suggested_connections=suggested_connections[:5]  # 최대 5개
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
