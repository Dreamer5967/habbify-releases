import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import { useAuthStore } from './authStore'

export interface JournalEntry {
 id: string
 profileId: string
 date: string
 title: string
 content: string
 mood: 'excellent' | 'good' | 'okay' | 'bad' | 'terrible'
 tags?: string[]
 createdAt: string
 updatedAt: string
}

interface JournalState {
 entries: JournalEntry[]
 setEntries: (entries: JournalEntry[]) => void
 addEntry: (entry: JournalEntry) => void
 updateEntry: (id: string, updates: Partial<JournalEntry>) => void
 deleteEntry: (id: string) => void
 getEntryByDate: (profileId: string, date: string) => JournalEntry | null
 getEntriesByMonth: (profileId: string, year: number, month: number) => JournalEntry[]
 loadEntries: (profileId: string) => void
 getTodayEntry: (profileId: string) => JournalEntry | null
}

export const useJournalStore = create<JournalState>((set, get) => ({
 entries: [],

 setEntries: (entries) => set({ entries}),

 addEntry: (entry) => {
 set((state) => {
 const newEntries = [...state.entries, entry]
 localStorage.setItem(`journal_${entry.profileId}`, JSON.stringify(newEntries))
 return { entries: newEntries}
})
},

 updateEntry: (id, updates) => {
 set((state) => {
 const newEntries = state.entries.map((e) => {
 if (e.id === id) {
 return { ...e, ...updates, updatedAt: getTrueDate().toISOString()}
}
 return e
})
 if (newEntries.length > 0) {
 localStorage.setItem(`journal_${newEntries[0].profileId}`, JSON.stringify(newEntries))
}
 return { entries: newEntries}
})
},

 deleteEntry: (id) => {
    set((state) => {
      const newEntries = state.entries.filter((e) => e.id !== id)
      if (state.entries.length > 0) {
        localStorage.setItem(`journal_${state.entries[0].profileId}`, JSON.stringify(newEntries))
      }
      useAuthStore.getState().deleteCloudDoc('journal', id)
      return { entries: newEntries}
    })
  },

 getEntryByDate: (profileId, date) => {
 return get().entries.find((e) => e.profileId === profileId && e.date === date) || null
},

 getEntriesByMonth: (profileId, year, month) => {
 return get().entries.filter((e) => {
 const entryDate = new Date(e.date)
 return (
 e.profileId === profileId &&
 entryDate.getFullYear() === year &&
 entryDate.getMonth() === month
 )
})
},

 loadEntries: (profileId: string) => {
 const stored = localStorage.getItem(`journal_${profileId}`)
 if (stored) {
 try {
 const entries = JSON.parse(stored)
 set({ entries})
} catch (e) {
 console.error('Failed to load journal entries:', e)
}
}
},

 getTodayEntry: (profileId) => {
 const today = getTrueTodayString()
 return get().getEntryByDate(profileId, today)
},
}))
