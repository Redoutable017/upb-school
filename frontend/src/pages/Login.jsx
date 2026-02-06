import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, Loader, Eye, EyeOff, Fingerprint } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePreferencesStore } from '../store/preferencesStore';
import toast from 'react-hot-toast';
import { 
  isBiometricAvailable, 
  authenticateWithBiometric,
  removeBiometric,
  getBiometricType,
  detectDevice 
} from '../utils/deviceUtils';

export default function Login() {
  const navigate = useNavigate();
  const { login, biometricLogin, setUser, setToken } = useAuthStore();
  const { getUserPreferences } = usePreferencesStore();
  
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [biometricChecking, setBiometricChecking] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [lastUserId, setLastUserId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    identifier: '',
    password: '',
  });

  useEffect(() => {
    checkBiometricOnLoad();
  }, []);

  const checkBiometricOnLoad = async () => {
    try {
      const storedUserId = localStorage.getItem('last_user_id');
      
      if (!storedUserId) {
        setBiometricChecking(false);
        setShowForm(true);
        return;
      }

      setLastUserId(storedUserId);

      const bioInfo = await isBiometricAvailable();
      
      if (!bioInfo.available) {
        setBiometricChecking(false);
        setShowForm(true);
        return;
      }

      const userPrefs = getUserPreferences(storedUserId);
      
      if (!userPrefs.biometrie_active) {
        setBiometricChecking(false);
        setShowForm(true);
        return;
      }

      const credentialId = localStorage.getItem(`biometric_credential_${storedUserId}`);
      
      if (!credentialId) {
        setBiometricChecking(false);
        setShowForm(true);
        return;
      }

      setBiometricAvailable(true);
      setBiometricType(getBiometricType());
      
      setTimeout(() => {
        handleBiometricLoginAuto(storedUserId);
      }, 500);
      
    } catch (error) {
      console.error('Erreur vérification biométrie:', error);
      setBiometricChecking(false);
      setShowForm(true);
    }
  };

  const handleBiometricLoginAuto = async (userId) => {
    try {
      const authResult = await authenticateWithBiometric(userId);
      
      if (!authResult.success) {
        if (authResult.shouldClearCredential) {
          removeBiometric(userId);
          toast.error(authResult.error);
        } else {
          toast.info(authResult.error || 'Utilisez le formulaire de connexion');
        }
        
        setBiometricChecking(false);
        setShowForm(true);
        return;
      }

      setLoading(true);
      
      const result = await biometricLogin(userId);
      
      if (result.success) {
        toast.success(`Bienvenue ${result.user.prenom} ! 🎉`);
        navigate('/dashboard');
      } else {
        if (result.error?.includes('non activée')) {
          toast.error('Biométrie désactivée pour ce compte');
        } else {
          toast.error(result.error || 'Erreur de connexion biométrique');
        }
        setBiometricChecking(false);
        setShowForm(true);
      }
      
    } catch (error) {
      console.error('Erreur connexion biométrique:', error);
      toast.error('Erreur de connexion biométrique');
      setBiometricChecking(false);
      setShowForm(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLoginManual = async () => {
    if (!lastUserId) {
      toast.error('Aucun compte biométrique configuré');
      return;
    }
    
    handleBiometricLoginAuto(lastUserId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const result = await login(formData.identifier, formData.password);
      
      if (result.success) {
        toast.success(`Bienvenue ${result.user.prenom} !`);
        navigate('/dashboard');
      } else {
        if (result.error?.includes('Identifiants')) {
          toast.error('Identifiants invalides ou mot de passe incorrect');
        } else if (result.error?.includes('introuvable')) {
          toast.error('Compte introuvable. Veuillez vous inscrire.');
        } else {
          toast.error(result.error || 'Erreur de connexion');
        }
      }
    } catch (error) {
      console.error('Erreur connexion:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  // Écran de chargement biométrique
  if (biometricChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-32 h-32 bg-gradient-to-br from-accent to-purple rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
            <Fingerprint size={64} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Vérification biométrique...</h2>
          <p className="text-gray-400">
            {biometricType && `Préparation de ${biometricType}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {/* Effets de fond */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="card max-w-md w-full relative z-10 animate-fadeIn">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-accent to-purple rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-2xl animate-float">
            UPB
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-accent to-purple bg-clip-text text-transparent">
            Bienvenue
          </h1>
          <p className="text-gray-400 mt-2">Connectez-vous à votre compte</p>
        </div>

        {/* Bouton biométrique manuel (si disponible) */}
        {biometricAvailable && lastUserId && (
          <button
            onClick={handleBiometricLoginManual}
            disabled={loading}
            className="btn btn-primary w-full mb-6 flex items-center justify-center gap-3"
          >
            <Fingerprint size={24} />
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Authentification...
              </>
            ) : (
              <>Connexion avec {biometricType}</>
            )}
          </button>
        )}

        {biometricAvailable && <div className="text-center text-gray-400 my-6">ou</div>}

        {/* Formulaire classique */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email/Téléphone/Pseudo */}
          <div>
            <label className="block text-sm font-medium mb-2">Email, Pseudo ou Téléphone</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                className="input pl-12"
                placeholder="email@exemple.com, pseudo ou 0612345678"
                value={formData.identifier}
                onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-medium mb-2">Mot de passe</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type={showPassword ? "text" : "password"}
                className="input pl-12 pr-12"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* Mot de passe oublié */}
          <div className="text-right">
            <Link to="/forgot-password" className="text-accent hover:underline text-sm">
              Mot de passe oublié ?
            </Link>
          </div>

          {/* Bouton de connexion */}
          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader className="animate-spin" size={20} />
                Connexion...
              </>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Lien inscription */}
        <p className="text-center mt-6 text-gray-400">
          Pas encore de compte ?{' '}
          <Link to="/register" className="text-accent hover:underline font-semibold">
            S'inscrire
          </Link>
        </p>

        {/* Info biométrie */}
        {biometricAvailable && (
          <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
            <p className="text-xs text-blue-400 text-center">
              <Fingerprint size={14} className="inline mr-1" />
              {biometricType} configurée pour ce compte
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
