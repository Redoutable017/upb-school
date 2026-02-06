import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Récupérer tous les cours (filtrés par filière)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { filiere } = req.query;

    let query = 'SELECT * FROM courses';
    let params = [];

    if (filiere) {
      query += ' WHERE filiere = $1';
      params.push(filiere);
    }

    query += ' ORDER BY matiere, titre';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer un cours spécifique
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cours non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les cours par matière
router.get('/matiere/:matiere', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM courses WHERE UPPER(matiere) = UPPER($1)',
      [req.params.matiere]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les matières disponibles par filière et niveau
router.get('/filieres/:filiere/matieres', authenticateToken, async (req, res) => {
  try {
    const { filiere } = req.params;
    const { niveau } = req.query;
    
    let query = `SELECT id, nom, code, filiere, niveau, description, has_tp 
                 FROM matieres 
                 WHERE (filiere LIKE $1 OR filiere LIKE $2)`;
    
    const params = [`%${filiere}%`, `${filiere},%`];
    
    if (niveau) {
      query += ` AND niveau = $3`;
      params.push(niveau);
    }
    
    query += ` ORDER BY nom`;
    
    const result = await pool.query(query, params);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des matières:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
