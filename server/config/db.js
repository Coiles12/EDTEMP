const { createClient } = require('@libsql/client');
require('dotenv').config();

const url = process.env.TURSO_DATABASE_URL || 'file:local.db';
const authToken = process.env.TURSO_AUTH_TOKEN || undefined;

const db = createClient({
  url,
  authToken,
});

/**
 * Initialise le schéma de base de données (tables users et events, index).
 */
async function initDb() {
  try {
    // Création de la table des utilisateurs
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL COLLATE NOCASE,
        password_hash TEXT NOT NULL,
        color TEXT NOT NULL DEFAULT '#3B82F6',
        ics_url TEXT,
        last_sync_at DATETIME,
        sync_status TEXT DEFAULT 'none',
        sync_error TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Création de la table des événements
    await db.execute(`
      CREATE TABLE IF NOT EXISTS events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        uid TEXT NOT NULL,
        title TEXT NOT NULL,
        location TEXT,
        description TEXT,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        all_day INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE(user_id, uid)
      );
    `);

    // Création des index pour accélérer les recherches de plages horaires
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_events_user_dates ON events(user_id, start_time, end_time);
    `);
    await db.execute(`
      CREATE INDEX IF NOT EXISTS idx_events_dates ON events(start_time, end_time);
    `);

    console.log(`[DB] Base de données initialisée avec succès (Mode: ${url.startsWith('file:') ? 'SQLite Local' : 'Turso Cloud'}).`);
  } catch (err) {
    console.error('[DB] Erreur lors de l\'initialisation du schéma de base de données :', err);
    throw err;
  }
}

module.exports = {
  db,
  initDb,
};
