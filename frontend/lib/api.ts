import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// API 인스턴스 생성
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30초 타임아웃
});

// 에러 메시지 추출
const getErrorMessage = (error: any): string => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return '알 수 없는 오류가 발생했습니다.';
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // 토큰이 있으면 추가 (향후 인증 구현 시)
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const message = getErrorMessage(error);
    
    // 네트워크 에러
    if (!error.response) {
      toast.error('네트워크 연결을 확인해주세요.');
      return Promise.reject(error);
    }
    
    // 401 Unauthorized
    if (error.response.status === 401) {
      localStorage.removeItem('token');
      // 로그인 페이지로 리다이렉트 (향후 구현)
    }
    
    // 429 Too Many Requests
    if (error.response.status === 429) {
      toast.error('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.');
      return Promise.reject(error);
    }
    
    // 500 Server Error
    if (error.response.status >= 500) {
      toast.error('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
      return Promise.reject(error);
    }
    
    // 기타 에러
    toast.error(message);
    return Promise.reject(error);
  }
);

// Note API 타입 정의
interface Note {
  id: number;
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface AnalyzeResponse {
  summary: string;
  keywords: string[];
  main_topics: string[];
}

interface SimilarNote {
  id: number;
  title: string;
  summary?: string;
  similarity_score: number;
  tags?: string[];
}

interface GraphData {
  nodes: Array<{
    id: string;
    label: string;
    group?: string;
    size?: number;
  }>;
  edges: Array<{
    source: string;
    target: string;
    weight: number;
  }>;
}

interface InsightResponse {
  insight: string;
  related_topics: string[];
  suggested_connections: any[];
}

// Note APIs
export const noteApi = {
  // 노트 생성
  create: async (title: string, content: string): Promise<Note> => {
    const response = await api.post('/api/notes/create', { title, content });
    return response.data;
  },

  // 노트 목록
  list: async (skip = 0, limit = 20): Promise<Note[]> => {
    const response = await api.get('/api/notes/list', {
      params: { skip, limit },
    });
    return response.data;
  },

  // 특정 노트 조회
  get: async (id: number): Promise<Note> => {
    const response = await api.get(`/api/notes/${id}`);
    return response.data;
  },

  // 노트 수정
  update: async (id: number, data: { title?: string; content?: string }): Promise<Note> => {
    const response = await api.put(`/api/notes/${id}`, data);
    return response.data;
  },

  // 노트 삭제
  delete: async (id: number): Promise<void> => {
    await api.delete(`/api/notes/${id}`);
  },

  // AI 분석
  analyze: async (content: string): Promise<AnalyzeResponse> => {
    const response = await api.post('/api/notes/analyze', { content });
    return response.data;
  },

  // 유사 노트 검색
  findSimilar: async (query: string, limit = 5): Promise<{ similar_notes: SimilarNote[] }> => {
    const response = await api.post('/api/notes/similar', null, {
      params: { query, limit },
    });
    return response.data;
  },

  // 그래프 데이터
  getGraphData: async (limit = 50): Promise<GraphData> => {
    const response = await api.get('/api/notes/graph/data', {
      params: { limit },
    });
    return response.data;
  },

  // 인사이트 생성
  generateInsight: async (noteIds: number[]): Promise<InsightResponse> => {
    const response = await api.post('/api/notes/insight', {
      note_ids: noteIds,
    });
    return response.data;
  },
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.data.status === 'ok';
  } catch {
    return false;
  }
};

export default api;
