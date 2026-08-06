import type { Habit} from '../store/habitStore'
import type { Profile} from '../store/profileStore'
import type { Settings} from '../store/settingsStore'

// Check if we're in Electron
const isElectron = () => {
 return typeof window !== 'undefined' && (window as any).ipcRenderer !== undefined
}

// ============ PROFILES ============

export async function saveProfile(profile: Profile) {
 if (!isElectron()) return
 return (window as any).ipcRenderer.invoke('db:saveProfile', profile)
}

export async function getProfile(id: string): Promise<Profile | null> {
 if (!isElectron()) return null
 return (window as any).ipcRenderer.invoke('db:getProfile', id)
}

export async function getAllProfiles(): Promise<Profile[]> {
 if (!isElectron()) return []
 return (window as any).ipcRenderer.invoke('db:getAllProfiles')
}

export async function deleteProfile(id: string) {
 if (!isElectron()) return
 return (window as any).ipcRenderer.invoke('db:deleteProfile', id)
}

// ============ HABITS ============

export async function saveHabit(habit: Habit) {
 if (!isElectron()) return
 return (window as any).ipcRenderer.invoke('db:saveHabit', habit)
}

export async function getHabit(id: string): Promise<Habit | null> {
 if (!isElectron()) return null
 return (window as any).ipcRenderer.invoke('db:getHabit', id)
}

export async function getHabitsByProfile(profileId: string): Promise<Habit[]> {
 if (!isElectron()) return []
 return (window as any).ipcRenderer.invoke('db:getHabitsByProfile', profileId)
}

export async function deleteHabit(id: string) {
 if (!isElectron()) return
 return (window as any).ipcRenderer.invoke('db:deleteHabit', id)
}

// ============ COMPLETION HISTORY ============

export async function saveCompletion(habitId: string, date: string, streak: number, totalCompletions: number) {
 if (!isElectron()) return
 return (window as any).ipcRenderer.invoke('db:saveCompletion', habitId, date, streak, totalCompletions)
}

export async function deleteCompletion(habitId: string, date: string) {
 if (!isElectron()) return
 return (window as any).ipcRenderer.invoke('db:deleteCompletion', habitId, date)
}

export async function getCompletionHistory(habitId: string) {
 if (!isElectron()) return []
 return (window as any).ipcRenderer.invoke('db:getCompletionHistory', habitId)
}

// ============ SETTINGS ============

export async function saveSettings(settings: Settings) {
 if (!isElectron()) return
 return (window as any).ipcRenderer.invoke('db:saveSettings', settings)
}

export async function getSettings(profileId: string): Promise<Settings | null> {
 if (!isElectron()) return null
 return (window as any).ipcRenderer.invoke('db:getSettings', profileId)
}

// ============ JOURNAL ENTRIES ============

export async function saveJournalEntry(id: string, habitId: string, date: string, content: string, mood?: string) {
 if (!isElectron()) return
 return (window as any).ipcRenderer.invoke('db:saveJournalEntry', id, habitId, date, content, mood)
}

export async function getJournalEntry(habitId: string, date: string) {
 if (!isElectron()) return null
 return (window as any).ipcRenderer.invoke('db:getJournalEntry', habitId, date)
}

export async function getJournalEntries(habitId: string) {
 if (!isElectron()) return []
 return (window as any).ipcRenderer.invoke('db:getJournalEntries', habitId)
}

export async function deleteJournalEntry(id: string) {
 if (!isElectron()) return
 return (window as any).ipcRenderer.invoke('db:deleteJournalEntry', id)
}
