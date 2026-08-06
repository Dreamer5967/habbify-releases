import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import { useAuthStore } from './authStore'

export interface Routine {
 id: string
 profileId: string
 title: string
 description?: string
 frequency: 'daily' | 'weekly' | 'custom'
 lastCompletedDate?: string // ISO date
 streak: number
 createdAt: string
 updatedAt: string
}

interface RoutineState {
 routines: Routine[]
 setRoutines: (routines: Routine[]) => void
 addRoutine: (routine: Routine) => void
 updateRoutine: (id: string, updates: Partial<Routine>) => void
 removeRoutine: (id: string) => void
 loadRoutines: (profileId: string) => void
}

export const useRoutineStore = create<RoutineState>((set, get) => ({
 routines: [],

 setRoutines: (routines) => set({ routines}),

 addRoutine: (routine) => {
 set((state) => {
 const newRoutines = [...state.routines, routine]
 localStorage.setItem(`routines_${routine.profileId}`, JSON.stringify(newRoutines))
 return { routines: newRoutines}
})
},

 updateRoutine: (id, updates) => {
 set((state) => {
 const newRoutines = state.routines.map((r) => (r.id === id ? { ...r, ...updates, updatedAt: getTrueDate().toISOString()} : r))
 if (newRoutines.length > 0) {
 localStorage.setItem(`routines_${newRoutines[0].profileId}`, JSON.stringify(newRoutines))
}
 return { routines: newRoutines}
})
},

 removeRoutine: (id) => {
    set((state) => {
      const newRoutines = state.routines.filter((r) => r.id !== id)
      if (state.routines.length > 0) {
        localStorage.setItem(`routines_${state.routines[0].profileId}`, JSON.stringify(newRoutines))
      }
      useAuthStore.getState().deleteCloudDoc('routines', id)
      return { routines: newRoutines}
    })
  },

 loadRoutines: (profileId) => {
 const stored = localStorage.getItem(`routines_${profileId}`)
 if (stored) {
 try {
 const routines = JSON.parse(stored)
 set({ routines})
} catch (e) {
 console.error('Failed to load routines:', e)
}
}
},
}))
