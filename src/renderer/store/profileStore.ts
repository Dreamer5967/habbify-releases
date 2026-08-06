import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'

export interface Profile {
 id: string
 name: string
 avatar?: string
 photoURL?: string
 xp: number
 level: number
 createdAt: string
 updatedAt: string
}

interface ProfileState {
 profiles: Profile[]
 currentProfile: Profile | null
 setProfiles: (profiles: Profile[]) => void
 setCurrentProfile: (profile: Profile | null) => void
 addProfile: (profile: Profile) => void
 updateProfile: (id: string, updates: Partial<Profile>) => void
 deleteProfile: (id: string) => void
  addXP: (idOrXp: string | number, xpAmount?: number) => void
 loadProfiles: () => void
 loadProfile: (id: string) => Profile | null
}

export const useProfileStore = create<ProfileState>((set, get) => ({
 profiles: [],
 currentProfile: null,

 setProfiles: (profiles) => {
 console.log('Setting profiles:', profiles)
 set({ profiles})
 localStorage.setItem('profiles', JSON.stringify(profiles))
},

 setCurrentProfile: (profile) => {
 console.log('Setting current profile:', profile)
 set({ currentProfile: profile})
 if (profile) {
 localStorage.setItem('currentProfileId', profile.id)
 // Also add to profiles list if not already there
 const state = get()
 if (!state.profiles.find(p => p.id === profile.id)) {
 const newProfiles = [...state.profiles, profile]
 localStorage.setItem('profiles', JSON.stringify(newProfiles))
 set({ profiles: newProfiles})
}
}
},

 loadProfiles: () => {
 const stored = localStorage.getItem('profiles')
 console.log('Loading profiles from storage:', stored)
 if (stored) {
 try {
 const profiles = JSON.parse(stored)
 console.log('Loaded profiles:', profiles)
 set({ profiles})
} catch (e) {
 console.error('Failed to load profiles:', e)
}
}
},

 loadProfile: (id: string) => {
 const stored = localStorage.getItem('profiles')
 console.log('Loading profile', id, 'from storage:', stored)
 if (stored) {
 try {
 const profiles = JSON.parse(stored)
 const profile = profiles.find((p: Profile) => p.id === id)
 console.log('Found profile:', profile)
 if (profile) {
 set({ currentProfile: profile})
 return profile
}
} catch (e) {
 console.error('Failed to load profile:', e)
}
}
 return null
},

 addProfile: (profile) => {
 console.log('Adding profile:', profile)
 set((state) => {
 const newProfiles = [...state.profiles, profile]
 localStorage.setItem('profiles', JSON.stringify(newProfiles))
 return { profiles: newProfiles}
})
},

 updateProfile: (id, updates) => {
 set((state) => {
 const newProfiles = state.profiles.map((p) => {
 if (p.id === id) {
 return { ...p, ...updates, updatedAt: getTrueDate().toISOString()}
}
 return p
})
 localStorage.setItem('profiles', JSON.stringify(newProfiles))

 const updatedCurrent = state.currentProfile?.id === id
 ? { ...state.currentProfile, ...updates, updatedAt: getTrueDate().toISOString()}
 : state.currentProfile

 return {
 profiles: newProfiles,
 currentProfile: updatedCurrent,
}
})
},

 deleteProfile: (id) => {
 set((state) => {
 const newProfiles = state.profiles.filter((p) => p.id !== id)
 localStorage.setItem('profiles', JSON.stringify(newProfiles))
 return {
 profiles: newProfiles,
 currentProfile: state.currentProfile?.id === id ? null : state.currentProfile,
}
})
},

  addXP: (idOrXp, xpAmount) => {
    const state = get()
    const targetId = typeof idOrXp === 'string' ? idOrXp : state.currentProfile?.id
    const amount = typeof idOrXp === 'number' ? idOrXp : (xpAmount || 0)

    if (!targetId || !amount) return

    set((state) => {
      const newProfiles = state.profiles.map((p) => {
        if (p.id === targetId) {
          const newXP = (p.xp || 0) + amount
          const newLevel = Math.floor(newXP / 200) + 1
          return { ...p, xp: newXP, level: newLevel, updatedAt: getTrueDate().toISOString() }
        }
        return p
      })
      localStorage.setItem('profiles', JSON.stringify(newProfiles))

      let updatedCurrent = state.currentProfile;
      if (state.currentProfile?.id === targetId) {
        const newXP = (state.currentProfile.xp || 0) + amount
        const newLevel = Math.floor(newXP / 200) + 1
        updatedCurrent = { ...state.currentProfile, xp: newXP, level: newLevel, updatedAt: getTrueDate().toISOString() }
        
        // Sync to auth store for cloud leaderboard & friends!
        try {
          const authState = (window as any).__authStore?.getState?.() || (import('./authStore').then(m => m.useAuthStore.getState()).then(a => a.userProfile && a.updateUserProfile({ xp: newXP, level: newLevel })).catch(() => {}));
          if (authState && typeof authState.updateUserProfile === 'function' && authState.userProfile) {
            authState.updateUserProfile({ xp: newXP, level: newLevel });
          }
        } catch (e) {
          console.error('Failed syncing XP to auth store:', e)
        }
      }

      return {
        profiles: newProfiles,
        currentProfile: updatedCurrent,
      }
    })
  },
}))
