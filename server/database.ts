import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';

// Initialize DB
let db: Database | null = null;

export const initDb = async () => {
  if (db) return db;

  const dbPath = path.resolve(process.cwd(), 'database.sqlite');

  db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      start_date TEXT
    );

    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      author_name TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS processes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      efficiency REAL NOT NULL,
      status TEXT NOT NULL,
      normal_count INTEGER NOT NULL,
      warning_count INTEGER NOT NULL,
      anomaly_count INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS anomalies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      process_name TEXT NOT NULL,
      count INTEGER NOT NULL,
      avg_delay REAL NOT NULL,
      type TEXT NOT NULL, -- 'anomaly' or 'warning'
      FOREIGN KEY (process_name) REFERENCES processes(name)
    );

    CREATE TABLE IF NOT EXISTS dashboard_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_delay REAL NOT NULL
    );
  `);

  // Seed Initial Data if tables are empty
  const processCount = await db.get('SELECT COUNT(*) as count FROM processes');
  if (processCount.count === 0) {
    await db.exec(`
      INSERT INTO processes (name, efficiency, status, normal_count, warning_count, anomaly_count) VALUES
      ('프레스', 85, '정상', 85, 10, 5),
      ('엔진', 90, '정상', 90, 7, 3),
      ('차체', 78, '위험', 78, 15, 7),
      ('도장', 88, '정상', 88, 8, 4),
      ('설비', 92, '정상', 92, 5, 3);

      INSERT INTO anomalies (process_name, count, avg_delay, type) VALUES
      ('프레스', 5, 2.5, 'anomaly'),
      ('프레스', 10, 0.5, 'warning'),
      ('엔진', 3, 4.0, 'anomaly'),
      ('엔진', 7, 0.8, 'warning'),
      ('차체', 7, 3.2, 'anomaly'),
      ('차체', 15, 0.6, 'warning'),
      ('도장', 4, 2.8, 'anomaly'),
      ('도장', 8, 0.4, 'warning'),
      ('설비', 3, 5.0, 'anomaly'),
      ('설비', 5, 1.0, 'warning');

      INSERT INTO dashboard_history (date, total_delay) VALUES
      ('1/5', 35),
      ('1/6', 42),
      ('1/7', 58),
      ('1/8', 51);
    `);
  }

  console.log('Database initialized successfully at ' + dbPath);
  return db;
};

export const getDb = async () => {
  if (!db) {
    return await initDb();
  }
  return db;
};
