import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function listModels() {
  console.log('📋 Liste des modèles disponibles avec votre clé API...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  try {
    // Essayer de lister les modèles
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.models && data.models.length > 0) {
      console.log('✅ Modèles disponibles :');
      data.models.forEach(model => {
        console.log(`  - ${model.name}`);
        console.log(`    Description : ${model.description || 'N/A'}`);
        console.log(`    Méthodes : ${model.supportedGenerationMethods?.join(', ') || 'N/A'}\n`);
      });
    } else {
      console.log('❌ Aucun modèle disponible avec cette clé.');
    }
    
  } catch (error) {
    console.error('\n❌ ERREUR :');
    console.error(`Message : ${error.message}`);
    
    console.error('\n💡 DIAGNOSTIC :');
    console.error('   Votre clé API semble invalide ou restreinte.');
    console.error('\n📝 SOLUTION :');
    console.error('   1. Allez sur https://aistudio.google.com/app/apikey');
    console.error('   2. Créez une NOUVELLE clé API');
    console.error('   3. Remplacez OPENAI_API_KEY dans backend/.env');
    console.error('   4. Redémarrez le backend');
  }
}

listModels();
