import Database from "better-sqlite3";
import { join } from "path";

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(join(process.cwd(), "db", "custom.db"), {
      readonly: true,
    });
    _db.pragma("journal_mode = WAL");
    _db.pragma("busy_timeout = 5000");
  }
  return _db;
}
