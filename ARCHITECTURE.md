# Architecture de UPB School

## Vue d'ensemble

UPB School est une application web éducative composée de deux parties principales :
- **Frontend** : Application React (SPA) avec Vite
- **Backend** : API REST Node.js avec Express

```
UPB_Projet/
├── frontend/          # Application React
│   ├── src/
│   │   ├── pages/     # Pages de l'application
│   │   ├── components/# Composants réutilisables
│   │   ├── store/     # État global (Zustand)
│   │   ├── services/  # Appels API
│   │   └── utils/     # Fonctions utilitaires
│   └── dist/          # Build de production
│
├── backend/           # API Node.js
│   ├── routes/        # Routes API
│   ├── middleware/    # Middlewares (auth, etc.)
│   ├── config/        # Configuration (DB, etc.)
│   ├── utils/         # Utilitaires (email, etc.)
│   └── uploads/       # Fichiers uploadés
│
└── *.md               # Documentation
```

---

## Base de données PostgreSQL

### Tables principales

#### 1. `users` - Utilisateurs
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | Identifiant unique |
| nom | VARCHAR | Nom de famille |
| prenom | VARCHAR | Prénom |
| pseudo | VARCHAR | Pseudo unique |
| email | VARCHAR | Email unique |
| telephone | VARCHAR | Téléphone (optionnel) |
| password_hash | VARCHAR | Mot de passe hashé (bcrypt) |
| filiere | VARCHAR | Filière (ASSRI, MIAGE, 3EA, SJAP) |
| niveau_etude | VARCHAR | Niveau (L1, L2, L3, M1, M2) |
| photo_profil | TEXT | Chemin vers la photo |
| points_exp | INTEGER | Points d'expérience |
| niveau | INTEGER | Niveau de l'utilisateur |
| theme_preference | VARCHAR | 'dark' ou 'light' |
| biometrie_active | BOOLEAN | Biométrie activée |
| previous_password_hash | VARCHAR | Ancien mot de passe (pour éviter réutilisation) |

#### 2. `matieres` - Matières par filière/niveau
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | Identifiant unique |
| nom | VARCHAR | Nom de la matière |
| code | VARCHAR | Code unique (ex: ANA1_L1) |
| filiere | VARCHAR | Filières concernées (ex: "ASSRI,MIAGE") |
| niveau | VARCHAR | Niveau (L1, L2, etc.) |
| description | TEXT | Description de la matière |
| has_tp | BOOLEAN | A des TP ou non |

#### 3. `courses` - Cours/TD/TP
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | Identifiant unique |
| titre | VARCHAR | Titre du document |
| filiere | VARCHAR | Filière concernée |
| matiere_id | INTEGER | FK vers matieres.id |
| type_document | VARCHAR | 'cours', 'td', 'tp' |
| fichier_cours | TEXT | Chemin du fichier cours |
| fichier_td | TEXT | Chemin du fichier TD |
| fichier_tp | TEXT | Chemin du fichier TP |
| description | TEXT | Description |
| ordre | INTEGER | Ordre d'affichage |

#### 4. `quiz_attempts` - Tentatives de quiz
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | Identifiant unique |
| user_id | INTEGER | FK vers users.id |
| matiere | VARCHAR | Nom de la matière |
| score | INTEGER | Score obtenu |
| total_questions | INTEGER | Nombre de questions |
| tentative_numero | INTEGER | 1 ou 2 |
| points_gagnes | INTEGER | Points gagnés |
| points_perdus | INTEGER | Points perdus |

#### 5. `reset_codes` - Codes de réinitialisation
| Colonne | Type | Description |
|---------|------|-------------|
| id | SERIAL | Identifiant unique |
| user_email | VARCHAR | Email de l'utilisateur |
| code | VARCHAR | Code à 6 chiffres |
| expires_at | TIMESTAMP | Expiration (10 min) |
| used | BOOLEAN | Code déjà utilisé |

---

## Frontend (React + Vite)

### Technologies utilisées
- **React 18** : Bibliothèque UI
- **Vite** : Build tool rapide
- **Zustand** : Gestion d'état global
- **React Router** : Navigation SPA
- **Tailwind CSS** : Styles utilitaires
- **Axios** : Requêtes HTTP
- **Lucide React** : Icônes
- **React Hot Toast** : Notifications
- **Canvas Confetti** : Animations de célébration

### Structure des pages
```
src/pages/
├── Login.jsx          # Connexion
├── Register.jsx       # Inscription
├── ForgotPassword.jsx # Mot de passe oublié
├── Dashboard.jsx      # Tableau de bord
├── Courses.jsx        # Liste des cours
├── CourseDetail.jsx   # Détail d'un cours
├── Quiz.jsx           # Quiz interactif
├── Leaderboard.jsx    # Classement
├── Profile.jsx        # Profil utilisateur
├── Settings.jsx       # Paramètres
└── Admin.jsx          # Panel admin
```

### State Management (Zustand)
```javascript
// authStore.js - État d'authentification
{
  user: { id, nom, prenom, email, filiere, ... },
  token: "jwt_token",
  login(), logout(), register(), updateUser()
}

// preferencesStore.js - Préférences utilisateur
{
  theme: 'dark' | 'light',
  notifications: boolean,
  toggleTheme(), setNotifications()
}
```

### Services API
```javascript
// api.js
authAPI.register(data)      // Inscription
authAPI.login(data)         // Connexion
authAPI.forgotPassword()    // Mot de passe oublié
authAPI.resetPassword()     // Réinitialisation

userAPI.getProfile()        // Profil
userAPI.updateProfile()     // Mise à jour profil
userAPI.uploadPhoto()       // Photo de profil

coursesAPI.getAll()         // Tous les cours
coursesAPI.getMatieresByFiliere() // Matières

quizAPI.submit()            // Soumettre quiz
quizAPI.getHistory()        // Historique

aiAPI.generateQuiz()        // Générer quiz IA
aiAPI.chat()                // Chat avec IA
```

---

## Backend (Node.js + Express)

### Technologies utilisées
- **Express** : Framework web
- **PostgreSQL** : Base de données (via `pg`)
- **bcryptjs** : Hashage des mots de passe
- **jsonwebtoken** : Tokens JWT
- **nodemailer** : Envoi d'emails
- **multer** : Upload de fichiers
- **helmet** : Sécurité HTTP
- **cors** : Cross-Origin Resource Sharing
- **express-rate-limit** : Limitation de requêtes

### Routes API

#### Auth (`/api/auth`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /register | Créer un compte |
| POST | /login | Se connecter |
| POST | /forgot-password | Demander réinitialisation |
| POST | /verify-reset-code | Vérifier le code |
| POST | /reset-password | Réinitialiser le mot de passe |
| POST | /biometric-login | Connexion biométrique |

#### User (`/api/user`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | /profile | Obtenir son profil |
| PUT | /profile | Modifier son profil |
| POST | /profile/photo | Uploader photo |
| PUT | /preferences | Modifier préférences |
| DELETE | /account | Supprimer son compte |

#### Courses (`/api/courses`)
| Méthode | Route | Description |
|---------|-------|-------------|
| GET | / | Liste des cours |
| GET | /:id | Détail d'un cours |
| GET | /filieres/:filiere/matieres | Matières par filière |

#### Quiz (`/api/quiz`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /submit | Soumettre un quiz |
| GET | /can-retry/:matiere | Vérifier si retry possible |
| GET | /history | Historique des quiz |
| GET | /leaderboard | Classement |

#### AI (`/api/ai`)
| Méthode | Route | Description |
|---------|-------|-------------|
| POST | /generate-quiz | Générer quiz avec Gemini |
| POST | /chat | Chat avec l'IA |
| POST | /explain | Explication d'un concept |

---

## Système d'authentification

### Flux d'inscription
1. Utilisateur remplit le formulaire
2. Validation côté client (mot de passe fort)
3. Envoi au backend
4. Vérification unicité email/pseudo
5. Hash du mot de passe (bcrypt, 10 rounds)
6. Création en base de données
7. Génération token JWT (7 jours)
8. Email de bienvenue envoyé
9. Redirection vers dashboard

### Flux de connexion
1. Saisie identifiant (email/pseudo/téléphone) + mot de passe
2. Recherche utilisateur en base
3. Comparaison hash bcrypt
4. Génération token JWT
5. Stockage token côté client (Zustand persist)

### Flux de réinitialisation mot de passe
1. Saisie de l'email
2. Vérification existence du compte
3. Génération code 6 chiffres (10 min validité)
4. Envoi par email
5. Saisie du code
6. Vérification non-expiration et non-utilisation
7. Saisie nouveau mot de passe
8. Vérification différent des 2 derniers
9. Mise à jour en base + notification email

---

## Système de Quiz et Points

### Règles de points
- **1ère tentative** : 15 questions
  - Bonne réponse : +50 points
  - Mauvaise réponse : -20 points
  - Question bonus (15ème) : +200 points si correcte
  
- **2ème tentative** (si score < 50%) : 10 questions
  - Points divisés par 2 (+25/-10)
  - Pas de question bonus

### Niveaux
Le niveau est calculé selon les points d'XP :
- Niveau 1 : 0-99 XP
- Niveau 2 : 100-249 XP
- Niveau 3 : 250-499 XP
- etc. (paliers croissants)

---

## Sécurité

### Mesures implémentées
1. **Helmet** : Headers HTTP sécurisés
2. **CORS** : Restriction des origines
3. **Rate Limiting** : 100 req/15min par IP
4. **bcrypt** : Hash des mots de passe (cost 10)
5. **JWT** : Tokens signés, expiration 7 jours
6. **Validation mot de passe** : 8 car, 1 maj, 1 chiffre, 1 spécial
7. **Anti-spam reset** : 30s entre les demandes
8. **Historique MDP** : Empêche réutilisation des 2 derniers

---

## Variables d'environnement

### Backend (.env)
```env
# Serveur
PORT=5000
NODE_ENV=development

# Base de données
DATABASE_URL=postgresql://user:password@host:5432/database

# JWT
JWT_SECRET=votre_secret_jwt_tres_long

# Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre.email@gmail.com
SMTP_PASS=mot_de_passe_application

# Frontend URL
FRONTEND_URL=http://localhost:5173

# API Gemini
GEMINI_API_KEY=votre_clé_api_gemini
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Flux de données

```
+-------------+     HTTP      +-------------+     SQL      +-------------+
|   Frontend  | <-----------> |   Backend   | <-----------> |  PostgreSQL |
|   (React)   |    JSON       |  (Express)  |   Queries     |     (DB)    |
+-------------+               +-------------+               +-------------+
       |                            |
       |                            |
       v                            v
  LocalStorage               Nodemailer ----> SMTP (Gmail)
  (Token JWT)                     |
                                  |
                                  v
                            Google Gemini API
                            (Génération Quiz)
```
