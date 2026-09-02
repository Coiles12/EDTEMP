const express = require('express');
const router = express.Router();
const calendarController = require('../controllers/calendarController');
const authMiddleware = require('../middlewares/auth');
const upload = require('../middlewares/upload');

// Toutes les routes du calendrier sont protégées par l'authentification
router.use(authMiddleware);

// Upload manuel d'un fichier .ics
router.post('/upload', upload.single('icsFile'), calendarController.uploadIcs);

// Abonnement et enregistrement d'une URL de flux ICS
router.post('/subscribe', calendarController.subscribeIcs);

// Déclenchement d'une synchronisation manuelle
router.post('/sync', calendarController.syncIcs);

// Récupération de son propre emploi du temps détaillé
router.get('/me', calendarController.getMyCalendar);

// Récupération des disponibilités anonymisées du groupe (libre / occupé uniquement)
router.get('/group', calendarController.getGroupCalendar);

module.exports = router;
