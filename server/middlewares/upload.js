const multer = require('multer');

// Stockage en mémoire RAM pour éviter d'écrire des fichiers temporaires sur le disque (idéal pour Render/Fly.io)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Limite de 10 Mo par fichier .ics
  },
  fileFilter: (req, file, cb) => {
    // Vérification de l'extension et du mime type
    const isIcs = file.originalname.toLowerCase().endsWith('.ics') ||
                  file.mimetype.includes('calendar') ||
                  file.mimetype.includes('text/plain');
    if (isIcs) {
      cb(null, true);
    } else {
      cb(new Error('Format de fichier invalide. Veuillez importer un fichier .ics valide.'));
    }
  },
});

module.exports = upload;
