const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_edtemp_local_token_key_9938210';

/**
 * Middleware d'authentification par JWT Bearer Token.
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès non autorisé : jeton d\'authentification manquant.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      id: decoded.id,
      username: decoded.username,
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session invalide ou expirée. Veuillez vous reconnecter.' });
  }
}

module.exports = authMiddleware;
