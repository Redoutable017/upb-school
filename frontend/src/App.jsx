import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from './store/authStore';
import { usePreferencesStore } from './store/preferencesStore';
import { getToastConfig, initializeTheme } from './utils/themeUtils';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import Courses from './pages/Courses';
import Quiz from './pages/Quiz';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Leaderboard from './pages/Leaderboard';
import Layout from './components/Layout';

// Composant pour gérer le thème dynamique
function ThemeWrapper({ children }) {
  const { user } = useAuthStore();
  const { getUserPreferences } = usePreferencesStore();
  const location = useLocation();
  const [currentTheme, setCurrentTheme] = useState('dark');
  
  useEffect(() => {
    // Vérifier si on est sur la page login
    const isLoginPage = location.pathname === '/login';
    
    if (isLoginPage) {
      // Forcer le thème dark sur la page login
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
      localStorage.setItem('theme', 'dark');
      setCurrentTheme('dark');
    } else if (user) {
      // Si utilisateur connecté, utiliser ses préférences
      const prefs = getUserPreferences(user.id);
      const userTheme = prefs.theme || user.theme_preference || 'dark';
      
      document.documentElement.classList.toggle('dark', userTheme === 'dark');
      document.documentElement.classList.toggle('light', userTheme === 'light');
      localStorage.setItem('theme', userTheme);
      setCurrentTheme(userTheme);
    } else {
      // Sinon utiliser le thème sauvegardé ou dark par défaut
      const savedTheme = localStorage.getItem('theme') || 'dark';
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
      document.documentElement.classList.toggle('light', savedTheme === 'light');
      setCurrentTheme(savedTheme);
    }
    
    // Écouter les changements de thème
    const handleThemeChange = (event) => {
      const newTheme = event.detail;
      setCurrentTheme(newTheme);
    };
    
    window.addEventListener('theme-changed', handleThemeChange);
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
    };
  }, [user, location.pathname, getUserPreferences]);
  
  return children;
}

// Composant de sécurité pour les routes protégées
function ProtectedRoute({ children, requireAuth = true }) {
  const { token } = useAuthStore();
  const location = useLocation();
  
  if (requireAuth && !token) {
    // Rediriger vers login en sauvegardant la page demandée
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  if (!requireAuth && token) {
    // Si déjà connecté et essaie d'accéder à login/register
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
}

// Toaster dynamique qui s'adapte au thème
function DynamicToaster() {
  const { user } = useAuthStore();
  const { getUserPreferences } = usePreferencesStore();
  const [toastConfig, setToastConfig] = useState(getToastConfig('dark'));
  
  useEffect(() => {
    const determineTheme = () => {
      if (user) {
        const prefs = getUserPreferences(user.id);
        return prefs.theme || user.theme_preference || 'dark';
      }
      return localStorage.getItem('theme') || 'dark';
    };
    
    const theme = determineTheme();
    setToastConfig(getToastConfig(theme));
    
    // Écouter les changements de thème
    const handleThemeChange = () => {
      const newTheme = determineTheme();
      setToastConfig(getToastConfig(newTheme));
    };
    
    window.addEventListener('theme-changed', handleThemeChange);
    window.addEventListener('storage', handleThemeChange);
    
    return () => {
      window.removeEventListener('theme-changed', handleThemeChange);
      window.removeEventListener('storage', handleThemeChange);
    };
  }, [user, getUserPreferences]);
  
  return (
    <Toaster
      position={toastConfig.position}
      toastOptions={toastConfig.toastOptions}
      containerStyle={{
        top: 80,
        right: 20,
        zIndex: 9999
      }}
    />
  );
}

function App() {
  // Initialiser le thème au chargement
  useEffect(() => {
    initializeTheme();
  }, []);
  
  return (
    <BrowserRouter>
      <ThemeWrapper>
        {/* Toaster dynamique qui s'adapte au thème */}
        <DynamicToaster />
        
        <Routes>
          {/* Routes publiques - accessible sans authentification */}
          <Route path="/login" element={
            <ProtectedRoute requireAuth={false}>
              <Login />
            </ProtectedRoute>
          } />
          
          <Route path="/register" element={
            <ProtectedRoute requireAuth={false}>
              <Register />
            </ProtectedRoute>
          } />
          
          <Route path="/forgot-password" element={
            <ProtectedRoute requireAuth={false}>
              <ForgotPassword />
            </ProtectedRoute>
          } />
          
          {/* Routes protégées - nécessitent une authentification */}
          <Route path="/" element={
            <ProtectedRoute requireAuth={true}>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="courses" element={<Courses />} />
            <Route path="quiz" element={<Quiz />} />
            <Route path="leaderboard" element={<Leaderboard />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            
            {/* Route admin (à protéger avec rôle admin) */}
            <Route path="admin" element={
              <ProtectedRoute requireAuth={true}>
                {/* <AdminPanel /> - À implémenter */}
                <div className="p-8">
                  <h1 className="text-2xl font-bold">Panel Admin</h1>
                  <p className="text-gray-600 dark:text-gray-400">À implémenter</p>
                </div>
              </ProtectedRoute>
            } />
          </Route>
          
          {/* 404 - Page non trouvée */}
          <Route path="/404" element={
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
                <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">Page non trouvée</p>
                <a 
                  href="/dashboard" 
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Retour au tableau de bord
                </a>
              </div>
            </div>
          } />
          
          {/* Redirection par défaut */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
        
        {/* Pied de page global */}
        <footer className="fixed bottom-0 left-0 right-0 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-t border-gray-200 dark:border-gray-800 py-3 px-6 text-center text-sm text-gray-600 dark:text-gray-400 z-40">
          <div className="container mx-auto">
            <p>
              UPB School &copy; {new Date().getFullYear()} - 
              <span className="mx-2">•</span>
              <a href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Confidentialité</a>
              <span className="mx-2">•</span>
              <a href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Conditions</a>
              <span className="mx-2">•</span>
              <a href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</a>
            </p>
          </div>
        </footer>
      </ThemeWrapper>
    </BrowserRouter>
  );
}

export default App;