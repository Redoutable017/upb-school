import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, BookOpen, Trophy, Target } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { quizAPI, userAPI } from '../services/api';
import confetti from 'canvas-confetti';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [history, setHistory] = useState([]);

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
      setHistory(historyRes.data.slice(0, 5));
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
    }
  };

  const getPointsForNextLevel = () => {
    const requirements = [600, 850, 1000, 1250, 1500, 1750, 2000, 2500, 3000];
    return requirements[user?.niveau - 1] || 0;
  };

  const progressPercentage = user?.points_exp 
    ? (user.points_exp / getPointsForNextLevel()) * 100 
    : 0;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold">
            Bonjour, {user?.prenom} ! 👋
          </h1>
          <p className="text-gray-400 mt-2">
            Prêt à continuer ton apprentissage ?
          </p>
        </div>
        <div className="badge text-lg">
          Niveau {user?.niveau}
        </div>
      </div>

      {/* Stats Cards */}
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
              <BookOpen className="text-orange" size={24} />
            </div>
            <div>
              <p className="text-3xl font-bold">{user?.filiere}</p>
              <p className="text-gray-400 text-sm">{user?.niveau_etude}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progression */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp size={24} className="text-accent" />
            Progression vers le niveau {(user?.niveau || 1) + 1}
          </h3>
          <span className="text-gray-400">
            {user?.points_exp || 0} / {getPointsForNextLevel()} XP
          </span>
        </div>
        <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-accent to-purple h-full rounded-full transition-all duration-500 relative overflow-hidden"
            style={{ width: `${Math.min(progressPercentage, 100)}%` }}
          >
            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/courses" className="card hover:scale-105 transition-transform cursor-pointer">
          <BookOpen size={40} className="text-accent mb-4" />
          <h3 className="text-xl font-semibold mb-2">Mes Cours</h3>
          <p className="text-gray-400">Accéder aux cours et documents</p>
        </Link>

        <Link to="/quiz" className="card hover:scale-105 transition-transform cursor-pointer">
          <Trophy size={40} className="text-purple mb-4" />
          <h3 className="text-xl font-semibold mb-2">Quiz</h3>
          <p className="text-gray-400">Tester mes connaissances</p>
        </Link>

        <Link to="/profile" className="card hover:scale-105 transition-transform cursor-pointer">
          <Target size={40} className="text-success mb-4" />
          <h3 className="text-xl font-semibold mb-2">Mon Profil</h3>
          <p className="text-gray-400">Voir mes statistiques</p>
        </Link>
      </div>

      {/* Historique récent */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-4">Activité récente</h3>
        <div className="space-y-3">
          {history.length > 0 ? (
            history.map((attempt, index) => (
              <div
                key={index}
                className="flex justify-between items-center p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div>
                  <p className="font-semibold">{attempt.matiere}</p>
                  <p className="text-sm text-gray-400">
                    {new Date(attempt.completed_at).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">
                    {attempt.score}/{attempt.total_questions}
                  </p>
                  <p className="text-sm text-gray-400">
                    +{attempt.points_gagnes} XP
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-400 py-8">
              Aucune activité récente. Commence un quiz !
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
