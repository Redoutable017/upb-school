import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration de multer pour l'upload de photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Seules les images sont autorisées'));
    }
  }
});

// Récupérer le profil de l'utilisateur
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, nom, prenom, pseudo, filiere, niveau_etude, email, telephone, 
              photo_profil, points_exp, niveau, theme_preference, biometrie_active, 
              created_at, updated_at
       FROM users WHERE id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le profil
router.put('/profile', authenticateToken, async (req, res) => {
  const { nom, prenom, filiere, niveau_etude, telephone } = req.body;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET nom = COALESCE($1, nom), 
           prenom = COALESCE($2, prenom), 
           filiere = COALESCE($3, filiere),
           niveau_etude = COALESCE($4, niveau_etude),
           telephone = COALESCE($5, telephone),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING id, nom, prenom, filiere, niveau_etude, email, telephone, points_exp, niveau`,
      [nom, prenom, filiere, niveau_etude, telephone, req.user.id]
    );

    res.json({ message: 'Profil mis à jour', user: result.rows[0] });
  } catch (error) {
    console.error('Erreur lors de la mise à jour du profil:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Upload photo de profil
router.post('/profile/photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucune image fournie' });
    }

    const photoUrl = `/uploads/profiles/${req.file.filename}`;

    await pool.query(
      'UPDATE users SET photo_profil = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [photoUrl, req.user.id]
    );

    res.json({ message: 'Photo de profil mise à jour', photo_url: photoUrl });
  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    res.status(500).json({ error: 'Erreur lors de l\'upload' });
  }
});

// Supprimer le compte
router.delete('/account', authenticateToken, async (req, res) => {
  try {
    await pool.query('DELETE FROM users WHERE id = $1', [req.user.id]);
    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression' });
  }
});

// Mettre à jour les préférences (thème, biométrie)
router.put('/preferences', authenticateToken, async (req, res) => {
  const { theme_preference, biometrie_active } = req.body;

  try {
    await pool.query(
      `UPDATE users 
       SET theme_preference = COALESCE($1, theme_preference),
           biometrie_active = COALESCE($2, biometrie_active),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [theme_preference, biometrie_active, req.user.id]
    );

    res.json({ message: 'Préférences mises à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour des préférences:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer les statistiques de l'utilisateur
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const statsQuery = await pool.query(
      `SELECT 
        COUNT(*) as total_quiz,
        SUM(points_gagnes) as total_points_gagnes,
        SUM(points_perdus) as total_points_perdus,
        AVG(score::FLOAT / total_questions * 100) as moyenne_pourcentage
       FROM quiz_attempts WHERE user_id = $1`,
      [req.user.id]
    );

    const userQuery = await pool.query(
      'SELECT points_exp, niveau FROM users WHERE id = $1',
      [req.user.id]
    );

    res.json({
      ...statsQuery.rows[0],
      points_exp: userQuery.rows[0].points_exp,
      niveau: userQuery.rows[0].niveau
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des stats:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer le classement global
router.get('/leaderboard', authenticateToken, async (req, res) => {
  const { filiere } = req.query;

  try {
    let query = `
      SELECT id, nom, prenom, pseudo, filiere, niveau_etude, points_exp, niveau, photo_profil
      FROM users
      WHERE pseudo != 'ADMIN'
    `;
    
    const params = [];
    
    if (filiere) {
      query += ' AND filiere = $1';
      params.push(filiere);
    }
    
    query += ' ORDER BY niveau DESC, points_exp DESC LIMIT 100';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
