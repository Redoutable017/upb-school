# FAQ - Questions Fréquentes UPB School

## Gestion des Matières

### Comment ajouter une nouvelle matière ?

Exécuter cette requête SQL sur votre base de données :

```sql
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp)
VALUES (
  'Nom de la matière',      -- Ex: 'Programmation Web'
  'CODE_NIVEAU',            -- Ex: 'PROGWEB_L2' (doit être unique)
  'FILIERE1,FILIERE2',      -- Ex: 'ASSRI,MIAGE' ou juste 'MIAGE'
  'L2',                     -- Niveau: L1, L2, L3, M1, M2
  'Description de la matière',
  TRUE                      -- TRUE si a des TP, FALSE sinon
);
```

### Comment ajouter des matières spécifiques à un niveau sans affecter les autres ?

Le système filtre automatiquement par niveau. Par exemple, pour MIAGE L2 :

```sql
-- Ces matières n'apparaîtront QUE pour les étudiants en L2
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp) VALUES
('Gestion de Projet', 'GPROJ_L2', 'MIAGE', 'L2', 'Méthodologies Agile et classiques', FALSE),
('ERP et Progiciels', 'ERP_L2', 'MIAGE', 'L2', 'SAP, Oracle, etc.', TRUE);

-- Ces matières apparaîtront pour L2 ASSRI ET MIAGE
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp) VALUES
('Base de Données Avancées', 'BDA_L2', 'ASSRI,MIAGE', 'L2', 'SQL avancé', TRUE);
```

Un étudiant en MIAGE L1 ne verra pas ces matières car `niveau = 'L2'`.

### Comment modifier une matière existante ?

```sql
-- Modifier la description
UPDATE matieres SET description = 'Nouvelle description' WHERE code = 'ANA1_L1';

-- Ajouter une filière
UPDATE matieres SET filiere = 'ASSRI,MIAGE,3EA' WHERE code = 'ANA1_L1';

-- Changer le statut TP
UPDATE matieres SET has_tp = TRUE WHERE code = 'ANA1_L1';
```

### Comment supprimer une matière ?

```sql
-- 1. D'abord supprimer les cours associés
DELETE FROM courses WHERE matiere_id = (SELECT id FROM matieres WHERE code = 'CODE_MATIERE');

-- 2. Supprimer les quiz associés
DELETE FROM quiz_attempts WHERE matiere = 'Nom de la matière';

-- 3. Supprimer la matière
DELETE FROM matieres WHERE code = 'CODE_MATIERE';
```

---

## Gestion des Cours, TD et TP

### Comment ajouter un cours à une matière ?

```sql
-- 1. Récupérer l'ID de la matière
SELECT id, nom FROM matieres WHERE code = 'ANA1_L1';
-- Supposons que l'ID soit 2

-- 2. Ajouter le cours
INSERT INTO courses (titre, filiere, matiere_id, type_document, description, ordre)
VALUES (
  'Chapitre 1 - Les suites numériques',
  'ASSRI,MIAGE',
  2,        -- ID de la matière
  'cours',  -- Type: 'cours', 'td', ou 'tp'
  'Introduction aux suites convergentes',
  1         -- Ordre d'affichage
);
```

### Comment ajouter un TD à une matière ?

```sql
INSERT INTO courses (titre, filiere, matiere_id, type_document, description, ordre)
VALUES (
  'TD 1 - Exercices sur les suites',
  'ASSRI,MIAGE',
  2,
  'td',     -- Type TD
  '15 exercices corrigés',
  1
);
```

### Comment ajouter un TP à une matière ?

```sql
INSERT INTO courses (titre, filiere, matiere_id, type_document, description, ordre)
VALUES (
  'TP 1 - Implémentation des algorithmes de tri',
  'ASSRI,MIAGE',
  8,        -- ID de la matière Algorithmique
  'tp',     -- Type TP
  'TP en Python',
  1
);
```

### Comment associer un fichier PDF à un cours ?

1. **Placer le fichier** dans le dossier approprié :
   - Cours : `backend/uploads/cours/`
   - TD : `backend/uploads/td/`
   - TP : `backend/uploads/tp/`

2. **Mettre à jour la base de données** :
```sql
-- Pour un cours
UPDATE courses SET fichier_cours = '/uploads/cours/analyse1_ch1.pdf' WHERE id = 1;

-- Pour un TD
UPDATE courses SET fichier_td = '/uploads/td/analyse1_td1.pdf' WHERE id = 2;

-- Pour un TP
UPDATE courses SET fichier_tp = '/uploads/tp/algo_tp1.pdf' WHERE id = 3;
```

### Comment modifier ou supprimer un cours ?

```sql
-- Modifier
UPDATE courses SET titre = 'Nouveau titre', description = 'Nouvelle desc' WHERE id = 1;

-- Supprimer
DELETE FROM courses WHERE id = 1;
```

---

## Visualisation et Téléchargement des fichiers

### Comment un utilisateur peut-il visualiser un fichier ?

Dans l'application, chaque cours/TD/TP a deux boutons :
- **Visualiser** : Ouvre le PDF dans un nouvel onglet du navigateur
- **Télécharger** : Lance le téléchargement sur l'appareil

### Comment ça fonctionne techniquement ?

Le backend sert les fichiers statiques :
```javascript
// Dans server.js
app.use('/uploads', express.static('uploads'));
```

Le frontend accède aux fichiers via :
```javascript
// Visualiser (ouvre dans un nouvel onglet)
window.open('http://localhost:5000/uploads/cours/fichier.pdf', '_blank');

// Télécharger
const link = document.createElement('a');
link.href = 'http://localhost:5000/uploads/cours/fichier.pdf';
link.download = 'fichier.pdf';
link.click();
```

---

## Déploiement et Liens Fonctionnels

### Comment les liens dans les emails fonctionneront après déploiement ?

Les liens sont construits dynamiquement avec la variable `FRONTEND_URL` :

```javascript
// Dans backend/utils/email.js
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const resetLink = `${frontendUrl}/reset-password?code=${code}&email=${email}`;
```

**En développement** :
```
FRONTEND_URL=http://localhost:5173
→ http://localhost:5173/reset-password?code=123456&email=user@mail.com
```

**En production** :
```
FRONTEND_URL=https://upb-school.vercel.app
→ https://upb-school.vercel.app/reset-password?code=123456&email=user@mail.com
```

### Étapes pour que les liens fonctionnent en production

1. Déployer le frontend sur Vercel → Obtenir l'URL (ex: `https://upb-school.vercel.app`)
2. Configurer `FRONTEND_URL=https://upb-school.vercel.app` dans les variables d'environnement du backend sur Render
3. Redémarrer le backend
4. Les emails contiendront maintenant les bons liens

---

## Connexion Simultanée

### Est-ce possible de se connecter sur plusieurs appareils en même temps ?

**OUI**, c'est possible et c'est le comportement par défaut.

### Pourquoi ?

Le système utilise des **tokens JWT stateless** :
- Chaque connexion génère un nouveau token indépendant
- Les tokens sont valides pendant 7 jours
- Aucune limite de sessions côté serveur

### Exemple concret

1. Tu te connectes sur ton PC → Token A généré (valide 7 jours)
2. Tu te connectes sur ton téléphone → Token B généré (valide 7 jours)
3. Les deux appareils restent connectés indépendamment

### Comment limiter à un seul appareil (si souhaité) ?

Pour forcer une seule session, il faudrait modifier le système :

```sql
-- Ajouter une colonne à la table users
ALTER TABLE users ADD COLUMN current_session_token VARCHAR(255);
```

```javascript
// À chaque connexion, invalider l'ancien token
const sessionToken = crypto.randomBytes(32).toString('hex');
await pool.query('UPDATE users SET current_session_token = $1 WHERE id = $2', [sessionToken, user.id]);

// À chaque requête, vérifier que le token correspond
if (user.current_session_token !== req.sessionToken) {
  return res.status(401).json({ error: 'Session expirée (connexion depuis un autre appareil)' });
}
```

---

## Résumé des commandes SQL utiles

### Lister les matières
```sql
SELECT id, nom, code, filiere, niveau FROM matieres ORDER BY niveau, nom;
```

### Lister les cours d'une matière
```sql
SELECT c.*, m.nom as matiere_nom 
FROM courses c 
JOIN matieres m ON c.matiere_id = m.id 
WHERE m.code = 'ANA1_L1';
```

### Compter les étudiants par filière et niveau
```sql
SELECT filiere, niveau_etude, COUNT(*) as total 
FROM users 
WHERE pseudo != 'ADMIN'
GROUP BY filiere, niveau_etude 
ORDER BY filiere, niveau_etude;
```

### Voir les statistiques des quiz
```sql
SELECT matiere, COUNT(*) as tentatives, 
       ROUND(AVG(score::float/total_questions*100), 1) as moyenne_pourcent
FROM quiz_attempts 
GROUP BY matiere 
ORDER BY tentatives DESC;
```
