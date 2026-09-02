const { initDb, db } = require('./server/config/db');
const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./server/routes/authRoutes');
const calendarRoutes = require('./server/routes/calendarRoutes');

const PORT = 3001;

async function runE2ETest() {
  await initDb();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.static(path.join(__dirname, 'public')));
  app.use('/api/auth', authRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'public/index.html')));

  const server = app.listen(PORT);
  console.log(`[E2E] Serveur de test démarré sur http://localhost:${PORT}`);

  try {
    // 1. Nettoyage initial
    await db.execute({
      sql: 'DELETE FROM users WHERE username IN (?, ?)',
      args: ['e2e_alice', 'e2e_bob'],
    });

    // 2. Inscription Alice
    console.log('[E2E] Inscription Alice...');
    const regResAlice = await fetch(`http://localhost:${PORT}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'e2e_alice', password: 'password123', color: '#3B82F6' }),
    });
    const regAliceData = await regResAlice.json();
    if (!regResAlice.ok) throw new Error(`Inscription Alice échouée: ${JSON.stringify(regAliceData)}`);
    const tokenAlice = regAliceData.token;
    console.log('✅ Inscription Alice réussie');

    // 3. Inscription Bob
    console.log('[E2E] Inscription Bob...');
    const regResBob = await fetch(`http://localhost:${PORT}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'e2e_bob', password: 'password123', color: '#10B981' }),
    });
    const regBobData = await regResBob.json();
    if (!regResBob.ok) throw new Error(`Inscription Bob échouée: ${JSON.stringify(regBobData)}`);
    const tokenBob = regBobData.token;
    console.log('✅ Inscription Bob réussie');

    // 4. Upload ICS pour Alice (via FormData multipart)
    console.log('[E2E] Upload calendrier ICS Alice...');
    const icsContentAlice = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EDTEMP Test//FR
BEGIN:VEVENT
UID:e2e-alice-cours-1
SUMMARY:Informatique Théorique
LOCATION:Amphi Turing
DTSTART:20260907T083000Z
DTEND:20260907T103000Z
END:VEVENT
END:VCALENDAR`;

    const blobAlice = new Blob([icsContentAlice], { type: 'text/calendar' });
    const formDataAlice = new FormData();
    formDataAlice.append('icsFile', blobAlice, 'edt_alice.ics');

    const upResAlice = await fetch(`http://localhost:${PORT}/api/calendar/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenAlice}` },
      body: formDataAlice,
    });
    const upDataAlice = await upResAlice.json();
    if (!upResAlice.ok) throw new Error(`Upload Alice échoué: ${JSON.stringify(upDataAlice)}`);
    console.log('✅ Upload Alice réussi :', upDataAlice.message);

    // 5. Upload ICS pour Bob
    console.log('[E2E] Upload calendrier ICS Bob (activité confidentielle)...');
    const icsContentBob = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EDTEMP Test//FR
BEGIN:VEVENT
UID:e2e-bob-cours-1
SUMMARY:Examen Confidentiel
LOCATION:Salle Secrète 404
DTSTART:20260907T090000Z
DTEND:20260907T120000Z
END:VEVENT
END:VCALENDAR`;

    const blobBob = new Blob([icsContentBob], { type: 'text/calendar' });
    const formDataBob = new FormData();
    formDataBob.append('icsFile', blobBob, 'edt_bob.ics');

    const upResBob = await fetch(`http://localhost:${PORT}/api/calendar/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${tokenBob}` },
      body: formDataBob,
    });
    const upDataBob = await upResBob.json();
    if (!upResBob.ok) throw new Error(`Upload Bob échoué: ${JSON.stringify(upDataBob)}`);
    console.log('✅ Upload Bob réussi :', upDataBob.message);

    // 6. Alice consulte son propre agenda (/api/calendar/me)
    console.log('[E2E] Alice récupère son calendrier personnel...');
    const meRes = await fetch(`http://localhost:${PORT}/api/calendar/me`, {
      headers: { Authorization: `Bearer ${tokenAlice}` },
    });
    const meData = await meRes.json();
    if (!meRes.ok) throw new Error(`Fetch /me échoué: ${JSON.stringify(meData)}`);
    
    if (meData.events.length !== 1 || meData.events[0].title !== 'Informatique Théorique' || meData.events[0].location !== 'Amphi Turing') {
      throw new Error(`Détails Alice incorrects: ${JSON.stringify(meData)}`);
    }
    console.log('✅ Alice voit correctement son cours détaillé :', meData.events[0].title, 'dans', meData.events[0].location);

    // 7. Alice consulte le calendrier du groupe (/api/calendar/group)
    console.log('[E2E] Alice récupère les disponibilités du groupe...');
    const groupRes = await fetch(`http://localhost:${PORT}/api/calendar/group`, {
      headers: { Authorization: `Bearer ${tokenAlice}` },
    });
    const groupData = await groupRes.json();
    if (!groupRes.ok) throw new Error(`Fetch /group échoué: ${JSON.stringify(groupData)}`);

    const bobInGroup = groupData.group.find(g => g.username === 'e2e_bob');
    if (!bobInGroup) throw new Error('Bob introuvable dans le groupe.');
    if (bobInGroup.busySlots.length !== 1) throw new Error(`Créneaux de Bob erronés: ${JSON.stringify(bobInGroup)}`);

    const slot = bobInGroup.busySlots[0];
    console.log('Créneau de Bob vu par Alice :', slot);

    // VÉRIFICATION STRICTE DE CONFIDENTIALITÉ
    if (slot.title !== undefined || slot.location !== undefined || slot.description !== undefined) {
      throw new Error('❌ ALERTE SÉCURITÉ : Titre ou salle fuitée dans le groupe !');
    }
    console.log('✅ RÈGLE DE CONFIDENTIALITÉ VALIDÉE : Aucun titre ni salle de cours n\'est transmis dans /group !');

    // 8. Test de distribution du frontend statique (GET /)
    console.log('[E2E] Vérification de la distribution du frontend statique...');
    const htmlRes = await fetch(`http://localhost:${PORT}/`);
    const htmlText = await htmlRes.text();
    if (!htmlText.includes('EDTEMP') || !htmlText.includes('calendar-toolbar')) {
      throw new Error('Frontend non servi correctement par Express.');
    }
    console.log('✅ Le frontend statique index.html est parfaitement servi par Express !');

    // 9. Nettoyage
    await db.execute({
      sql: 'DELETE FROM users WHERE username IN (?, ?)',
      args: ['e2e_alice', 'e2e_bob'],
    });
    console.log('✅ Nettoyage des données de test effectué');

  } finally {
    server.close(() => {
      setTimeout(() => process.exit(0), 100);
    });
    console.log('[E2E] Serveur de test arrêté.');
  }
}

runE2ETest()
  .then(() => {
    console.log('🎉 TOUS LES TESTS END-TO-END ONT RÉUSSI AVEC SUCCÈS !');
  })
  .catch((err) => {
    console.error('❌ Échec du test E2E :', err);
    process.exit(1);
  });
