from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, ForeignKey, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.db.session import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    preferences = Column(JSON, default={})
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    notes = relationship("Note", back_populates="user", cascade="all, delete-orphan")

class Note(Base):
    __tablename__ = "notes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    summary = Column(Text, nullable=True)
    tags = Column(JSON, default=list)
    embedding_id = Column(String(255), nullable=True)  # Weaviate ID
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # 관계
    user = relationship("User", back_populates="notes")
    connections = relationship("NoteConnection", 
                              foreign_keys="[NoteConnection.source_note_id]",
                              back_populates="source_note",
                              cascade="all, delete-orphan")

class NoteConnection(Base):
    __tablename__ = "note_connections"

    id = Column(Integer, primary_key=True, index=True)
    source_note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    target_note_id = Column(Integer, ForeignKey("notes.id"), nullable=False)
    similarity_score = Column(Float, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계
    source_note = relationship("Note", foreign_keys=[source_note_id], back_populates="connections")
    target_note = relationship("Note", foreign_keys=[target_note_id])
