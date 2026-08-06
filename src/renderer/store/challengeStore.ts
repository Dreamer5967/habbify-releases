import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'

export interface Challenge {
 id: string
 profileId: string
 name: string
 description: string
 icon: string
 difficulty: 'easy' | 'medium' | 'hard'
 duration: number
 startDate: string
 endDate: string
 isCompleted: boolean
 progress: number
 targetValue: number
 reward: number
 createdAt: string
}

export const CHALLENGE_TEMPLATES = {
 SEVENTY_FIVE_HARD: {
 name: '75 Hard',
 description: 'Complete 2+ habits every day for 75 days straight. No days off!',
 icon: '💪',
 difficulty: 'hard' as const,
 duration: 75,
 targetValue: 75,
 reward: 500,
},
 THIRTY_DAY_SPRINT: {
 name: '30 Day Sprint',
 description: 'Complete your habits for 30 consecutive days',
 icon: '🏃',
 difficulty: 'medium' as const,
 duration: 30,
 targetValue: 30,
 reward: 250,
},
 DIGITAL_DETOX: {
 name: 'Digital Detox',
 description: 'Reduce screen time and complete wellness habits for 14 days',
 icon: '📵',
 difficulty: 'medium' as const,
 duration: 14,
 targetValue: 14,
 reward: 150,
},
 MORNING_CHAMPION: {
 name: 'Morning Champion',
 description: 'Complete morning habits for 7 consecutive days before 9 AM',
 icon: '🌅',
 difficulty: 'easy' as const,
 duration: 7,
 targetValue: 7,
 reward: 100,
},
 FITNESS_WARRIOR: {
 name: 'Fitness Warrior',
 description: 'Complete fitness habits 5 days a week for 4 weeks',
 icon: '🏋️',
 difficulty: 'medium' as const,
 duration: 28,
 targetValue: 20,
 reward: 200,
},
 MEDITATION_MASTER: {
 name: 'Meditation Master',
 description: 'Meditate for 21 consecutive days',
 icon: '🧘',
 difficulty: 'medium' as const,
 duration: 21,
 targetValue: 21,
 reward: 180,
},
 READING_CRUSADE: {
 name: 'Reading Crusade',
 description: 'Read daily for 30 days',
 icon: '📚',
 difficulty: 'medium' as const,
 duration: 30,
 targetValue: 30,
 reward: 220,
},
}

interface ChallengeState {
 challenges: Challenge[]
 setChallenges: (challenges: Challenge[]) => void
 addChallenge: (challenge: Challenge) => void
 createChallenge: (challenge: Challenge) => void // Alias for addChallenge
 updateChallenge: (id: string, updates: Partial<Challenge>) => void
 deleteChallenge: (id: string) => void
 completeChallenge: (id: string) => void
 updateProgress: (id: string, progress: number) => void
 // New method: increment progress by amount
 progressChallenge: (id: string, amount: number) => void
 getActiveChallenges: (profileId: string) => Challenge[]
 getCompletedChallenges: (profileId: string) => Challenge[]
 loadChallenges: (profileId: string) => void
}

export const useChallengeStore = create<ChallengeState>((set, get) => ({
 challenges: [],
 
 setChallenges: (challenges) => set({ challenges}),
 
 addChallenge: (challenge) => {
 set((state) => {
 const newChallenges = [...state.challenges, challenge]
 localStorage.setItem(`challenges_${challenge.profileId}`, JSON.stringify(newChallenges))
 return { challenges: newChallenges}
})
},
 // Alias createChallenge to addChallenge for backward compatibility
 createChallenge: (challenge) => {
 // Reuse addChallenge logic
 const add = get().addChallenge
 add(challenge)
},
 
 updateChallenge: (id, updates) => {
 set((state) => {
 const newChallenges = state.challenges.map((c) => (c.id === id ? { ...c, ...updates} : c))
 if (newChallenges.length > 0) {
 localStorage.setItem(`challenges_${newChallenges[0].profileId}`, JSON.stringify(newChallenges))
}
 return { challenges: newChallenges}
})
},
 
 deleteChallenge: (id) => {
 set((state) => {
 const newChallenges = state.challenges.filter((c) => c.id !== id)
 if (newChallenges.length > 0) {
 localStorage.setItem(`challenges_${newChallenges[0].profileId}`, JSON.stringify(newChallenges))
}
 return { challenges: newChallenges}
})
},
 
 completeChallenge: (id) => {
 set((state) => ({
 challenges: state.challenges.map((c) => (c.id === id ? { ...c, isCompleted: true, progress: 100} : c)),
}))
},
 
 updateProgress: (id, progress) => {
 set((state) => ({
 challenges: state.challenges.map((c) => (c.id === id ? { ...c, progress} : c)),
}))
},
 // Increment progress by amount (used by UI)
 progressChallenge: (id, amount) => {
 // Retrieve current progress and add amount
 const current = get().challenges.find(c => c.id === id)
 const newProgress = (current?.progress ?? 0) + amount
 // Reuse updateProgress to set and persist
 get().updateProgress(id, newProgress)
 // Also persist the updated challenges list to localStorage
 const updated = get().challenges
 if (updated.length > 0) {
 localStorage.setItem(
`challenges_${updated[0].profileId}`,
 JSON.stringify(updated)
 )
}
},
 
 getActiveChallenges: (profileId) => {
 return get().challenges.filter(
 (c) => c.profileId === profileId && !c.isCompleted && new Date(c.endDate) > getTrueDate()
 )
},
 
 getCompletedChallenges: (profileId) => {
 return get().challenges.filter((c) => c.profileId === profileId && c.isCompleted)
},
 
 loadChallenges: (profileId: string) => {
 const stored = localStorage.getItem(`challenges_${profileId}`)
 if (stored) {
 try {
 const challenges = JSON.parse(stored)
 set({ challenges})
} catch (e) {
 console.error('Failed to load challenges:', e)
}
}
},
}))
