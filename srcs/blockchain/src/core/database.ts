import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { Blockchain } from "../module/block.schema.js";

// DB path
const DEFAULT_DIR = path.join(process.cwd(), 'data')
const DB_PATH = process.env.BLOCK_DB_PATH || path.join(DEFAULT_DIR, 'blockchain.db')

// Check dir
try {
  fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })
} catch (err) {
  const e: any = new Error(`Failed to ensure DB directory: ${(err as any)?.message || String(err)}`)
  throw e
}

export const db = new Database(DB_PATH)
console.log('Using SQLite file:', DB_PATH)

// Create table
try {
  db.exec(`
CREATE TABLE IF NOT EXISTS snapshot(
    tx_id INTEGER PRIMARY KEY AUTOINCREMENT,
    tx_hash TEXT UNIQUE,
    date_confirmed TEXT,
    tour_id INTEGER UNIQUE,
    player1_id INTEGER,
    player2_id INTEGER,
    player3_id INTEGER,
    player4_id INTEGER
    );
  `)
} catch (err) {
  const e: any = new Error(
    `Failed to initialize DB schema: ${(err as any)?.message || String(err)}`,
  )
  throw e;
}

const insertSnapMatchStmt = db.prepare(`INSERT INTO snapshot(tx_id,tour_id,player1_id,player2_id,player3_id,player4_id) VALUES (?,?,?,?,?,?)`);


export function insertSnapMatch(block: Blockchain): number{
    try {    
        const idb = insertSnapMatchStmt.run(block.tour_id, block.player1_id, block.player2_id, block.player3_id,block.player4_id);
        return Number(idb.lastInsertRowid);
    } catch (err: any) {
        if (err && err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        const msg = (err.message || '').toLowerCase();
        if (msg.includes('match')) {
            const error: any = new Error(`Tournament '${block.tour_id}' is already taken`);
            error.code = 'TOURNAMENT_EXISTS';
            throw error;
        }
    }
    const error: any = new Error(`Error during Tournament storage: ${err?.message || err}`);
    error.code = 'DB_INSERT_TOURNAMENT_ERR';
    throw error;
  }
}
