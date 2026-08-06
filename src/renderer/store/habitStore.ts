import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import { useActivityStore} from './activityStore'
import { useProfileStore} from './profileStore'
import { useAuthStore } from './authStore'

export interface Habit {
 id: string
 profileId: string
 name: string
 description?: string
 icon: string
 color: string
 category: string
 difficulty: 'easy' | 'medium' | 'hard'
 frequency: 'daily' | 'weekly' | 'custom'
 priority: 'high' | 'medium' | 'low'
 tags?: string[]
 currentStreak: number
 longestStreak: number
 totalCompletions: number
 lastCompletedDate?: string
 completionHistory?: string[]
 reminderTime?: string
 isActive: boolean
 isArchived: boolean
 createdAt: string
 updatedAt: string
 journeyId?: string
}

interface HabitState {
 habits: Habit[]
 setHabits: (habits: Habit[]) => void
 addHabit: (habit: Habit) => void
 removeHabit: (id: string) => void
 updateHabit: (id: string, habit: Partial<Habit>) => void
 completeHabit: (id: string) => void
 canCompleteHabit: (id: string) => boolean
 undoCompletion: (id: string) => boolean
 canUndoCompletion: (id: string) => boolean
 loadHabits: (profileId: string) => void
 saveToStorage: () => void
 purgeAllHabits: () => void
}

const getToday = () => {
 const today = getTrueDate()
 return today.toISOString().split('T')[0]
}

export const useHabitStore = create<HabitState>((set, get) => ({
 habits: [],
 setHabits: (habits) => set({ habits}),
 
 loadHabits: (profileId: string) => {
 const stored = localStorage.getItem(`habits_${profileId}`)
 if (stored) {
 try {
 const habits = JSON.parse(stored)
 set({ habits})
} catch (e) {
 console.error('Failed to load habits:', e)
}
}
},

 saveToStorage: () => {
 const state = get()
 if (state.habits.length > 0) {
 const profileId = state.habits[0].profileId
 localStorage.setItem(`habits_${profileId}`, JSON.stringify(state.habits))
}
},

 addHabit: (habit) => {
 set((state) => {
 const newHabits = [...state.habits, habit]
 localStorage.setItem(`habits_${habit.profileId}`, JSON.stringify(newHabits))
 return { habits: newHabits}
})
},

 removeHabit: (id) => {
 set((state) => {
 const habitToRemove = state.habits.find((h) => h.id === id);
 if (!habitToRemove) return { habits: state.habits };
 const newHabits = state.habits.filter((h) => h.id !== id)
 localStorage.setItem(`habits_${habitToRemove.profileId}`, JSON.stringify(newHabits))
 useAuthStore.getState().deleteCloudDoc('habits', id)
 return { habits: newHabits}
})
},

 updateHabit: (id, updates) => {
 set((state) => {
 const newHabits = state.habits.map((h) => {
 if (h.id === id) {
 return { ...h, ...updates, updatedAt: getTrueDate().toISOString()}
}
 return h
})
 if (newHabits.length > 0) {
 localStorage.setItem(`habits_${newHabits[0].profileId}`, JSON.stringify(newHabits))
}
 return { habits: newHabits}
})
},

 canCompleteHabit: (id) => {
 const habit = get().habits.find((h) => h.id === id)
 if (!habit) return false
 const today = getToday()
 return habit.lastCompletedDate !== today
},

 canUndoCompletion: (id) => {
 const habit = get().habits.find((h) => h.id === id)
 if (!habit) return false
 const today = getToday()
 return habit.lastCompletedDate === today
},

 completeHabit: (id) => {
 set((state) => {
 const today = getToday()
 const newHabits = state.habits.map((h) => {
 if (h.id === id && h.lastCompletedDate !== today) {
 return {
 ...h,
 currentStreak: h.currentStreak + 1,
 longestStreak: Math.max(h.longestStreak, h.currentStreak + 1),
 totalCompletions: h.totalCompletions + 1,
 lastCompletedDate: today,
 completionHistory: [...(h.completionHistory || []), today],
 updatedAt: getTrueDate().toISOString(),
}
}
 return h
})
 if (newHabits.length > 0) {
 localStorage.setItem(`habits_${newHabits[0].profileId}`, JSON.stringify(newHabits))
}
 return { habits: newHabits}
})
},

 undoCompletion: (id) => {
 const state = get()
 const habit = state.habits.find((h) => h.id === id)
 const today = getToday()

 if (!habit || habit.lastCompletedDate !== today) return false

 set((state) => {
 const newHabits = state.habits.map((h) => {
 if (h.id === id) {
 return {
 ...h,
 currentStreak: Math.max(0, h.currentStreak - 1),
 totalCompletions: Math.max(0, h.totalCompletions - 1),
 lastCompletedDate: undefined,
 completionHistory: h.completionHistory?.filter(date => date !== today),
 updatedAt: getTrueDate().toISOString(),
}
}
 return h
})
 if (newHabits.length > 0) {
 localStorage.setItem(`habits_${newHabits[0].profileId}`, JSON.stringify(newHabits))
}
 return { habits: newHabits}
})

 return true
},
 purgeAllHabits: () => {
 const profileId = useProfileStore.getState().currentProfile?.id;
 set({ habits: [] });
 if (profileId) {
 localStorage.setItem(`habits_${profileId}`, JSON.stringify([]));
 }
 },
}))
