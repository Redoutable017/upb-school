import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Fonction pour calculer le niveau en fonction des points
function calculateLevel(points) {
  if (points < 600) return 1;
  if (points < 1450) return 2; // 600 + 850
  if (points < 2450) return 3; // 600 + 850 + 1000
  if (points < 3700) return 4; // ... + 1250
  if (points < 5200) return 5; // ... + 1500
  if (points < 6950) return 6; // ... + 1750
  if (points < 8950) return 7; // ... + 2000
  if (points < 11450) return 8; // ... + 2500
  if (points < 14450) return 9; // ... + 3000
  return 10;
}

// Fonction pour obtenir les points requis pour le prochain niveau
function getPointsForNextLevel(currentLevel) {
  const requirements = {
    1: 600,
    2: 850,
    3: 1000,
    4: 1250,
    5: 1500,
    6: 1750,
    7: 2000,
    8: 2500,
    9: 3000,
    10: 0
  };
  return requirements[currentLevel] || 0;
}

// Soumettre un quiz
router.post('/submit', authenticateToken, async (req, res) => {
  const { matiere, score, total_questions, temps_ecoule, questions_data, tentative_numero } = req.body;

  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    // Récupérer les infos utilisateur
    const userResult = await client.query(
      'SELECT points_exp, niveau FROM users WHERE id = $1',
      [req.user.id]
    );
    
    const currentUser = userResult.rows[0];
    const currentLevel = currentUser.niveau;
    const currentPoints = currentUser.points_exp;

    // Calculer les points gagnés/perdus selon la tentative
    let pointsParBonneReponse, pointsParMauvaiseReponse;
    let nombreQuestions = total_questions;
    let questionBonus = false;

    if (tentative_numero === 1) {
      // Première tentative : 15 questions dont 1 bonus
      pointsParBonneReponse = 100;
      pointsParMauvaiseReponse = 40;
      questionBonus = true;
    } else {
      // Deuxième tentative : 10 questions, points divisés par 2
      pointsParBonneReponse = 50;
      pointsParMauvaiseReponse = 18;
      questionBonus = false;
    }

    let totalPointsGagnes = 0;
    let totalPointsPerdus = 0;

    // Calculer les points
    for (let i = 0; i < questions_data.length; i++) {
      const question = questions_data[i];
      const isLastQuestion = i === questions_data.length - 1;
      const isBonusQuestion = questionBonus && isLastQuestion;

      if (question.correct) {
        // Question bonus vaut 200 points
        totalPointsGagnes += isBonusQuestion ? 200 : pointsParBonneReponse;
      } else {
        // Malus pour question bonus : -80
        totalPointsPerdus += isBonusQuestion ? 80 : pointsParMauvaiseReponse;
      }
    }

    const netPoints = totalPointsGagnes - totalPointsPerdus;
    const newTotalPoints = Math.max(0, currentPoints + netPoints);

    // Calculer le nouveau niveau
    const newLevel = calculateLevel(newTotalPoints);
    const leveledUp = newLevel > currentLevel;

    // Réinitialiser les points à 0 si on passe au niveau supérieur
    let finalPoints = newTotalPoints;
    if (leveledUp) {
      finalPoints = 0;
    }

    // Mettre à jour l'utilisateur
    await client.query(
      'UPDATE users SET points_exp = $1, niveau = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [finalPoints, newLevel, req.user.id]
    );

    // Enregistrer la tentative
    await client.query(
      `INSERT INTO quiz_attempts 
       (user_id, matiere, score, total_questions, points_gagnes, points_perdus, tentative_numero, temps_ecoule, questions_data)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [req.user.id, matiere, score, total_questions, totalPointsGagnes, totalPointsPerdus, tentative_numero, temps_ecoule, JSON.stringify(questions_data)]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Quiz soumis avec succès',
      points_gagnes: totalPointsGagnes,
      points_perdus: totalPointsPerdus,
      net_points: netPoints,
      nouveau_total_points: finalPoints,
      niveau: newLevel,
      niveau_up: leveledUp,
      points_pour_prochain_niveau: getPointsForNextLevel(newLevel)
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Erreur lors de la soumission du quiz:', error);
    res.status(500).json({ error: 'Erreur lors de la soumission' });
  } finally {
    client.release();
  }
});

// Vérifier si l'utilisateur peut retenter un quiz
router.get('/can-retry/:matiere', authenticateToken, async (req, res) => {
  try {
    const { matiere } = req.params;

    // Récupérer les tentatives pour cette matière
    const result = await pool.query(
      `SELECT * FROM quiz_attempts 
       WHERE user_id = $1 AND matiere = $2 
       ORDER BY completed_at DESC`,
      [req.user.id, matiere]
    );

    const attempts = result.rows;

    // Si aucune tentative
    if (attempts.length === 0) {
      return res.json({ 
        can_retry: true, 
        is_first_attempt: true,
        reason: 'Première tentative'
      });
    }

    // Si déjà 2 tentatives, bloqué
    if (attempts.length >= 2) {
      return res.json({ 
        can_retry: false, 
        is_first_attempt: false,
        reason: 'Nombre maximum de tentatives atteint (2)' 
      });
    }

    // Si 1 tentative, vérifier si le score est sous la moyenne
    const lastAttempt = attempts[0];
    const percentage = (lastAttempt.score / lastAttempt.total_questions) * 100;
    const moyenne = 50; // 50% est la moyenne

    if (percentage < moyenne) {
      return res.json({ 
        can_retry: true, 
        is_first_attempt: false,
        last_score: lastAttempt.score,
        last_total: lastAttempt.total_questions,
        last_percentage: percentage.toFixed(2),
        reason: `Score inférieur à la moyenne (${percentage.toFixed(2)}% < ${moyenne}%)` 
      });
    } else {
      return res.json({ 
        can_retry: false, 
        is_first_attempt: false,
        last_score: lastAttempt.score,
        last_total: lastAttempt.total_questions,
        last_percentage: percentage.toFixed(2),
        reason: `Score suffisant (${percentage.toFixed(2)}% >= ${moyenne}%)` 
      });
    }

  } catch (error) {
    console.error('Erreur lors de la vérification:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer l'historique des quiz
router.get('/history', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM quiz_attempts 
       WHERE user_id = $1 
       ORDER BY completed_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Récupérer le classement (leaderboard)
router.get('/leaderboard', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT 
        id,
        nom,
        prenom,
        pseudo,
        filiere,
        niveau,
        points_exp,
        photo_profil
       FROM users 
       WHERE pseudo != 'ADMIN'
       ORDER BY niveau DESC, points_exp DESC 
       LIMIT 100`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération du classement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
