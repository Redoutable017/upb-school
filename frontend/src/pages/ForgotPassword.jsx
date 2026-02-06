import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, Loader, CheckCircle, Eye, EyeOff, Lock, Check, X, Clock } from 'lucide-react';
import { authAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendCode = async (e) => {
    e.preventDefault();
    
    if (cooldown > 0) {
      toast.error(`Veuillez attendre ${cooldown}s avant de renvoyer un code`);
      return;
    }
    
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      toast.success('Code envoyé par email (valide 10 min)');
      setCooldown(30);
      setStep(2);
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Trop de demandes. Veuillez patienter 30 secondes.');
        setCooldown(30);
      } else {
        toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (cooldown > 0) {
      toast.error(`Veuillez attendre ${cooldown}s avant de renvoyer un code`);
      return;
    }
    
    setLoading(true);

    try {
      await authAPI.forgotPassword(email);
      toast.success('Nouveau code envoyé par email');
      setCooldown(30);
    } catch (error) {
      if (error.response?.status === 429) {
        toast.error('Trop de demandes. Veuillez patienter 30 secondes.');
        setCooldown(30);
      } else {
        toast.error(error.response?.data?.error || 'Erreur lors de l\'envoi');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authAPI.verifyResetCode(email, code);
      toast.success('Code vérifié !');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Code invalide ou expiré');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    return {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[@#$%^&+=!*()_\-{}[\]:;"'<>,.?/\\|`~]/.test(password),
    };
  };

  const passwordValidation = validatePassword(newPassword);

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    if (!passwordValidation.length) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }
    if (!passwordValidation.uppercase) {
      toast.error('Le mot de passe doit contenir au moins une majuscule');
      return;
    }
    if (!passwordValidation.number) {
      toast.error('Le mot de passe doit contenir au moins un chiffre');
      return;
    }
    if (!passwordValidation.special) {
      toast.error('Le mot de passe doit contenir au moins un caractère spécial');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(email, code, newPassword);
      toast.success('Mot de passe réinitialisé avec succès !');
      setStep(4);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  const PasswordCriteria = ({ met, text }) => (
    <div className={`flex items-center gap-2 text-xs ${met ? 'text-green-500' : 'text-gray-400'}`}>
      {met ? <Check size={14} /> : <X size={14} />}
      <span>{text}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card max-w-md w-full relative z-10 animate-fadeIn">
        <Link to="/login" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6">
          <ArrowLeft size={20} />
          Retour à la connexion
        </Link>

        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-accent to-purple rounded-2xl flex items-center justify-center text-white font-bold text-3xl mx-auto mb-4 shadow-2xl">
            🔐
          </div>
          <h1 className="text-3xl font-bold">Mot de passe oublié</h1>
          <p className="text-gray-400 mt-2">
            {step === 1 && 'Entrez votre email pour recevoir un code'}
            {step === 2 && 'Entrez le code reçu par email'}
            {step === 3 && 'Créez un nouveau mot de passe'}
            {step === 4 && 'Mot de passe réinitialisé !'}
          </p>
        </div>

        {step === 1 && (
          <form onSubmit={handleSendCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="email"
                  className="input pl-12"
                  placeholder="email@exemple.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || cooldown > 0} 
              className="btn btn-primary w-full"
            >
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Envoi...
                </>
              ) : cooldown > 0 ? (
                <>
                  <Clock size={20} />
                  Attendre {cooldown}s
                </>
              ) : (
                'Envoyer le code'
              )}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyCode} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Code à 6 chiffres</label>
              <input
                type="text"
                className="input text-center text-2xl tracking-widest"
                placeholder="000000"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                required
              />
              <p className="text-xs text-gray-400 mt-2">
                Le code expire dans 10 minutes
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Vérification...
                </>
              ) : (
                'Vérifier le code'
              )}
            </button>

            <button
              type="button"
              onClick={handleResendCode}
              disabled={cooldown > 0 || loading}
              className="btn btn-secondary w-full"
            >
              {cooldown > 0 ? (
                <>
                  <Clock size={18} />
                  Renvoyer dans {cooldown}s
                </>
              ) : (
                'Renvoyer un code'
              )}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="input pl-12 pr-12"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              {newPassword && (
                <div className="mt-3 p-3 bg-white/5 rounded-lg space-y-1">
                  <p className="text-xs font-medium text-gray-300 mb-2">Critères du mot de passe :</p>
                  <PasswordCriteria met={passwordValidation.length} text="Au moins 8 caractères" />
                  <PasswordCriteria met={passwordValidation.uppercase} text="Au moins 1 majuscule (A-Z)" />
                  <PasswordCriteria met={passwordValidation.number} text="Au moins 1 chiffre (0-9)" />
                  <PasswordCriteria met={passwordValidation.special} text="Au moins 1 caractère spécial (@, #, $, !, %, etc.)" />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Confirmer le mot de passe</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  className="input pl-12 pr-12"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-500">Les mots de passe ne correspondent pas</p>
              )}
              {confirmPassword && newPassword === confirmPassword && confirmPassword.length > 0 && (
                <p className="mt-1 text-xs text-green-500">Les mots de passe correspondent</p>
              )}
            </div>

            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <p className="text-xs text-yellow-400">
                Note : Le nouveau mot de passe ne peut pas être identique à vos 2 derniers mots de passe.
              </p>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading ? (
                <>
                  <Loader className="animate-spin" size={20} />
                  Réinitialisation...
                </>
              ) : (
                'Réinitialiser le mot de passe'
              )}
            </button>
          </form>
        )}

        {step === 4 && (
          <div className="text-center space-y-6">
            <CheckCircle className="mx-auto text-success" size={80} />
            <p className="text-lg">
              Votre mot de passe a été réinitialisé avec succès !
            </p>
            <p className="text-sm text-gray-400">
              Un email de confirmation vous a été envoyé.
            </p>
            <Link to="/login" className="btn btn-primary w-full">
              Se connecter
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
