from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime

# User Schemas
class UserCreate(BaseModel):
    email: EmailStr
    name: str
    preferences: Optional[Dict[str, Any]] = {}

class UserOut(BaseModel):
    id: int
    email: str
    name: str
    preferences: Dict[str, Any]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Note Schemas
class NoteCreate(BaseModel):
    title: str
    content: str

class NoteUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None

class NoteOut(BaseModel):
    id: int
    user_id: int
    title: str
    content: str
    summary: Optional[str] = None
    tags: List[str] = []
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class NoteWithConnections(NoteOut):
    connections: List[Dict[str, Any]] = []

# AI Analysis Schemas
class AnalyzeRequest(BaseModel):
    content: str

class AnalyzeResponse(BaseModel):
    summary: str
    keywords: List[str]
    main_topics: List[str]

# Similar Notes Schemas
class SimilarNote(BaseModel):
    id: int
    title: str
    summary: Optional[str]
    similarity_score: float
    tags: List[str] = []

class SimilarNotesResponse(BaseModel):
    query: str
    similar_notes: List[SimilarNote]

# Graph Schemas
class GraphNode(BaseModel):
    id: str
    label: str
    group: Optional[str] = None
    size: Optional[float] = 1.0

class GraphEdge(BaseModel):
    source: str
    target: str
    weight: float

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

# Insight Schemas
class InsightRequest(BaseModel):
    note_ids: List[int]

class InsightResponse(BaseModel):
    insight: str
    related_topics: List[str]
    suggested_connections: List[Dict[str, Any]]
