import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';

const dbPath = process.env.DB_PATH ?? path.resolve(__dirname, '../../data/workbench.db');

const dbDir = path.dirname(dbPath);
fs.mkdirSync(dbDir, { recursive: true });

export const db = new Database(dbPath);

export function initSchema(): Database.Database {
  const schemaSql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');
  db.exec(schemaSql);
  return db;
}
