import { useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { usePreferencesStore } from '../store/preferencesStore';

export default function ThemeProvider({ children }) {
  const { user } = useAuthStore();
  const { getUserPreferences } = usePreferencesStore();

  useEffect(() => {
    if (user) {
      const prefs = getUserPreferences(user.id);
      const theme = prefs.theme || 'dark';
      
      if (theme === 'light') {
        document.documentElement.classList.add('light');
      } else {
        document.documentElement.classList.remove('light');
      }
    } else {
      // Pas d'utilisateur connecté → Thème sombre par défaut
      document.documentElement.classList.remove('light');
    }
  }, [user, getUserPreferences]);

  return children;
}
