import { create } from 'zustand';

export interface Player {
  id: string;
  name: string;
}

interface MatchState {
  matchId: string | null;
  status: string | null;
  fen: string;
  pgn: string;
  myColor: 'white' | 'black' | null;
  turn: 'white' | 'black';
  whitePlayer: Player | null;
  blackPlayer: Player | null;
  whiteTimeMs: number;
  blackTimeMs: number;
  result: string | null;
  resultReason: string | null;
  winnerName: string | null;
  
  // Actions
  setMatchState: (data: Partial<MatchState>) => void;
  updateTime: (whiteTimeMs: number, blackTimeMs: number) => void;
  reset: () => void;
}

const initialState = {
  matchId: null,
  status: null,
  fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
  pgn: '',
  myColor: null,
  turn: 'white' as const,
  whitePlayer: null,
  blackPlayer: null,
  whiteTimeMs: 0,
  blackTimeMs: 0,
  result: null,
  resultReason: null,
  winnerName: null,
};

export const useMatchStore = create<MatchState>((set) => ({
  ...initialState,
  setMatchState: (data) => set((state) => ({ ...state, ...data })),
  updateTime: (whiteTimeMs, blackTimeMs) => set({ whiteTimeMs, blackTimeMs }),
  reset: () => set(initialState),
}));
