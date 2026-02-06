# 🎓 UPB SCHOOL - Guide d'Installation Complet

## 📋 Table des matières
1. [Prérequis](#prérequis)
2. [Installation PostgreSQL avec pgAdmin 4](#installation-postgresql)
3. [Configuration de la base de données](#configuration-base-de-données)
4. [Installation du Backend](#installation-backend)
5. [Installation du Frontend](#installation-frontend)
6. [Configuration de l'email (Gmail)](#configuration-email)
7. [Lancement de l'application](#lancement-application)
8. [Résolution des problèmes courants](#problèmes-courants)

---

## 🔧 Prérequis

Avant de commencer, assurez-vous d'avoir installé :

### 1. Node.js (v18 ou supérieur)
- **Télécharger** : https://nodejs.org/
- Choisir la version LTS (Long Term Support)
- Vérifier l'installation :
  ```powershell
  node --version
  npm --version
  ```

### 2. PostgreSQL 16 avec pgAdmin 4
- **Télécharger** : https://www.postgresql.org/download/windows/
- Choisir l'installateur Windows (inclut pgAdmin 4)

---

## 🗄️ Installation PostgreSQL

### Étape 1 : Installation
1. Lancez l'installateur PostgreSQL
2. **Port** : Laissez 5432 (par défaut)
3. **Mot de passe superutilisateur** : `creation12` (comme dans votre .env)
4. **Locale** : French, France
5. Cochez **pgAdmin 4** lors de l'installation

### Étape 2 : Vérification
Après installation, PostgreSQL devrait démarrer automatiquement.

Pour vérifier :
```powershell
# Vérifier si le service tourne
Get-Service -Name postgresql*
```

---

## 💾 Configuration de la base de données

### Méthode 1 : Avec pgAdmin 4 (Interface graphique)

#### 1. Ouvrir pgAdmin 4
- Cherchez "pgAdmin 4" dans le menu Démarrer
- Entrez votre mot de passe : `creation12`

#### 2. Créer la base de données
1. Dans l'arbre à gauche, cliquez droit sur **"Databases"**
2. Cliquez sur **"Create" > "Database..."**
3. **Nom** : `upb_school`
4. **Owner** : `postgres`
5. Cliquez sur **"Save"**

✅ Votre base de données est créée !

#### 3. Créer les tables

**Option A : Via l'interface pgAdmin**
1. Cliquez droit sur `upb_school` > **"Query Tool"**
2. Ouvrez le fichier suivant dans un éditeur :
   ```
   C:\Users\LENOVO\Desktop\UPB_Projet\backend\scripts\setupDatabase.js
   ```
3. Ou utilisez l'option automatique ci-dessous

**Option B : Automatiquement avec Node.js (RECOMMANDÉ)**

Ouvrez PowerShell dans le dossier backend :
```powershell
cd C:\Users\LENOVO\Desktop\UPB_Projet\backend
npm install
npm run db:setup
```

Vous devriez voir :
```
✅ Connexion à PostgreSQL établie
🔄 Création des tables...
✅ Tables créées avec succès !
✅ Données d'exemple insérées !
🎉 Configuration de la base de données terminée !
```

### Méthode 2 : En ligne de commande (psql)

```powershell
# Se connecter à PostgreSQL
psql -U postgres

# Entrez le mot de passe : creation12

# Créer la base
CREATE DATABASE upb_school;

# Se connecter à la base
\c upb_school

# Quitter
\q
```

---

## 🔙 Installation du Backend

### Étape 1 : Installation des dépendances

```powershell
cd C:\Users\LENOVO\Desktop\UPB_Projet\backend
npm install
```

Cette commande installe :
- Express (serveur web)
- PostgreSQL (client DB)
- Gemini AI
- Nodemailer (emails)
- JWT (authentification)
- Et tous les autres modules

### Étape 2 : Vérifier le fichier .env

Le fichier `.env` existe déjà à la racine du backend. Vérifiez qu'il contient :

```env
DATABASE_URL=postgresql://postgres:creation12@localhost:5432/upb_school
JWT_SECRET=upb-school-secret-key-2026-change-in-production
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yannhvevo@gmail.com
SMTP_PASS=fsby twqv vudg kvtj
EMAIL_FROM=UPB School <noreply@upbschool.com>
OPENAI_API_KEY=AIzaSyDEyDzh_rDGxHNTH93Veou5G9AmmBERoq4
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

⚠️ **IMPORTANT** : La clé API Gemini (`OPENAI_API_KEY`) doit être valide. Pour obtenir votre clé :
1. Allez sur : https://makersuite.google.com/app/apikey
2. Cliquez sur "Create API Key"
3. Remplacez la valeur dans le .env

### Étape 3 : Créer les tables de la base de données

```powershell
npm run db:setup
```

### Étape 4 : Démarrer le serveur backend

```powershell
npm run dev
```

Vous devriez voir :
```
🚀 Serveur démarré sur le port 5000
📍 URL: http://localhost:5000
🔧 Environnement: development
✅ Connexion à PostgreSQL établie
✅ Serveur SMTP prêt à envoyer des emails
```

✅ **Le backend est prêt !**

Pour tester, ouvrez un navigateur : http://localhost:5000/api/health

Vous devriez voir :
```json
{
  "status": "OK",
  "message": "UPB School API is running",
  "timestamp": "2026-02-04T..."
}
```

---

## 🎨 Installation du Frontend

### Étape 1 : Ouvrir un NOUVEAU terminal PowerShell

⚠️ **NE FERMEZ PAS le terminal du backend !**

Ouvrez un nouveau terminal :

```powershell
cd C:\Users\LENOVO\Desktop\UPB_Projet\frontend
```

### Étape 2 : Installation des dépendances

```powershell
npm install
```

Cette commande installe :
- React 18
- Vite (build tool ultra-rapide)
- Tailwind CSS
- React Router
- Axios
- Zustand (state management)
- Et tous les autres modules

⏱️ Cela peut prendre 2-3 minutes.

### Étape 3 : Démarrer le serveur frontend

```powershell
npm run dev
```

Vous devriez voir :
```
  VITE v5.0.11  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

✅ **Le frontend est prêt !**

Ouvrez votre navigateur : **http://localhost:5173**

---

## 📧 Configuration de l'email (Gmail)

Pour que les emails de réinitialisation de mot de passe fonctionnent :

### Option 1 : Utiliser le compte Gmail configuré

Le compte `yannhvevo@gmail.com` est déjà configuré avec un mot de passe d'application.

### Option 2 : Configurer votre propre Gmail

1. **Activer la validation en 2 étapes**
   - Allez sur : https://myaccount.google.com/security
   - Activez "Validation en 2 étapes"

2. **Créer un mot de passe d'application**
   - Allez sur : https://myaccount.google.com/apppasswords
   - Nom : "UPB School"
   - Copiez le mot de passe généré (16 caractères)

3. **Mettre à jour le .env**
   ```env
   SMTP_USER=votre-email@gmail.com
   SMTP_PASS=votre-mot-de-passe-application
   EMAIL_FROM=UPB School <noreply@upbschool.com>
   ```

4. **Redémarrer le backend**
   ```powershell
   # Dans le terminal backend, appuyez sur Ctrl+C
   npm run dev
   ```

---

## 🚀 Lancement de l'application

### Résumé des commandes

**Terminal 1 - Backend :**
```powershell
cd C:\Users\LENOVO\Desktop\UPB_Projet\backend
npm run dev
```

**Terminal 2 - Frontend :**
```powershell
cd C:\Users\LENOVO\Desktop\UPB_Projet\frontend
npm run dev
```

### Accès à l'application

- **Frontend** : http://localhost:5173
- **Backend API** : http://localhost:5000
- **pgAdmin 4** : http://localhost:5050 (ou application de bureau)

---

## 🎯 Premier test de l'application

### 1. Créer un compte
1. Ouvrez http://localhost:5173
2. Cliquez sur **"S'inscrire"**
3. Remplissez le formulaire :
   - **Nom** : Dupont
   - **Prénom** : Jean
   - **Filière** : ASSRI
   - **Niveau** : L1
   - **Email** : jean.dupont@test.com
   - **Téléphone** : 0612345678
   - **Mot de passe** : 123456

4. Cliquez sur **"Créer mon compte"**

✅ Vous devriez être redirigé vers le Dashboard !

### 2. Tester la réinitialisation de mot de passe

1. Déconnectez-vous
2. Cliquez sur **"Mot de passe oublié ?"**
3. Entrez votre email
4. Vérifiez votre boîte mail (si configuré)
5. Entrez le code reçu
6. Créez un nouveau mot de passe

### 3. Vérifier dans pgAdmin

1. Ouvrez pgAdmin 4
2. Connectez-vous à `upb_school`
3. Cliquez droit sur `Tables` > **"Refresh"**
4. Explorez la table `users` :
   ```sql
   SELECT * FROM users;
   ```

Vous devriez voir votre utilisateur !

---

## 🔍 Structure du projet

```
UPB_Projet/
├── backend/
│   ├── config/
│   │   └── database.js          # Configuration PostgreSQL
│   ├── middleware/
│   │   └── auth.js               # Middleware JWT
│   ├── routes/
│   │   ├── auth.js               # Routes authentification
│   │   ├── user.js               # Routes utilisateur
│   │   ├── courses.js            # Routes cours
│   │   ├── quiz.js               # Routes quiz + système de points
│   │   └── ai.js                 # Routes IA Gemini
│   ├── scripts/
│   │   └── setupDatabase.js      # Script création tables
│   ├── utils/
│   │   └── email.js              # Fonctions email
│   ├── uploads/
│   │   └── profiles/             # Photos de profil
│   ├── .env                      # Variables d'environnement
│   ├── server.js                 # Point d'entrée
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── Layout.jsx        # Layout principal
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Page connexion
│   │   │   ├── Register.jsx      # Page inscription
│   │   │   ├── ForgotPassword.jsx # Réinitialisation MDP
│   │   │   ├── Dashboard.jsx     # Tableau de bord
│   │   │   ├── Courses.jsx       # Page cours
│   │   │   ├── Quiz.jsx          # Page quiz
│   │   │   ├── Profile.jsx       # Profil utilisateur
│   │   │   └── Settings.jsx      # Paramètres
│   │   ├── services/
│   │   │   └── api.js            # API client Axios
│   │   ├── store/
│   │   │   └── authStore.js      # Store Zustand
│   │   ├── App.jsx               # Router principal
│   │   ├── main.jsx              # Point d'entrée
│   │   └── index.css             # Styles Tailwind
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
└── README.md                     # Ce fichier
```

---

## ❌ Résolution des problèmes courants

### Problème 1 : "Port 5000 déjà utilisé"

**Solution 1 : Tuer le processus**
```powershell
# Trouver le processus sur le port 5000
netstat -ano | findstr :5000

# Tuer le processus (remplacez XXXX par le PID)
taskkill /PID XXXX /F
```

**Solution 2 : Changer le port**
Dans `backend/.env` :
```env
PORT=5001
```

### Problème 2 : "Cannot connect to PostgreSQL"

**Vérifier que PostgreSQL tourne :**
```powershell
Get-Service -Name postgresql*
```

Si "Stopped", démarrez-le :
```powershell
Start-Service postgresql-x64-16
```

**Vérifier les identifiants :**
- Username : `postgres`
- Password : `creation12`
- Database : `upb_school`
- Port : `5432`

### Problème 3 : "npm install" échoue

**Vider le cache npm :**
```powershell
npm cache clean --force
npm install
```

**Utiliser yarn (alternative) :**
```powershell
npm install -g yarn
yarn install
```

### Problème 4 : "Module not found"

**Réinstaller les dépendances :**
```powershell
# Backend
cd backend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install

# Frontend
cd ..\frontend
Remove-Item -Recurse -Force node_modules
Remove-Item package-lock.json
npm install
```

### Problème 5 : "CORS Error" dans le navigateur

**Vérifier la configuration CORS dans `backend/server.js` :**
```javascript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

**Vérifier que les deux serveurs tournent :**
- Backend : http://localhost:5000
- Frontend : http://localhost:5173

### Problème 6 : Emails non envoyés

**Vérifier les logs du backend :**
```
✅ Serveur SMTP prêt à envoyer des emails
```

Si ce message n'apparaît pas :
1. Vérifiez `SMTP_USER` et `SMTP_PASS` dans le .env
2. Vérifiez que vous avez créé un mot de passe d'application Gmail
3. Vérifiez votre connexion Internet

### Problème 7 : "API Key invalid" (Gemini)

**Obtenir une nouvelle clé API :**
1. Allez sur : https://makersuite.google.com/app/apikey
2. Créez une nouvelle clé
3. Remplacez dans le .env :
   ```env
   OPENAI_API_KEY=votre-nouvelle-cle
   ```
4. Redémarrez le backend

---

## 🎓 Fonctionnalités implémentées

### ✅ Authentification
- [x] Inscription complète (nom, prénom, filière, niveau, email, téléphone)
- [x] Connexion par email OU téléphone
- [x] Mot de passe oublié avec code à 6 chiffres par email
- [x] Code valide 15 minutes
- [x] Email de notification après changement de MDP
- [x] JWT tokens sécurisés

### ✅ Système de points et niveaux
- [x] Points XP : +100 par bonne réponse, -40 par mauvaise
- [x] Question bonus (15ème) : +200 / -80
- [x] Deuxième tentative : points divisés par 2
- [x] 10 paliers de niveaux avec points requis croissants
- [x] Réinitialisation des points à chaque nouveau niveau
- [x] Progression sauvegardée en temps réel

### ✅ Système de quiz
- [x] Génération automatique de quiz par l'IA
- [x] 15 questions première tentative (dont 1 bonus)
- [x] 10 questions deuxième tentative
- [x] Limite de 2 tentatives par matière
- [x] Retente autorisée si score < 50%
- [x] Questions uniques par étudiant
- [x] Historique complet des tentatives

### ✅ IA Gemini
- [x] Chatbot éducatif avec modération de contenu
- [x] Génération automatique de quiz basés sur les cours
- [x] Explication de concepts
- [x] Historique des conversations

### ✅ Base de données
- [x] Tables users, courses, quiz_attempts, ai_conversations
- [x] Matières : TEEO, ANALYSE 1/2, ANGLAIS, ARCHITECTURE, ALGORITHME, ALGEBRE 1, MERISE, MICRO ECONOMIE
- [x] Support ASSRI et MIAGE

### 📝 Fonctionnalités à compléter

Les pages suivantes ont été créées mais nécessitent une implémentation complète :
- [ ] Page Cours (affichage, téléchargement PDF/Word, accès TD/TP)
- [ ] Page Quiz complète (interface quiz avec timer, animations)
- [ ] Page Profil (upload photo, suppression compte, statistiques détaillées)
- [ ] Page Paramètres (thème clair/sombre, biométrie, contact)
- [ ] Classement (leaderboard)
- [ ] Animations confettis lors de passage de niveau

---

## 📚 Documentation API

### Authentification

**POST** `/api/auth/register`
```json
{
  "nom": "Dupont",
  "prenom": "Jean",
  "filiere": "ASSRI",
  "niveau_etude": "L1",
  "email": "jean@test.com",
  "telephone": "0612345678",
  "password": "123456"
}
```

**POST** `/api/auth/login`
```json
{
  "identifier": "jean@test.com",
  "password": "123456"
}
```

**POST** `/api/auth/forgot-password`
```json
{
  "email": "jean@test.com"
}
```

### Quiz

**POST** `/api/quiz/submit`
```json
{
  "matiere": "ANALYSE 1",
  "score": 12,
  "total_questions": 15,
  "temps_ecoule": 450,
  "tentative_numero": 1,
  "questions_data": [...]
}
```

**GET** `/api/quiz/can-retry/:matiere`

**GET** `/api/quiz/history`

**GET** `/api/quiz/leaderboard`

### IA

**POST** `/api/ai/chat`
```json
{
  "message": "Explique-moi les limites en analyse",
  "matiere": "ANALYSE 1"
}
```

**POST** `/api/ai/generate-quiz`
```json
{
  "matiere": "ANALYSE 1",
  "contenu_cours": "...",
  "nombre_questions": 15
}
```

---

## 🔐 Sécurité

- JWT avec expiration 7 jours
- Mots de passe hashés avec bcrypt (10 rounds)
- Rate limiting (100 requêtes / 15 min)
- Helmet.js pour sécuriser les headers HTTP
- CORS configuré
- Validation des entrées utilisateur
- Modération de contenu IA
- Codes de réinitialisation à usage unique

---

## 🚀 Prochaines étapes

1. **Implémenter les pages manquantes** (Cours, Quiz complet, Profil, Paramètres)
2. **Ajouter l'upload de documents PDF/Word** pour les cours
3. **Créer l'interface de quiz interactive** avec timer et animations
4. **Implémenter le système de confettis** lors des passages de niveau
5. **Ajouter le classement (leaderboard)** en temps réel
6. **Optimiser pour mobile** (responsive design déjà en place)
7. **Tests unitaires et d'intégration**
8. **Déploiement** (Vercel pour frontend, Railway/Heroku pour backend, Supabase pour PostgreSQL)

---

## 💡 Astuces

### Raccourcis PowerShell

Créez un script `start.ps1` à la racine du projet :

```powershell
# Démarrer backend et frontend ensemble
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm run dev"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
```

Lancez avec :
```powershell
.\start.ps1
```

### Accès rapide pgAdmin

Créez un raccourci bureau vers :
```
C:\Program Files\PostgreSQL\16\pgAdmin 4\bin\pgAdmin4.exe
```

### VSCode Extensions recommandées

- **ES7+ React/Redux/React-Native snippets**
- **Tailwind CSS IntelliSense**
- **PostgreSQL** (par Chris Kolkman)
- **Thunder Client** (pour tester l'API)
- **Prettier** (formatage automatique)

---

## 📞 Support

En cas de problème :

1. **Vérifiez les logs** dans les terminaux backend et frontend
2. **Consultez la section "Problèmes courants"** ci-dessus
3. **Vérifiez que PostgreSQL tourne** avec pgAdmin 4
4. **Vérifiez les ports** (5000 pour backend, 5173 pour frontend, 5432 pour PostgreSQL)

---

## 🎉 Félicitations !

Vous avez maintenant une application web moderne et fonctionnelle pour votre projet UPB School !

**Points forts de votre application :**
- ✅ Architecture moderne (React + Node.js + PostgreSQL)
- ✅ IA intégrée (Gemini)
- ✅ Système de points et niveaux complet
- ✅ Authentification sécurisée
- ✅ Design moderne avec Tailwind CSS
- ✅ Responsive (mobile-friendly)
- ✅ Scalable et maintenable

**Bonne chance pour votre concours ! 🏆**
