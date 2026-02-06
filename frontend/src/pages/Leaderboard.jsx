import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, Filter, Star } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { quizAPI } from '../services/api';
import toast from 'react-hot-toast';

export default function Leaderboard() {
  const { user } = useAuthStore();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterFiliere, setFilterFiliere] = useState('');

  const getPhotoUrl = (photoPath) => {
    if (!photoPath) return null;
    if (photoPath.startsWith('http')) return photoPath;
    return `http://localhost:5000${photoPath}`;
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await quizAPI.getLeaderboard();
      setLeaderboard(response.data);
    } catch (error) {
      toast.error('Erreur lors du chargement du classement');
    } finally {
      setLoading(false);
    }
  };

  const filteredLeaderboard = filterFiliere === 'L1_TRONC_COMMUN'
    ? leaderboard.filter(u => 
        u.niveau_etude === 'L1' && 
        (u.filiere === 'ASSRI' || u.filiere === 'MIAGE')
      )
    : filterFiliere
      ? leaderboard.filter(u => u.filiere === filterFiliere)
      : leaderboard;

  const userPosition = filteredLeaderboard.findIndex(u => u.id === user?.id) + 1;

  const getMedalIcon = (position) => {
    if (position === 1) return <Crown size={32} className="text-yellow-400" />;
    if (position === 2) return <Medal size={32} className="text-gray-400" />;
    if (position === 3) return <Medal size={32} className="text-orange-400" />;
    return <Star size={24} className="text-gray-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-accent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Trophy className="text-accent" size={40} />
            Classement
          </h1>
          <p className="text-gray-400 mt-2">
            Top {filteredLeaderboard.length} étudiants
          </p>
        </div>

        {userPosition > 0 && (
          <div className="badge text-lg">
            Votre position : #{userPosition}
          </div>
        )}
      </div>

      {/* Filtre */}
      <div className="card">
        <div className="flex items-center gap-3">
          <Filter size={20} />
          <select
            className="input"
            value={filterFiliere}
            onChange={(e) => setFilterFiliere(e.target.value)}
          >
            <option value="">Tous les niveaux et filières</option>
            <option value="L1_TRONC_COMMUN">L1 Tronc Commun (ASSRI + MIAGE)</option>
            <option value="ASSRI">ASSRI</option>
            <option value="MIAGE">MIAGE</option>
          </select>
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {filteredLeaderboard.slice(0, 3).map((student, index) => (
          <div
            key={student.id}
            className={`card text-center ${
              student.id === user?.id ? 'border-2 border-accent shadow-2xl' : ''
            } ${
              index === 0 ? 'md:order-2 scale-110' : index === 1 ? 'md:order-1' : 'md:order-3'
            }`}
          >
            <div className="flex justify-center mb-4">
              {getMedalIcon(index + 1)}
            </div>

            <div className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-accent overflow-hidden">
              {student.photo_profil ? (
                <img
                  key={student.id}
                  src={getPhotoUrl(student.photo_profil)}
                  alt={student.pseudo || student.nom}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const fallback = e.target.parentElement.querySelector('.fallback-avatar');
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className={`fallback-avatar w-full h-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-white font-bold text-3xl ${student.photo_profil ? 'hidden' : 'flex'}`}
              >
                {student.prenom?.charAt(0)}{student.nom?.charAt(0)}
              </div>
            </div>

            <p className="text-2xl font-bold">#{index + 1}</p>
            <p className="text-xl font-semibold mt-2">
              {student.pseudo || `${student.prenom} ${student.nom}`}
            </p>
            <p className="text-gray-400">{student.filiere}</p>

            <div className="mt-4 pt-4 border-t border-white/10">
              <div className="flex justify-around">
                <div>
                  <p className="text-sm text-gray-400">Niveau</p>
                  <p className="text-2xl font-bold text-accent">{student.niveau}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-400">XP</p>
                  <p className="text-2xl font-bold text-purple">{student.points_exp}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Reste du classement */}
      <div className="card">
        <h3 className="text-2xl font-bold mb-6">Classement Complet</h3>
        
        <div className="space-y-3">
          {filteredLeaderboard.map((student, index) => {
            const isCurrentUser = student.id === user?.id;
            const position = index + 1;

            return (
              <div
                key={student.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  isCurrentUser
                    ? 'bg-accent/20 border-2 border-accent scale-105 shadow-xl'
                    : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                {/* Position */}
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-white/10 font-bold text-lg flex-shrink-0">
                  {position <= 3 ? getMedalIcon(position) : `#${position}`}
                </div>

                {/* Photo */}
                <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                  {student.photo_profil ? (
                    <img
                      key={student.id}
                      src={getPhotoUrl(student.photo_profil)}
                      alt={student.pseudo || student.nom}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = e.target.parentElement.querySelector('.fallback-avatar');
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div 
                    className={`fallback-avatar w-full h-full bg-gradient-to-br from-accent to-purple flex items-center justify-center text-white font-bold ${student.photo_profil ? 'hidden' : 'flex'}`}
                  >
                    {student.prenom?.charAt(0)}{student.nom?.charAt(0)}
                  </div>
                </div>

                {/* Infos */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">
                    {student.pseudo || `${student.prenom} ${student.nom}`}
                    {isCurrentUser && (
                      <span className="ml-2 text-accent text-sm">(Vous)</span>
                    )}
                  </p>
                  <p className="text-sm text-gray-400">{student.filiere}</p>
                </div>

                {/* Stats */}
                <div className="flex gap-6 items-center">
                  <div className="text-center">
                    <p className="text-sm text-gray-400">Niveau</p>
                    <p className="text-xl font-bold text-accent">{student.niveau}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-400">XP</p>
                    <p className="text-xl font-bold">{student.points_exp}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredLeaderboard.length === 0 && (
          <div className="text-center py-12">
            <Trophy size={64} className="mx-auto text-gray-600 mb-4" />
            <p className="text-xl text-gray-400">Aucun étudiant trouvé</p>
            <p className="text-gray-500 mt-2">
              Changez les filtres ou revenez plus tard
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
