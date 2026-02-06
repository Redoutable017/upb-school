import pool from '../config/database.js';

const setupDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Création des tables...');

    // Table users
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        pseudo VARCHAR(50) UNIQUE,
        filiere VARCHAR(50) NOT NULL,
        niveau_etude VARCHAR(50) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        telephone VARCHAR(20) UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        photo_profil TEXT,
        points_exp INTEGER DEFAULT 0,
        niveau INTEGER DEFAULT 1,
        theme_preference VARCHAR(20) DEFAULT 'dark',
        biometrie_active BOOLEAN DEFAULT FALSE,
        email_verified BOOLEAN DEFAULT FALSE,
        previous_password_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table reset_codes
    await client.query(`
      CREATE TABLE IF NOT EXISTS reset_codes (
        id SERIAL PRIMARY KEY,
        user_email VARCHAR(255) NOT NULL,
        code VARCHAR(6) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_email) REFERENCES users(email) ON DELETE CASCADE
      );
    `);

    // Table courses
    await client.query(`
      CREATE TABLE IF NOT EXISTS courses (
        id SERIAL PRIMARY KEY,
        titre VARCHAR(200) NOT NULL,
        matiere VARCHAR(100) NOT NULL,
        filiere VARCHAR(50) NOT NULL,
        fichier_cours TEXT,
        fichier_td TEXT,
        fichier_tp TEXT,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Table quiz_attempts
    await client.query(`
      CREATE TABLE IF NOT EXISTS quiz_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        matiere VARCHAR(100) NOT NULL,
        score INTEGER NOT NULL,
        total_questions INTEGER NOT NULL,
        points_gagnes INTEGER NOT NULL,
        points_perdus INTEGER NOT NULL,
        tentative_numero INTEGER DEFAULT 1,
        temps_ecoule INTEGER,
        questions_data JSONB,
        completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Table ai_conversations
    await client.query(`
      CREATE TABLE IF NOT EXISTS ai_conversations (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        message_user TEXT NOT NULL,
        message_ai TEXT NOT NULL,
        matiere VARCHAR(100),
        flagged BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    // Table niveau_paliers
    await client.query(`
      CREATE TABLE IF NOT EXISTS niveau_paliers (
        niveau INTEGER PRIMARY KEY,
        points_requis INTEGER NOT NULL
      );
    `);

    // Insertion des paliers de niveau
    await client.query(`
      INSERT INTO niveau_paliers (niveau, points_requis) VALUES
        (1, 0),
        (2, 600),
        (3, 850),
        (4, 1000),
        (5, 1250),
        (6, 1500),
        (7, 1750),
        (8, 2000),
        (9, 2500),
        (10, 3000)
      ON CONFLICT (niveau) DO NOTHING;
    `);

    // Insertion de cours exemples pour ASSRI et MIAGE
    await client.query(`
      INSERT INTO courses (titre, matiere, filiere, description) VALUES
        ('Théorie des Ensembles et Opérations', 'TEEO', 'ASSRI', 'Introduction aux ensembles et opérations de base'),
        ('Théorie des Ensembles et Opérations', 'TEEO', 'MIAGE', 'Introduction aux ensembles et opérations de base'),
        ('Analyse Mathématique 1', 'ANALYSE 1', 'ASSRI', 'Limites, continuité et dérivées'),
        ('Analyse Mathématique 1', 'ANALYSE 1', 'MIAGE', 'Limites, continuité et dérivées'),
        ('Anglais Technique', 'ANGLAIS', 'ASSRI', 'Anglais appliqué à l''informatique'),
        ('Anglais Technique', 'ANGLAIS', 'MIAGE', 'Anglais appliqué à l''informatique'),
        ('Architecture des Ordinateurs', 'ARCHITECTURE DES ORDINATEURS', 'ASSRI', 'Composants et fonctionnement des ordinateurs'),
        ('Architecture des Ordinateurs', 'ARCHITECTURE DES ORDINATEURS', 'MIAGE', 'Composants et fonctionnement des ordinateurs'),
        ('Architecture des Réseaux', 'ARCHITECTURE DES RESEAUX', 'ASSRI', 'Protocoles et topologies réseau'),
        ('Algorithmique', 'ALGORITHME', 'ASSRI', 'Structures de données et algorithmes'),
        ('Algorithmique', 'ALGORITHME', 'MIAGE', 'Structures de données et algorithmes'),
        ('Algèbre Linéaire 1', 'ALGEBRE 1', 'ASSRI', 'Matrices, espaces vectoriels'),
        ('Algèbre Linéaire 1', 'ALGEBRE 1', 'MIAGE', 'Matrices, espaces vectoriels'),
        ('MERISE - Modélisation', 'MERISE', 'ASSRI', 'Méthode de conception de systèmes d''information'),
        ('MERISE - Modélisation', 'MERISE', 'MIAGE', 'Méthode de conception de systèmes d''information'),
        ('Microéconomie', 'MICRO ECONOMIE', 'MIAGE', 'Principes économiques de base'),
        ('Analyse Mathématique 2', 'ANALYSE 2', 'ASSRI', 'Intégrales et séries'),
        ('Analyse Mathématique 2', 'ANALYSE 2', 'MIAGE', 'Intégrales et séries')
      ON CONFLICT DO NOTHING;
    `);

    console.log('✅ Tables créées avec succès !');
    console.log('✅ Données d\'exemple insérées !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la création des tables:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

setupDatabase()
  .then(() => {
    console.log('🎉 Configuration de la base de données terminée !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec de la configuration:', error);
    process.exit(1);
  });
