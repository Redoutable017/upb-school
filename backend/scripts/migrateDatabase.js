import pool from '../config/database.js';
import bcrypt from 'bcryptjs';

const migrateDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Migration de la base de données...');

    // Ajouter colonne pseudo à users
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS pseudo VARCHAR(50) UNIQUE;
    `);
    console.log('✅ Colonne pseudo ajoutée');

    // Rendre telephone nullable
    await client.query(`
      ALTER TABLE users 
      ALTER COLUMN telephone DROP NOT NULL;
    `);
    console.log('✅ Téléphone rendu optionnel');

    // Ajouter colonne email_verified
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
    `);
    console.log('✅ Colonne email_verified ajoutée');

    // Ajouter colonne previous_password_hash pour empêcher réutilisation
    await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS previous_password_hash VARCHAR(255);
    `);
    console.log('✅ Colonne previous_password_hash ajoutée');

    // Créer le compte ADMIN
    const adminPassword = await bcrypt.hash('Life.raymd@10', 10);
    
    await client.query(`
      INSERT INTO users (
        nom, prenom, pseudo, filiere, niveau_etude, 
        email, password_hash, niveau, points_exp, email_verified
      ) VALUES (
        'ADMIN', 'ADMIN', 'ADMIN', 'ADMIN', 'ADMIN',
        'upb.school1@gmail.com', $1, 999, 999999, TRUE
      )
      ON CONFLICT (email) DO NOTHING;
    `, [adminPassword]);
    
    console.log('✅ Compte ADMIN créé');

    // Mettre à jour les utilisateurs existants avec un pseudo par défaut
    await client.query(`
      UPDATE users 
      SET pseudo = CONCAT(LOWER(prenom), '_', LOWER(nom), '_', id)
      WHERE pseudo IS NULL;
    `);
    console.log('✅ Pseudos générés pour utilisateurs existants');

    console.log('🎉 Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

migrateDatabase()
  .then(() => {
    console.log('✅ Script de migration exécuté');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Échec de la migration:', error);
    process.exit(1);
  });
