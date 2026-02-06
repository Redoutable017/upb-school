import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function insertMatieres() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Insertion des matières L1...');
    
    // Créer la table matieres si elle n'existe pas
    await client.query(`
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
    `);
    
    console.log('✅ Table matieres créée');
    
    // Modifier la table courses
    await client.query(`
      ALTER TABLE courses 
        ADD COLUMN IF NOT EXISTS matiere_id INTEGER REFERENCES matieres(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS type_document VARCHAR(20) DEFAULT 'cours' CHECK (type_document IN ('cours', 'td', 'tp')),
        ADD COLUMN IF NOT EXISTS ordre INTEGER DEFAULT 1;
    `);
    
    console.log('✅ Table courses modifiée');
    
    // Insérer les matières du tronc commun L1
    const matieres = [
      { nom: 'TEEO', code: 'TEEO_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Techniques d\'Expression Écrite et Orale', has_tp: false },
      { nom: 'Analyse 1', code: 'ANA1_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Analyse mathématique 1', has_tp: false },
      { nom: 'Analyse 2', code: 'ANA2_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Analyse mathématique 2', has_tp: false },
      { nom: 'Algèbre 1', code: 'ALG1_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Algèbre linéaire', has_tp: false },
      { nom: 'Anglais', code: 'ANG_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Anglais technique', has_tp: false },
      { nom: 'Architecture des Ordinateurs', code: 'ARCHI_ORD_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Architecture des ordinateurs', has_tp: true },
      { nom: 'Architecture des Réseaux', code: 'ARCHI_RES_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Architecture des réseaux informatiques', has_tp: true },
      { nom: 'Algorithmique', code: 'ALGO_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Algorithmique et programmation', has_tp: true },
      { nom: 'MERISE', code: 'MERISE_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Méthode MERISE pour bases de données', has_tp: true },
      { nom: 'Micro-économie', code: 'MICROECO_L1', filiere: 'ASSRI,MIAGE', niveau: 'L1', description: 'Principes de micro-économie', has_tp: false }
    ];
    
    for (const matiere of matieres) {
      try {
        await client.query(
          `INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (code) DO NOTHING`,
          [matiere.nom, matiere.code, matiere.filiere, matiere.niveau, matiere.description, matiere.has_tp]
        );
        console.log(`✅ Matière insérée : ${matiere.nom}`);
      } catch (err) {
        console.log(`⚠️  Matière déjà existante : ${matiere.nom}`);
      }
    }
    
    // Créer les index
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_matieres_filiere_niveau ON matieres(filiere, niveau);
      CREATE INDEX IF NOT EXISTS idx_courses_matiere ON courses(matiere_id);
    `);
    
    console.log('✅ Index créés');
    
    // Compter les matières
    const result = await client.query('SELECT COUNT(*) as count FROM matieres');
    console.log(`\n📊 Total de matières dans la base : ${result.rows[0].count}`);
    
    // Afficher les matières
    const matieresList = await client.query('SELECT nom, code, filiere, niveau, has_tp FROM matieres ORDER BY nom');
    console.log('\n📚 Liste des matières L1 :');
    matieresList.rows.forEach(m => {
      console.log(`  • ${m.nom} (${m.code}) - ${m.filiere} ${m.niveau}${m.has_tp ? ' + TP' : ''}`);
    });
    
    console.log('\n✅ Migration terminée avec succès !');
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Exécuter le script
insertMatieres()
  .then(() => {
    console.log('\n🎉 Script terminé !');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  });
