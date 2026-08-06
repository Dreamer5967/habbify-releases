import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import { db} from '../config/firebase'
import { collection, addDoc, query, orderBy, limit, getDocs} from 'firebase/firestore'

export interface Activity {
 id: string
 profileId: string
 profileName: string
 action: string // e.g.,"completed habit"
 targetName: string // e.g.,"Morning Jog"
 timestamp: string
}

interface ActivityState {
 activities: Activity[]
 loading: boolean
 logActivity: (profileId: string, profileName: string, action: string, targetName: string) => Promise<void>
 loadGlobalFeed: () => Promise<void>
}

export const useActivityStore = create<ActivityState>((set, get) => ({
 activities: [],
 loading: false,

 logActivity: async (profileId, profileName, action, targetName) => {
 try {
 const activityData = {
 profileId,
 profileName,
 action,
 targetName,
 timestamp: getTrueDate().toISOString()
}
 // Save locally for instant UI
 const newActivity = { id: crypto.randomUUID(), ...activityData}
 set((state) => ({ activities: [newActivity, ...state.activities].slice(0, 50)}))
 
 // Save to Firestore
 if (db) {
 await addDoc(collection(db, 'activities'), activityData)
}
} catch (error) {
 console.error('Failed to log activity:', error)
}
},

 loadGlobalFeed: async () => {
 set({ loading: true})
 try {
 if (!db) {
 set({ loading: false})
 return
}
 const q = query(collection(db, 'activities'), orderBy('timestamp', 'desc'), limit(50))
 const snapshot = await getDocs(q)
 const feed = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()} as Activity))
 set({ activities: feed, loading: false})
} catch (error) {
 console.error('Failed to load global feed:', error)
 set({ loading: false})
}
}
}))
