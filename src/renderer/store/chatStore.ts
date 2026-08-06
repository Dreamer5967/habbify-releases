import { create } from 'zustand'
import { collection, doc, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthStore } from './authStore'
import { useProfileStore } from './profileStore'

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  text: string
  timestamp: string
}

interface ChatState {
  messages: ChatMessage[]
  activeChatId: string | null
  loading: boolean
  unsubscribe: (() => void) | null
  getOrCreateChatId: (friendId: string) => string
  openChat: (friendId: string, friendName: string) => void
  sendMessage: (text: string) => Promise<void>
  closeChat: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  activeChatId: null,
  loading: false,
  unsubscribe: null,

  getOrCreateChatId: (friendId: string) => {
    const myId = useAuthStore.getState().user?.uid || useProfileStore.getState().currentProfile?.id || 'local_user'
    const ids = [myId, friendId].sort()
    return `${ids[0]}_${ids[1]}`
  },

  openChat: (friendId: string, friendName: string) => {
    const myId = useAuthStore.getState().user?.uid || useProfileStore.getState().currentProfile?.id || 'local_user'

    const state = get()
    if (state.unsubscribe) {
      state.unsubscribe()
    }

    const chatId = get().getOrCreateChatId(friendId)
    set({ activeChatId: chatId, loading: true, messages: [] })

    try {
      const chatRef = doc(db, 'chats', chatId)
      setDoc(chatRef, {
        participants: [myId, friendId],
        updatedAt: serverTimestamp()
      }, { merge: true })

      const messagesRef = collection(db, 'chats', chatId, 'messages')
      const q = query(messagesRef, orderBy('timestamp', 'asc'), limit(100))

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages: ChatMessage[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          messages.push({
            id: doc.id,
            senderId: data.senderId,
            senderName: data.senderName,
            text: data.text,
            timestamp: data.timestamp?.toDate ? data.timestamp.toDate().toISOString() : new Date().toISOString()
          })
        })
        set({ messages, loading: false })
      }, (error) => {
        console.error('Firebase chat snapshot fallback:', error)
        set({ loading: false })
      })

      set({ unsubscribe })
    } catch (e) {
      console.error('Failed to open chat:', e)
      set({ loading: false })
    }
  },

  sendMessage: async (text: string) => {
    const { activeChatId } = get()
    const user = useAuthStore.getState().user
    const profile = useProfileStore.getState().currentProfile || useAuthStore.getState().userProfile
    const myId = user?.uid || profile?.id || 'local_user'
    const myName = profile?.name || 'You'

    if (!activeChatId || !text.trim()) return

    try {
      const messagesRef = collection(db, 'chats', activeChatId, 'messages')
      await addDoc(messagesRef, {
        senderId: myId,
        senderName: myName,
        text: text.trim(),
        timestamp: serverTimestamp()
      })

      const chatRef = doc(db, 'chats', activeChatId)
      await setDoc(chatRef, {
        updatedAt: serverTimestamp()
      }, { merge: true })
    } catch (e) {
      console.error('Firebase sendMessage failed, storing locally:', e)
      const localMsg: ChatMessage = {
        id: Date.now().toString(),
        senderId: myId,
        senderName: myName,
        text: text.trim(),
        timestamp: new Date().toISOString()
      }
      set((state) => ({ messages: [...state.messages, localMsg] }))
    }
  },

  closeChat: () => {
    const { unsubscribe } = get()
    if (unsubscribe) {
      unsubscribe()
    }
    set({ activeChatId: null, messages: [], unsubscribe: null })
  }
}))
