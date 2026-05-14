import { create } from 'zustand';

interface SearchState {
  query: string;
  setQuery: (query: string) => void;
  clearSearch: () => void;
}

export const useSearchStore = create<SearchState>((set) => ({
  query: "",
  setQuery: (query: string) => set({ query }),
  clearSearch: () => set({ query: "" }),
}));
