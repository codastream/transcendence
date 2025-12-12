import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { DataError } from '../types/errors.js'
import { DATA_ERROR } from '../utils/constants.js'
import { DBUser } from '../types/models.js'

// DB path
const DEFAULT_DIR = path.join(process.cwd(), 'data')
const DB_PATH = process.env.AUTH_DB_PATH || path.join(DEFAULT_DIR, 'auth.db')

// Check dir
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
} catch (err:any) {
    throw new DataError(DATA_ERROR.INTERNAL_ERROR, `Failed to ensure DB directory`, err);
}

// Open/create database
const db = new Database(DB_PATH)

// Create table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      email TEXT UNIQUE,
      password TEXT
    );
  `)
} catch (err: any) {
  throw new DataError(DATA_ERROR.INTERNAL_ERROR, `Failed to initialize DB schema`, err);
}

// Prepare statements
const findByUsernameStmt = db.prepare('SELECT * FROM users WHERE username = ?')
const findByEmailStmt = db.prepare('SELECT * FROM users WHERE email = ?')
const findByIdentifierStmt = db.prepare(
  'SELECT * FROM users WHERE username = ? OR email = ? LIMIT 1',
)
const insertUserStmt = db.prepare('INSERT INTO users (username, email, password) VALUES (?, ?, ?)')
const deleteUserStmt = db.prepare('DELETE FROM users WHERE id = ?')

export function findUserByUsername(username: string): DBUser | null {
  try {
    const user = findByUsernameStmt.get(username)
    return (user as DBUser) || null
  } catch (err: any) {
    throw new DataError(DATA_ERROR.INTERNAL_ERROR, `DB Error ${err.message}`, err);
  }
}

export function findUserByEmail(email: string): DBUser | null {
  try {
    const user = findByEmailStmt.get(email)
    return (user as DBUser) || null
  } catch (err: any) {
    throw new DataError(DATA_ERROR.INTERNAL_ERROR, `DB Error ${err.message}`, err);
  }
}

export function findUserByIdentifier(identifier: string): DBUser | null {
  try {
    const user = findByIdentifierStmt.get(identifier, identifier)
    return (user as DBUser) || null
  } catch (err: any) {
    throw new DataError(DATA_ERROR.INTERNAL_ERROR, `DB Error ${err.message}`, err);
  }
}

/**
 * @abstract create user in DB
 * @param user 
 * @returns inserted id
 */
export function createUser(user: { username: string; email?: string | null; password: string }): number {
  try {
    const info = insertUserStmt.run(user.username, user.email || null, user.password)
    if (info.changes === 0) {
      throw new DataError(DATA_ERROR.INTERNAL_ERROR, 'No rows changed');
    }
    if (!info.lastInsertRowid) {
      throw new DataError(DATA_ERROR.INTERNAL_ERROR, 'No ID rerurned');
    }
    return Number(info.lastInsertRowid);
  } catch (err: any) {
    if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
      const msg = (err.message || '').toLowerCase()
      if (msg.includes('username')) {
        throw new DataError(DATA_ERROR.DUPLICATE, 'Username taken', err, { field: 'username', value: user.username });
    } else if (msg.includes('email')) {
        throw new DataError(DATA_ERROR.DUPLICATE, 'Email taken', err, { field: 'email', value: user.email });
      } else {
        throw new DataError(DATA_ERROR.DUPLICATE, 'Unique constraint violated', err);
      }
    }
    throw new DataError(DATA_ERROR.INTERNAL_ERROR, `DB Error ${err.message}`, err);
  }
}

export function deleteUser(userId:number): void {
    try {
        const info = deleteUserStmt.run(userId);
        if (info.changes === 0)
            throw new DataError(DATA_ERROR.NOT_FOUND, 'User not found for deletion');
    } catch (err: any) {
        if (err instanceof DataError) throw err;
        throw new DataError(DATA_ERROR.INTERNAL_ERROR, `DB Error ${err.message}`, err);
    }
}

export function closeDatabase() {
  try {
    db.close()
  } catch (err: any) {
    throw new DataError(DATA_ERROR.INTERNAL_ERROR, `Unable to close DB ${err.message}`, err);
  }
}

export function getDatabasePath() {
  return DB_PATH
}

/**
 * @todo dev only - delete before prod
 */
export function listUsers(): DBUser[] {
  try {
    const stmt = db.prepare('SELECT * FROM users')
    const users = stmt.all() as DBUser[]
    return users
  } catch (err: any) {
    throw new DataError(DATA_ERROR.INTERNAL_ERROR, `DB Error ${err.message}`, err);
  }
}
