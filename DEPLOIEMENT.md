# Guide de Déploiement - UPB School

## Vue d'ensemble

Pour rendre UPB School accessible sur Internet, il faut déployer :
1. **Frontend** (React) → Vercel ou Netlify (gratuit)
2. **Backend** (Node.js) → Render ou Railway (gratuit)
3. **Base de données** (PostgreSQL) → Supabase ou Neon (gratuit)

---

## Étape 1 : Base de données PostgreSQL

### Option recommandée : Supabase (gratuit)

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un compte et un nouveau projet
3. Récupérer l'URL de connexion dans Settings > Database
4. Format : `postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres`

### Migrer les données locales

```bash
# Exporter vos données locales
pg_dump -U postgres upb_school > backup.sql

# Importer sur Supabase (via leur interface SQL ou psql)
psql "postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres" < backup.sql
```

---

## Étape 2 : Backend sur Render

### Configuration

1. Aller sur [render.com](https://render.com)
2. Connecter votre dépôt GitHub
3. Créer un "Web Service"
4. Configurer :
   - **Build Command** : `cd backend && npm install`
   - **Start Command** : `cd backend && node server.js`
   - **Environment** : Node

### Variables d'environnement (sur Render)

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres
JWT_SECRET=[générer_un_secret_long_et_aléatoire]
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=upb.school1@gmail.com
SMTP_PASS=[mot_de_passe_application_gmail]
FRONTEND_URL=https://upb-school.vercel.app
GEMINI_API_KEY=[votre_clé_api]
```

**Important** : La variable `FRONTEND_URL` doit pointer vers l'URL finale de votre frontend.

---

## Étape 3 : Frontend sur Vercel

### Configuration

1. Aller sur [vercel.com](https://vercel.com)
2. Importer votre projet GitHub
3. Configurer :
   - **Framework** : Vite
   - **Root Directory** : `frontend`
   - **Build Command** : `npm run build`
   - **Output Directory** : `dist`

### Variable d'environnement (sur Vercel)

```
VITE_API_URL=https://upb-school-api.onrender.com/api
```

**Important** : Cette URL doit pointer vers votre backend déployé sur Render.

---

## Configuration des liens dans les emails

### Problème actuel
Les liens dans les emails pointent vers `localhost:5173`, ce qui ne fonctionnera pas en production.

### Solution
Le backend utilise la variable `FRONTEND_URL` pour construire les liens.

Dans `backend/utils/email.js`, les liens sont construits comme ceci :
```javascript
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const link = `${frontendUrl}/reset-password?code=${code}&email=${email}`;
```

**En production**, définir :
```
FRONTEND_URL=https://upb-school.vercel.app
```

Ainsi, les emails contiendront :
- `https://upb-school.vercel.app/reset-password?code=123456&email=user@mail.com`

---

## Vérification de l'email (fonctionnalité future)

Actuellement, l'email n'est pas vérifié à l'inscription. Pour l'ajouter :

### 1. Modifier l'inscription (backend)

```javascript
// Dans routes/auth.js, après création du compte
const verificationToken = crypto.randomBytes(32).toString('hex');

await pool.query(
  'UPDATE users SET email_verification_token = $1 WHERE id = $2',
  [verificationToken, user.id]
);

const verificationLink = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;
await sendVerificationEmail(email, prenom, verificationLink);
```

### 2. Ajouter une route de vérification

```javascript
router.get('/verify-email/:token', async (req, res) => {
  const { token } = req.params;
  
  const result = await pool.query(
    'UPDATE users SET email_verified = TRUE WHERE email_verification_token = $1 RETURNING *',
    [token]
  );
  
  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Lien invalide' });
  }
  
  res.redirect(`${process.env.FRONTEND_URL}/login?verified=true`);
});
```

---

## Connexion simultanée sur plusieurs appareils

### Réponse : OUI, c'est possible

Le système actuel permet la connexion simultanée car :

1. **JWT stateless** : Chaque token est autonome et valide pendant 7 jours
2. **Pas de session serveur** : Aucune limite de sessions côté backend
3. **Stockage local** : Chaque appareil stocke son propre token

### Comportement actuel
- Connexion sur PC → Token A généré
- Connexion sur mobile → Token B généré
- Les deux fonctionnent indépendamment pendant 7 jours

### Pour limiter (si souhaité plus tard)

```javascript
// Ajouter une colonne session_token dans users
// À chaque connexion, générer et stocker un nouveau session_token
// Vérifier ce token à chaque requête
// Nouvelle connexion = invalide l'ancienne
```

---

## Checklist de déploiement

### Avant le déploiement
- [ ] Créer compte Supabase/Neon (DB)
- [ ] Créer compte Render (Backend)
- [ ] Créer compte Vercel (Frontend)
- [ ] Avoir un dépôt GitHub avec le code

### Base de données
- [ ] Créer projet PostgreSQL sur Supabase
- [ ] Exécuter le script de création des tables
- [ ] Copier l'URL de connexion

### Backend
- [ ] Créer Web Service sur Render
- [ ] Configurer toutes les variables d'environnement
- [ ] Vérifier que l'URL `/api/health` répond

### Frontend
- [ ] Créer projet sur Vercel
- [ ] Configurer `VITE_API_URL`
- [ ] Vérifier le build réussi

### Tests finaux
- [ ] Tester inscription
- [ ] Tester connexion
- [ ] Tester réinitialisation mot de passe
- [ ] Vérifier réception des emails
- [ ] Tester les quiz

---

## Domaine personnalisé (optionnel)

### Sur Vercel
1. Aller dans Settings > Domains
2. Ajouter votre domaine (ex: `upb-school.com`)
3. Configurer DNS chez votre registrar

### Sur Render
1. Aller dans Settings > Custom Domain
2. Ajouter un sous-domaine (ex: `api.upb-school.com`)
3. Configurer DNS

### Mise à jour des variables
```
# Backend
FRONTEND_URL=https://upb-school.com

# Frontend
VITE_API_URL=https://api.upb-school.com/api
```

---

## Coûts estimés

| Service | Plan gratuit | Limites |
|---------|-------------|---------|
| Vercel | Oui | 100GB bandwidth/mois |
| Render | Oui | Sleep après 15min d'inactivité |
| Supabase | Oui | 500MB DB, 2GB bandwidth |
| Gmail SMTP | Oui | 500 emails/jour |

**Total mensuel** : 0€ pour commencer

### Pour plus de performance
- Render Pro : ~7$/mois (pas de sleep)
- Supabase Pro : ~25$/mois (plus de stockage)
