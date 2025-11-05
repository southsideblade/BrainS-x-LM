'use client';

import { useEffect, useState } from 'react';
import { Hash, FileText, Bold, Italic, List, Link } from 'lucide-react';

interface NoteEditorProps {
  title: string;
  content: string;
  onTitleChange: (value: string) => void;
  onContentChange: (value: string) => void;
  readOnly?: boolean;
}

export default function NoteEditor({
  title,
  content,
  onTitleChange,
  onContentChange,
  readOnly = false,
}: NoteEditorProps) {
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);

  useEffect(() => {
    const words = content.trim().split(/\s+/).filter(w => w.length > 0).length;
    const chars = content.length;
    setWordCount(words);
    setCharCount(chars);
  }, [content]);

  const insertMarkdown = (prefix: string, suffix = '') => {
    if (readOnly) return;
    
    const textarea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    
    const newText = 
      content.substring(0, start) + 
      prefix + selectedText + suffix +
      content.substring(end);
    
    onContentChange(newText);
    
    // 커서 위치 조정
    setTimeout(() => {
      textarea.focus();
      const newPosition = start + prefix.length + selectedText.length;
      textarea.setSelectionRange(newPosition, newPosition);
    }, 0);
  };

  const toolbarButtons = [
    { icon: Bold, label: '굵게', action: () => insertMarkdown('**', '**') },
    { icon: Italic, label: '기울임', action: () => insertMarkdown('_', '_') },
    { icon: List, label: '목록', action: () => insertMarkdown('- ') },
    { icon: Hash, label: '제목', action: () => insertMarkdown('## ') },
    { icon: Link, label: '링크', action: () => insertMarkdown('[', '](url)') },
  ];

  return (
    <div className="card">
      {/* 제목 입력 */}
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          제목
        </label>
        <input
          id="title"
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="생각의 제목을 입력하세요"
          className="input-field text-lg font-semibold"
          readOnly={readOnly}
        />
      </div>

      {/* 툴바 */}
      {!readOnly && (
        <div className="flex items-center space-x-1 mb-2 p-2 bg-gray-50 rounded-lg">
          {toolbarButtons.map((btn, idx) => {
            const Icon = btn.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={btn.action}
                title={btn.label}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded transition-colors"
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
          <div className="flex-1" />
          <span className="text-xs text-gray-500">Markdown 지원</span>
        </div>
      )}

      {/* 내용 입력 */}
      <div className="mb-4">
        <label htmlFor="content-editor" className="block text-sm font-medium text-gray-700 mb-2">
          내용
        </label>
        <textarea
          id="content-editor"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="당신의 생각을 자유롭게 적어보세요..."
          className="textarea-field min-h-[400px] font-mono text-sm"
          readOnly={readOnly}
        />
      </div>

      {/* 통계 정보 */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{wordCount} 단어</span>
          <span>{charCount} 글자</span>
        </div>
        <div className="flex items-center space-x-1">
          <FileText className="w-4 h-4" />
          <span>Markdown</span>
        </div>
      </div>
    </div>
  );
}
