import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import { useAuthStore } from './authStore'

export interface Goal {
 id: string
 profileId: string
 title: string
 description?: string
 // optional duration in days (kept for backward compatibility)
 durationDays?: number
 // New fields for spreadsheet tracker
 startDate?: string // ISO date (YYYY-MM-DD)
 endDate?: string // ISO date
 checkIns?: Record<string, boolean> // key = ISO date, value = checked
 // UI helper
 showTracker?: boolean
 progress: number // 0-100
 completed: boolean
 tags?: string[]
 createdAt: string
 updatedAt: string
}

interface GoalState {
 goals: Goal[]
 setGoals: (goals: Goal[]) => void
 addGoal: (goal: Goal) => void
 updateGoal: (id: string, updates: Partial<Goal>) => void
 removeGoal: (id: string) => void
 loadGoals: (profileId: string) => void
}

export const useGoalStore = create<GoalState>((set, get) => ({
 goals: [],

 setGoals: (goals) => set({ goals}),

 addGoal: (goal) => {
 const sanitizedGoal = Object.fromEntries(Object.entries(goal).filter(([, v]) => v !== undefined)) as Goal;
 set((state) => {
 const newGoals = [...state.goals, sanitizedGoal];
 localStorage.setItem(`goals_${sanitizedGoal.profileId}`, JSON.stringify(newGoals));
 return { goals: newGoals};
})
},

 updateGoal: (id, updates) => {
 const sanitizedUpdates = Object.fromEntries(Object.entries(updates).filter(([, v]) => v !== undefined));
 set((state) => {
 const newGoals = state.goals.map((g) => (g.id === id ? { ...g, ...sanitizedUpdates, updatedAt: getTrueDate().toISOString()} : g));
 if (newGoals.length > 0) {
 localStorage.setItem(`goals_${newGoals[0].profileId}`, JSON.stringify(newGoals));
}
 return { goals: newGoals};
})
},

 removeGoal: (id) => {
    set((state) => {
      const newGoals = state.goals.filter((g) => g.id !== id)
      if (state.goals.length > 0) {
        localStorage.setItem(`goals_${state.goals[0].profileId}`, JSON.stringify(newGoals))
      }
      useAuthStore.getState().deleteCloudDoc('goals', id)
      return { goals: newGoals}
    })
  },

 loadGoals: (profileId) => {
 const stored = localStorage.getItem(`goals_${profileId}`)
 if (stored) {
 try {
 const goals = JSON.parse(stored)
 set({ goals})
} catch (e) {
 console.error('Failed to load goals:', e)
}
}
},
}))
