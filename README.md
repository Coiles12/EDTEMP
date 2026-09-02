# 📅 EDTEMP — Partage d'Emplois du Temps & Disponibilités

**EDTEMP** est une application web légère et collaborative permettant à un groupe d'étudiants ou d'amis (6 à 15 personnes) de partager et comparer leurs emplois du temps issus de leur ENT (via synchronisation ou import `.ics` / iCalendar).

---

## 🌟 Fonctionnalités

1. **Mon Agenda (vue détaillée)** :
   - Grille horaire hebdomadaire claire (du lundi au dimanche, 07h00 - 21h00).
   - Détail complet des cours personnels : intitulé, horaires, salle / amphi, description.
   - Navigation intuitive : semaine précédente, aujourd'hui, semaine suivante.

2. **Disponibilités du Groupe (confidentialité garantie)** :
   - **Confidentialité stricte** : Pour chaque ami du groupe, la plateforme n'affiche que des blocs "Occupé" sur leurs créneaux. **Aucun détail de cours (matière, salle, professeur) n'est jamais transmis** sur le réseau aux autres membres.
   - Filtre interactif des membres avec puces de couleur personnalisées.
   - **Mode "Créneaux communs libres" (style Doodle)** : met en surbrillance verte immédiate les créneaux horaires où **tous les amis sélectionnés sont libres en même temps**.

3. **Synchronisation & Import ICS** :
   - **Abonnement automatique** : Renseignez le lien d'export ICS de votre ENT (`https://...` ou `webcal://...`). Le serveur se charge de télécharger et de resynchroniser automatiquement l'agenda toutes les 6 heures via un planificateur cron en tâche de fond.
   - **Import manuel** : Glissez-déposez directement un fichier `.ics` exporté depuis votre ENT.
   - **Bouton de synchronisation manuelle** pour forcer l'actualisation immédiate en un clic.

4. **Architecture Monolithe & 100% Gratuite** :
   - Backend : Node.js + Express (sert à la fois les API REST et le frontend statique).
   - Base de données : SQLite persistant via le client cloud gratuit **Turso** (`@libsql/client`), avec support local sans configuration requise.
   - Frontend : HTML5 / CSS3 / JavaScript Vanilla moderne (sans aucun framework lourd, zéro dépendance frontend).
   - **Mode Sombre / Mode Clair** : Thème adaptatif automatique avec bascule manuelle en 1 clic et mémorisation dans le navigateur.

---

## 📁 Arborescence du Projet

```text
EDTEMP/
├── .env.example              # Modèle des variables d'environnement
├── .gitignore                # Exclusion des node_modules, .env et base locale
├── package.json              # Dépendances du projet
├── README.md                 # Documentation d'installation et de déploiement
├── test-backend.js           # Tests unitaires et vérification de confidentialité
├── test-e2e.js               # Tests d'intégration de bout en bout (E2E)
│
├── server/                   # Backend Node.js
│   ├── index.js              # Point d'entrée serveur (Express, API, statique, cron)
│   ├── config/
│   │   └── db.js             # Connexion Turso (@libsql/client) & migrations
│   ├── controllers/
│   │   ├── authController.js # Inscription, connexion, profil
│   │   └── calendarController.js # Upload, abonnement, /me et /group anonymisé
│   ├── middlewares/
│   │   ├── auth.js           # Authentification JWT Bearer
│   │   └── upload.js         # Upload en mémoire avec Multer
│   ├── routes/
│   │   ├── authRoutes.js     # Routes /api/auth/*
│   │   └── calendarRoutes.js # Routes /api/calendar/*
│   └── services/
│       ├── icsParser.js      # Analyseur iCalendar (node-ical) & récurrences RRULE
│       └── syncService.js    # Synchronisation des flux distants & cron toutes les 6h
│
└── public/                   # Frontend Vanilla
    ├── index.html            # Structure SPA avec navigation par onglets
    ├── css/
    │   └── style.css         # Styles épurés, grille horaire adaptative
    └── js/
        ├── api.js            # Client HTTP fetch et gestion du token JWT
        ├── auth.js           # Modale de connexion / inscription et profil
        ├── calendar.js       # Vue "Mon agenda" personnelle
        ├── groupCalendar.js  # Vue des disponibilités du groupe & mode Doodle
        └── app.js            # Orchestrateur (onglets, dates, formulaires)
```

---

## 🚀 Démarrage en local

### 1. Prérequis
- [Node.js](https://nodejs.org/) version 18 ou supérieure
- Git

### 2. Installation
Clonez le dépôt ou placez-vous dans le dossier du projet, puis installez les dépendances :

```bash
# Sur Linux / macOS :
npm install

# Sur Windows (PowerShell) :
npm.cmd install
```

### 3. Configuration de l'environnement
Copiez le fichier `.env.example` en `.env` :

```bash
cp .env.example .env
```

Par défaut, `TURSO_DATABASE_URL=file:local.db` est configuré. Cela permet d'exécuter l'application **immédiatement en local** sur une base SQLite de test, **sans avoir besoin de créer de compte Turso pour tester**.

### 4. Lancement
```bash
# Lancement classique :
npm start

# Ou avec rechargement automatique en développement :
npm run dev
```

L'application est accessible à l'adresse : **[http://localhost:3000](http://localhost:3000)**.

### 5. Exécution des tests
Deux suites de tests sont fournies :
```bash
# Test d'intégration de la base et de la règle de confidentialité :
npm test

# Test End-to-End complet (création comptes, upload ICS, requêtes HTTP, frontend statique) :
npm run test:e2e
```

---

## ☁️ Déploiement 100% Gratuit

Cette stack a été spécialement pensée pour fonctionner sur les formules gratuites de **Turso** et **Render** (ou **Fly.io**).

### Étape 1 : Créer la base de données gratuite sur Turso

[Turso](https://turso.tech) offre une base SQLite distribuée avec un quota gratuit généreux (jusqu'à 9 Go de stockage, jusqu'à 500 bases, sans mise en veille).

1. Rendez-vous sur [turso.tech](https://turso.tech) et créez un compte gratuit.
2. Installez le CLI Turso ou utilisez la console web :
   ```bash
   # Créer une base de données nommée "edtemp"
   turso db create edtemp

   # Récupérer l'URL de connexion (libsql://...)
   turso db show edtemp --url

   # Créer un jeton d'authentification permanent
   turso db tokens create edtemp
   ```
3. Notez l'URL (`libsql://edtemp-[votre-pseudo].turso.io`) et le token généré.

---

### Étape 2 : Déploiement sur Render (Web Service Gratuit)

[Render](https://render.com) propose un hébergement gratuit pour les applications Node.js avec certificat SSL automatique.

1. Créez un compte sur [Render.com](https://render.com) et connectez votre compte GitHub / GitLab.
2. Cliquez sur **New +** > **Web Service**.
3. Sélectionnez votre dépôt GitHub contenant le projet EDTEMP.
4. Renseignez les informations suivantes :
   - **Name** : `edtemp` (ou le nom de votre choix)
   - **Region** : `Frankfurt (EU Central)` (recommandé pour la France)
   - **Branch** : `main`
   - **Runtime** : `Node`
   - **Build Command** : `npm install`
   - **Start Command** : `node server/index.js`
   - **Instance Type** : `Free`
5. Dans la section **Environment Variables**, ajoutez les 4 variables :
   - `PORT` : `3000`
   - `JWT_SECRET` : Une chaîne aléatoire et secrète (ex: générée avec `openssl rand -hex 32`)
   - `TURSO_DATABASE_URL` : Votre URL Turso (`libsql://edtemp-...turso.io`)
   - `TURSO_AUTH_TOKEN` : Votre token Turso
6. Cliquez sur **Deploy Web Service**.
7. En 2 minutes, votre application est en ligne sur `https://edtemp.onrender.com` !

> **Astuce mise en veille Render** : Le plan gratuit de Render met en veille les services après 15 minutes d'inactivité. Grâce à Turso, vos données restent intactes. Au premier réveil (qui prend ~30s), la base et les plannings se reconnectent immédiatement.

---

### Alternative : Déploiement sur Fly.io

Si vous préférez [Fly.io](https://fly.io) :

1. Installez `flyctl` et connectez-vous (`fly auth login`).
2. À la racine du projet, lancez :
   ```bash
   fly launch --no-deploy
   ```
3. Configurez les variables secrètes :
   ```bash
   fly secrets set JWT_SECRET="votre_secret" TURSO_DATABASE_URL="libsql://edtemp-..." TURSO_AUTH_TOKEN="votre_token"
   ```
4. Déployez :
   ```bash
   fly deploy
   ```

---

## 🔒 Confidentialité & Sécurité

- **Confidentialité par conception** : La route backend `GET /api/calendar/group` n'extrait **que** les colonnes `start_time` et `end_time` de la table des événements. Les champs `title`, `location` et `description` sont exclus de la requête SQL et ne quittent jamais le serveur.
- **Mots de passe** : Chiffrés avec `bcryptjs` avec un sel de facteur 10.
- **Authentification** : Jetons JWT sécurisés transmis via le header standard `Authorization: Bearer <token>`.
- **Upload sécurisé** : Traitement des fichiers `.ics` en mémoire RAM (Multer `memoryStorage`), évitant l'écriture de fichiers résiduels sur disque.

---

## 📜 Licence
Projet open-source sous licence [MIT](LICENSE).
