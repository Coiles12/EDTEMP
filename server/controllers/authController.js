const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../config/db');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_edtemp_local_token_key_9938210';

const DEFAULT_COLORS = [
  '#3B82F6', // Bleu
  '#10B981', // Émeraude
  '#F59E0B', // Ambre
  '#EF4444', // Rouge
  '#8B5CF6', // Violet
  '#EC4899', // Rose
  '#06B6D4', // Cyan
  '#84CC16', // Citron vert
  '#F97316', // Orange
  '#6366F1', // Indigo
];

/**
 * Inscription d'un nouvel utilisateur
 */
async function register(req, res) {
  try {
    const { username, password, color } = req.body;

    if (!username || typeof username !== 'string' || username.trim().length < 2) {
      return res.status(400).json({ error: 'Le pseudo doit comporter au moins 2 caractères.' });
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'Le mot de passe doit comporter au moins 6 caractères.' });
    }

    const cleanUsername = username.trim();

    // Vérifier si l'utilisateur existe déjà
    const existing = await db.execute({
      sql: 'SELECT id FROM users WHERE username = ? COLLATE NOCASE',
      args: [cleanUsername],
    });

    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Ce pseudo est déjà utilisé par un autre membre.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // Attribuer une couleur aléatoire agréable ou celle choisie
    const userColor = color || DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];

    const result = await db.execute({
      sql: 'INSERT INTO users (username, password_hash, color) VALUES (?, ?, ?)',
      args: [cleanUsername, passwordHash, userColor],
    });

    const newUserId = Number(result.lastInsertRowid);

    const token = jwt.sign(
      { id: newUserId, username: cleanUsername },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      message: 'Compte créé avec succès !',
      token,
      user: {
        id: newUserId,
        username: cleanUsername,
        color: userColor,
        ics_url: null,
        last_sync_at: null,
        sync_status: 'none',
      },
    });
  } catch (err) {
    console.error('[Auth] Erreur lors de l\'inscription :', err);
    return res.status(500).json({ error: 'Erreur interne lors de la création du compte.' });
  }
}

/**
 * Connexion d'un utilisateur existant
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Veuillez saisir votre pseudo et votre mot de passe.' });
    }

    const cleanUsername = username.trim();

    const result = await db.execute({
      sql: 'SELECT * FROM users WHERE username = ? COLLATE NOCASE',
      args: [cleanUsername],
    });

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    }

    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'Connexion réussie !',
      token,
      user: {
        id: user.id,
        username: user.username,
        color: user.color,
        ics_url: user.ics_url,
        last_sync_at: user.last_sync_at,
        sync_status: user.sync_status,
        sync_error: user.sync_error,
      },
    });
  } catch (err) {
    console.error('[Auth] Erreur lors de la connexion :', err);
    return res.status(500).json({ error: 'Erreur interne lors de la connexion.' });
  }
}

/**
 * Récupère les données du profil de l'utilisateur connecté
 */
async function getMe(req, res) {
  try {
    const result = await db.execute({
      sql: 'SELECT id, username, color, ics_url, last_sync_at, sync_status, sync_error, created_at FROM users WHERE id = ?',
      args: [req.user.id],
    });

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé.' });
    }

    return res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('[Auth] Erreur getMe :', err);
    return res.status(500).json({ error: 'Erreur lors de la récupération du profil.' });
  }
}

/**
 * Met à jour les préférences de l'utilisateur (couleur)
 */
async function updateProfile(req, res) {
  try {
    const { color } = req.body;
    if (color && typeof color === 'string') {
      await db.execute({
        sql: 'UPDATE users SET color = ? WHERE id = ?',
        args: [color.trim(), req.user.id],
      });
    }

    return res.json({ message: 'Profil mis à jour avec succès.' });
  } catch (err) {
    console.error('[Auth] Erreur mise à jour profil :', err);
    return res.status(500).json({ error: 'Impossible de mettre à jour le profil.' });
  }
}

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
