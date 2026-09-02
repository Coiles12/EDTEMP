const { db } = require('../config/db');
const { parseIcsString, normalizeCalendarUrl } = require('../services/icsParser');
const { saveUserEvents, syncUserCalendar } = require('../services/syncService');

/**
 * Upload manuel d'un fichier .ics
 */
async function uploadIcs(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier .ics n\'a été transmis.' });
    }

    const icsText = req.file.buffer.toString('utf-8');
    const events = parseIcsString(icsText);

    if (events.length === 0) {
      return res.status(400).json({ error: 'Aucun événement valide n\'a été trouvé dans ce fichier .ics.' });
    }

    const count = await saveUserEvents(req.user.id, events);

    // Mettre à jour le statut
    await db.execute({
      sql: `UPDATE users 
            SET last_sync_at = CURRENT_TIMESTAMP, 
                sync_status = 'success', 
                sync_error = NULL 
            WHERE id = ?`,
      args: [req.user.id],
    });

    return res.json({
      message: `Emploi du temps mis à jour avec succès (${count} cours importés).`,
      count,
    });
  } catch (err) {
    console.error('[Calendar] Erreur lors de l\'upload ICS :', err);
    return res.status(500).json({ error: `Erreur lors de l'analyse du fichier ICS : ${err.message}` });
  }
}

/**
 * Enregistre une URL ICS d'abonnement ENT et lance la première synchronisation
 */
async function subscribeIcs(req, res) {
  try {
    const { icsUrl } = req.body;
    if (!icsUrl || typeof icsUrl !== 'string') {
      return res.status(400).json({ error: 'L\'URL du flux ICS est obligatoire.' });
    }

    const cleanUrl = normalizeCalendarUrl(icsUrl);

    // Enregistrer l'URL dans le profil utilisateur
    await db.execute({
      sql: 'UPDATE users SET ics_url = ? WHERE id = ?',
      args: [cleanUrl, req.user.id],
    });

    // Lancement immédiat de la synchronisation
    const syncResult = await syncUserCalendar(req.user.id, cleanUrl);

    return res.json({
      message: `Abonnement enregistré et synchronisé avec succès (${syncResult.count} cours importés).`,
      count: syncResult.count,
    });
  } catch (err) {
    console.error('[Calendar] Erreur lors de l\'abonnement ICS :', err);
    return res.status(500).json({ error: `Erreur lors de la synchronisation de l'URL : ${err.message}` });
  }
}

/**
 * Déclenche une synchronisation manuelle pour l'utilisateur connecté
 */
async function syncIcs(req, res) {
  try {
    const userResult = await db.execute({
      sql: 'SELECT ics_url FROM users WHERE id = ?',
      args: [req.user.id],
    });

    const user = userResult.rows[0];
    if (!user || !user.ics_url) {
      return res.status(400).json({ error: 'Aucun lien d\'abonnement ICS configuré pour votre compte.' });
    }

    const syncResult = await syncUserCalendar(req.user.id, user.ics_url);

    return res.json({
      message: `Synchronisation réussie (${syncResult.count} cours mis à jour).`,
      count: syncResult.count,
    });
  } catch (err) {
    console.error('[Calendar] Erreur lors du rafraîchissement manuel :', err);
    return res.status(500).json({ error: `Échec du rafraîchissement : ${err.message}` });
  }
}

/**
 * Récupère l'emploi du temps complet et détaillé de l'utilisateur connecté
 */
async function getMyCalendar(req, res) {
  try {
    const { start, end } = req.query;

    let sql = `
      SELECT id, uid, title, location, description, start_time, end_time, all_day 
      FROM events 
      WHERE user_id = ?
    `;
    const args = [req.user.id];

    if (start && end) {
      sql += ' AND end_time >= ? AND start_time <= ?';
      args.push(start, end);
    }

    sql += ' ORDER BY start_time ASC';

    const result = await db.execute({ sql, args });

    return res.json({
      events: result.rows.map((row) => ({
        id: row.id,
        uid: row.uid,
        title: row.title,
        location: row.location,
        description: row.description,
        startTime: row.start_time,
        endTime: row.end_time,
        allDay: Boolean(row.all_day),
      })),
    });
  } catch (err) {
    console.error('[Calendar] Erreur lors de la récupération de mon calendrier :', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération de votre calendrier.' });
  }
}

/**
 * Récupère les créneaux d'occupation des autres utilisateurs du groupe
 * RÈGLE DE CONFIDENTIALITÉ : Seuls start_time et end_time sont récupérés.
 * Aucun titre, description ou lieu n'est sélectionné ou transmis.
 */
async function getGroupCalendar(req, res) {
  try {
    const { start, end } = req.query;

    // 1. Récupérer la liste des autres membres du groupe
    const usersResult = await db.execute({
      sql: 'SELECT id, username, color, last_sync_at FROM users WHERE id != ? ORDER BY username ASC',
      args: [req.user.id],
    });

    const otherUsers = usersResult.rows;

    if (otherUsers.length === 0) {
      return res.json({ group: [] });
    }

    // 2. Récupérer uniquement les plages horaires occupées pour ces membres
    let sql = `
      SELECT user_id, start_time, end_time, all_day 
      FROM events 
      WHERE user_id != ?
    `;
    const args = [req.user.id];

    if (start && end) {
      sql += ' AND end_time >= ? AND start_time <= ?';
      args.push(start, end);
    }

    sql += ' ORDER BY start_time ASC';

    const eventsResult = await db.execute({ sql, args });
    const allBusyEvents = eventsResult.rows;

    // 3. Structurer la réponse par membre
    const group = otherUsers.map((member) => {
      const memberEvents = allBusyEvents.filter((ev) => ev.user_id === member.id);
      return {
        userId: member.id,
        username: member.username,
        color: member.color,
        lastSyncAt: member.last_sync_at,
        busySlots: memberEvents.map((ev) => ({
          startTime: ev.start_time,
          endTime: ev.end_time,
          allDay: Boolean(ev.all_day),
        })),
      };
    });

    return res.json({ group });
  } catch (err) {
    console.error('[Calendar] Erreur lors de la récupération du calendrier de groupe :', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération des disponibilités du groupe.' });
  }
}

module.exports = {
  uploadIcs,
  subscribeIcs,
  syncIcs,
  getMyCalendar,
  getGroupCalendar,
};
