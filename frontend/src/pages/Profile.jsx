import { useState, useEffect } from 'react';
import { User, Camera, Trash2, TrendingUp, Trophy, Target, Calendar } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { userAPI, quizAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, historyRes] = await Promise.all([
        userAPI.getStats(),
        quizAPI.getHistory()
      ]);
      
      setStats(statsRes.data);
      setHistory(historyRes.data.slice(0, 10));
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Veuillez sélectionner une image');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('L\'image ne doit pas dépasser 5MB');
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('photo', file);

    try {
      const response = await userAPI.uploadPhoto(formData);
      const photoUrl = `http://localhost:5000${response.data.photo_url}`;
      
      // Mise à jour immédiate dans le store
      updateUser({ photo_profil: photoUrl });
      
      toast.success('Photo de profil mise à jour');
      
      // Forcer le rechargement de la page après un court délai
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Erreur upload photo:', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await userAPI.deleteAccount();
      toast.success('Compte supprimé avec succès');
      logout();
      navigate('/login');
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const getPointsForNextLevel = () => {
    const requirements = [600, 850, 1000, 1250, 1500, 1750, 2000, 2500, 3000];
    return requirements[user?.niveau - 1] || 0;
  };

  const progressPercentage = user?.points_exp 
    ? Math.min((user.points_exp / getPointsForNextLevel()) * 100, 100)
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      <h1 className="text-4xl font-bold">Mon Profil</h1>

      {/* Carte principale */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Photo de profil */}
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl overflow-hidden">
              {user?.photo_profil ? (
                <img
                  key={user.photo_profil}
                  src={user.photo_profil}
                  alt="Profil"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.parentElement.querySelector('.fallback-avatar');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              
              <div 
                className={`fallback-avatar w-full h-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-white font-bold text-5xl ${user?.photo_profil ? 'hidden' : 'flex'}`}
              >
                {user?.pseudo === 'ADMIN' ? 'A' : user?.prenom?.charAt(0)}
              </div>
            </div>
            
            {/* Overlay pour changer la photo */}
            <label className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={32} className="text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={uploadingPhoto}
              />
            </label>
          </div>

          {/* Informations */}
          <div className="flex-1 space-y-4">
            <div>
              <h2 className="text-3xl font-bold">
                {user?.pseudo === 'ADMIN' ? 'ADMIN' : user?.prenom}
              </h2>
              <p className="text-gray-400 mt-1">{user?.email}</p>
              <p className="text-gray-400">{user?.telephone}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="card bg-white/5">
                <p className="text-sm text-gray-400 mb-1">Filière</p>
                <p className="text-xl font-bold">{user?.filiere}</p>
              </div>
              <div className="card bg-white/5">
                <p className="text-sm text-gray-400 mb-1">Niveau d'étude</p>
                <p className="text-xl font-bold">{user?.niveau_etude}</p>
              </div>
            </div>

            <div className="card bg-white/5">
              <p className="text-sm text-gray-400 mb-2">
                Progression vers le niveau {user?.niveau + 1}
              </p>
              <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden mb-2">
                <div
                  className="bg-gradient-to-r from-accent to-purple h-full transition-all"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-sm text-gray-400">
                <span>{user?.points_exp} XP</span>
                <span>{getPointsForNextLevel()} XP</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center">
              <Trophy className="text-accent" size={24} />
            </div>
            <div>
              <p className="text-3xl font-bold">{stats?.total_quiz || 0}</p>
              <p className="text-gray-400 text-sm">Quiz complétés</p>
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-purple/20 rounded-xl flex items-center justify-center">
              <Target className="text-purple" size={24} />
            </div>
            <div>
              <p className="text-3xl font-bold">{user?.points_exp || 0}</p>
              <p className="text-gray-400 text-sm">Points XP</p>
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-success/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="text-success" size={24} />
            </div>
            <div>
              <p className="text-3xl font-bold">
                {stats?.moyenne_pourcentage ? Math.round(stats.moyenne_pourcentage) : 0}%
              </p>
              <p className="text-gray-400 text-sm">Score moyen</p>
            </div>
          </div>
        </div>

        <div className="card hover:scale-105 transition-transform">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange/20 rounded-xl flex items-center justify-center">
              <Calendar className="text-orange" size={24} />
            </div>
            <div>
              <p className="text-3xl font-bold">{user?.niveau}</p>
              <p className="text-gray-400 text-sm">Niveau actuel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des quiz */}
      <div className="card">
        <h3 className="text-2xl font-bold mb-6">Historique des quiz</h3>
        
        {history.length > 0 ? (
          <div className="space-y-3">
            {history.map((attempt) => {
              const percentage = Math.round((attempt.score / attempt.total_questions) * 100);
              const isGood = percentage >= 70;
              
              return (
                <div
                  key={attempt.id}
                  className="card bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <div className="flex flex-col md:flex-row justify-between gap-4">
                    <div>
                      <p className="font-semibold text-lg">{attempt.matiere}</p>
                      <p className="text-sm text-gray-400">
                        {new Date(attempt.completed_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className={`text-2xl font-bold ${isGood ? 'text-success' : 'text-orange'}`}>
                          {attempt.score}/{attempt.total_questions}
                        </p>
                        <p className="text-sm text-gray-400">{percentage}%</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-xl font-bold text-accent">
                          +{attempt.points_gagnes}
                        </p>
                        <p className="text-sm text-gray-400">Points gagnés</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-400">Tentative</p>
                        <div className="badge mt-1">
                          {attempt.tentative_numero}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-xl text-gray-400">Aucun quiz complété</p>
            <p className="text-gray-500 mt-2">
              Commence un quiz pour voir ton historique ici
            </p>
          </div>
        )}
      </div>

      {/* Zone de danger */}
      <div className="card border-error/30 bg-error/5">
        <h3 className="text-2xl font-bold mb-4 text-error">Zone de danger</h3>
        <p className="text-gray-400 mb-6">
          La suppression de votre compte est irréversible. Toutes vos données, 
          votre progression et vos quiz seront définitivement supprimés.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="btn bg-error hover:bg-error/80 text-white"
          >
            <Trash2 size={20} />
            Supprimer mon compte
          </button>
        ) : (
          <div className="space-y-4 p-4 bg-error/10 rounded-xl border border-error/30">
            <p className="font-semibold text-error">
              ⚠️ Êtes-vous vraiment sûr(e) de vouloir supprimer votre compte ?
            </p>
            <p className="text-sm text-gray-300">
              Cette action est <strong>IRRÉVERSIBLE</strong>. Vous perdrez :
            </p>
            <ul className="text-sm text-gray-300 list-disc list-inside space-y-1">
              <li>Tous vos quiz et votre progression</li>
              <li>Votre niveau et vos points XP</li>
              <li>Votre historique complet</li>
              <li>Votre compte ne pourra pas être récupéré</li>
            </ul>
            
            <div className="flex gap-4 mt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn btn-secondary flex-1"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                className="btn bg-error hover:bg-error/80 text-white flex-1"
              >
                <Trash2 size={20} />
                Oui, supprimer définitivement
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
