import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

async function testGeminiAPI() {
  console.log('🧪 Test de l\'API Gemini...\n');
  
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY non définie dans .env');
    process.exit(1);
  }
  
  console.log(`🔑 Clé API détectée : ${apiKey.substring(0, 10)}...${apiKey.substring(apiKey.length - 5)}`);
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    console.log('📡 Envoi d\'une requête de test...');
    
    const result = await model.generateContent('Réponds simplement "OK" si tu reçois ce message.');
    const response = result.response.text();
    
    console.log('\n✅ SUCCÈS ! L\'API fonctionne correctement.');
    console.log(`📨 Réponse de l'IA : ${response}`);
    console.log('\n🎉 Votre clé API Gemini est valide et fonctionnelle.');
    
  } catch (error) {
    console.error('\n❌ ERREUR lors du test de l\'API:');
    console.error(`Type : ${error.name}`);
    console.error(`Message : ${error.message}`);
    
    if (error.message.includes('API_KEY_INVALID') || error.message.includes('invalid')) {
      console.error('\n💡 SOLUTION : La clé API est invalide.');
      console.error('   1. Allez sur https://aistudio.google.com/app/apikey');
      console.error('   2. Créez une nouvelle clé API');
      console.error('   3. Remplacez OPENAI_API_KEY dans backend/.env');
    } else if (error.message.includes('PERMISSION_DENIED')) {
      console.error('\n💡 SOLUTION : Permissions insuffisantes.');
      console.error('   1. Vérifiez que l\'API Generative Language est activée');
      console.error('   2. Créez une nouvelle clé sans restrictions');
    } else if (error.message.includes('QUOTA')) {
      console.error('\n💡 SOLUTION : Quota dépassé.');
      console.error('   Le quota gratuit est de 60 requêtes/minute.');
      console.error('   Attendez quelques minutes ou créez une nouvelle clé.');
    }
    
    process.exit(1);
  }
}

testGeminiAPI();
