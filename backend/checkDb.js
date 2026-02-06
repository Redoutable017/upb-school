import pool from './config/database.js';

const checkAndCreateUsers = async () => {
  try {
    // Vérifier si la table users existe
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
      console.log('Table users manquante, création...');
      
      await pool.query(`
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
      console.log('Table users créée !');
    } else {
      console.log('Table users existe déjà');
    }
    
    // Vérifier reset_codes
    const resetCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'reset_codes'
      );
    `);
    
    if (!resetCheck.rows[0].exists) {
      console.log('Table reset_codes manquante, création...');
      
      await pool.query(`
        CREATE TABLE IF NOT EXISTS reset_codes (
          id SERIAL PRIMARY KEY,
          user_email VARCHAR(255) NOT NULL,
          code VARCHAR(6) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          used BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      console.log('Table reset_codes créée !');
    } else {
      console.log('Table reset_codes existe déjà');
    }
    
    console.log('Vérification terminée !');
    
  } catch (error) {
    console.error('Erreur:', error.message);
  } finally {
    await pool.end();
  }
};

checkAndCreateUsers();
