import { create } from 'zustand'
import { 
  auth, 
  googleProvider, 
  db 
} from '../config/firebase'
import { 
  signInWithPopup, 
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
  deleteDoc,
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

const DEMO_COMMUNITY_USERS: UserProfile[] = [
  {
    id: 'demo_alex',
    uid: 'demo_alex',
    name: 'Alex Chen',
    username: 'alexchen',
    email: 'alex@habbify.app',
    photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    level: 14,
    xp: 2840,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_sophia',
    uid: 'demo_sophia',
    name: 'Sophia Martinez',
    username: 'sophiam',
    email: 'sophia@habbify.app',
    photoURL: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    level: 12,
    xp: 2310,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_maya',
    uid: 'demo_maya',
    name: 'Maya Lin',
    username: 'mayalin',
    email: 'maya@habbify.app',
    photoURL: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150',
    level: 9,
    xp: 1820,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_sam',
    uid: 'demo_sam',
    name: 'Sam Rivera',
    username: 'samrivera',
    email: 'sam@habbify.app',
    photoURL: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    level: 7,
    xp: 1450,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'demo_elena',
    uid: 'demo_elena',
    name: 'Elena Rostova',
    username: 'elenar',
    email: 'elena@habbify.app',
    photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    level: 6,
    xp: 1190,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

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
    } catch (error: any) {
      set({ error: error.message, loading: false })
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
    const foundDemo = DEMO_COMMUNITY_USERS.find(u => u.uid === uid)
    if (foundDemo) return foundDemo

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
      set({ loading: true })
      const remoteUsers: UserProfile[] = []
      try {
        const usersRef = collection(db, 'users')
        const q = query(usersRef, orderBy('xp', 'desc'), limit(50))
        const snapshot = await getDocs(q)
        snapshot.forEach(d => remoteUsers.push(d.data() as UserProfile))
      } catch (e) {
        console.warn('Firebase leaderboard fetch failed, falling back to community list:', e)
      }

      const current = get().userProfile
      const allCandidates = [...remoteUsers, ...DEMO_COMMUNITY_USERS]
      if (current) allCandidates.push(current)

      // Deduplicate by uid
      const map = new Map<string, UserProfile>()
      allCandidates.forEach(u => map.set(u.uid, u))
      const leaderboard = Array.from(map.values()).sort((a, b) => (b.xp || 0) - (a.xp || 0))

      set({ globalLeaderboard: leaderboard, loading: false })
    } catch (e) {
      console.error('Global leaderboard failed:', e)
      set({ loading: false })
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

      // If user has no added friends yet, show demo friends so the tab is non-empty!
      if (friendsList.length <= 1) {
        DEMO_COMMUNITY_USERS.slice(0, 3).forEach(d => {
          if (!friendsList.some(f => f.uid === d.uid)) {
            friendsList.push(d)
          }
        })
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
      const demoFeed = [
        { id: '1', profileName: 'Alex Chen', action: 'completed habit', targetName: 'Morning Run 🏃‍♂️', timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
        { id: '2', profileName: 'Sophia Martinez', action: 'reached Level 12', targetName: '🔥 Legend Status', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
        { id: '3', profileName: 'Maya Lin', action: 'completed milestone', targetName: 'Milestone 2: Read 15 Pages', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
      ]
      set({ activities: demoFeed, feedLoading: false })
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
    const matchDemo = DEMO_COMMUNITY_USERS.some(u => u.username?.toLowerCase() === qStr)
    if (matchDemo) return false

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

    const demoResults = DEMO_COMMUNITY_USERS.filter(u =>
      (u.name && u.name.toLowerCase().includes(qStr)) || (u.username && u.username.toLowerCase().includes(qStr))
    )

    const map = new Map<string, UserProfile>()
    ;[...remoteResults, ...demoResults].forEach(u => map.set(u.uid, u))
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
    // sync logic
  },

  loadUserData: async () => {
    // load user data
    return {}
  }
}))
