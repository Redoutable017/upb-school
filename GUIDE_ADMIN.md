# Guide Administrateur - UPB School

## Accès Admin

### Identifiants
- **Pseudo** : `ADMIN`
- **Email** : `upb.school1@gmail.com`
- **Mot de passe** : `Life.raymd@10`

### URL d'accès
- Local : `http://localhost:5173/admin`
- Production : `https://[votre-domaine]/admin`

**Note** : Seul le compte ADMIN peut accéder au panel d'administration.

---

## Gestion des Matières

### Structure de la table `matieres`

```sql
CREATE TABLE matieres (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,        -- "Analyse 1"
  code VARCHAR(50) NOT NULL UNIQUE, -- "ANA1_L1"
  filiere VARCHAR(50) NOT NULL,     -- "ASSRI,MIAGE" ou "ASSRI"
  niveau VARCHAR(10) NOT NULL,      -- "L1", "L2", "L3", "M1", "M2"
  description TEXT,                 -- "Analyse mathématique 1"
  has_tp BOOLEAN DEFAULT FALSE      -- A des TP ou non
);
```

### Ajouter une nouvelle matière

**Via SQL (recommandé)** :
```sql
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp)
VALUES (
  'Programmation Web',
  'PROGWEB_L2',
  'ASSRI,MIAGE',
  'L2',
  'Développement web avec HTML, CSS, JavaScript',
  TRUE
);
```

### Ajouter une matière pour UNE SEULE filière

```sql
-- Matière uniquement pour MIAGE L2
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp)
VALUES (
  'Gestion de Projet',
  'GPROJ_L2_MIAGE',
  'MIAGE',
  'L2',
  'Méthodologies de gestion de projet informatique',
  FALSE
);
```

### Ajouter une matière pour PLUSIEURS filières

```sql
-- Matière partagée entre ASSRI et MIAGE en L2
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp)
VALUES (
  'Base de Données Avancées',
  'BDA_L2',
  'ASSRI,MIAGE',
  'L2',
  'SQL avancé, optimisation, transactions',
  TRUE
);
```

### Comment fonctionne le filtrage par filière

Le système recherche les matières dont la colonne `filiere` contient la filière de l'utilisateur :

```sql
-- Pour un étudiant en ASSRI L1
SELECT * FROM matieres 
WHERE (filiere LIKE '%ASSRI%' OR filiere LIKE 'ASSRI,%')
  AND niveau = 'L1';
```

Donc :
- `filiere = 'ASSRI'` → visible par ASSRI uniquement
- `filiere = 'ASSRI,MIAGE'` → visible par ASSRI et MIAGE
- `filiere = 'ASSRI,MIAGE,3EA'` → visible par les 3 filières

### Modifier une matière

```sql
UPDATE matieres 
SET description = 'Nouvelle description', has_tp = TRUE
WHERE code = 'ANA1_L1';
```

### Supprimer une matière

```sql
-- D'abord supprimer les cours associés
DELETE FROM courses WHERE matiere_id = (SELECT id FROM matieres WHERE code = 'ANA1_L1');

-- Puis supprimer la matière
DELETE FROM matieres WHERE code = 'ANA1_L1';
```

---

## Gestion des Cours/TD/TP

### Structure de la table `courses`

```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  titre VARCHAR(200) NOT NULL,
  filiere VARCHAR(50) NOT NULL,
  matiere_id INTEGER REFERENCES matieres(id),
  type_document VARCHAR(20),       -- 'cours', 'td', 'tp'
  fichier_cours TEXT,              -- '/uploads/cours/fichier.pdf'
  fichier_td TEXT,                 -- '/uploads/td/fichier.pdf'
  fichier_tp TEXT,                 -- '/uploads/tp/fichier.pdf'
  description TEXT,
  ordre INTEGER DEFAULT 0
);
```

### Ajouter un nouveau cours

```sql
-- D'abord récupérer l'ID de la matière
SELECT id FROM matieres WHERE code = 'ANA1_L1';  -- Exemple: id = 2

-- Ajouter le cours
INSERT INTO courses (titre, filiere, matiere_id, type_document, description, ordre)
VALUES (
  'Chapitre 1 - Les suites numériques',
  'ASSRI,MIAGE',
  2,  -- ID de la matière Analyse 1
  'cours',
  'Introduction aux suites et convergence',
  1
);
```

### Ajouter un TD à une matière

```sql
INSERT INTO courses (titre, filiere, matiere_id, type_document, description, ordre)
VALUES (
  'TD 1 - Exercices sur les suites',
  'ASSRI,MIAGE',
  2,
  'td',
  'Exercices pratiques sur les suites',
  1
);
```

### Ajouter un TP à une matière

```sql
INSERT INTO courses (titre, filiere, matiere_id, type_document, description, ordre)
VALUES (
  'TP 1 - Programmation récursive',
  'ASSRI,MIAGE',
  8,  -- ID d'Algorithmique par exemple
  'tp',
  'Implémentation d algorithmes récursifs',
  1
);
```

### Upload des fichiers PDF

1. Placer le fichier dans `backend/uploads/cours/`, `backend/uploads/td/` ou `backend/uploads/tp/`
2. Mettre à jour l'enregistrement en base :

```sql
UPDATE courses 
SET fichier_cours = '/uploads/cours/analyse1_chapitre1.pdf'
WHERE id = 1;
```

### Modifier un cours

```sql
UPDATE courses 
SET titre = 'Nouveau titre', description = 'Nouvelle description'
WHERE id = 1;
```

### Supprimer un cours

```sql
DELETE FROM courses WHERE id = 1;
```

---

## Exemple complet : Ajouter les matières MIAGE L2

```sql
-- 1. Ajouter les matières spécifiques à MIAGE L2
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp) VALUES
('Systèmes d Information', 'SI_L2', 'MIAGE', 'L2', 'Conception des systèmes d information', TRUE),
('Comptabilité Analytique', 'COMPTA_L2', 'MIAGE', 'L2', 'Analyse des coûts et budgets', FALSE),
('Droit du Numérique', 'DROITNUM_L2', 'MIAGE', 'L2', 'Aspects juridiques du numérique', FALSE);

-- 2. Ajouter les matières communes ASSRI/MIAGE L2
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp) VALUES
('Programmation Orientée Objet', 'POO_L2', 'ASSRI,MIAGE', 'L2', 'Java, héritage, polymorphisme', TRUE),
('Réseaux Avancés', 'RESAV_L2', 'ASSRI,MIAGE', 'L2', 'Protocoles TCP/IP avancés', TRUE),
('Base de Données', 'BDD_L2', 'ASSRI,MIAGE', 'L2', 'SQL, modélisation, normalisation', TRUE);
```

---

## Visualiser et télécharger les fichiers

### Comment ça fonctionne

1. Les fichiers sont stockés dans `backend/uploads/`
2. Le backend sert ces fichiers via Express static :
   ```javascript
   app.use('/uploads', express.static('uploads'));
   ```
3. L'URL d'accès est : `http://localhost:5000/uploads/cours/fichier.pdf`

### Pour l'utilisateur

Dans le frontend, deux options sont offertes :
- **Visualiser** : Ouvre le PDF dans un nouvel onglet
- **Télécharger** : Lance le téléchargement du fichier

Le code frontend :
```javascript
// Visualiser
window.open(`${API_URL}/uploads/cours/${fichier}`, '_blank');

// Télécharger
const link = document.createElement('a');
link.href = `${API_URL}/uploads/cours/${fichier}`;
link.download = fichier;
link.click();
```

---

## Lister les matières existantes

```sql
-- Toutes les matières
SELECT id, nom, code, filiere, niveau, has_tp FROM matieres ORDER BY niveau, nom;

-- Matières par niveau
SELECT * FROM matieres WHERE niveau = 'L1' ORDER BY nom;

-- Matières par filière
SELECT * FROM matieres WHERE filiere LIKE '%ASSRI%' ORDER BY niveau, nom;
```

---

## Lister les cours existants

```sql
-- Tous les cours avec leur matière
SELECT c.id, c.titre, c.type_document, m.nom as matiere, c.filiere, c.ordre
FROM courses c
LEFT JOIN matieres m ON c.matiere_id = m.id
ORDER BY m.nom, c.ordre;

-- Cours d'une matière spécifique
SELECT * FROM courses WHERE matiere_id = 2 ORDER BY ordre;
```

---

## Script pour ajouter une nouvelle filière (ex: 3EA L1)

```sql
-- Ajouter les matières de 3EA L1
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp) VALUES
('Électronique Analogique', 'ELEC_ANA_L1', '3EA', 'L1', 'Circuits analogiques et composants', TRUE),
('Électronique Numérique', 'ELEC_NUM_L1', '3EA', 'L1', 'Circuits logiques et numériques', TRUE),
('Automatique', 'AUTO_L1', '3EA', 'L1', 'Systèmes automatisés', TRUE),
('Mathématiques pour l Ingénieur', 'MATH_ING_L1', '3EA', 'L1', 'Algèbre et analyse appliquées', FALSE);

-- Si certaines matières sont communes avec ASSRI/MIAGE, les partager
UPDATE matieres SET filiere = 'ASSRI,MIAGE,3EA' WHERE code IN ('ANA1_L1', 'ANA2_L1', 'ALG1_L1');
```

---

## Statistiques administrateur

### Nombre d'utilisateurs par filière
```sql
SELECT filiere, COUNT(*) as total FROM users GROUP BY filiere ORDER BY total DESC;
```

### Nombre de quiz par matière
```sql
SELECT matiere, COUNT(*) as tentatives, AVG(score) as score_moyen 
FROM quiz_attempts 
GROUP BY matiere 
ORDER BY tentatives DESC;
```

### Top 10 des meilleurs élèves
```sql
SELECT pseudo, prenom, nom, points_exp, niveau, filiere 
FROM users 
WHERE pseudo != 'ADMIN'
ORDER BY points_exp DESC 
LIMIT 10;
```

---

## Bonnes pratiques

1. **Convention de nommage des codes** : `[MATIERE]_[NIVEAU]` ou `[MATIERE]_[NIVEAU]_[FILIERE]`
   - Exemple : `ANA1_L1`, `POO_L2_MIAGE`

2. **Filières multiples** : Séparer par virgules sans espaces
   - Correct : `ASSRI,MIAGE`
   - Incorrect : `ASSRI, MIAGE`

3. **Ordre des cours** : Utiliser des nombres (1, 2, 3...) pour trier

4. **Fichiers** : 
   - Nommer clairement : `analyse1_chapitre1.pdf`
   - Maximum 10 MB recommandé
   - Formats acceptés : PDF, DOCX, PPTX
