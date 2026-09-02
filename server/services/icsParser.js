const ical = require('node-ical');

/**
 * Normalise une URL ICS (ex: webcal://vers https://)
 * @param {string} url
 * @returns {string}
 */
function normalizeCalendarUrl(url) {
  let cleaned = (url || '').trim();
  if (cleaned.startsWith('webcal://')) {
    cleaned = 'https://' + cleaned.slice('webcal://'.length);
  }
  return cleaned;
}

/**
 * Télécharge et parse le contenu d'un lien d'abonnement ICS
 * @param {string} rawUrl
 * @returns {Promise<Array>} Liste d'événements normalisés
 */
async function parseIcsFromUrl(rawUrl) {
  const url = normalizeCalendarUrl(rawUrl);
  if (!url) {
    throw new Error('L\'URL de l\'agenda ICS est requise.');
  }

  // Téléchargement avec timeout et headers standards
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 secondes timeout

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'EDTEMP-Calendar-Sync/1.0',
        'Accept': 'text/calendar, text/plain, */*',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Échec du téléchargement du calendrier (Statut HTTP ${response.status})`);
    }

    const icsText = await response.text();
    return parseIcsString(icsText);
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('Le serveur de l\'ENT a mis trop de temps à répondre (délai dépassé).');
    }
    throw err;
  }
}

/**
 * Parse une chaîne de caractères brute au format iCalendar (.ics)
 * @param {string} icsString
 * @returns {Array} Liste d'événements normalisés
 */
function parseIcsString(icsString) {
  if (!icsString || typeof icsString !== 'string') {
    throw new Error('Contenu de calendrier vide ou invalide.');
  }

  const parsed = ical.sync.parseICS(icsString);
  const events = [];

  // Fenêtre d'expansion pour les événements récurrents (de 3 mois avant à 12 mois après la date actuelle)
  const now = new Date();
  const windowStart = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  for (const k of Object.keys(parsed)) {
    const ev = parsed[k];
    if (!ev || ev.type !== 'VEVENT') continue;

    const baseUid = ev.uid || `evt_${Math.random().toString(36).substring(2, 11)}`;
    const title = (ev.summary || 'Événement').toString().trim();
    const location = (ev.location || '').toString().trim();
    const description = (ev.description || '').toString().trim();
    const allDay = ev.datetype === 'date' ? 1 : 0;

    // Gestion des événements récurrents (RRULE)
    if (ev.rrule) {
      try {
        const duration = ev.end && ev.start ? (new Date(ev.end).getTime() - new Date(ev.start).getTime()) : 3600000;
        const dates = ev.rrule.between(windowStart, windowEnd, true);

        dates.forEach((occurrenceDate, index) => {
          const occStart = new Date(occurrenceDate);
          const occEnd = new Date(occStart.getTime() + duration);

          events.push({
            uid: `${baseUid}_rec_${occStart.getTime()}`,
            title,
            location,
            description,
            startTime: occStart.toISOString(),
            endTime: occEnd.toISOString(),
            allDay,
          });
        });
        continue;
      } catch (rruleErr) {
        console.warn(`[ICS] Avertissement lors de l'expansion RRULE pour ${baseUid}:`, rruleErr.message);
        // Fallback vers l'événement unique
      }
    }

    // Événement standard non-récurrent
    if (ev.start) {
      const startDate = new Date(ev.start);
      // Si fin non définie, par défaut 1 heure après le début
      const endDate = ev.end ? new Date(ev.end) : new Date(startDate.getTime() + 60 * 60 * 1000);

      // Ignorer les événements avec dates invalides
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        continue;
      }

      events.push({
        uid: baseUid,
        title,
        location,
        description,
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        allDay,
      });
    }
  }

  return events;
}

module.exports = {
  normalizeCalendarUrl,
  parseIcsFromUrl,
  parseIcsString,
};
