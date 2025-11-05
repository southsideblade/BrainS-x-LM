import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Note {
  id: number;
  title: string;
  content: string;
  summary?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

interface AppState {
  // 노트 관련
  notes: Note[];
  selectedNoteId: number | null;
  isLoading: boolean;
  
  // 검색 관련
  searchQuery: string;
  
  // UI 상태
  isSidebarOpen: boolean;
  isGraphFullscreen: boolean;
  
  // 액션
  setNotes: (notes: Note[]) => void;
  addNote: (note: Note) => void;
  updateNote: (id: number, note: Partial<Note>) => void;
  deleteNote: (id: number) => void;
  selectNote: (id: number | null) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  toggleSidebar: () => void;
  toggleGraphFullscreen: () => void;
  
  // 필터된 노트 getter
  getFilteredNotes: () => Note[];
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      notes: [],
      selectedNoteId: null,
      isLoading: false,
      searchQuery: '',
      isSidebarOpen: true,
      isGraphFullscreen: false,
      
      // 액션 구현
      setNotes: (notes) => set({ notes }),
      
      addNote: (note) => set((state) => ({
        notes: [note, ...state.notes]
      })),
      
      updateNote: (id, updatedNote) => set((state) => ({
        notes: state.notes.map(note => 
          note.id === id ? { ...note, ...updatedNote } : note
        )
      })),
      
      deleteNote: (id) => set((state) => ({
        notes: state.notes.filter(note => note.id !== id),
        selectedNoteId: state.selectedNoteId === id ? null : state.selectedNoteId
      })),
      
      selectNote: (id) => set({ selectedNoteId: id }),
      
      setLoading: (loading) => set({ isLoading: loading }),
      
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      toggleSidebar: () => set((state) => ({
        isSidebarOpen: !state.isSidebarOpen
      })),
      
      toggleGraphFullscreen: () => set((state) => ({
        isGraphFullscreen: !state.isGraphFullscreen
      })),
      
      // 필터된 노트 getter
      getFilteredNotes: () => {
        const { notes, searchQuery } = get();
        if (!searchQuery) return notes;
        
        const query = searchQuery.toLowerCase();
        return notes.filter(note => 
          note.title.toLowerCase().includes(query) ||
          note.content?.toLowerCase().includes(query) ||
          note.tags?.some(tag => tag.toLowerCase().includes(query))
        );
      },
    }),
    {
      name: 'brainsxlm-storage',
      partialize: (state) => ({
        isSidebarOpen: state.isSidebarOpen,
        searchQuery: state.searchQuery,
      }),
    }
  )
);
