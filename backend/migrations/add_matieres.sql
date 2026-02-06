-- Créer la table des matières
CREATE TABLE IF NOT EXISTS matieres (
  id SERIAL PRIMARY KEY,
  nom VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  filiere VARCHAR(50) NOT NULL,
  niveau VARCHAR(10) NOT NULL,
  description TEXT,
  has_tp BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modifier la table courses pour référencer les matières
ALTER TABLE courses 
  DROP COLUMN IF EXISTS matiere,
  ADD COLUMN IF NOT EXISTS matiere_id INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS type_document VARCHAR(20) DEFAULT 'cours' CHECK (type_document IN ('cours', 'td', 'tp')),
  ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 1;

-- Insérer les matières du tronc commun L1 (ASSRI + MIAGE)
INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp) VALUES
  ('TEEO', 'TEEO_L1', 'ASSRI,MIAGE', 'L1', 'Techniques d''Expression Écrite et Orale', false),
  ('Analyse 1', 'ANA1_L1', 'ASSRI,MIAGE', 'L1', 'Analyse mathématique 1', false),
  ('Analyse 2', 'ANA2_L1', 'ASSRI,MIAGE', 'L1', 'Analyse mathématique 2', false),
  ('Algèbre 1', 'ALG1_L1', 'ASSRI,MIAGE', 'L1', 'Algèbre linéaire', false),
  ('Anglais', 'ANG_L1', 'ASSRI,MIAGE', 'L1', 'Anglais technique', false),
  ('Architecture des Ordinateurs', 'ARCHI_ORD_L1', 'ASSRI,MIAGE', 'L1', 'Architecture des ordinateurs', true),
  ('Architecture des Réseaux', 'ARCHI_RES_L1', 'ASSRI,MIAGE', 'L1', 'Architecture des réseaux informatiques', true),
  ('Algorithmique', 'ALGO_L1', 'ASSRI,MIAGE', 'L1', 'Algorithmique et programmation', true),
  ('MERISE', 'MERISE_L1', 'ASSRI,MIAGE', 'L1', 'Méthode MERISE pour bases de données', true),
  ('Micro-économie', 'MICROECO_L1', 'ASSRI,MIAGE', 'L1', 'Principes de micro-économie', false)
ON CONFLICT (code) DO NOTHING;

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_matieres_filiere_niveau ON matieres(filiere, niveau);
CREATE INDEX IF NOT EXISTS idx_courses_matiere ON courses(matiere_id);

-- Ajouter une colonne pour l'email en masse
ALTER TABLE users ADD COLUMN IF NOT EXISTS newsletter_optin BOOLEAN DEFAULT true;

COMMENT ON TABLE matieres IS 'Table des matières par filière et niveau';
COMMENT ON COLUMN courses.type_document IS 'Type de document : cours, td ou tp';
COMMENT ON COLUMN courses.ordre IS 'Ordre d''affichage des documents (1, 2, 3...)';
