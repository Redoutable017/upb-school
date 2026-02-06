import express from 'express';
import multer from 'multer';
import path from 'path';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import { sendMassEmail } from '../utils/email.js';

const router = express.Router();

// Middleware pour vérifier que l'utilisateur est ADMIN
const isAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT pseudo FROM users WHERE id = $1',
      [req.user.id]
    );
    
    if (result.rows[0]?.pseudo === 'ADMIN') {
      next();
    } else {
      res.status(403).json({ error: 'Accès refusé : Admin uniquement' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Configuration multer pour upload de cours
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/courses/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `${req.body.type_document || 'cours'}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype) || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seuls les fichiers PDF et Word sont autorisés'));
    }
  }
});

// ==================== GESTION DES MATIÈRES ====================

// Lister toutes les matières
router.get('/matieres', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT m.*, 
             COUNT(c.id) as nb_documents
      FROM matieres m
      LEFT JOIN courses c ON c.matiere_id = m.id
      GROUP BY m.id
      ORDER BY m.filiere, m.niveau, m.nom
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Créer une matière
router.post('/matieres', authenticateToken, isAdmin, async (req, res) => {
  const { nom, code, filiere, niveau, description, has_tp } = req.body;
  
  try {
    const result = await pool.query(
      `INSERT INTO matieres (nom, code, filiere, niveau, description, has_tp)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [nom, code, filiere, niveau, description, has_tp]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') {
      res.status(400).json({ error: 'Code matière déjà utilisé' });
    } else {
      console.error('Erreur:', error);
      res.status(500).json({ error: 'Erreur serveur' });
    }
  }
});

// Modifier une matière
router.put('/matieres/:id', authenticateToken, isAdmin, async (req, res) => {
  const { nom, code, filiere, niveau, description, has_tp } = req.body;
  
  try {
    const result = await pool.query(
      `UPDATE matieres 
       SET nom = $1, code = $2, filiere = $3, niveau = $4, description = $5, has_tp = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [nom, code, filiere, niveau, description, has_tp, req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matière non trouvée' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer une matière
router.delete('/matieres/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM matieres WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Matière non trouvée' });
    }
    
    res.json({ message: 'Matière supprimée avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== GESTION DES COURS/TD/TP ====================

// Upload de document(s)
router.post('/upload-cours', authenticateToken, isAdmin, upload.array('documents', 10), async (req, res) => {
  const { matiere_id, type_document, titre_base } = req.body;
  
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }
    
    const uploaded = [];
    
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      const titre = req.files.length > 1 ? `${titre_base} ${i + 1}` : titre_base;
      
      const result = await pool.query(
        `INSERT INTO courses (matiere_id, titre, type_document, fichier_url, ordre, created_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         RETURNING *`,
        [matiere_id, titre, type_document, `/uploads/courses/${file.filename}`, i + 1]
      );
      
      uploaded.push(result.rows[0]);
    }
    
    res.status(201).json({ 
      message: `${uploaded.length} document(s) uploadé(s) avec succès`,
      documents: uploaded 
    });
  } catch (error) {
    console.error('Erreur upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Lister les documents d'une matière
router.get('/matieres/:matiere_id/documents', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT c.*, m.nom as matiere_nom
       FROM courses c
       JOIN matieres m ON c.matiere_id = m.id
       WHERE c.matiere_id = $1
       ORDER BY c.type_document, c.ordre`,
      [req.params.matiere_id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un document
router.delete('/documents/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM courses WHERE id = $1 RETURNING *', [req.params.id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Document non trouvé' });
    }
    
    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== STATISTIQUES ====================

router.get('/stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE pseudo != 'ADMIN') as total_users,
        (SELECT COUNT(*) FROM matieres) as total_matieres,
        (SELECT COUNT(*) FROM courses) as total_documents,
        (SELECT COUNT(DISTINCT filiere) FROM users WHERE pseudo != 'ADMIN') as total_filieres,
        (SELECT COUNT(*) FROM quiz_attempts) as total_quiz_attempts
    `);
    
    const usersByFiliere = await pool.query(`
      SELECT filiere, niveau_etude, COUNT(*) as count
      FROM users
      WHERE pseudo != 'ADMIN'
      GROUP BY filiere, niveau_etude
      ORDER BY filiere, niveau_etude
    `);
    
    res.json({
      ...stats.rows[0],
      users_by_filiere: usersByFiliere.rows
    });
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// ==================== ENVOI EMAIL EN MASSE ====================

router.post('/send-mass-email', authenticateToken, isAdmin, async (req, res) => {
  const { subject, message, filiere, niveau } = req.body;
  
  try {
    let query = 'SELECT email, prenom FROM users WHERE pseudo != $1 AND newsletter_optin = true';
    let params = ['ADMIN'];
    
    if (filiere) {
      query += ' AND filiere = $2';
      params.push(filiere);
    }
    
    if (niveau) {
      query += filiere ? ' AND niveau_etude = $3' : ' AND niveau_etude = $2';
      params.push(niveau);
    }
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Aucun destinataire trouvé' });
    }
    
    await sendMassEmail(result.rows, subject, message);
    
    res.json({ 
      message: `Email envoyé à ${result.rows.length} utilisateur(s)`,
      count: result.rows.length 
    });
  } catch (error) {
    console.error('Erreur envoi email:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi' });
  }
});

export default router;
