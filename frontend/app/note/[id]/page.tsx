'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Edit, Trash2, Calendar, Tag, 
  Link as LinkIcon, Sparkles, Share2 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { noteApi } from '@/lib/api';
import NoteEditor from '@/components/NoteEditor';

export default function NoteDetailPage() {
  const params = useParams();
  const router = useRouter();
  const noteId = Number(params.id);
  
  const [note, setNote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [insightLoading, setInsightLoading] = useState(false);
  const [insight, setInsight] = useState<any>(null);

  useEffect(() => {
    if (noteId) {
      loadNote();
    }
  }, [noteId]);

  const loadNote = async () => {
    setLoading(true);
    try {
      const data = await noteApi.get(noteId);
      setNote(data);
      setEditTitle(data.title);
      setEditContent(data.content);
    } catch (error) {
      console.error('Failed to load note:', error);
      alert('노트를 불러오는데 실패했습니다.');
      router.push('/notes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('이 노트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    
    try {
      await noteApi.delete(noteId);
      router.push('/notes');
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const handleSave = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    setIsSaving(true);
    try {
      const updated = await noteApi.update(noteId, {
        title: editTitle,
        content: editContent,
      });
      setNote(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update note:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleGenerateInsight = async () => {
    setInsightLoading(true);
    try {
      const result = await noteApi.generateInsight([noteId]);
      setInsight(result);
    } catch (error) {
      console.error('Failed to generate insight:', error);
    } finally {
      setInsightLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brain-primary mx-auto mb-4"></div>
          <p className="text-gray-600">노트를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="card text-center py-12">
        <p className="text-gray-500">노트를 찾을 수 없습니다.</p>
        <Link href="/notes" className="btn-primary mt-4 inline-block">
          노트 목록으로
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="mb-6 flex items-center justify-between">
        <Link 
          href="/notes"
          className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          <span>목록으로</span>
        </Link>
        
        {!isEditing && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              className="btn-secondary flex items-center space-x-2"
            >
              <Edit className="w-4 h-4" />
              <span>편집</span>
            </button>
            <button
              onClick={handleDelete}
              className="btn-secondary text-red-600 hover:bg-red-50 flex items-center space-x-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>삭제</span>
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 메인 콘텐츠 */}
        <div className="lg:col-span-2">
          {isEditing ? (
            <div>
              <NoteEditor
                title={editTitle}
                content={editContent}
                onTitleChange={setEditTitle}
                onContentChange={setEditContent}
              />
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(note.title);
                    setEditContent(note.content);
                  }}
                  className="btn-secondary"
                >
                  취소
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="btn-primary"
                >
                  {isSaving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          ) : (
            <div className="card">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                {note.title}
              </h1>
              
              <div className="flex items-center text-sm text-gray-500 mb-6 space-x-4">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(note.created_at)}
                </div>
                {note.updated_at !== note.created_at && (
                  <div className="text-xs">
                    (수정됨: {formatDate(note.updated_at)})
                  </div>
                )}
              </div>

              {note.summary && (
                <div className="bg-gradient-to-r from-brain-primary/5 to-brain-secondary/5 rounded-lg p-4 mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">AI 요약</h3>
                  <p className="text-gray-600">{note.summary}</p>
                </div>
              )}

              <div className="prose prose-gray max-w-none">
                <ReactMarkdown>{note.content}</ReactMarkdown>
              </div>

              {note.tags?.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <div className="flex items-center flex-wrap gap-2">
                    <Tag className="w-4 h-4 text-gray-400" />
                    {note.tags.map((tag: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* 연결된 노트 */}
          {note.connections?.length > 0 && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <LinkIcon className="w-5 h-5 mr-2 text-brain-primary" />
                연결된 노트
              </h3>
              <div className="space-y-2">
                {note.connections.map((conn: any) => (
                  <Link
                    key={conn.id}
                    href={`/note/${conn.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {conn.title}
                    </div>
                    <div className="text-xs text-brain-primary mt-1">
                      유사도: {Math.round(conn.similarity_score * 100)}%
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* AI 인사이트 */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-brain-accent" />
              AI 인사이트
            </h3>
            
            {!insight ? (
              <button
                onClick={handleGenerateInsight}
                disabled={insightLoading}
                className="btn-primary w-full"
              >
                {insightLoading ? '생성 중...' : '인사이트 생성'}
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">통찰</h4>
                  <p className="text-sm text-gray-600">{insight.insight}</p>
                </div>
                
                {insight.related_topics?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">
                      관련 주제 추천
                    </h4>
                    <ul className="space-y-1">
                      {insight.related_topics.map((topic: string, idx: number) => (
                        <li key={idx} className="text-sm text-gray-600">
                          • {topic}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <button
                  onClick={handleGenerateInsight}
                  className="text-xs text-brain-primary hover:text-brain-secondary"
                >
                  다시 생성
                </button>
              </div>
            )}
          </div>

          {/* 액션 버튼 */}
          <div className="card space-y-2">
            <Link
              href="/graph"
              className="btn-secondary w-full text-center"
            >
              그래프에서 보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
