const cron = require('node-cron');
const { db } = require('../config/db');
const { parseIcsFromUrl } = require('./icsParser');

/**
 * Enregistre une liste d'événements pour un utilisateur en remplaçant les anciens
 * @param {number} userId
 * @param {Array} events
 */
async function saveUserEvents(userId, events) {
  // Suppression des anciens événements de l'utilisateur pour garantir l'absence de cours fantômes annulés
  await db.execute({
    sql: 'DELETE FROM events WHERE user_id = ?',
    args: [userId],
  });

  if (!events || events.length === 0) {
    return 0;
  }

  // Insertion par lots de 50 pour respecter les contraintes de taille de requêtes
  const CHUNK_SIZE = 50;
  for (let i = 0; i < events.length; i += CHUNK_SIZE) {
    const chunk = events.slice(i, i + CHUNK_SIZE);
    const statements = chunk.map((ev) => ({
      sql: `INSERT OR REPLACE INTO events 
            (user_id, uid, title, location, description, start_time, end_time, all_day) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        userId,
        ev.uid,
        ev.title || 'Événement',
        ev.location || '',
        ev.description || '',
        ev.startTime,
        ev.endTime,
        ev.allDay || 0,
      ],
    }));

    await db.batch(statements);
  }

  return events.length;
}

/**
 * Synchronise l'agenda d'un utilisateur à partir de son URL ICS
 * @param {number} userId
 * @param {string} icsUrl
 */
async function syncUserCalendar(userId, icsUrl) {
  if (!icsUrl) {
    throw new Error('Aucune URL ICS configurée.');
  }

  try {
    const events = await parseIcsFromUrl(icsUrl);
    const count = await saveUserEvents(userId, events);

    await db.execute({
      sql: `UPDATE users 
            SET last_sync_at = CURRENT_TIMESTAMP, 
                sync_status = 'success', 
                sync_error = NULL 
            WHERE id = ?`,
      args: [userId],
    });

    console.log(`[Sync] Utilisateur #${userId} synchronisé : ${count} événements importés.`);
    return { count, success: true };
  } catch (err) {
    console.error(`[Sync] Échec de synchronisation pour l'utilisateur #${userId} :`, err.message);

    await db.execute({
      sql: `UPDATE users 
            SET sync_status = 'error', 
                sync_error = ? 
            WHERE id = ?`,
      args: [err.message, userId],
    });

    throw err;
  }
}

/**
 * Parcourt tous les utilisateurs disposant d'une URL ICS pour les resynchroniser
 */
async function syncAllSubscribedUsers() {
  console.log('[Cron] Début de la synchronisation automatique des abonnements ICS...');
  try {
    const result = await db.execute(`
      SELECT id, username, ics_url 
      FROM users 
      WHERE ics_url IS NOT NULL AND TRIM(ics_url) != ''
    `);

    const users = result.rows;
    console.log(`[Cron] ${users.length} utilisateur(s) à synchroniser.`);

    for (const user of users) {
      try {
        await syncUserCalendar(user.id, user.ics_url);
      } catch (err) {
        console.warn(`[Cron] Avertissement synchro pour ${user.username} :`, err.message);
      }
    }

    console.log('[Cron] Fin du cycle de synchronisation automatique.');
  } catch (err) {
    console.error('[Cron] Erreur globale lors du cycle de synchronisation :', err);
  }
}

/**
 * Démarre le planificateur de tâches cron (toutes les 6 heures par défaut)
 */
function startSyncCron() {
  // Exécution toutes les 6 heures (à la minute 0 de chaque tranche de 6h : 00h, 06h, 12h, 18h)
  cron.schedule('0 */6 * * *', () => {
    syncAllSubscribedUsers();
  });
  console.log('[Cron] Tâche de synchronisation automatique programmée toutes les 6 heures.');
}

module.exports = {
  saveUserEvents,
  syncUserCalendar,
  syncAllSubscribedUsers,
  startSyncCron,
};
