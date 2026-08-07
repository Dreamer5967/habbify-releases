import { create} from 'zustand'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import * as dbService from '../services/dbService'
import { applyTheme } from '../utils/themeUtils'

export interface Settings {
 id: string
 profileId: string
 theme: 'light' | 'dark' | 'system' | 'ocean' | 'forest' | 'sunset' | 'midnight' | 'berry' | 'coral' | 'mint' | 'gradient-sunset' | 'gradient-midnight' | 'gradient-ocean' | 'gradient-forest' | 'gradient-berry' | 'dashboard' | 'calibrated' | 'monsoon' | 'black-hole' | 'mochi' | 'tsunami' | 'matcha' | 'bubble-pop' | 'meteor-shower' | 'arcane' | 'custom'
 customTheme?: {
 primary: string
 secondary: string
 accent: string
 background: string
 surface: string
 text: string
 success: string
 danger: string
 border: string
}

 soundEnabled: boolean
 notificationsEnabled: boolean
 dateFormat: 'DD/MM/YYYY' | 'MM/DD/YYYY'
 weekStartsOn: 'monday' | 'sunday'
 compactMode: boolean
 fontSize: 'small' | 'medium' | 'large'
 animationSpeed: 'slow' | 'normal' | 'fast'
 dyslexicFont: boolean
 highContrast: boolean
 reducedMotion: boolean
 nativeTimezone?: string // Added for Satellite Sync Feature
 currencySymbol?: string // For Finance Tracker
 groqApiKey?: string
 freeAiCallsRemaining: number
 createdAt: string
 updatedAt: string
}

interface SettingsState {
 settings: Settings | null
 setSettings: (settings: Settings) => void
 updateSettings: (updates: Partial<Settings>) => void
 toggleSound: () => void
 toggleNotifications: () => void
 setTheme: (theme: Settings['theme']) => void
 setCustomTheme: (customTheme: Settings['customTheme']) => void
 setDateFormat: (format: Settings['dateFormat']) => void
 loadSettings: (profileId: string) => Promise<void>
 updateReady: boolean
 updateVersion: string
 setUpdateReady: (ready: boolean, version?: string) => void
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  updateReady: false,
  updateVersion: '',
  setUpdateReady: (ready, version = '') => set({ updateReady: ready, updateVersion: version }),
 settings: null,
  setSettings: (settings) => {
    if (settings.theme) {
      localStorage.setItem('theme', settings.theme)
      if (settings.customTheme) {
        localStorage.setItem('customTheme', JSON.stringify(settings.customTheme))
      }
      applyTheme(settings.theme, settings.customTheme)
    }
    set({ settings })
  },
 updateSettings: (updates) => set((state) => {
    const current = state.settings || {
      theme: 'dashboard',
      soundEnabled: true,
      notificationsEnabled: true,
      dateFormat: 'DD/MM/YYYY',
      weekStartsOn: 'monday',
      compactMode: false,
      fontSize: 'medium',
      animationSpeed: 'normal',
      dyslexicFont: false,
      highContrast: false,
      reducedMotion: false,
      currencySymbol: '$',
      freeAiCallsRemaining: 70,
    } as Settings

    const updated = { ...current, ...updates, updatedAt: getTrueDate().toISOString()}
    if (updates.theme && updates.theme !== 'custom') {
      delete updated.customTheme
    }

    dbService.saveSettings(updated)
    
    // Persist to localStorage
    if (updated.profileId) {
      localStorage.setItem(`user_settings_${updated.profileId}`, JSON.stringify(updated))
    }
    localStorage.setItem('user_settings', JSON.stringify(updated))
    
    if (updated.theme) {
      localStorage.setItem('theme', updated.theme)
      if (updated.theme === 'custom' && updated.customTheme) {
        localStorage.setItem('customTheme', JSON.stringify(updated.customTheme))
      } else if (updates.theme && updates.theme !== 'custom') {
        localStorage.removeItem('customTheme')
      }
      applyTheme(updated.theme, updated.customTheme)
    }

    return { settings: updated}
  }),
 toggleSound: () => set((state) => {
 if (state.settings) {
 const updated = { ...state.settings, soundEnabled: !state.settings.soundEnabled, updatedAt: getTrueDate().toISOString()}
 dbService.saveSettings(updated)
 return { settings: updated}
}
 return state
}),
 toggleNotifications: () => set((state) => {
 if (state.settings) {
 const updated = { ...state.settings, notificationsEnabled: !state.settings.notificationsEnabled, updatedAt: getTrueDate().toISOString()}
 dbService.saveSettings(updated)
 return { settings: updated}
}
 return state
}),
  setTheme: (theme) => {
    get().updateSettings({ theme })
  },
  setCustomTheme: (customTheme) => {
    get().updateSettings({ theme: 'custom', customTheme })
  },
 setDateFormat: (format) => set((state) => {
 if (state.settings) {
 const updated = { ...state.settings, dateFormat: format, updatedAt: getTrueDate().toISOString()}
 dbService.saveSettings(updated)
 return { settings: updated}
}
 return state
}),
  loadSettings: async (profileId: string) => {
    let settings = await dbService.getSettings(profileId)
    if (!settings) {
      const stored = localStorage.getItem(`user_settings_${profileId}`) || localStorage.getItem('user_settings')
      if (stored) {
        try {
          settings = JSON.parse(stored)
        } catch (e) {}
      }
    }
    if (!settings) {
      const savedTheme = (localStorage.getItem('theme') || 'dashboard') as Settings['theme']
      const savedCustom = localStorage.getItem('customTheme') ? JSON.parse(localStorage.getItem('customTheme')!) : undefined
      settings = {
        id: profileId,
        profileId,
        theme: savedTheme,
        customTheme: savedCustom,
        soundEnabled: true,
        notificationsEnabled: true,
        dateFormat: 'DD/MM/YYYY',
        weekStartsOn: 'monday',
        compactMode: false,
        fontSize: 'medium',
        animationSpeed: 'normal',
        dyslexicFont: false,
        highContrast: false,
        reducedMotion: false,
        currencySymbol: '$',
        freeAiCallsRemaining: 70,
        createdAt: getTrueDate().toISOString(),
        updatedAt: getTrueDate().toISOString()
      }
    }
    set({ settings })
    if (settings.theme) {
      applyTheme(settings.theme, settings.customTheme)
    }
  },
 initializeFromRemote: (remoteSettings) => set({ settings: remoteSettings}),
}))
