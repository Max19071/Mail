import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

const databasePath =
  process.env.DATABASE_PATH?.trim() || path.join(process.cwd(), "data", "ai-mail-hub.db");

mkdirSync(path.dirname(databasePath), { recursive: true });

const globalForDatabase = globalThis as typeof globalThis & {
  aiMailSqlite?: Database.Database;
};

const sqlite = globalForDatabase.aiMailSqlite ?? new Database(databasePath);

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.aiMailSqlite = sqlite;
}

sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS mailboxes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    address TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    api_key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mailbox_id INTEGER NOT NULL,
    from_address TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    is_read INTEGER NOT NULL DEFAULT 0,
    received_at TEXT NOT NULL,
    FOREIGN KEY (mailbox_id) REFERENCES mailboxes(id) ON DELETE CASCADE
  );
`);

export const db = drizzle(sqlite, { schema });
