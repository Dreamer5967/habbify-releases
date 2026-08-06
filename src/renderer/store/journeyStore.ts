import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'

export interface Milestone {
 id: string
 title: string
 description?: string
 completed: boolean
 estimatedDays: number
}

export interface Journey {
 id: string
 profileId: string
 title: string
 description: string
 milestones: Milestone[]
 linkedHabits: string[] // IDs of habits created for this journey
 status: 'planned' | 'active' | 'completed' | 'archived'
 createdAt: string
 updatedAt: string
}

interface JourneyState {
 journeys: Journey[]
 setJourneys: (journeys: Journey[]) => void
 addJourney: (journey: Journey) => void
 updateJourney: (id: string, updates: Partial<Journey>) => void
 removeJourney: (id: string) => void
 toggleMilestone: (journeyId: string, milestoneId: string) => void
 loadJourneys: (profileId: string) => void
}

export const useJourneyStore = create<JourneyState>((set, get) => ({
 journeys: [],

 setJourneys: (journeys) => set({ journeys}),

 addJourney: (journey) => {
 set((state) => {
 const newJourneys = [...state.journeys, journey]
 localStorage.setItem(`journeys_${journey.profileId}`, JSON.stringify(newJourneys))
 return { journeys: newJourneys}
})
},

 updateJourney: (id, updates) => {
 set((state) => {
 const newJourneys = state.journeys.map((j) => 
 j.id === id ? { ...j, ...updates, updatedAt: getTrueDate().toISOString()} : j
 )
 if (newJourneys.length > 0) {
 localStorage.setItem(`journeys_${newJourneys[0].profileId}`, JSON.stringify(newJourneys))
}
 return { journeys: newJourneys}
})
},

 removeJourney: (id) => {
 set((state) => {
 const newJourneys = state.journeys.filter((j) => j.id !== id)
 if (state.journeys.length > 0) {
 localStorage.setItem(`journeys_${state.journeys[0].profileId}`, JSON.stringify(newJourneys))
}
 return { journeys: newJourneys}
})
},

 toggleMilestone: (journeyId, milestoneId) => {
 set((state) => {
 const newJourneys = state.journeys.map((j) => {
 if (j.id === journeyId) {
 const updatedMilestones = j.milestones.map(m => 
 m.id === milestoneId ? { ...m, completed: !m.completed} : m
 )
 
 // Check if all milestones are completed
 const allCompleted = updatedMilestones.every(m => m.completed)
 const newStatus = allCompleted ? 'completed' : j.status

 return { 
 ...j, 
 milestones: updatedMilestones, 
 status: newStatus,
 updatedAt: getTrueDate().toISOString() 
}
}
 return j
})
 if (newJourneys.length > 0) {
 localStorage.setItem(`journeys_${newJourneys[0].profileId}`, JSON.stringify(newJourneys))
}
 return { journeys: newJourneys}
})
},

 loadJourneys: (profileId: string) => {
 const saved = localStorage.getItem(`journeys_${profileId}`)
 if (saved) {
 set({ journeys: JSON.parse(saved)})
} else {
 set({ journeys: []})
}
}
}))
