import { useState, useEffect } from 'react';
import { Moon, Sun, Mail, Shield, Bell, Info, Fingerprint } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { usePreferencesStore } from '../store/preferencesStore';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';
import { 
  isBiometricAvailable, 
  registerBiometric, 
  removeBiometric,
  getBiometricType,
  detectDevice
} from '../utils/deviceUtils';

export default function Settings() {
  const { user, updateUser } = useAuthStore();
  const { getUserPreferences, saveUserPreferences, setTheme, setBiometrie, setNotifications } = usePreferencesStore();
  
  const userPrefs = getUserPreferences(user?.id);
  
  const [theme, setThemeState] = useState(userPrefs.theme || 'dark');
  const [biometrie, setBiometrieState] = useState(userPrefs.biometrie_active || false);
  const [notifications, setNotificationsState] = useState(userPrefs.notifications || {
    nouveauxCours: false,
    rappelsQuiz: false,
    passageNiveau: false
  });
  const [saving, setSaving] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState(null);
  const [device, setDevice] = useState('unknown');

  useEffect(() => {
    checkBiometricSupport();
    setDevice(detectDevice());
  }, []);

  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const checkBiometricSupport = async () => {
    const info = await isBiometricAvailable();
    setBiometricInfo(info);
  };

  const handleThemeChange = async (newTheme) => {
    setThemeState(newTheme);
    setTheme(user?.id, newTheme);
    
    if (newTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    
    toast.success('Thème mis à jour');
  };

  const handleBiometrieToggle = async () => {
    const newValue = !biometrie;
    
    if (!biometricInfo?.available) {
      toast.error(biometricInfo?.reason || 'La biométrie n\'est pas disponible');
      return;
    }

    setSaving(true);

    try {
      if (newValue) {
        const result = await registerBiometric(user.id, user.pseudo || user.email);
        
        if (!result.success) {
          toast.error('Échec de l\'enregistrement biométrique');
          setSaving(false);
          return;
        }
      } else {
        removeBiometric(user.id);
      }

      await userAPI.updatePreferences({ biometrie_active: newValue });
      
      setBiometrieState(newValue);
      setBiometrie(user?.id, newValue);
      
      toast.success(newValue ? `${getBiometricType()} activée !` : 'Biométrie désactivée');
    } catch (error) {
      console.error('Erreur sync biométrie:', error);
      
      if (newValue) {
        removeBiometric(user.id);
      }
      
      toast.error('Erreur lors de la synchronisation. Réessayez.');
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = (key) => {
    const newNotifs = {
      ...notifications,
      [key]: !notifications[key]
    };
    setNotificationsState(newNotifs);
    setNotifications(user?.id, newNotifs);
    toast.success('Préférences enregistrées');
  };

  const handleContactUs = () => {
    window.location.href = `mailto:upb.school1@gmail.com?subject=Contact UPB School&body=Bonjour,%0D%0A%0D%0AJe vous contacte concernant...`;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-4xl font-bold">Paramètres</h1>
        <p className="text-gray-400 mt-2">
          Personnalisez votre expérience UPB School
        </p>
      </div>

      {/* Apparence */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          {theme === 'dark' ? <Moon size={24} /> : <Sun size={24} />}
          <div>
            <h2 className="text-2xl font-bold">Apparence</h2>
            <p className="text-gray-400 text-sm">Choisissez le thème de l'application</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Thème sombre */}
          <button
            onClick={() => handleThemeChange('dark')}
            disabled={saving}
            className={`p-6 rounded-xl border-2 transition-all ${
              theme === 'dark'
                ? 'border-accent bg-accent/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-darker to-dark rounded-xl flex items-center justify-center">
                <Moon size={32} className="text-accent" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Sombre</p>
                <p className="text-sm text-gray-400">Idéal pour la nuit</p>
              </div>
            </div>
            {theme === 'dark' && (
              <div className="mt-4 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm inline-block">
                ✓ Actif
              </div>
            )}
          </button>

          {/* Thème clair */}
          <button
            onClick={() => handleThemeChange('light')}
            disabled={saving}
            className={`p-6 rounded-xl border-2 transition-all ${
              theme === 'light'
                ? 'border-accent bg-accent/10'
                : 'border-white/10 hover:border-white/20'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <Sun size={32} className="text-orange-500" />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Clair</p>
                <p className="text-sm text-gray-400">Idéal en journée</p>
              </div>
            </div>
            {theme === 'light' && (
              <div className="mt-4 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm inline-block">
                ✓ Actif
              </div>
            )}
          </button>
        </div>
      </div>

      {/* Sécurité */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} />
          <div>
            <h2 className="text-2xl font-bold">Sécurité</h2>
            <p className="text-gray-400 text-sm">Options de connexion et sécurité</p>
          </div>
        </div>

        {/* Biométrie */}
        <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
          <div className="flex-1">
            <p className="font-semibold mb-1">Authentification biométrique</p>
            <p className="text-sm text-gray-400">
              Utilisez votre empreinte digitale ou Face ID pour vous connecter
            </p>
            {!window.PublicKeyCredential && (
              <p className="text-xs text-orange-400 mt-2">
                ⚠️ Non disponible sur cet appareil
              </p>
            )}
          </div>
          
          <button
            onClick={handleBiometrieToggle}
            disabled={saving || !window.PublicKeyCredential}
            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
              biometrie ? 'bg-accent' : 'bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                biometrie ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
          <p className="text-sm text-blue-400">
            <Info size={16} className="inline mr-2" />
            <strong>Note :</strong> Lorsque vous fermez la page, vous serez automatiquement déconnecté 
            pour des raisons de sécurité. L'authentification biométrique vous permettra de vous reconnecter 
            rapidement.
          </p>
        </div>
      </div>

      {/* Notifications */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Bell size={24} />
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-gray-400 text-sm">Gérez vos préférences de notification</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
            <div>
              <p className="font-semibold">Nouveaux cours</p>
              <p className="text-sm text-gray-400">
                Recevoir un email lors de l'ajout de nouveaux cours
              </p>
            </div>
            <button
              onClick={() => handleNotificationToggle('nouveauxCours')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifications.nouveauxCours ? 'bg-accent' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  notifications.nouveauxCours ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
            <div>
              <p className="font-semibold">Rappels de quiz</p>
              <p className="text-sm text-gray-400">
                Recevoir des rappels pour compléter vos quiz
              </p>
            </div>
            <button
              onClick={() => handleNotificationToggle('rappelsQuiz')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifications.rappelsQuiz ? 'bg-accent' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  notifications.rappelsQuiz ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl">
            <div>
              <p className="font-semibold">Passage de niveau</p>
              <p className="text-sm text-gray-400">
                Recevoir un email lors du passage à un nouveau niveau
              </p>
            </div>
            <button
              onClick={() => handleNotificationToggle('passageNiveau')}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
                notifications.passageNiveau ? 'bg-accent' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
                  notifications.passageNiveau ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <Mail size={24} />
          <div>
            <h2 className="text-2xl font-bold">Nous contacter</h2>
            <p className="text-gray-400 text-sm">Besoin d'aide ? Contactez notre équipe</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="font-semibold mb-2">Email de support</p>
            <a 
              href="mailto:upb.school1@gmail.com"
              className="text-accent hover:underline flex items-center gap-2"
            >
              <Mail size={18} />
              upb.school1@gmail.com
            </a>
          </div>

          <button
            onClick={handleContactUs}
            className="btn btn-primary w-full"
          >
            <Mail size={20} />
            Envoyer un email
          </button>
        </div>
      </div>

      {/* À propos */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-4">À propos de UPB School</h2>
        <div className="space-y-3 text-gray-400">
          <p>
            <strong className="text-white">Version :</strong> 1.0.0
          </p>
          <p>
            <strong className="text-white">Développé par :</strong> Smart Team
          </p>
          <p>
            <strong className="text-white">Technologies :</strong> React, Node.js, PostgreSQL, Gemini AI
          </p>
          <p className="pt-4 border-t border-white/10">
            © 2026 UPB School - Excellence Éducative & Innovation Pédagogique
          </p>
        </div>
      </div>
    </div>
  );
}
