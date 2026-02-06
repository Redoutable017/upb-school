import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configuration du transporteur SMTP
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Vérifier la connexion SMTP
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Erreur SMTP:', error.message);
  } else {
    console.log('✅ Serveur SMTP prêt à envoyer des emails');
  }
});

// Envoyer le code de réinitialisation
export const sendResetCode = async (email, code) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🔐 Code de réinitialisation - UPB School',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #0b84ff, #8b5cf6);
            color: white;
            width: 80px;
            height: 80px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .code-box {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            padding: 30px;
            border-radius: 15px;
            margin: 30px 0;
            letter-spacing: 10px;
          }
          .warning {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">UPB</div>
            <h1 style="color: #333; margin: 0;">Réinitialisation de mot de passe</h1>
          </div>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Bonjour,
          </p>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Vous avez demandé la réinitialisation de votre mot de passe sur <strong>UPB School</strong>.
            Voici votre code de vérification :
          </p>
          
          <div class="code-box">${code}</div>
          
          <div class="warning">
            <strong>⏱️ Important :</strong> Ce code expire dans <strong>10 minutes</strong>.
          </div>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. 
            Votre compte reste sécurisé.
          </p>
          
          <div class="footer">
            <p>© 2026 UPB School - Excellence Éducative & Innovation Pédagogique</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Code de réinitialisation envoyé à ${email}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi du code:', error);
    throw error;
  }
};

// Envoyer une notification de changement de mot de passe
export const sendPasswordChangedNotification = async (email) => {
  const resetLink = `${process.env.FRONTEND_URL}/reset-password`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '✅ Mot de passe modifié - UPB School',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #0b84ff, #8b5cf6);
            color: white;
            width: 80px;
            height: 80px;
            border-radius: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 32px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .success-icon {
            background: #d4edda;
            color: #155724;
            width: 100px;
            height: 100px;
            border-radius: 50%;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 60px;
            margin: 20px 0;
          }
          .alert {
            background: #f8d7da;
            border-left: 4px solid #dc3545;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 30px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">UPB</div>
            <h1 style="color: #333; margin: 0;">Mot de passe modifié</h1>
          </div>
          
          <div style="text-align: center;">
            <div class="success-icon">✓</div>
          </div>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Bonjour,
          </p>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Votre mot de passe <strong>UPB School</strong> a été modifié avec succès.
          </p>
          
          <div class="alert">
            <strong>🔒 Ce n'était pas vous ?</strong><br>
            Si vous n'êtes pas à l'origine de ce changement, cliquez sur le bouton ci-dessous 
            pour réinitialiser immédiatement votre mot de passe :
            <br><br>
            <a href="${resetLink}" class="btn">Réinitialiser mon mot de passe</a>
          </div>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Pour votre sécurité, nous vous recommandons de :
          </p>
          <ul style="font-size: 16px; color: #555; line-height: 1.8;">
            <li>Utiliser un mot de passe unique et complexe</li>
            <li>Ne jamais partager votre mot de passe</li>
            <li>Activer la biométrie si disponible</li>
          </ul>
          
          <div class="footer">
            <p>© 2026 UPB School - Excellence Éducative & Innovation Pédagogique</p>
            <p>Cet email a été envoyé automatiquement, merci de ne pas y répondre.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Notification envoyée à ${email}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de la notification:', error);
    throw error;
  }
};

// Envoyer l'email de bienvenue après inscription
export const sendWelcomeEmail = async (email, prenom) => {
  const verifyLink = `${process.env.FRONTEND_URL}/verify-email?email=${encodeURIComponent(email)}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🎉 Bienvenue sur UPB School !',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            margin: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            max-width: 150px;
            height: auto;
            margin-bottom: 20px;
          }
          .welcome-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-size: 24px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 15px;
            margin: 20px 0;
          }
          .features {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 10px;
            margin: 20px 0;
          }
          .feature-item {
            display: flex;
            align-items: center;
            margin: 15px 0;
            font-size: 16px;
            color: #555;
          }
          .feature-icon {
            background: linear-gradient(135deg, #0b84ff, #8b5cf6);
            color: white;
            width: 40px;
            height: 40px;
            border-radius: 10px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            margin-right: 15px;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 15px 40px;
            border-radius: 10px;
            text-decoration: none;
            font-weight: bold;
            margin-top: 20px;
            text-align: center;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:logo" alt="UPB School" class="logo">
            <h1 style="color: #333; margin: 0;">Bienvenue sur UPB School !</h1>
          </div>
          
          <div class="welcome-badge">
            🎉 Ton aventure commence maintenant !
          </div>
          
          <p style="font-size: 18px; color: #555; line-height: 1.6;">
            Bonjour <strong>${prenom}</strong>,
          </p>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            Félicitations ! Ton compte <strong>UPB School</strong> a été créé avec succès. 
            Tu fais maintenant partie d'une communauté d'étudiants passionnés par l'excellence académique ! 🚀
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" class="btn">✅ Vérifier mon adresse email</a>
          </div>
          
          <div class="features">
            <h3 style="color: #333; margin-top: 0;">Ce qui t'attend :</h3>
            
            <div class="feature-item">
              <div class="feature-icon">📚</div>
              <div>
                <strong>Cours & Documents</strong><br>
                Accède à tous tes cours, TD et TP en PDF
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">🤖</div>
              <div>
                <strong>Assistant IA</strong><br>
                Pose tes questions, l'IA t'explique tout !
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">🎯</div>
              <div>
                <strong>Quiz & Expérience</strong><br>
                Teste tes connaissances et gagne des points
              </div>
            </div>
            
            <div class="feature-item">
              <div class="feature-icon">🏆</div>
              <div>
                <strong>Classement</strong><br>
                Compare ton niveau avec les autres étudiants
              </div>
            </div>
          </div>
          
          <p style="font-size: 16px; color: #555; line-height: 1.6;">
            <strong>🎓 Ton parcours commence à 0 points.</strong><br>
            Réponds aux quiz pour monter de niveau et devenir le meilleur de ta filière !
          </p>
          
          <p style="font-size: 14px; color: #777; line-height: 1.6; margin-top: 30px;">
            <em>Astuce : Active la biométrie dans les paramètres pour te connecter plus rapidement ! 🔒</em>
          </p>
          
          <div class="footer">
            <p><strong>© 2026 UPB School</strong></p>
            <p>Développé par Smart Team</p>
            <p style="margin-top: 10px;">Excellence Éducative & Innovation Pédagogique</p>
            <p style="font-size: 12px; color: #999; margin-top: 15px;">
              Cet email a été envoyé automatiquement, merci de ne pas y répondre.
            </p>
          </div>
        </div>
      </body>
      </html>
    `,
    attachments: [
      {
        filename: 'logo.jpeg',
        path: './public/images/logo.jpeg',
        cid: 'logo'
      }
    ]
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenue envoyé à ${email}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi de l\'email de bienvenue:', error);
    throw error;
  }
};

// Envoyer un email en masse à tous les utilisateurs
export const sendMassEmail = async (users, subject, message) => {
  const errors = [];
  
  for (const user of users) {
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `📢 ${subject} - UPB School`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              padding: 20px;
              margin: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background: white;
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              max-width: 150px;
              height: auto;
              margin-bottom: 20px;
            }
            .message-content {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 10px;
              margin: 20px 0;
              line-height: 1.8;
              color: #333;
            }
            .footer {
              text-align: center;
              color: #666;
              font-size: 14px;
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #eee;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="cid:logo" alt="UPB School" class="logo">
              <h1 style="color: #333; margin: 0;">${subject}</h1>
            </div>
            
            <p style="font-size: 18px; color: #555;">
              Bonjour <strong>${user.prenom}</strong>,
            </p>
            
            <div class="message-content">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div class="footer">
              <p><strong>© 2026 UPB School</strong></p>
              <p>Développé par Smart Team</p>
              <p style="margin-top: 10px;">Excellence Éducative & Innovation Pédagogique</p>
              <p style="font-size: 12px; color: #999; margin-top: 15px;">
                Cet email a été envoyé automatiquement, merci de ne pas y répondre.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
      attachments: [
        {
          filename: 'logo.jpeg',
          path: './public/images/logo.jpeg',
          cid: 'logo'
        }
      ]
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`✅ Email envoyé à ${user.email}`);
    } catch (error) {
      console.error(`❌ Erreur envoi à ${user.email}:`, error.message);
      errors.push({ email: user.email, error: error.message });
    }
  }

  if (errors.length > 0) {
    console.warn(`⚠️  ${errors.length} email(s) n'ont pas pu être envoyés`);
  }

  return { sent: users.length - errors.length, errors };
};
