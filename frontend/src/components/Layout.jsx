import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, BookOpen, Trophy, User, Settings, LogOut, Award } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/courses', icon: BookOpen, label: 'Cours' },
    { path: '/quiz', icon: Trophy, label: 'Quiz' },
    { path: '/leaderboard', icon: Award, label: 'Classement' },
    { path: '/profile', icon: User, label: 'Profil' },
    { path: '/settings', icon: Settings, label: 'Paramètres' },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-dark/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-accent to-purple rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg">
                UPB
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-accent to-purple bg-clip-text text-transparent">
                  UPB School
                </h1>
                <p className="text-xs text-gray-400">Excellence Éducative</p>
              </div>
            </Link>

            {/* User Info */}
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="font-semibold">
                  {user?.pseudo === 'ADMIN' ? 'ADMIN' : `${user?.prenom} ${user?.nom}`}
                </p>
                <p className="text-sm text-gray-400">Niveau {user?.niveau} • {user?.points_exp} XP</p>
              </div>
              <button
                onClick={handleLogout}
                className="btn btn-secondary"
              >
                <LogOut size={20} />
                <span className="hidden sm:inline">Déconnexion</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-dark/30 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto py-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-accent text-white shadow-lg'
                      : 'text-gray-300 hover:bg-white/10'
                  }`}
                >
                  <Icon size={20} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-dark/50 border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-gray-400">
          <p>© 2026 UPB School - Excellence Éducative & Innovation Pédagogique</p>
        </div>
      </footer>
    </div>
  );
}
