import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'

export interface Achievement {
 id: string
 profileId: string
 name: string
 description: string
 icon: string
 criteria: string
 unlockedAt?: string
 points: number
 color?: string
}

export const BADGE_DEFINITIONS = {
 // Streak badges
 STREAK_3: { id: 'streak_3', name: 'Getting Started', description: 'Achieve a 3-day streak', icon: '🔥', criteria: 'streak_3', points: 10},
 STREAK_7: { id: 'streak_7', name: 'One Week Wonder', description: 'Achieve a 7-day streak', icon: '🔥', criteria: 'streak_7', points: 25},
 STREAK_30: { id: 'streak_30', name: 'Habit Master', description: 'Achieve a 30-day streak', icon: '🎖️', criteria: 'streak_30', points: 50},
 STREAK_100: { id: 'streak_100', name: 'Century Club', description: 'Achieve a 100-day streak', icon: '💯', criteria: 'streak_100', points: 100},
 
 // Completion badges
 COMPLETIONS_10: { id: 'completions_10', name: 'Starter', description: 'Complete 10 habits', icon: '⭐', criteria: 'completions_10', points: 15},
 COMPLETIONS_50: { id: 'completions_50', name: 'Dedicated', description: 'Complete 50 habits', icon: '⭐', criteria: 'completions_50', points: 40},
 COMPLETIONS_100: { id: 'completions_100', name: 'Unstoppable', description: 'Complete 100 habits', icon: '🌟', criteria: 'completions_100', points: 75},
 
 // Level badges
 LEVEL_5: { id: 'level_5', name: 'Rising Star', description: 'Reach Level 5', icon: '⬆️', criteria: 'level_5', points: 30},
 LEVEL_10: { id: 'level_10', name: 'Legend', description: 'Reach Level 10', icon: '👑', criteria: 'level_10', points: 75},
 
 // Habit badges
 HABITS_5: { id: 'habits_5', name: 'Multitasker', description: 'Track 5 habits simultaneously', icon: '🎯', criteria: 'habits_5', points: 20},
 HABITS_10: { id: 'habits_10', name: 'Overachiever', description: 'Track 10 habits simultaneously', icon: '🚀', criteria: 'habits_10', points: 50},

 // Special badges
 pomodoro_master: { id: 'pomodoro_master', name: 'Pomodoro Master', description: 'Complete 10 focus sessions', icon: 'Brain', color: 'bg-purple-500', criteria: 'focus_10', points: 30},
 wealth_builder: { id: 'wealth_builder', name: 'Wealth Builder', description: 'Log 50 finance entries', icon: 'DollarSign', color: 'bg-emerald-500', criteria: 'finance_50', points: 30},
 social_butterfly: { id: 'social_butterfly', name: 'Social Butterfly', description: 'Add 5 friends', icon: 'Users', color: 'bg-blue-500', criteria: 'friends_5', points: 30},
 journal_keeper: { id: 'journal_keeper', name: 'Journal Keeper', description: 'Write 20 journal entries', icon: 'BookOpen', color: 'bg-indigo-500', criteria: 'journal_20', points: 30},
}

interface AchievementState {
 achievements: Achievement[]
 unlockedBadges: string[] // badge IDs
 setAchievements: (achievements: Achievement[]) => void
 addAchievement: (achievement: Achievement) => void
 unlockBadge: (profileId: string, badgeId: string) => void
 checkAndUnlockBadges: (profileId: string, stats: any) => string[] // returns newly unlocked badge IDs
 loadAchievements: (profileId: string) => void
 getTotalPoints: () => number
}

export const useAchievementStore = create<AchievementState>((set, get) => ({
 achievements: [],
 unlockedBadges: [],

 setAchievements: (achievements) => set({ achievements}),

 addAchievement: (achievement) => {
 set((state) => {
 const newAchievements = [...state.achievements, achievement]
 localStorage.setItem(`achievements_${achievement.profileId}`, JSON.stringify(newAchievements))
 return { achievements: newAchievements}
})
},

 unlockBadge: (profileId, badgeId) => {
 set((state) => {
 if (state.unlockedBadges.includes(badgeId)) return state
 
 const badge = BADGE_DEFINITIONS[badgeId as keyof typeof BADGE_DEFINITIONS]
 if (!badge) return state

 const newAchievement: Achievement = {
 id:`${badgeId}_${Date.now()}`,
 profileId,
 name: badge.name,
 description: badge.description,
 icon: badge.icon,
 criteria: badge.criteria,
 unlockedAt: getTrueDate().toISOString(),
 points: badge.points,
 color: 'color' in badge ? badge.color : undefined,
}

 const newAchievements = [...state.achievements, newAchievement]
 const newUnlockedBadges = [...state.unlockedBadges, badgeId]
 
 localStorage.setItem(`achievements_${profileId}`, JSON.stringify(newAchievements))
 localStorage.setItem(`unlocked_badges_${profileId}`, JSON.stringify(newUnlockedBadges))
 
 return { achievements: newAchievements, unlockedBadges: newUnlockedBadges}
})
},

 checkAndUnlockBadges: (profileId, stats) => {
 const state = get()
 const newlyUnlocked: string[] = []
 const { maxStreak = 0, totalCompletions = 0, currentLevel = 1, activeHabits = 0} = stats

 const checkBadge = (badgeId: string, condition: boolean) => {
 if (condition && !state.unlockedBadges.includes(badgeId)) {
 state.unlockBadge(profileId, badgeId)
 newlyUnlocked.push(badgeId)
}
}

 checkBadge('streak_3', maxStreak >= 3)
 checkBadge('streak_7', maxStreak >= 7)
 checkBadge('streak_30', maxStreak >= 30)
 checkBadge('streak_100', maxStreak >= 100)
 checkBadge('completions_10', totalCompletions >= 10)
 checkBadge('completions_50', totalCompletions >= 50)
 checkBadge('completions_100', totalCompletions >= 100)
 checkBadge('level_5', currentLevel >= 5)
 checkBadge('level_10', currentLevel >= 10)
 checkBadge('habits_5', activeHabits >= 5)
 checkBadge('habits_10', activeHabits >= 10)

 return newlyUnlocked
},

 loadAchievements: (profileId: string) => {
 const stored = localStorage.getItem(`achievements_${profileId}`)
 const unlockedStored = localStorage.getItem(`unlocked_badges_${profileId}`)
 
 if (stored) {
 try {
 const achievements = JSON.parse(stored)
 set({ achievements})
} catch (e) {
 console.error('Failed to load achievements:', e)
}
}

 if (unlockedStored) {
 try {
 const unlockedBadges = JSON.parse(unlockedStored)
 set({ unlockedBadges})
} catch (e) {
 console.error('Failed to load unlocked badges:', e)
}
}
},

 getTotalPoints: () => {
 const state = get()
 return state.achievements.reduce((sum, achievement) => sum + achievement.points, 0)
},
}))
