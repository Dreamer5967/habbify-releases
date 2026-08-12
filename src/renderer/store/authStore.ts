import { create } from 'zustand'
import { 
  auth, 
  db 
} from '../config/firebase'
import { 
  signInWithCredential,
  GoogleAuthProvider,
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore'
import { getTrueDate } from '../utils/timeUtils'

export interface UserProfile {
  id: string
  uid: string
  name: string
  email: string
  username?: string
  bio?: string
  photoURL?: string
  avatar?: string
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
  globalLeaderboard: UserProfile[]
  friendsLeaderboard: UserProfile[]
  activities: any[]
  loading: boolean
  feedLoading: boolean
  error: string | null
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
  initializeAuth: () => void
  updateUserProfile: (updates: Partial<UserProfile>) => Promise<void>
  getUserProfileByUid: (uid: string) => Promise<UserProfile | null>
  fetchGlobalLeaderboard: () => Promise<void>
  getFriendsLeaderboard: () => Promise<void>
  fetchGlobalFeed: () => Promise<void>
  postActivityToFeed: (action: string, targetName: string) => Promise<void>
  checkUsernameAvailability: (username: string) => Promise<boolean>
  searchUsers: (queryStr: string) => Promise<UserProfile[]>
  searchUsersByUsername: (queryStr: string) => Promise<UserProfile[]>
  sendFriendRequest: (friendId: string) => Promise<void>
  acceptFriendRequest: (friendId: string) => Promise<void>
  rejectFriendRequest: (friendId: string) => Promise<void>
  removeFriend: (friendId: string) => Promise<void>
  getIncomingRequestsProfiles: () => Promise<UserProfile[]>
  syncLocalDataToFirestore: (localData: any) => Promise<void>
  loadUserData: () => Promise<any>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  userProfile: null,
  globalLeaderboard: [],
  friendsLeaderboard: [],
  activities: [],
  loading: true,
  feedLoading: false,
  error: null,

  signInWithGoogle: async () => {
    try {
      set({ loading: true, error: null })

      // In Electron, signInWithPopup is broken. We use the local auth server:
      // 1. Start a local HTTP server that serves a Google sign-in page
      // 2. Open that page in the system browser
      // 3. After the user signs in, the page POSTs the Google idToken back
      // 4. Electron sends us the token via IPC
      // 5. We complete Firebase sign-in with signInWithCredential
      const isElectron = !!(window as any).electron

      if (isElectron) {
        const electron = (window as any).electron

        // Collect Firebase config to pass to the local auth page
        const firebaseConfig = {
          apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
          authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
          projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
          storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
          messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
          appId: import.meta.env.VITE_FIREBASE_APP_ID,
        }

        // Start the local auth server and open the login page in the system browser
        await electron.startAuthServer(firebaseConfig)
        electron.openExternal('http://localhost:13377/auth.html')

        // Wait for the idToken to come back via IPC (the local server relays it)
        const idToken: string = await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Sign-in timed out. Please try again.')), 120000)
          electron.onAuthCallback((token: string) => {
            clearTimeout(timeout)
            resolve(token)
          })
        })

        // Sign into Firebase using the Google credential
        const credential = GoogleAuthProvider.credential(idToken)
        const result = await signInWithCredential(auth, credential)
        const user = result.user

        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        let profile: UserProfile
        if (!userSnap.exists()) {
          const username = (user.displayName || user.email?.split('@')[0] || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 1000)

          profile = {
            id: user.uid,
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            username,
            level: 1,
            xp: 0,
            createdAt: getTrueDate().toISOString(),
            updatedAt: getTrueDate().toISOString(),
            friends: [],
            incomingRequests: [],
            outgoingRequests: [],
          }
          await setDoc(userRef, profile)
        } else {
          profile = userSnap.data() as UserProfile
        }

        set({ user, userProfile: profile, loading: false })
        localStorage.setItem('currentUserId', user.uid)

      } else {
        // Web / dev environment: use normal popup
        const { signInWithPopup } = await import('firebase/auth')
        const { googleProvider } = await import('../config/firebase')
        const result = await signInWithPopup(auth, googleProvider)
        const user = result.user

        const userRef = doc(db, 'users', user.uid)
        const userSnap = await getDoc(userRef)

        let profile: UserProfile
        if (!userSnap.exists()) {
          const username = (user.displayName || user.email?.split('@')[0] || 'user')
            .toLowerCase()
            .replace(/[^a-z0-9_]/g, '') + Math.floor(Math.random() * 1000)

          profile = {
            id: user.uid,
            uid: user.uid,
            name: user.displayName || 'User',
            email: user.email || '',
            photoURL: user.photoURL || undefined,
            username,
            level: 1,
            xp: 0,
            createdAt: getTrueDate().toISOString(),
            updatedAt: getTrueDate().toISOString(),
            friends: [],
            incomingRequests: [],
            outgoingRequests: [],
          }
          await setDoc(userRef, profile)
        } else {
          profile = userSnap.data() as UserProfile
        }

        set({ user, userProfile: profile, loading: false })
        localStorage.setItem('currentUserId', user.uid)
      }

    } catch (error: any) {
      console.error('Google Sign-In failed:', error)
      set({ error: error.message || 'Sign-in failed. Please try again.', loading: false })
      throw error
    }
  },

  signOut: async () => {
    try {
      set({ loading: true, error: null })
      await firebaseSignOut(auth)
      set({ user: null, userProfile: null, loading: false })
      localStorage.removeItem('currentUserId')
      localStorage.clear()
    } catch (error: any) {
      set({ error: error.message, loading: false })
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
      if (!state.userProfile) return
      const updated = {
        ...state.userProfile,
        ...updates,
        updatedAt: getTrueDate().toISOString()
      }
      set({ userProfile: updated })

      if (state.user) {
        const userRef = doc(db, 'users', state.user.uid)
        await setDoc(userRef, updates, { merge: true })
      }
    } catch (error) {
      console.error('Failed to update profile:', error)
    }
  },

  getUserProfileByUid: async (uid: string) => {
    try {
      const userRef = doc(db, 'users', uid)
      const userSnap = await getDoc(userRef)
      if (userSnap.exists()) {
        return userSnap.data() as UserProfile
      }
    } catch (e) {
      console.error('Error fetching profile:', e)
    }
    return null
  },

  fetchGlobalLeaderboard: async () => {
    try {
      const remoteUsers: UserProfile[] = []
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, orderBy('xp', 'desc'), limit(50))
        const snapshot = await getDocs(q)
        snapshot.forEach(d => remoteUsers.push(d.data() as UserProfile))
      } catch (e) {
        console.warn('Firebase leaderboard fetch failed:', e)
      }

      const current = get().userProfile
      const allCandidates = [...remoteUsers]
      if (current) allCandidates.push(current)

      // Filter out test/fake profiles & deduplicate by uid
      const map = new Map<string, UserProfile>()
      allCandidates
        .filter(u => {
          if (!u || !u.uid) return false
          const name = (u.displayName || u.username || '').toLowerCase()
          return !name.includes('test') && !name.includes('fake') && !name.includes('demo') && !name.includes('dummy')
        })
        .forEach(u => map.set(u.uid, u))

      const leaderboard = Array.from(map.values()).sort((a, b) => (b.xp || 0) - (a.xp || 0))

      set({ globalLeaderboard: leaderboard })
    } catch (e) {
      console.error('Global leaderboard failed:', e)
    }
  },

  getFriendsLeaderboard: async () => {
    try {
      const state = get()
      const current = state.userProfile
      const friendIds = current?.friends || []

      const friendsList: UserProfile[] = []
      if (current) friendsList.push(current)

      for (const fId of friendIds) {
        const p = await get().getUserProfileByUid(fId)
        if (p) friendsList.push(p)
      }

      const map = new Map<string, UserProfile>()
      friendsList.forEach(u => map.set(u.uid, u))
      const sorted = Array.from(map.values()).sort((a, b) => (b.xp || 0) - (a.xp || 0))

      set({ friendsLeaderboard: sorted })
    } catch (e) {
      console.error('Friends leaderboard failed:', e)
    }
  },

  fetchGlobalFeed: async () => {
    try {
      set({ feedLoading: true })
      set({ activities: [], feedLoading: false })
    } catch (e) {
      set({ feedLoading: false })
    }
  },

  postActivityToFeed: async (action: string, targetName: string) => {
    const current = get().userProfile
    if (!current) return
    const newAct = {
      id: Date.now().toString(),
      profileName: current.name,
      photoURL: current.photoURL || current.avatar,
      action,
      targetName,
      timestamp: new Date().toISOString()
    }
    set(state => ({ activities: [newAct, ...state.activities] }))
  },

  checkUsernameAvailability: async (username: string) => {
    const qStr = username.toLowerCase().trim()
    try {
      const usersRef = collection(db, 'users')
      const q = query(usersRef, where('username', '==', qStr))
      const snapshot = await getDocs(q)
      return snapshot.empty
    } catch (error) {
      return true
    }
  },

  searchUsers: async (queryStr: string) => {
    return get().searchUsersByUsername(queryStr)
  },

  searchUsersByUsername: async (queryStr: string) => {
    const qStr = queryStr.toLowerCase().trim()
    if (!qStr) return []

    const remoteResults: UserProfile[] = []
    try {
      const usersRef = collection(db, 'users')
      const snapshot = await getDocs(query(usersRef, limit(50)))
      snapshot.forEach(doc => {
        const u = doc.data() as UserProfile
        if ((u.name && u.name.toLowerCase().includes(qStr)) || (u.username && u.username.toLowerCase().includes(qStr))) {
          remoteResults.push(u)
        }
      })
    } catch (e) {}

    const map = new Map<string, UserProfile>()
    remoteResults.forEach(u => map.set(u.uid, u))
    return Array.from(map.values())
  },

  sendFriendRequest: async (friendId: string) => {
    const state = get()
    if (!state.userProfile) throw new Error('Not logged in')
    const myId = state.userProfile.uid

    const updatedProfile = {
      ...state.userProfile,
      outgoingRequests: [...(state.userProfile.outgoingRequests || []), friendId]
    }
    set({ userProfile: updatedProfile })

    try {
      const myRef = doc(db, 'users', myId)
      await setDoc(myRef, { outgoingRequests: arrayUnion(friendId) }, { merge: true })
      const friendRef = doc(db, 'users', friendId)
      await setDoc(friendRef, { incomingRequests: arrayUnion(myId) }, { merge: true })
    } catch (e) {}
  },

  acceptFriendRequest: async (friendId: string) => {
    const state = get()
    if (!state.userProfile) throw new Error('Not logged in')
    const myId = state.userProfile.uid

    const updatedProfile = {
      ...state.userProfile,
      friends: [...(state.userProfile.friends || []), friendId],
      incomingRequests: (state.userProfile.incomingRequests || []).filter(id => id !== friendId)
    }
    set({ userProfile: updatedProfile })

    try {
      const myRef = doc(db, 'users', myId)
      await setDoc(myRef, { friends: arrayUnion(friendId), incomingRequests: arrayRemove(friendId) }, { merge: true })
      const friendRef = doc(db, 'users', friendId)
      await setDoc(friendRef, { friends: arrayUnion(myId), outgoingRequests: arrayRemove(myId) }, { merge: true })
    } catch (e) {}
  },

  rejectFriendRequest: async (friendId: string) => {
    const state = get()
    if (!state.userProfile) throw new Error('Not logged in')
    const myId = state.userProfile.uid

    const updatedProfile = {
      ...state.userProfile,
      incomingRequests: (state.userProfile.incomingRequests || []).filter(id => id !== friendId)
    }
    set({ userProfile: updatedProfile })
  },

  removeFriend: async (friendId: string) => {
    const state = get()
    if (!state.userProfile) throw new Error('Not logged in')

    const updatedProfile = {
      ...state.userProfile,
      friends: (state.userProfile.friends || []).filter(id => id !== friendId)
    }
    set({ userProfile: updatedProfile })
  },

  getIncomingRequestsProfiles: async () => {
    const state = get()
    if (!state.userProfile) return []
    const incoming = state.userProfile.incomingRequests || []
    const results: UserProfile[] = []
    for (const uid of incoming) {
      const p = await get().getUserProfileByUid(uid)
      if (p) results.push(p)
    }
    return results
  },

  syncLocalDataToFirestore: async (localData) => {
    const state = get()
    if (!state.user) throw new Error('No user logged in')
  },

  loadUserData: async () => {
    return {}
  }
}))
