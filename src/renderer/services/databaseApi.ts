import { getDatabase} from './database'
import { getTrueDate, getTrueTodayString} from '../utils/timeUtils'
import { Habit} from '../store/habitStore'
import { Profile} from '../store/profileStore'
import { Settings} from '../store/settingsStore'

// ============ PROFILES ============

export function saveProfile(profile: Profile) {
 const db = getDatabase()
 const stmt = db.prepare(`
 INSERT OR REPLACE INTO profiles (id, name, avatar, xp, level, createdAt, updatedAt)
 VALUES (?, ?, ?, ?, ?, ?, ?)
`)
 stmt.run(profile.id, profile.name, profile.avatar, profile.xp, profile.level, profile.createdAt, profile.updatedAt)
}

export function getProfile(id: string): Profile | null {
 const db = getDatabase()
 const stmt = db.prepare('SELECT * FROM profiles WHERE id = ?')
 return stmt.get(id) as Profile | null
}

export function getAllProfiles(): Profile[] {
 const db = getDatabase()
 const stmt = db.prepare('SELECT * FROM profiles ORDER BY createdAt DESC')
 return stmt.all() as Profile[]
}

export function deleteProfile(id: string) {
 const db = getDatabase()
 db.prepare('DELETE FROM profiles WHERE id = ?').run(id)
 db.prepare('DELETE FROM habits WHERE profileId = ?').run(id)
 db.prepare('DELETE FROM settings WHERE profileId = ?').run(id)
}

// ============ HABITS ============

export function saveHabit(habit: Habit) {
 const db = getDatabase()
 const stmt = db.prepare(`
 INSERT OR REPLACE INTO habits 
 (id, profileId, name, description, icon, color, category, difficulty, frequency, priority, 
 currentStreak, longestStreak, totalCompletions, lastCompletedDate, isActive, isArchived, createdAt, updatedAt)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
 stmt.run(
 habit.id, habit.profileId, habit.name, habit.description, habit.icon, habit.color,
 habit.category, habit.difficulty, habit.frequency, habit.priority,
 habit.currentStreak, habit.longestStreak, habit.totalCompletions, habit.lastCompletedDate,
 habit.isActive ? 1 : 0, habit.isArchived ? 1 : 0, habit.createdAt, habit.updatedAt
 )
}

export function getHabit(id: string): Habit | null {
 const db = getDatabase()
 const stmt = db.prepare('SELECT * FROM habits WHERE id = ?')
 const result = stmt.get(id) as any
 return result ? convertHabitFromDb(result) : null
}

export function getHabitsByProfile(profileId: string): Habit[] {
 const db = getDatabase()
 const stmt = db.prepare('SELECT * FROM habits WHERE profileId = ? ORDER BY createdAt DESC')
 const results = stmt.all(profileId) as any[]
 return results.map(convertHabitFromDb)
}

export function deleteHabit(id: string) {
 const db = getDatabase()
 db.prepare('DELETE FROM habits WHERE id = ?').run(id)
 db.prepare('DELETE FROM completionHistory WHERE habitId = ?').run(id)
 db.prepare('DELETE FROM journalEntries WHERE habitId = ?').run(id)
}

function convertHabitFromDb(row: any): Habit {
 return {
 ...row,
 isActive: row.isActive === 1,
 isArchived: row.isArchived === 1,
}
}

// ============ COMPLETION HISTORY ============

export function saveCompletion(habitId: string, date: string, streak: number, totalCompletions: number) {
 const db = getDatabase()
 const stmt = db.prepare(`
 INSERT INTO completionHistory (habitId, date, streak, totalCompletions, createdAt)
 VALUES (?, ?, ?, ?, ?)
`)
 stmt.run(habitId, date, streak, totalCompletions, getTrueDate().toISOString())
}

export function deleteCompletion(habitId: string, date: string) {
 const db = getDatabase()
 db.prepare('DELETE FROM completionHistory WHERE habitId = ? AND date = ?').run(habitId, date)
}

export function getCompletionHistory(habitId: string) {
 const db = getDatabase()
 const stmt = db.prepare('SELECT * FROM completionHistory WHERE habitId = ? ORDER BY date DESC')
 return stmt.all(habitId) as any[]
}

// ============ SETTINGS ============

export function saveSettings(settings: Settings) {
 const db = getDatabase()
 const stmt = db.prepare(`
 INSERT OR REPLACE INTO settings 
 (id, profileId, theme, soundEnabled, notificationsEnabled, dateFormat, weekStartsOn, 
 compactMode, fontSize, animationSpeed, dyslexicFont, highContrast, reducedMotion, createdAt, updatedAt)
 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`)
 stmt.run(
 settings.id, settings.profileId, settings.theme,
 settings.soundEnabled ? 1 : 0, settings.notificationsEnabled ? 1 : 0,
 settings.dateFormat, settings.weekStartsOn,
 settings.compactMode ? 1 : 0, settings.fontSize, settings.animationSpeed,
 settings.dyslexicFont ? 1 : 0, settings.highContrast ? 1 : 0, settings.reducedMotion ? 1 : 0,
 settings.createdAt, settings.updatedAt
 )
}

export function getSettings(profileId: string): Settings | null {
 const db = getDatabase()
 const stmt = db.prepare('SELECT * FROM settings WHERE profileId = ?')
 const result = stmt.get(profileId) as any
 return result ? convertSettingsFromDb(result) : null
}

function convertSettingsFromDb(row: any): Settings {
 return {
 ...row,
 soundEnabled: row.soundEnabled === 1,
 notificationsEnabled: row.notificationsEnabled === 1,
 compactMode: row.compactMode === 1,
 dyslexicFont: row.dyslexicFont === 1,
 highContrast: row.highContrast === 1,
 reducedMotion: row.reducedMotion === 1,
}
}

// ============ JOURNAL ENTRIES ============

export function saveJournalEntry(id: string, habitId: string, date: string, content: string, mood?: string) {
 const db = getDatabase()
 const stmt = db.prepare(`
 INSERT OR REPLACE INTO journalEntries (id, habitId, date, content, mood, createdAt, updatedAt)
 VALUES (?, ?, ?, ?, ?, ?, ?)
`)
 stmt.run(id, habitId, date, content, mood, getTrueDate().toISOString(), getTrueDate().toISOString())
}

export function getJournalEntry(habitId: string, date: string) {
 const db = getDatabase()
 const stmt = db.prepare('SELECT * FROM journalEntries WHERE habitId = ? AND date = ?')
 return stmt.get(habitId, date) as any
}

export function getJournalEntries(habitId: string) {
 const db = getDatabase()
 const stmt = db.prepare('SELECT * FROM journalEntries WHERE habitId = ? ORDER BY date DESC')
 return stmt.all(habitId) as any[]
}

export function deleteJournalEntry(id: string) {
 const db = getDatabase()
 db.prepare('DELETE FROM journalEntries WHERE id = ?').run(id)
}
