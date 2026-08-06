import { create } from 'zustand'
import { getTrueDate, getTrueTodayString } from '../utils/timeUtils'
import { useAuthStore } from './authStore'
import { useProfileStore } from './profileStore'

export interface TodoItem {
  id: string
  profileId: string
  text: string
  completed: boolean
  date: string // YYYY-MM-DD
  createdAt: string
}

interface TodoState {
  todos: TodoItem[]
  setTodos: (todos: TodoItem[]) => void
  addTodo: (todo: TodoItem) => void
  toggleTodo: (id: string) => void
  removeTodo: (id: string) => void
  clearCompleted: () => void
  loadTodos: (profileId: string) => void
}

export const useTodoStore = create<TodoState>((set, get) => ({
  todos: [],

  setTodos: (todos) => set({ todos }),

  addTodo: (todo) => {
    set((state) => {
      const newTodos = [...state.todos, todo]
      localStorage.setItem(`todos_${todo.profileId}`, JSON.stringify(newTodos))
      return { todos: newTodos }
    })
  },

  toggleTodo: (id) => {
    set((state) => {
      const newTodos = state.todos.map((t) =>
        t.id === id ? { ...t, completed: !t.completed } : t
      )
      if (newTodos.length > 0) {
        localStorage.setItem(`todos_${newTodos[0].profileId}`, JSON.stringify(newTodos))
      }
      return { todos: newTodos }
    })
  },

  removeTodo: (id) => {
    set((state) => {
      const newTodos = state.todos.filter((t) => t.id !== id)
      if (state.todos.length > 0) {
        localStorage.setItem(`todos_${state.todos[0].profileId}`, JSON.stringify(newTodos))
      }
      useAuthStore.getState().deleteCloudDoc('todos', id)
      return { todos: newTodos }
    })
  },

  clearCompleted: () => {
    const state = get()
    const today = getTrueTodayString()
    const completed = state.todos.filter(t => t.completed && t.date === today)
    const remaining = state.todos.filter(t => !(t.completed && t.date === today))
    
    // Delete from cloud
    completed.forEach(t => {
      useAuthStore.getState().deleteCloudDoc('todos', t.id)
    })

    if (state.todos.length > 0) {
      localStorage.setItem(`todos_${state.todos[0].profileId}`, JSON.stringify(remaining))
    }
    set({ todos: remaining })
  },

  loadTodos: (profileId) => {
    const stored = localStorage.getItem(`todos_${profileId}`)
    if (stored) {
      try {
        const todos = JSON.parse(stored)
        set({ todos })
      } catch (e) {
        console.error('Failed to load todos:', e)
      }
    }
  },
}))
