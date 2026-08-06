import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import {
 signInWithPopup,
 signInWithCredential,
 GoogleAuthProvider,
 signOut as firebaseSignOut,
 onAuthStateChanged,
 type User,
} from 'firebase/auth'
import { doc, setDoc, getDoc, collection, getDocs, query, where, orderBy, limit, arrayUnion, arrayRemove, updateDoc, deleteDoc } from 'firebase/firestore'
import { auth, db} from '../config/firebase'
import { EmailService} from '../services/EmailService'

export interface UserProfile {
 id: string
 uid: string
 name: string
 email: string
 photoURL?: string
 username?: string
 bio?: string
 level: number
 xp: number
 createdAt: string
 updatedAt: string
 friends?: string[]
 incomingRequests?: string[]
 outgoingRequests?: string[]
}

interface AuthState {
 user: User | null
 userProfile: UserProfile | null
 loading: boolean
 error: string | null
 signInWithGoogle: () => Promise<void>
 signOut: () => Promise<void>
 initializeAuth: () => void
 updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
 syncLocalDataToFirestore: (localData: any) => Promise<void>
 deleteCloudDoc: (collectionName: string, docId: string) => Promise<void>
 loadUserData: () => Promise<any>
 checkUsernameAvailability: (username: string) => Promise<boolean>
 searchUsers: (queryStr: string) => Promise<UserProfile[]>
 sendFriendRequest: (friendId: string) => Promise<void>
 acceptFriendRequest: (friendId: string) => Promise<void>
 rejectFriendRequest: (friendId: string) => Promise<void>
 removeFriend: (friendId: string) => Promise<void>
 getLeaderboard: () => Promise<UserProfile[]>
 getFriendsLeaderboard: () => Promise<UserProfile[]>
 getIncomingRequestsProfiles: () => Promise<UserProfile[]>
}

const googleProvider = new GoogleAuthProvider()
const AUTH_POPUP_TIMEOUT_MS = 8000

function getReadableAuthError(error: unknown): string {
 const message = error instanceof Error ? error.message : String(error)

 if (/API_KEY_HTTP_REFERRER_BLOCKED|referer|referrer/i.test(message)) {
 return 'Google sign-in is blocked by Firebase API key referrer restrictions. Allow this app\'s localhost origin and the Firebase auth domain in Google Cloud/Firebase settings, then try again.'
}

 if (/timed out/i.test(message)) {
 return 'Google sign-in did not complete. Firebase is likely rejecting the request because the API key referrer restrictions or authorized domains are not configured for this app.'
}

 if (/unauthorized-domain/i.test(message)) {
 return 'Google sign-in is not allowed for this domain in Firebase Auth. Add this localhost origin to the authorized domains list and try again.'
}

 return message
}

export const useAuthStore = create<AuthState>((set, get) => ({
 user: null,
 userProfile: null,
 loading: true,
 error: null,

 signInWithGoogle: async () => {
 try {
 set({ error: null, loading: true})

 let result;
 if ((window as any).electron) {
 // Desktop App: Use local proxy server and custom URI scheme
 const config = {
 apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDemoKeyForDevelopment',
 authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'habbify-demo.firebaseapp.com',
 projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'habbify-demo',
 storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'habbify-demo.appspot.com',
 messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '123456789',
 appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:123456789:web:abcdef1234567890',
};
 const port = await (window as any).electron.startAuthServer(config);
 
 const tokenPromise = new Promise<string>((resolve) => {
 (window as any).electron.onAuthCallback((token: string) => resolve(token));
});

 (window as any).electron.openExternal(`http://localhost:${port}/auth.html`);
 
 const idToken = await Promise.race([
 tokenPromise,
 new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Google sign-in timed out.')), 60000))
 ]);

 const credential = GoogleAuthProvider.credential(idToken);
 result = await signInWithCredential(auth, credential);
} else {
 // Web/Dev App: Standard Popup
 const timeoutPromise = new Promise<never>((_, reject) => {
 window.setTimeout(() => {
 reject(new Error('Google sign-in timed out before Firebase responded.'))
}, AUTH_POPUP_TIMEOUT_MS)
})

 result = await Promise.race([
 signInWithPopup(auth, googleProvider),
 timeoutPromise,
 ])
}

 const user = result.user

 // Create or update user profile in Firestore
 const userRef = doc(db, 'users', user.uid)
 const userSnap = await getDoc(userRef)

 if (!userSnap.exists()) {
 // New user - generate default username from email or name
 const baseUsername = user.email ? user.email.split('@')[0] : user.displayName?.replace(/\s+/g, '').toLowerCase() || 'user';
 const uniqueUsername =`${baseUsername}${Math.floor(Math.random() * 1000)}`.toLowerCase();

 const newProfile: UserProfile = {
 id: user.uid,
 uid: user.uid,
 name: user.displayName || 'User',
 username: uniqueUsername,
 email: user.email || '',
 photoURL: user.photoURL || undefined,
 level: 1,
 xp: 0,
 createdAt: getTrueDate().toISOString(),
 updatedAt: getTrueDate().toISOString(),
 friends: [],
}
 await setDoc(userRef, newProfile)
 set({ user, userProfile: newProfile, loading: false})
 
 // Trigger Welcome Email in background
 if (newProfile.email) {
 EmailService.sendWelcomeEmail(newProfile.name, newProfile.email).catch(console.error);
}
} else {
 // Existing user
 const existingProfile = userSnap.data() as UserProfile;
 set({ user, userProfile: existingProfile, loading: false})
 
 // Trigger Login Email (Disabled per user request)
 // if (existingProfile.email) {
 // EmailService.sendLoginEmail(existingProfile.name, existingProfile.email).catch(console.error);
 //}
}

 // Save current user ID to localStorage
 localStorage.setItem('currentUserId', user.uid)
} catch (error: any) {
 const message = error instanceof Error ? error.message : String(error)
 set({ error: getReadableAuthError(error), loading: false})
 throw error
}
},

 signOut: async () => {
 try {
 set({ error: null, loading: true})
 
 const state = get()
 const profile = state.userProfile;
 
 await firebaseSignOut(auth)
 set({ user: null, userProfile: null, loading: false})
 localStorage.removeItem('currentUserId')
 localStorage.clear() // Clear local cache
 
 // Trigger Logout Email (Disabled per user request)
 // if (profile?.email) {
 // EmailService.sendLogoutEmail(profile.name, profile.email).catch(console.error);
 //}
} catch (error: any) {
 set({ error: error.message, loading: false})
 throw error
}
},

  initializeAuth: () => {
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userRef = doc(db, 'users', user.uid)
          const userSnap = await getDoc(userRef)
          let profile = userSnap.exists() ? (userSnap.data() as UserProfile) : null
          if (!profile) {
            profile = {
              id: user.uid,
              uid: user.uid,
              name: user.displayName || user.email?.split('@')[0] || 'User',
              email: user.email || '',
              photoURL: user.photoURL || undefined,
              level: 1,
              xp: 0,
              createdAt: getTrueDate().toISOString(),
              updatedAt: getTrueDate().toISOString(),
              friends: [],
              incomingRequests: [],
              outgoingRequests: [],
            }
          }
          set({ user, userProfile: profile, loading: false })
          localStorage.setItem('currentUserId', user.uid)
        } catch (error) {
          console.error('Failed to load user profile:', error)
          const fallbackProfile: UserProfile = {
            id: user.uid,
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            level: 1,
            xp: 0,
            createdAt: getTrueDate().toISOString(),
            updatedAt: getTrueDate().toISOString(),
            friends: [],
            incomingRequests: [],
            outgoingRequests: [],
          }
          set({ user, userProfile: fallbackProfile, loading: false })
        }
      } else {
        set({ user: null, userProfile: null, loading: false })
        localStorage.removeItem('currentUserId')
      }
    })
  },

 updateUserProfile: async (updates) => {
 try {
 const state = get()
 if (!state.user || !state.userProfile) {
 throw new Error('No user logged in')
}

 const userRef = doc(db, 'users', state.user.uid)
 const updatedProfile = {
 ...state.userProfile,
 ...updates,
 updatedAt: getTrueDate().toISOString(),
}

 await setDoc(userRef, updatedProfile, { merge: true})
 set({ userProfile: updatedProfile})
} catch (error: any) {
 set({ error: error.message})
 throw error
}
},

 checkUsernameAvailability: async (username: string) => {
 try {
 const usersRef = collection(db, 'users')
 const q = query(usersRef, where('username', '==', username.toLowerCase()))
 const snapshot = await getDocs(q)
 return snapshot.empty
} catch (error) {
 console.error('Failed to check username:', error)
 return false
}
},

 searchUsers: async (queryStr: string) => {
 try {
 const qStr = queryStr.toLowerCase().trim()
 if (!qStr) return []

 const usersRef = collection(db, 'users')
 // Fetch up to 100 recent users and filter in-memory to support searching by both name and username robustly.
 const snapshot = await getDocs(query(usersRef, limit(100)))
 
 const results = snapshot.docs
 .map(doc => doc.data() as UserProfile)
 .filter(u => 
 (u.name && u.name.toLowerCase().includes(qStr)) || 
 (u.username && u.username.toLowerCase().includes(qStr))
 )
 
 return results
} catch (error) {
 console.error('Failed to search users:', error)
 return []
}
},

  sendFriendRequest: async (friendId: string) => {
    const state = get()
    if (!state.user || !state.userProfile) throw new Error('Not logged in')
    if (state.userProfile.friends?.includes(friendId)) return
    if (state.userProfile.outgoingRequests?.includes(friendId)) return

    const myId = state.user.uid
    
    // Update local state immediately for instant responsive UX
    const updatedProfile = {
      ...state.userProfile,
      outgoingRequests: [...(state.userProfile.outgoingRequests || []), friendId]
    }
    set({ userProfile: updatedProfile })

    try {
      const myRef = doc(db, 'users', myId)
      await setDoc(myRef, {
        outgoingRequests: arrayUnion(friendId)
      }, { merge: true })

      const friendRef = doc(db, 'users', friendId)
      await setDoc(friendRef, {
        incomingRequests: arrayUnion(myId)
      }, { merge: true })
    } catch (error) {
      console.warn('Network sync for friend request delayed, saved locally:', error)
    }
  },

  acceptFriendRequest: async (friendId: string) => {
    const state = get()
    if (!state.user || !state.userProfile) throw new Error('Not logged in')
    
    const myId = state.user.uid
    
    const updatedProfile = {
      ...state.userProfile,
      friends: [...(state.userProfile.friends || []), friendId],
      incomingRequests: (state.userProfile.incomingRequests || []).filter(id => id !== friendId)
    }
    set({ userProfile: updatedProfile })

    try {
      const myRef = doc(db, 'users', myId)
      const friendRef = doc(db, 'users', friendId)

      await setDoc(myRef, {
        friends: arrayUnion(friendId),
        incomingRequests: arrayRemove(friendId)
      }, { merge: true })

      await setDoc(friendRef, {
        friends: arrayUnion(myId),
        outgoingRequests: arrayRemove(myId)
      }, { merge: true })
    } catch (error) {
      console.warn('Network sync for accept request delayed, saved locally:', error)
    }
  },

  rejectFriendRequest: async (friendId: string) => {
    const state = get()
    if (!state.user || !state.userProfile) throw new Error('Not logged in')
    
    const myId = state.user.uid
    
    const updatedProfile = {
      ...state.userProfile,
      incomingRequests: (state.userProfile.incomingRequests || []).filter(id => id !== friendId)
    }
    set({ userProfile: updatedProfile })

    try {
      const myRef = doc(db, 'users', myId)
      const friendRef = doc(db, 'users', friendId)

      await setDoc(myRef, {
        incomingRequests: arrayRemove(friendId)
      }, { merge: true })

      await setDoc(friendRef, {
        outgoingRequests: arrayRemove(myId)
      }, { merge: true })
    } catch (error) {
      console.warn('Network sync for reject request delayed, saved locally:', error)
    }
  },

  removeFriend: async (friendId: string) => {
    const state = get()
    if (!state.user || !state.userProfile) throw new Error('Not logged in')
    
    const myId = state.user.uid
    
    const updatedProfile = {
      ...state.userProfile,
      friends: (state.userProfile.friends || []).filter(id => id !== friendId)
    }
    set({ userProfile: updatedProfile })

    try {
      const myRef = doc(db, 'users', myId)
      const friendRef = doc(db, 'users', friendId)

      await setDoc(myRef, {
        friends: arrayRemove(friendId)
      }, { merge: true })

      await setDoc(friendRef, {
        friends: arrayRemove(myId)
      }, { merge: true })
    } catch (error) {
      console.warn('Network sync for remove friend delayed, saved locally:', error)
    }
  },

 getIncomingRequestsProfiles: async () => {
 try {
 const state = get()
 if (!state.user || !state.userProfile) return []
 
 const incomingIds = state.userProfile.incomingRequests || []
 if (incomingIds.length === 0) return []

 const usersRef = collection(db, 'users')
 
 // Since 'in' queries are limited to 10 items, we might need to chunk this in a real app
 // For now we'll do a simple chunking up to 10
 const chunkedIds = incomingIds.slice(0, 10)
 
 const q = query(usersRef, where('uid', 'in', chunkedIds))
 const snapshot = await getDocs(q)
 
 const profiles: UserProfile[] = []
 snapshot.forEach(doc => {
 profiles.push(doc.data() as UserProfile)
})
 
 return profiles
} catch (error) {
 console.error('Failed to get incoming requests profiles:', error)
 return []
}
},

 getLeaderboard: async () => {
 try {
 const usersRef = collection(db, 'users')
 const q = query(usersRef, orderBy('xp', 'desc'), limit(50))
 const snapshot = await getDocs(q)
 return snapshot.docs.map(doc => doc.data() as UserProfile)
} catch (error) {
 console.error('Failed to get leaderboard:', error)
 return []
}
},

 getFriendsLeaderboard: async () => {
 try {
 const state = get()
 if (!state.userProfile) return []
 
 const friendIds = state.userProfile.friends || []
 const allIds = [state.userProfile.uid, ...friendIds] // include self

 // Firestore 'in' query has a limit of 10 items.
 // If a user has >9 friends, we need multiple queries or to fetch all and filter.
 // We will batch chunk queries for robustness.
 const chunks = []
 for (let i = 0; i < allIds.length; i += 10) {
 chunks.push(allIds.slice(i, i + 10))
}

 const usersRef = collection(db, 'users')
 const allFriends: UserProfile[] = []

 for (const chunk of chunks) {
 if (chunk.length === 0) continue
 const q = query(usersRef, where('uid', 'in', chunk))
 const snapshot = await getDocs(q)
 allFriends.push(...snapshot.docs.map(doc => doc.data() as UserProfile))
}

 // Sort by XP locally
 return allFriends.sort((a, b) => b.xp - a.xp)
} catch (error) {
 console.error('Failed to get friends leaderboard:', error)
 return []
}
},

  deleteCloudDoc: async (collectionName: string, docId: string) => {
    try {
      const state = get()
      if (!state.user) return
      const docRef = doc(db, 'users', state.user.uid, collectionName, docId)
      await deleteDoc(docRef)
      console.log(`Cloud document ${collectionName}/${docId} deleted successfully`)
    } catch (e) {
      console.error(`Failed to delete cloud document ${collectionName}/${docId}:`, e)
    }
  },

  syncLocalDataToFirestore: async (localData) => {
    try {
      const state = get()
      if (!state.user) {
        throw new Error('No user logged in')
      }

      const syncCollection = async (collectionName: string, items: any[] = []) => {
        const colRef = collection(db, 'users', state.user!.uid, collectionName)
        const snap = await getDocs(colRef)
        const localIds = new Set(items.map(item => item.id))

        // Delete documents from Firestore that no longer exist locally
        for (const remoteDoc of snap.docs) {
          if (remoteDoc.id !== 'main' && !localIds.has(remoteDoc.id)) {
            await deleteDoc(doc(colRef, remoteDoc.id))
          }
        }

        // Save local items to Firestore
        for (const item of items) {
          if (!item.id) continue
          const sanitized = Object.fromEntries(Object.entries(item).filter(([, v]) => v !== undefined))
          await setDoc(doc(colRef, item.id), sanitized, { merge: true })
        }
      }

      if (localData.habits !== undefined) await syncCollection('habits', localData.habits)
      if (localData.achievements !== undefined) await syncCollection('achievements', localData.achievements)
      if (localData.challenges !== undefined) await syncCollection('challenges', localData.challenges)
      if (localData.journal !== undefined) await syncCollection('journal', localData.journal)
      if (localData.goals !== undefined) await syncCollection('goals', localData.goals)
      if (localData.routines !== undefined) await syncCollection('routines', localData.routines)
      if (localData.weeklyReviews !== undefined) await syncCollection('weeklyReviews', localData.weeklyReviews)
      if (localData.journeys !== undefined) await syncCollection('journeys', localData.journeys)
      if (localData.finance !== undefined) await syncCollection('finance', localData.finance)
      if (localData.todos !== undefined) await syncCollection('todos', localData.todos)

      // Save gym plan
      if (localData.gymPlan) {
        const gymPlanRef = doc(db, 'gymPlans', state.user.uid)
        await setDoc(gymPlanRef, localData.gymPlan, { merge: true })
      }

      // Save settings
      if (localData.settings) {
        const settingsRef = collection(db, 'users', state.user.uid, 'settings')
        await setDoc(doc(settingsRef, 'main'), localData.settings, { merge: true })
      }

      console.log('Data synced to Firestore successfully')
    } catch (error: any) {
      console.error('Failed to sync data:', error)
      throw error
    }
  },

 loadUserData: async () => {
 try {
 const state = get()
 if (!state.user) {
 throw new Error('No user logged in')
}

 const userRef = doc(db, 'users', state.user.uid)

 // Load habits
 const habitsRef = collection(db, 'users', state.user.uid, 'habits')
 const habitsSnap = await getDocs(habitsRef)
 const habits = habitsSnap.docs.map(doc => doc.data())

 // Load achievements
 const achievementsRef = collection(db, 'users', state.user.uid, 'achievements')
 const achievementsSnap = await getDocs(achievementsRef)
 const achievements = achievementsSnap.docs.map(doc => doc.data())

 // Load challenges
 const challengesRef = collection(db, 'users', state.user.uid, 'challenges')
 const challengesSnap = await getDocs(challengesRef)
 const challenges = challengesSnap.docs.map(doc => doc.data())

 // Load journal
 const journalRef = collection(db, 'users', state.user.uid, 'journal')
 const journalSnap = await getDocs(journalRef)
 const journal = journalSnap.docs.map(doc => doc.data())

 // Load goals
 const goalsRef = collection(db, 'users', state.user.uid, 'goals')
 const goalsSnap = await getDocs(goalsRef)
 const goals = goalsSnap.docs.map(doc => doc.data())

 // Load routines
 const routinesRef = collection(db, 'users', state.user.uid, 'routines')
 const routinesSnap = await getDocs(routinesRef)
 const routines = routinesSnap.docs.map(doc => doc.data())

 // Load weekly reviews
 const weeklyReviewsRef = collection(db, 'users', state.user.uid, 'weeklyReviews')
 const weeklyReviewsSnap = await getDocs(weeklyReviewsRef)
 const weeklyReviews = weeklyReviewsSnap.docs.map(doc => doc.data())

 // Load journeys
 const journeysRef = collection(db, 'users', state.user.uid, 'journeys')
 const journeysSnap = await getDocs(journeysRef)
 const journeys = journeysSnap.docs.map(doc => doc.data())

 // Load finance
 const financeRef = collection(db, 'users', state.user.uid, 'finance')
 const financeSnap = await getDocs(financeRef)
 const finance = financeSnap.docs.map(doc => doc.data())

 // Load gym plan
 const gymPlanRef = doc(db, 'gymPlans', state.user.uid)
 const gymPlanSnap = await getDoc(gymPlanRef)
 const gymPlan = gymPlanSnap.exists() ? gymPlanSnap.data() : null

 // Load settings
 const settingsRef = collection(db, 'users', state.user.uid, 'settings')
 const settingsSnap = await getDocs(settingsRef)
 const settings = settingsSnap.docs.find(doc => doc.id === 'main')?.data()

 // Load todos
 const todosRef = collection(db, 'users', state.user.uid, 'todos')
 const todosSnap = await getDocs(todosRef)
 const todos = todosSnap.docs.map(doc => doc.data())

 return { habits, achievements, challenges, journal, goals, routines, finance, gymPlan, weeklyReviews, journeys, settings, todos}
} catch (error: any) {
 console.error('Failed to load user data:', error)
 throw error
}
},
}))
