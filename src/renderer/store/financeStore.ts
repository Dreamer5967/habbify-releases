import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import { useAuthStore } from './authStore'

export interface FinanceEntry {
 id: string
 profileId: string
 date: string // ISO date
 amount: number // positive for income, negative for expense
 type: 'income' | 'expense'
 category?: string
 notes?: string
 createdAt: string
 updatedAt: string
}

interface FinanceState {
 entries: FinanceEntry[]
 setEntries: (entries: FinanceEntry[]) => void
 addEntry: (entry: FinanceEntry) => void
 updateEntry: (id: string, updates: Partial<FinanceEntry>) => void
 removeEntry: (id: string) => void
 loadEntries: (profileId: string) => void
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
 entries: [],

 setEntries: (entries) => set({ entries}),

 addEntry: (entry) => {
 set((state) => {
 const newEntries = [...state.entries, entry]
 localStorage.setItem(`finance_${entry.profileId}`, JSON.stringify(newEntries))
 return { entries: newEntries}
})
},

 updateEntry: (id, updates) => {
 set((state) => {
 const newEntries = state.entries.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: getTrueDate().toISOString()} : e))
 if (newEntries.length > 0) {
 localStorage.setItem(`finance_${newEntries[0].profileId}`, JSON.stringify(newEntries))
}
 return { entries: newEntries}
})
},

 removeEntry: (id) => {
    set((state) => {
      const newEntries = state.entries.filter((e) => e.id !== id)
      if (state.entries.length > 0) {
        localStorage.setItem(`finance_${state.entries[0].profileId}`, JSON.stringify(newEntries))
      }
      useAuthStore.getState().deleteCloudDoc('finance', id)
      return { entries: newEntries}
    })
  },

 loadEntries: (profileId) => {
 const stored = localStorage.getItem(`finance_${profileId}`)
 if (stored) {
 try {
 const entries = JSON.parse(stored)
 set({ entries})
} catch (e) {
 console.error('Failed to load finance entries:', e)
}
}
},
}))
