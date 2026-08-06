import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'

export interface TimerSession {
 id: string
 habitId?: string
 duration: number
 elapsed: number
 isRunning: boolean
 startTime?: string
 endTime?: string
 type: 'work' | 'break'
}

interface TimerState {
 sessions: TimerSession[]
 currentSession: TimerSession | null
 setCurrentSession: (session: TimerSession | null) => void
 addSession: (session: TimerSession) => void
 updateSession: (id: string, updates: Partial<TimerSession>) => void
 startTimer: (id: string) => void
 pauseTimer: (id: string) => void
 stopTimer: (id: string) => void
 resetTimer: (id: string) => void
 completeSession: (id: string) => void
}

export const useTimerStore = create<TimerState>((set) => ({
 sessions: [],
 currentSession: null,
 setCurrentSession: (session) => set({ currentSession: session}),
 addSession: (session) => set((state) => ({ sessions: [...state.sessions, session]})),
 updateSession: (id, updates) => set((state) => ({
 sessions: state.sessions.map((s) => (s.id === id ? { ...s, ...updates} : s)),
 currentSession: state.currentSession?.id === id ? { ...state.currentSession, ...updates} : state.currentSession,
})),
 startTimer: (id) => set((state) => ({
 sessions: state.sessions.map((s) => (s.id === id ? { ...s, isRunning: true, startTime: getTrueDate().toISOString()} : s)),
})),
 pauseTimer: (id) => set((state) => ({
 sessions: state.sessions.map((s) => (s.id === id ? { ...s, isRunning: false} : s)),
})),
 stopTimer: (id) => set((state) => ({
 sessions: state.sessions.map((s) => (s.id === id ? { ...s, isRunning: false, elapsed: 0} : s)),
})),
 resetTimer: (id) => set((state) => ({
 sessions: state.sessions.map((s) => (s.id === id ? { ...s, elapsed: 0, isRunning: false} : s)),
})),
 completeSession: (id) => set((state) => ({
 sessions: state.sessions.map((s) => (s.id === id ? { ...s, isRunning: false, endTime: getTrueDate().toISOString()} : s)),
})),
}))
