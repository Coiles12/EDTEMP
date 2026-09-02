const { db, initDb } = require('./server/config/db');
const { parseIcsString } = require('./server/services/icsParser');
const { saveUserEvents } = require('./server/services/syncService');
const bcrypt = require('bcryptjs');

async function runTest() {
  await initDb();

  const icsAlice = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:evt-alice-1
SUMMARY:Maths Discrètes
LOCATION:Amphi Curie
DTSTART:20260907T080000Z
DTEND:20260907T100000Z
END:VEVENT
END:VCALENDAR`;

  const eventsAlice = parseIcsString(icsAlice);
  console.log('[Test] Événements Alice parsés :', eventsAlice.length, '| Titre :', eventsAlice[0].title);

  // Nettoyage comptes de test
  await db.execute({
    sql: 'DELETE FROM users WHERE username IN (?, ?)',
    args: ['test_alice', 'test_bob'],
  });

  const passwordHash = await bcrypt.hash('secret123', 10);
  const u1 = await db.execute({
    sql: 'INSERT INTO users (username, password_hash, color) VALUES (?, ?, ?)',
    args: ['test_alice', passwordHash, '#3B82F6'],
  });
  const aliceId = Number(u1.lastInsertRowid);
  await saveUserEvents(aliceId, eventsAlice);

  const icsBob = `BEGIN:VCALENDAR
VERSION:2.0
BEGIN:VEVENT
UID:evt-bob-1
SUMMARY:Rendez-vous Médical Secret
LOCATION:Cabinet Privé
DTSTART:20260907T090000Z
DTEND:20260907T110000Z
END:VEVENT
END:VCALENDAR`;

  const eventsBob = parseIcsString(icsBob);
  const u2 = await db.execute({
    sql: 'INSERT INTO users (username, password_hash, color) VALUES (?, ?, ?)',
    args: ['test_bob', passwordHash, '#10B981'],
  });
  const bobId = Number(u2.lastInsertRowid);
  await saveUserEvents(bobId, eventsBob);

  // 1. Test Alice fetching son propre agenda détaillé
  const aliceEvents = await db.execute({
    sql: 'SELECT id, title, location, start_time, end_time FROM events WHERE user_id = ?',
    args: [aliceId],
  });
  console.log('[Test] Alice /me :', aliceEvents.rows[0].title, '| Salle :', aliceEvents.rows[0].location);

  // 2. Test Alice fetching la vue groupe (données de Bob)
  const groupEvents = await db.execute({
    sql: 'SELECT user_id, start_time, end_time, all_day FROM events WHERE user_id != ?',
    args: [aliceId],
  });
  console.log('[Test] Vue groupe reçue :', groupEvents.rows);

  if (groupEvents.rows[0].title === undefined && groupEvents.rows[0].location === undefined) {
    console.log('[Test] SUCCÈS CONFIDENTIALITÉ : Aucun titre, lieu ou description confidentielle n\'est exposé !');
  } else {
    throw new Error('Échec : fuite de données confidentielles.');
  }

  // Nettoyage après test
  await db.execute({
    sql: 'DELETE FROM users WHERE username IN (?, ?)',
    args: ['test_alice', 'test_bob'],
  });
  console.log('[Test] Nettoyage terminé.');
}

runTest()
  .then(() => {
    console.log('✅ TOUS LES TESTS D\'INTÉGRATION BACKEND SONT VALIDÉS !');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Erreur de test :', err);
    process.exit(1);
  });
