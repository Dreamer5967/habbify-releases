import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import * as dbService from '../services/dbService'
import { v4 as uuidv4} from 'uuid'
import { doc, getDoc, setDoc} from 'firebase/firestore'
import { db} from '../config/firebase'

export interface Exercise {
 id: string
 name: string
 sets: string
 reps: string
 weight: string
 completed?: boolean
}

export interface GymDay {
 id: string
 dayName: string // e.g."Day 1","Monday"
 description: string
 exercises: Exercise[]
}

export interface GymPlan {
 id: string
 profileId: string
 days: GymDay[]
 createdAt: string
 updatedAt: string
}

interface GymState {
 plan: GymPlan | null
 loadPlan: (profileId: string) => Promise<void>
 addDay: () => void
 removeDay: (dayId: string) => void
 updateDayDescription: (dayId: string, description: string) => void
 addExercise: (dayId: string, exercise: Omit<Exercise, 'id'>) => void
 removeExercise: (dayId: string, exerciseId: string) => void
 updateExercise: (dayId: string, exerciseId: string, updates: Partial<Exercise>) => void
 toggleExerciseCompletion: (dayId: string, exerciseId: string, completed: boolean) => void
 setFullPlan: (days: Omit<GymDay, 'id'>[]) => void
}

const createEmptyPlan = (profileId: string): GymPlan => ({
 id: uuidv4(),
 profileId,
 days: [
 { id: uuidv4(), dayName: 'Day 1', description: '', exercises: []},
 { id: uuidv4(), dayName: 'Day 2', description: '', exercises: []},
 { id: uuidv4(), dayName: 'Day 3', description: '', exercises: []},
 ],
 createdAt: getTrueDate().toISOString(),
 updatedAt: getTrueDate().toISOString(),
})

// Quick in-memory cache for simplicity, falling back to local storage if not using dbService perfectly
let cachedPlan: GymPlan | null = null;

const saveAndSetPlan = (updatedPlan: GymPlan, set: any) => {
 localStorage.setItem(`gym_plan_${updatedPlan.profileId}`, JSON.stringify(updatedPlan))
 set({ plan: updatedPlan})
 setDoc(doc(db, 'gymPlans', updatedPlan.profileId), updatedPlan).catch(e => console.error('Firebase sync failed', e))
}

export const useGymStore = create<GymState>((set, get) => ({
 plan: null,

 loadPlan: async (profileId: string) => {
 try {
 const planRef = doc(db, 'gymPlans', profileId)
 const planSnap = await getDoc(planRef)
 if (planSnap.exists()) {
 const plan = planSnap.data() as GymPlan
 set({ plan})
 localStorage.setItem(`gym_plan_${profileId}`, JSON.stringify(plan))
 return
}
} catch (e) {
 console.error('Failed to load plan from cloud:', e)
}

 // Attempt to load from localStorage first since it's a new feature
 const saved = localStorage.getItem(`gym_plan_${profileId}`)
 if (saved) {
 const plan = JSON.parse(saved)
 set({ plan})
 try {
 await setDoc(doc(db, 'gymPlans', profileId), plan)
} catch (e) {}
} else {
 const newPlan = createEmptyPlan(profileId)
 localStorage.setItem(`gym_plan_${profileId}`, JSON.stringify(newPlan))
 set({ plan: newPlan})
 try {
 await setDoc(doc(db, 'gymPlans', profileId), newPlan)
} catch (e) {}
}
},

 addDay: () => set(state => {
 if (!state.plan) return state
 const newDay: GymDay = {
 id: uuidv4(),
 dayName:`Day ${state.plan.days.length + 1}`,
 description: '',
 exercises: []
}
 const updatedPlan = { ...state.plan, days: [...state.plan.days, newDay], updatedAt: getTrueDate().toISOString()}
 saveAndSetPlan(updatedPlan, set)
 return { plan: updatedPlan}
}),

 removeDay: (dayId: string) => set(state => {
 if (!state.plan) return state
 const updatedDays = state.plan.days.filter(d => d.id !== dayId)
 // Re-number days
 const renumbered = updatedDays.map((d, i) => ({ ...d, dayName:`Day ${i + 1}`}))
 const updatedPlan = { ...state.plan, days: renumbered, updatedAt: getTrueDate().toISOString()}
 saveAndSetPlan(updatedPlan, set)
 return { plan: updatedPlan}
}),

 updateDayDescription: (dayId: string, description: string) => set(state => {
 if (!state.plan) return state
 const updatedDays = state.plan.days.map(d => 
 d.id === dayId ? { ...d, description} : d
 )
 const updatedPlan = { ...state.plan, days: updatedDays, updatedAt: getTrueDate().toISOString()}
 saveAndSetPlan(updatedPlan, set)
 return { plan: updatedPlan}
}),

 addExercise: (dayId: string, exercise) => set(state => {
 if (!state.plan) return state
 const newExercise = { ...exercise, id: uuidv4()}
 const updatedDays = state.plan.days.map(d => 
 d.id === dayId ? { ...d, exercises: [...d.exercises, newExercise]} : d
 )
 const updatedPlan = { ...state.plan, days: updatedDays, updatedAt: getTrueDate().toISOString()}
 saveAndSetPlan(updatedPlan, set)
 return { plan: updatedPlan}
}),

 removeExercise: (dayId: string, exerciseId: string) => set(state => {
 if (!state.plan) return state
 const updatedDays = state.plan.days.map(d => 
 d.id === dayId ? { ...d, exercises: d.exercises.filter(e => e.id !== exerciseId)} : d
 )
 const updatedPlan = { ...state.plan, days: updatedDays, updatedAt: getTrueDate().toISOString()}
 saveAndSetPlan(updatedPlan, set)
 return { plan: updatedPlan}
}),

 updateExercise: (dayId: string, exerciseId: string, updates: Partial<Exercise>) => set(state => {
 if (!state.plan) return state
 const updatedDays = state.plan.days.map(d => 
 d.id === dayId ? { 
 ...d, 
 exercises: d.exercises.map(e => e.id === exerciseId ? { ...e, ...updates} : e)
} : d
 )
 const updatedPlan = { ...state.plan, days: updatedDays, updatedAt: getTrueDate().toISOString()}
 saveAndSetPlan(updatedPlan, set)
 return { plan: updatedPlan}
}),

 toggleExerciseCompletion: (dayId: string, exerciseId: string, completed: boolean) => set(state => {
 if (!state.plan) return state
 const updatedDays = state.plan.days.map(d => 
 d.id === dayId ? { 
 ...d, 
 exercises: d.exercises.map(e => e.id === exerciseId ? { ...e, completed} : e)
} : d
 )
 const updatedPlan = { ...state.plan, days: updatedDays, updatedAt: getTrueDate().toISOString()}
 saveAndSetPlan(updatedPlan, set)
 return { plan: updatedPlan}
}),

 setFullPlan: (daysInput) => set(state => {
 if (!state.plan) return state
 
 const newDays: GymDay[] = daysInput.map(d => ({
 id: uuidv4(),
 dayName: d.dayName,
 description: d.description || '',
 exercises: d.exercises.map(e => ({
 id: uuidv4(),
 name: e.name || '',
 sets: e.sets || '',
 reps: e.reps || '',
 weight: e.weight || '',
 completed: false
}))
}))

 const updatedPlan = { ...state.plan, days: newDays, updatedAt: getTrueDate().toISOString()}
 saveAndSetPlan(updatedPlan, set)
 return { plan: updatedPlan}
})
}))
