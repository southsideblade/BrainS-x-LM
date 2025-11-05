'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, ArrowRight, Sparkles, Brain, Network, Zap } from 'lucide-react';
import { noteApi } from '@/lib/api';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [similarNotes, setSimilarNotes] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const response = await noteApi.findSimilar(searchQuery, 5);
      setSimilarNotes(response.similar_notes || []);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI 자동 요약',
      description: '노트를 작성하면 AI가 핵심을 자동으로 추출하고 태그를 생성합니다.',
    },
    {
      icon: Network,
      title: '지식 그래프',
      description: '연결된 생각들을 시각적으로 탐색하고 숨겨진 패턴을 발견하세요.',
    },
    {
      icon: Zap,
      title: '인사이트 생성',
      description: 'AI가 당신의 노트들을 분석해 새로운 통찰을 제안합니다.',
    },
  ];

  return (
    <div className="space-y-12">
      {/* 히어로 섹션 */}
      <section className="text-center py-12">
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-brain-primary to-brain-secondary bg-clip-text text-transparent">
            당신의 사고를 확장하는
          </span>
          <br />
          <span className="text-gray-800">AI 세컨드 브레인</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          생각을 기록하고, 연결하고, 재발견하세요
        </p>
        
        <div className="flex justify-center gap-4">
          <Link href="/note/new" className="btn-primary flex items-center space-x-2">
            <PlusCircle className="w-5 h-5" />
            <span>첫 노트 작성하기</span>
          </Link>
          <Link href="/graph" className="btn-secondary flex items-center space-x-2">
            <Network className="w-5 h-5" />
            <span>그래프 둘러보기</span>
          </Link>
        </div>
      </section>

      {/* 검색 섹션 */}
      <section className="card">
        <div className="flex items-center space-x-2 mb-4">
          <Sparkles className="w-6 h-6 text-brain-accent" />
          <h2 className="text-2xl font-bold">생각 검색하기</h2>
        </div>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="어떤 생각을 찾고 계신가요?"
            className="input-field flex-1"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching}
            className="btn-primary flex items-center space-x-2"
          >
            <Search className="w-5 h-5" />
            <span>{isSearching ? '검색 중...' : '검색'}</span>
          </button>
        </div>

        {similarNotes.length > 0 && (
          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">연관된 노트</h3>
            {similarNotes.map((note) => (
              <Link
                key={note.id}
                href={`/note/${note.id}`}
                className="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{note.title}</h4>
                    {note.summary && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {note.summary}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.tags?.slice(0, 3).map((tag: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-brain-primary/10 text-brain-primary rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ml-4 text-right">
                    <div className="text-sm text-gray-500">유사도</div>
                    <div className="text-lg font-semibold text-brain-primary">
                      {Math.round(note.similarity_score * 100)}%
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* 기능 소개 */}
      <section className="grid md:grid-cols-3 gap-6">
        {features.map((feature, idx) => {
          const Icon = feature.icon;
          return (
            <div key={idx} className="card text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-brain-primary to-brain-secondary rounded-full flex items-center justify-center">
                  <Icon className="w-8 h-8 text-white" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
