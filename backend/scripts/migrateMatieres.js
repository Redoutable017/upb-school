import pool from '../config/database.js';
import fs from 'fs';

async function migrateMatieres() {
  console.log('🔄 Migration : Ajout des matières...\n');
  
  try {
    const sql = fs.readFileSync('./migrations/add_matieres.sql', 'utf8');
    
    await pool.query(sql);
    
    console.log('✅ Migration réussie !');
    console.log('📚 Matières du tronc commun L1 ajoutées');
    
    // Afficher les matières créées
    const result = await pool.query('SELECT nom, code, filiere, niveau FROM matieres ORDER BY nom');
    console.log(`\n📋 ${result.rows.length} matières créées :\n`);
    result.rows.forEach(m => {
      console.log(`  - ${m.nom} (${m.code}) - ${m.filiere} ${m.niveau}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    process.exit(1);
  }
}

migrateMatieres();
