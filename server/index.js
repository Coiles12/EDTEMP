const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDb } = require('./config/db');
const { startSyncCron } = require('./services/syncService');
const authRoutes = require('./routes/authRoutes');
const calendarRoutes = require('./routes/calendarRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares globaux
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques du frontend Vanilla
const publicDirectory = path.join(__dirname, '../public');
app.use(express.static(publicDirectory));

// Routes de l'API
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);

// Route de santé pour le monitoring (Render / Fly.io health check)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Fallback pour les requêtes non-API : renvoie l'application frontend index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDirectory, 'index.html'));
});

// Démarrage du serveur et initialisation des services
async function startServer() {
  try {
    // 1. Initialisation de la base de données (Turso ou SQLite local)
    await initDb();

    // 2. Démarrage de la tâche planifiée de synchronisation ICS
    startSyncCron();

    // 3. Écoute sur le port configuré
    app.listen(PORT, () => {
      console.log(`
=====================================================
  EDTEMP - Partage d'emplois du temps ICS
  Serveur actif sur : http://localhost:${PORT}
  Mode BD : ${process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL : 'SQLite Local (file:local.db)'}
=====================================================
      `);
    });
  } catch (err) {
    console.error('[Server] Échec du démarrage du serveur :', err);
    process.exit(1);
  }
}

startServer();
