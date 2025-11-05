'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Save, Sparkles, Tag, Link as LinkIcon } from 'lucide-react';
import { noteApi } from '@/lib/api';
import NoteEditor from '@/components/NoteEditor';

export default function NewNotePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [similarNotes, setSimilarNotes] = useState<any[]>([]);

  const handleAnalyze = async () => {
    if (!content.trim()) return;
    
    setIsAnalyzing(true);
    try {
      const [analysisResult, similarResult] = await Promise.all([
        noteApi.analyze(content),
        noteApi.findSimilar(content, 3)
      ]);
      
      setAnalysis(analysisResult);
      setSimilarNotes(similarResult.similar_notes || []);
    } catch (error) {
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !content.trim()) {
      alert('제목과 내용을 모두 입력해주세요.');
      return;
    }
    
    setIsSaving(true);
    try {
      const note = await noteApi.create(title, content);
      router.push(`/note/${note.id}`);
    } catch (error) {
      console.error('Save error:', error);
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">새로운 생각 기록하기</h1>
        <p className="text-gray-600 mt-2">
          당신의 생각을 자유롭게 적어보세요. AI가 자동으로 구조화하고 연결해드립니다.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 에디터 영역 */}
        <div className="lg:col-span-2 space-y-4">
          <NoteEditor
            title={title}
            content={content}
            onTitleChange={setTitle}
            onContentChange={setContent}
          />
          
          {/* 액션 버튼 */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !content.trim()}
              className="btn-secondary flex items-center space-x-2"
            >
              <Sparkles className="w-5 h-5" />
              <span>{isAnalyzing ? 'AI 분석 중...' : 'AI 분석하기'}</span>
            </button>
            
            <button
              onClick={handleSave}
              disabled={isSaving || !title.trim() || !content.trim()}
              className="btn-primary flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>{isSaving ? '저장 중...' : '노트 저장'}</span>
            </button>
          </div>
        </div>

        {/* 사이드바 */}
        <div className="space-y-4">
          {/* AI 분석 결과 */}
          {analysis && (
            <div className="card slide-in">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-brain-accent" />
                AI 분석 결과
              </h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">요약</h4>
                  <p className="text-sm text-gray-600">{analysis.summary}</p>
                </div>
                
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1 flex items-center">
                    <Tag className="w-4 h-4 mr-1" />
                    키워드
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {analysis.keywords?.map((keyword: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-1 bg-brain-primary/10 text-brain-primary rounded-full"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>

                {analysis.main_topics?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">주요 주제</h4>
                    <div className="space-y-1">
                      {analysis.main_topics.map((topic: string, idx: number) => (
                        <div key={idx} className="text-sm text-gray-600">
                          • {topic}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 유사한 노트 */}
          {similarNotes.length > 0 && (
            <div className="card slide-in">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <LinkIcon className="w-5 h-5 mr-2 text-brain-primary" />
                연관된 노트
              </h3>
              
              <div className="space-y-2">
                {similarNotes.map((note) => (
                  <a
                    key={note.id}
                    href={`/note/${note.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-sm text-gray-900">
                      {note.title}
                    </div>
                    {note.summary && (
                      <div className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {note.summary}
                      </div>
                    )}
                    <div className="text-xs text-brain-primary mt-1">
                      유사도: {Math.round(note.similarity_score * 100)}%
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
