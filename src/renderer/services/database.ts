import Database from 'better-sqlite3'
import path from 'path'
import { app} from 'electron'

let db: Database.Database | null = null

export function initializeDatabase() {
 try {
 const userDataPath = app.getPath('userData')
 const dbPath = path.join(userDataPath, 'habbify.db')
 
 db = new Database(dbPath)
 db.pragma('journal_mode = WAL')
 
 createTables()
 console.log('Database initialized at:', dbPath)
 return db
} catch (error) {
 console.error('Failed to initialize database:', error)
 throw error
}
}

function createTables() {
 if (!db) return

 // Profiles table
 db.exec(`
 CREATE TABLE IF NOT EXISTS profiles (
 id TEXT PRIMARY KEY,
 name TEXT NOT NULL,
 avatar TEXT,
 xp INTEGER DEFAULT 0,
 level INTEGER DEFAULT 1,
 createdAt TEXT NOT NULL,
 updatedAt TEXT NOT NULL
 )
`)

 // Habits table
 db.exec(`
 CREATE TABLE IF NOT EXISTS habits (
 id TEXT PRIMARY KEY,
 profileId TEXT NOT NULL,
 name TEXT NOT NULL,
 description TEXT,
 icon TEXT NOT NULL,
 color TEXT NOT NULL,
 category TEXT NOT NULL,
 difficulty TEXT NOT NULL,
 frequency TEXT NOT NULL,
 priority TEXT NOT NULL,
 currentStreak INTEGER DEFAULT 0,
 longestStreak INTEGER DEFAULT 0,
 totalCompletions INTEGER DEFAULT 0,
 lastCompletedDate TEXT,
 isActive INTEGER DEFAULT 1,
 isArchived INTEGER DEFAULT 0,
 createdAt TEXT NOT NULL,
 updatedAt TEXT NOT NULL,
 FOREIGN KEY (profileId) REFERENCES profiles(id)
 )
`)

 // Completion history table
 db.exec(`
 CREATE TABLE IF NOT EXISTS completionHistory (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 habitId TEXT NOT NULL,
 date TEXT NOT NULL,
 streak INTEGER NOT NULL,
 totalCompletions INTEGER NOT NULL,
 createdAt TEXT NOT NULL,
 FOREIGN KEY (habitId) REFERENCES habits(id)
 )
`)

 // Settings table
 db.exec(`
 CREATE TABLE IF NOT EXISTS settings (
 id TEXT PRIMARY KEY,
 profileId TEXT NOT NULL,
 theme TEXT DEFAULT 'dark',
 soundEnabled INTEGER DEFAULT 1,
 notificationsEnabled INTEGER DEFAULT 1,
 dateFormat TEXT DEFAULT 'DD/MM/YYYY',
 weekStartsOn TEXT DEFAULT 'monday',
 compactMode INTEGER DEFAULT 0,
 fontSize TEXT DEFAULT 'medium',
 animationSpeed TEXT DEFAULT 'normal',
 dyslexicFont INTEGER DEFAULT 0,
 highContrast INTEGER DEFAULT 0,
 reducedMotion INTEGER DEFAULT 0,
 createdAt TEXT NOT NULL,
 updatedAt TEXT NOT NULL,
 FOREIGN KEY (profileId) REFERENCES profiles(id)
 )
`)

 // Journal entries table
 db.exec(`
 CREATE TABLE IF NOT EXISTS journalEntries (
 id TEXT PRIMARY KEY,
 habitId TEXT NOT NULL,
 date TEXT NOT NULL,
 content TEXT NOT NULL,
 mood TEXT,
 createdAt TEXT NOT NULL,
 updatedAt TEXT NOT NULL,
 FOREIGN KEY (habitId) REFERENCES habits(id)
 )
`)
}

export function getDatabase() {
 if (!db) {
 throw new Error('Database not initialized')
}
 return db
}

export function closeDatabase() {
 if (db) {
 db.close()
 db = null
}
}
