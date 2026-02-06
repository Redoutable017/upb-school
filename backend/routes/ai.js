import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Initialiser Gemini AI
const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);

// Modération de contenu
const moderateContent = (text) => {
  const forbiddenWords = [
    'sexe', 'porno', 'drogue', 'merde', 'connard', 'salaud', 'putain',
    'fuck', 'shit', 'bitch', 'damn', 'ass', 'dick'
  ];
  
  const lowerText = text.toLowerCase();
  
  for (const word of forbiddenWords) {
    if (lowerText.includes(word)) {
      return { 
        allowed: false, 
        reason: 'Contenu inapproprié détecté. Veuillez rester respectueux.' 
      };
  }
  }
  
  return { allowed: true };
};

// Chatbot éducatif avec l'IA
router.post('/chat', authenticateToken, async (req, res) => {
  const { message, matiere } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // Modération du contenu
    const moderation = moderateContent(message);
    if (!moderation.allowed) {
      return res.status(400).json({ error: moderation.reason });
    }

    // Contexte éducatif
    const systemPrompt = `Tu es un assistant pédagogique virtuel pour UPB School, une plateforme d'apprentissage. 
    
Ton rôle est d'aider les étudiants à comprendre leurs cours de manière claire et pédagogique.

RÈGLES STRICTES :
- Tu ne dois parler QUE de sujets éducatifs et académiques
- Tu ne dois JAMAIS parler de ta vie personnelle (tu n'en as pas)
- Tu ne dois JAMAIS utiliser de langage vulgaire, grossier ou offensant
- Tu ne dois JAMAIS aborder des sujets explicites ou inappropriés
- Si on te demande quelque chose d'inapproprié, refuse poliment et redirige vers l'éducation
- Réponds toujours en français
- Sois concis mais complet dans tes explications
- Utilise des exemples concrets quand c'est possible
- Encourage l'étudiant dans son apprentissage

${matiere ? `La conversation porte sur la matière : ${matiere}` : 'La conversation est générale sur les études.'}`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const chat = model.startChat({
      history: [
        {
          role: 'user',
          parts: [{ text: systemPrompt }]
        },
        {
          role: 'model',
          parts: [{ text: 'Compris ! Je suis là pour t\'aider dans tes études. Pose-moi tes questions sur tes cours et je ferai de mon mieux pour t\'expliquer clairement. 📚' }]
        }
      ],
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.7,
      },
    });

    const result = await chat.sendMessage(message);
    const response = result.response.text();

    // Modération de la réponse de l'IA
    const responseModeration = moderateContent(response);
    const flagged = !responseModeration.allowed;

    // Enregistrer la conversation
    await pool.query(
      `INSERT INTO ai_conversations (user_id, message_user, message_ai, matiere, flagged) 
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, message, response, matiere, flagged]
    );

    if (flagged) {
      return res.json({
        response: 'Je suis désolé, mais je ne peux pas répondre à cette question. Concentrons-nous sur tes études ! 📚',
        flagged: true
      });
    }

    res.json({ response, flagged: false });

  } catch (error) {
    console.error('Erreur lors du chat AI:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la communication avec l\'IA',
      details: error.message 
    });
  }
});

// Générer un quiz avec l'IA basé sur un cours
router.post('/generate-quiz', authenticateToken, async (req, res) => {
  const { matiere, contenu_cours, nombre_questions = 15 } = req.body;

  try {
    if (!matiere || !contenu_cours) {
      return res.status(400).json({ error: 'Matière et contenu du cours requis' });
    }

    const prompt = `Tu es un générateur de quiz éducatif. Crée un quiz de ${nombre_questions} questions basé sur ce cours.

COURS :
${contenu_cours}

RÈGLES :
- Génère exactement ${nombre_questions} questions
- Les 14 premières questions sont de difficulté normale
- La 15ème question doit être plus complexe (question bonus)
- Chaque question doit avoir 5 options de réponse
- UNE SEULE option est correcte
- Les questions doivent être variées et couvrir différentes parties du cours
- Retourne UNIQUEMENT un JSON valide dans ce format exact :

{
  "questions": [
    {
      "question": "Question ici ?",
      "options": ["Option A", "Option B", "Option C", "Option D", "Option E"],
      "correct_answer": 0,
      "explication": "Explication de pourquoi cette réponse est correcte",
      "partie_cours": "Partie du cours concernée"
    }
  ]
}

Note : correct_answer est l'index de la bonne réponse (0-4)`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parser la réponse JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Format de réponse invalide');
    }

    const quizData = JSON.parse(jsonMatch[0]);

    // Mélanger les questions sauf la dernière (bonus)
    if (quizData.questions.length > 1) {
      const bonusQuestion = quizData.questions.pop();
      quizData.questions = quizData.questions.sort(() => Math.random() - 0.5);
      quizData.questions.push(bonusQuestion);
    }

    res.json({ 
      matiere,
      quiz: quizData,
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('Erreur lors de la génération du quiz:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération du quiz',
      details: error.message 
    });
  }
});

// Expliquer un cours avec l'IA
router.post('/explain', authenticateToken, async (req, res) => {
  const { matiere, sujet, question } = req.body;

  try {
    if (!sujet) {
      return res.status(400).json({ error: 'Sujet requis' });
    }

    const prompt = `Tu es un professeur expert en ${matiere || 'enseignement général'}.

Un étudiant te demande d'expliquer : ${sujet}

${question ? `Question spécifique : ${question}` : ''}

Fournis une explication :
1. Claire et structurée
2. Avec des exemples concrets
3. Adaptée à un niveau universitaire
4. En français
5. En 300 mots maximum

Commence directement par l'explication sans introduction superflue.`;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const explication = result.response.text();

    res.json({ 
      matiere: matiere || 'général',
      sujet,
      explication
    });

  } catch (error) {
    console.error('Erreur lors de l\'explication:', error);
    res.status(500).json({ 
      error: 'Erreur lors de la génération de l\'explication',
      details: error.message 
    });
  }
});

// Récupérer l'historique des conversations
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, message_user, message_ai, matiere, created_at 
       FROM ai_conversations 
       WHERE user_id = $1 AND flagged = FALSE
       ORDER BY created_at DESC 
       LIMIT 50`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

export default router;
