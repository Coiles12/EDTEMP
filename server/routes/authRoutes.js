const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/auth');

// Routes publiques
router.post('/register', authController.register);
router.post('/login', authController.login);

// Routes authentifiées
router.get('/me', authMiddleware, authController.getMe);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
