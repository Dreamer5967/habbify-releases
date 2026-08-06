import { create } from 'zustand'
import { collection, doc, addDoc, query, orderBy, onSnapshot, serverTimestamp, setDoc, limit } from 'firebase/firestore'
import { db } from '../config/firebase'
import { useAuthStore } from './authStore'

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
    const myId = useAuthStore.getState().user?.uid
    if (!myId) throw new Error('Not logged in')
    const ids = [myId, friendId].sort()
    return `${ids[0]}_${ids[1]}`
  },

  openChat: (friendId: string, friendName: string) => {
    const myId = useAuthStore.getState().user?.uid
    if (!myId) return

    const state = get()
    if (state.unsubscribe) {
      state.unsubscribe()
    }

    const chatId = get().getOrCreateChatId(friendId)
    set({ activeChatId: chatId, loading: true, messages: [] })

    // Create chat doc if not exists
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
    })

    set({ unsubscribe })
  },

  sendMessage: async (text: string) => {
    const { activeChatId } = get()
    const user = useAuthStore.getState().user
    const profile = useAuthStore.getState().userProfile
    if (!activeChatId || !user || !profile || !text.trim()) return

    const messagesRef = collection(db, 'chats', activeChatId, 'messages')
    await addDoc(messagesRef, {
      senderId: user.uid,
      senderName: profile.name,
      text: text.trim(),
      timestamp: serverTimestamp()
    })

    const chatRef = doc(db, 'chats', activeChatId)
    await setDoc(chatRef, {
      updatedAt: serverTimestamp()
    }, { merge: true })
  },

  closeChat: () => {
    const { unsubscribe } = get()
    if (unsubscribe) {
      unsubscribe()
    }
    set({ activeChatId: null, messages: [], unsubscribe: null })
  }
}))
