import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import pool from '../config/database.js';
import { sendResetCode, sendPasswordChangedNotification, sendWelcomeEmail } from '../utils/email.js';

const router = express.Router();

// Fonction pour valider le mot de passe
const validatePassword = (password) => {
  if (password.length < 8) return { valid: false, message: 'Le mot de passe doit contenir au moins 8 caractères' };
  if (!/[A-Z]/.test(password)) return { valid: false, message: 'Le mot de passe doit contenir au moins une majuscule' };
  if (!/[0-9]/.test(password)) return { valid: false, message: 'Le mot de passe doit contenir au moins un chiffre' };
  if (!/[@#$%^&+=!*()_\-{}[\]:;"'<>,.?/\\|`~]/.test(password)) return { valid: false, message: 'Le mot de passe doit contenir au moins un caractère spécial (@, #, $, etc.)' };
  return { valid: true };
};

// Fonction pour valider le pseudo/nom (bloquer ADMIN)
const validateNotAdmin = (text) => {
  if (!text) return true;
  const normalized = text.toLowerCase().replace(/[_\s\-]/g, '');
  return !normalized.includes('admin');
};

// Inscription
router.post('/register', async (req, res) => {
  const { nom, prenom, pseudo, filiere, niveau_etude, email, telephone, password } = req.body;

  try {
    // Validation
    if (!nom || !prenom || !pseudo || !filiere || !niveau_etude || !email || !password) {
      return res.status(400).json({ error: 'Tous les champs sont requis (téléphone optionnel)' });
    }

    // Valider que ce n'est pas ADMIN
    if (!validateNotAdmin(nom)) {
      return res.status(400).json({ error: 'Nom invalide' });
    }
    if (!validateNotAdmin(prenom)) {
      return res.status(400).json({ error: 'Prénom invalide' });
    }
    if (!validateNotAdmin(pseudo)) {
      return res.status(400).json({ error: 'Pseudo invalide' });
    }

    // Valider le mot de passe
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Vérifier si l'email, pseudo ou téléphone existe déjà
    let existingUser;
    if (telephone) {
      existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR pseudo = $2 OR telephone = $3',
        [email, pseudo, telephone]
      );
    } else {
      existingUser = await pool.query(
        'SELECT * FROM users WHERE email = $1 OR pseudo = $2',
        [email, pseudo]
      );
    }

    if (existingUser.rows.length > 0) {
      const existing = existingUser.rows[0];
      if (existing.email === email && existing.pseudo === pseudo) {
        return res.status(400).json({ error: 'Email et pseudo déjà utilisés' });
      }
      if (existing.email === email) {
        return res.status(400).json({ error: 'Email déjà utilisé' });
      }
      if (existing.pseudo === pseudo) {
        return res.status(400).json({ error: 'Pseudo déjà utilisé' });
      }
      if (existing.telephone === telephone && telephone) {
        return res.status(400).json({ error: 'Numéro de téléphone déjà utilisé' });
      }
    }

    // Hasher le mot de passe
    const password_hash = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const result = await pool.query(
      `INSERT INTO users (nom, prenom, pseudo, filiere, niveau_etude, email, telephone, password_hash) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING id, nom, prenom, pseudo, filiere, niveau_etude, email, telephone, points_exp, niveau, created_at`,
      [nom, prenom, pseudo, filiere, niveau_etude, email, telephone || null, password_hash]
    );

    const user = result.rows[0];

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Envoyer email de bienvenue
    try {
      await sendWelcomeEmail(email, prenom);
    } catch (emailError) {
      console.error('Erreur envoi email bienvenue:', emailError);
    }

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        pseudo: user.pseudo,
        filiere: user.filiere,
        niveau_etude: user.niveau_etude,
        email: user.email,
        telephone: user.telephone,
        points_exp: user.points_exp,
        niveau: user.niveau
      }
    });
  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    res.status(500).json({ error: 'Erreur lors de la création du compte' });
  }
});

// Connexion
router.post('/login', async (req, res) => {
  const { identifier, password } = req.body;

  try {
    if (!identifier || !password) {
      return res.status(400).json({ error: 'Identifiant et mot de passe requis' });
    }

    // Rechercher l'utilisateur par email, pseudo ou téléphone
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR pseudo = $1 OR telephone = $1',
      [identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    const user = result.rows[0];

    // Vérifier le mot de passe
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Identifiants incorrects' });
    }

    // Mettre à jour la dernière connexion
    await pool.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        pseudo: user.pseudo,
        filiere: user.filiere,
        niveau_etude: user.niveau_etude,
        email: user.email,
        telephone: user.telephone,
        points_exp: user.points_exp,
        niveau: user.niveau,
        photo_profil: user.photo_profil ? `http://localhost:5000${user.photo_profil}` : null,
        theme_preference: user.theme_preference
      }
    });
  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    res.status(500).json({ error: 'Erreur lors de la connexion' });
  }
});

// Demande de réinitialisation de mot de passe
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    if (!email) {
      return res.status(400).json({ error: 'Email requis' });
    }

    // Vérifier si l'utilisateur existe
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Aucun compte trouvé avec cet email' });
    }

    // Vérifier si un code a été envoyé récemment (30 secondes)
    const recentCode = await pool.query(
      `SELECT * FROM reset_codes 
       WHERE user_email = $1 AND created_at > NOW() - INTERVAL '30 seconds'
       ORDER BY created_at DESC LIMIT 1`,
      [email]
    );

    if (recentCode.rows.length > 0) {
      return res.status(429).json({ 
        error: 'Veuillez attendre 30 secondes avant de demander un nouveau code',
        retryAfter: 30
      });
    }

    // Générer un code à 6 chiffres
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Calculer l'expiration (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Sauvegarder le code
    await pool.query(
      'INSERT INTO reset_codes (user_email, code, expires_at) VALUES ($1, $2, $3)',
      [email, code, expiresAt]
    );

    // Envoyer l'email
    await sendResetCode(email, code);

    res.json({ 
      message: 'Code de réinitialisation envoyé par email',
      expiresIn: '10 minutes'
    });
  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({ error: 'Erreur lors de l\'envoi du code' });
  }
});

// Vérification du code
router.post('/verify-reset-code', async (req, res) => {
  const { email, code } = req.body;

  try {
    if (!email || !code) {
      return res.status(400).json({ error: 'Email et code requis' });
    }

    const result = await pool.query(
      `SELECT * FROM reset_codes 
       WHERE user_email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }

    res.json({ message: 'Code vérifié avec succès', valid: true });
  } catch (error) {
    console.error('Erreur lors de la vérification du code:', error);
    res.status(500).json({ error: 'Erreur lors de la vérification' });
  }
});

// Réinitialisation du mot de passe
router.post('/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  try {
    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Tous les champs sont requis' });
    }

    // Valider le nouveau mot de passe
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      return res.status(400).json({ error: passwordValidation.message });
    }

    // Vérifier le code
    const codeResult = await pool.query(
      `SELECT * FROM reset_codes 
       WHERE user_email = $1 AND code = $2 AND used = FALSE AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [email, code]
    );

    if (codeResult.rows.length === 0) {
      return res.status(400).json({ error: 'Code invalide ou expiré' });
    }

    // Récupérer l'utilisateur avec son ancien mot de passe
    const userResult = await pool.query(
      'SELECT password_hash, previous_password_hash FROM users WHERE email = $1',
      [email]
    );

    const user = userResult.rows[0];

    // Vérifier si le nouveau mot de passe est le même que l'ancien
    const sameAsOld = await bcrypt.compare(newPassword, user.password_hash);
    if (sameAsOld) {
      return res.status(400).json({ error: 'Le nouveau mot de passe doit être différent de l\'ancien' });
    }

    // Vérifier si c'est le même que le précédent (si existe)
    if (user.previous_password_hash) {
      const sameAsPrevious = await bcrypt.compare(newPassword, user.previous_password_hash);
      if (sameAsPrevious) {
        return res.status(400).json({ error: 'Vous avez déjà utilisé ce mot de passe récemment' });
      }
    }

    // Hasher le nouveau mot de passe
    const password_hash = await bcrypt.hash(newPassword, 10);

    // Mettre à jour le mot de passe et sauvegarder l'ancien
    await pool.query(
      'UPDATE users SET password_hash = $1, previous_password_hash = $2, updated_at = CURRENT_TIMESTAMP WHERE email = $3',
      [password_hash, user.password_hash, email]
    );

    // Marquer le code comme utilisé
    await pool.query(
      'UPDATE reset_codes SET used = TRUE WHERE id = $1',
      [codeResult.rows[0].id]
    );

    // Envoyer notification par email
    try {
      await sendPasswordChangedNotification(email);
    } catch (emailError) {
      console.error('Erreur envoi email notification:', emailError);
    }

    res.json({ message: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error('Erreur lors de la réinitialisation:', error);
    res.status(500).json({ error: 'Erreur lors de la réinitialisation' });
  }
});

// Connexion biométrique
router.post('/biometric-login', async (req, res) => {
  const { userId } = req.body;

  try {
    if (!userId) {
      return res.status(400).json({ error: 'userId requis' });
    }

    const result = await pool.query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' });
    }

    const user = result.rows[0];

    // Vérifier que la biométrie est activée pour cet utilisateur
    if (!user.biometrie_active) {
      return res.status(403).json({ error: 'Biométrie non activée pour cet utilisateur' });
    }

    // Mettre à jour la dernière connexion
    await pool.query(
      'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Générer un token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Connexion biométrique réussie',
      token,
      user: {
        id: user.id,
        nom: user.nom,
        prenom: user.prenom,
        pseudo: user.pseudo,
        filiere: user.filiere,
        niveau_etude: user.niveau_etude,
        email: user.email,
        telephone: user.telephone,
        points_exp: user.points_exp,
        niveau: user.niveau,
        photo_profil: user.photo_profil ? `http://localhost:5000${user.photo_profil}` : null,
        theme_preference: user.theme_preference
      }
    });
  } catch (error) {
    console.error('Erreur connexion biométrique:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
