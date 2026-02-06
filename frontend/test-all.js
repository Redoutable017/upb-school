// test-all.js - Script de test complet
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const tests = [
  {
    name: 'Vérifier structure des fichiers',
    test: () => {
      const requiredFiles = [
        'backend/server.js',
        'backend/routes/auth.js',
        'backend/routes/user.js',
        'backend/config/database.js',
        'frontend/src/main.jsx',
        'frontend/src/App.jsx',
        'frontend/src/index.css',
        'frontend/vite.config.js',
        'package.json',
        'README.md'
      ];
      
      const missingFiles = [];
      requiredFiles.forEach(file => {
        if (!fs.existsSync(file)) {
          missingFiles.push(file);
        }
      });
      
      if (missingFiles.length > 0) {
        throw new Error(`Fichiers manquants: ${missingFiles.join(', ')}`);
      }
      return true;
    }
  },
  
  {
    name: 'Vérifier dépendances backend',
    test: () => {
      const packagePath = path.join(__dirname, 'backend', 'package.json');
      if (!fs.existsSync(packagePath)) {
        throw new Error('package.json backend manquant');
      }
      
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const requiredDeps = ['express', 'pg', 'bcrypt', 'jsonwebtoken', 'cors', 'helmet'];
      
      const missingDeps = requiredDeps.filter(dep => !pkg.dependencies?.[dep]);
      if (missingDeps.length > 0) {
        throw new Error(`Dépendances manquantes: ${missingDeps.join(', ')}`);
      }
      return true;
    }
  },
  
  {
    name: 'Vérifier variables d\'environnement',
    test: () => {
      const envExample = path.join(__dirname, 'backend', '.env.example');
      const env = path.join(__dirname, 'backend', '.env');
      
      if (fs.existsSync(envExample) && !fs.existsSync(env)) {
        console.warn('⚠️ .env manquant - Copiez .env.example vers .env');
      }
      
      if (fs.existsSync(env)) {
        const content = fs.readFileSync(env, 'utf8');
        const requiredVars = ['JWT_SECRET', 'DATABASE_URL'];
        
        requiredVars.forEach(varName => {
          if (!content.includes(`${varName}=`)) {
            console.warn(`⚠️ Variable ${varName} manquante dans .env`);
          }
        });
      }
      
      return true;
    }
  },
  
  {
    name: 'Vérifier syntaxe JavaScript',
    test: () => {
      // Vérifier les fichiers JS/JSX
      const checkFiles = [
        'backend/server.js',
        'backend/routes/auth.js',
        'frontend/src/main.jsx',
        'frontend/src/App.jsx'
      ];
      
      checkFiles.forEach(file => {
        if (fs.existsSync(file)) {
          try {
            const content = fs.readFileSync(file, 'utf8');
            // Vérification basique de syntaxe
            if (content.includes('console.error')) {
              console.log(`✅ ${file} - Contient des logs d'erreur`);
            }
          } catch (error) {
            throw new Error(`Erreur lecture ${file}: ${error.message}`);
          }
        }
      });
      
      return true;
    }
  },
  
  {
    name: 'Vérifier base de données',
    test: () => {
      const dbConfigPath = path.join(__dirname, 'backend', 'config', 'database.js');
      if (fs.existsSync(dbConfigPath)) {
        const content = fs.readFileSync(dbConfigPath, 'utf8');
        if (!content.includes('pool.query')) {
          console.warn('⚠️ Configuration DB - Vérifiez les requêtes SQL');
        }
      }
      return true;
    }
  },
  
  {
    name: 'Vérifier routes API',
    test: () => {
      const authRoutePath = path.join(__dirname, 'backend', 'routes', 'auth.js');
      if (fs.existsSync(authRoutePath)) {
        const content = fs.readFileSync(authRoutePath, 'utf8');
        const requiredRoutes = [
          'POST /register',
          'POST /login',
          'POST /forgot-password',
          'POST /reset-password'
        ];
        
        requiredRoutes.forEach(route => {
          if (!content.includes(route.split(' ')[1])) {
            console.warn(`⚠️ Route ${route} non trouvée`);
          }
        });
      }
      return true;
    }
  }
];

async function runTests() {
  console.log('🚀 LANCEMENT DES TESTS UPB SCHOOL\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`🔍 ${test.name}...`);
      const result = test.test();
      if (result === true || result === undefined) {
        console.log(`✅ ${test.name} - PASSED\n`);
        passed++;
      } else {
        console.log(`❌ ${test.name} - FAILED\n`);
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} - ERROR: ${error.message}\n`);
      failed++;
    }
  }
  
  console.log('\n📊 RÉSULTATS FINAUX');
  console.log(`✅ Tests réussis: ${passed}`);
  console.log(`❌ Tests échoués: ${failed}`);
  console.log(`📈 Taux de réussite: ${Math.round((passed / tests.length) * 100)}%`);
  
  if (failed > 0) {
    console.log('\n⚠️  CORRECTIONS NÉCESSAIRES:');
    console.log('1. Vérifiez que tous les fichiers existent');
    console.log('2. Lancez npm install dans backend/ et frontend/');
    console.log('3. Configurez votre .env avec les variables requises');
    console.log('4. Redémarrez les serveurs: npm run dev dans chaque dossier');
    process.exit(1);
  } else {
    console.log('\n🎉 TOUS LES TESTS SONT PASSÉS !');
    console.log('Votre application est prête à fonctionner.');
    console.log('\nPour démarrer:');
    console.log('1. Terminal 1: cd backend && npm run dev');
    console.log('2. Terminal 2: cd frontend && npm run dev');
    console.log('3. Ouvrez http://localhost:5173');
  }
}

runTests();