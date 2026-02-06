// store/preferencesStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { applyThemeToToasts, getThemeAwareStyles } from '../utils/themeUtils';

export const usePreferencesStore = create(
  persist(
    (set, get) => ({
      preferences: {},
      currentTheme: 'dark', // Par défaut dark
      
      // Initialiser le thème au chargement
      initializeTheme: () => {
        // Récupérer le thème sauvegardé ou utiliser dark par défaut
        const savedTheme = localStorage.getItem('theme') || 'dark';
        const deviceTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        const theme = savedTheme || deviceTheme;
        
        // Appliquer le thème
        document.documentElement.classList.toggle('dark', theme === 'dark');
        applyThemeToToasts(theme);
        
        set({ currentTheme: theme });
        return theme;
      },
      
      setUserPreference: (userId, key, value) => {
        set((state) => {
          const userPrefs = state.preferences[userId] || {};
          const newPrefs = {
            ...state.preferences,
            [userId]: {
              ...userPrefs,
              [key]: value
            }
          };
          
          // Si on change le thème, l'appliquer globalement
          if (key === 'theme') {
            // Appliquer le thème au document
            document.documentElement.classList.toggle('dark', value === 'dark');
            document.documentElement.classList.toggle('light', value === 'light');
            
            // Sauvegarder dans localStorage
            localStorage.setItem('theme', value);
            
            // Mettre à jour le thème courant
            set({ currentTheme: value });
            
            // Appliquer le thème aux toasts
            applyThemeToToasts(value);
          }
          
          return { preferences: newPrefs };
        });
      },
      
      getUserPreferences: (userId) => {
        const prefs = get().preferences[userId] || {};
        
        // S'assurer que les préférences par défaut sont définies
        return {
          theme: prefs.theme || get().currentTheme || 'dark',
          biometrie_active: prefs.biometrie_active || false,
          notifications: prefs.notifications || {
            quiz_results: true,
            new_courses: true,
            announcements: true,
            email_notifications: false
          },
          language: prefs.language || 'fr',
          auto_save: prefs.auto_save !== undefined ? prefs.auto_save : true,
          text_size: prefs.text_size || 'medium',
          reduce_animations: prefs.reduce_animations || false
        };
      },
      
      setMultiplePreferences: (userId, preferences) => {
        set((state) => {
          const userPrefs = state.preferences[userId] || {};
          const newPrefs = {
            ...state.preferences,
            [userId]: {
              ...userPrefs,
              ...preferences
            }
          };
          
          // Vérifier si le thème a changé
          if (preferences.theme && preferences.theme !== userPrefs.theme) {
            // Appliquer le thème
            document.documentElement.classList.toggle('dark', preferences.theme === 'dark');
            document.documentElement.classList.toggle('light', preferences.theme === 'light');
            localStorage.setItem('theme', preferences.theme);
            set({ currentTheme: preferences.theme });
            applyThemeToToasts(preferences.theme);
          }
          
          return { preferences: newPrefs };
        });
      },
      
      clearUserPreferences: (userId) => {
        set((state) => {
          const newPrefs = { ...state.preferences };
          delete newPrefs[userId];
          return { preferences: newPrefs };
        });
      },
      
      toggleBiometrie: (userId) => {
        set((state) => {
          const userPrefs = state.preferences[userId] || {};
          const newBiometrie = !userPrefs.biometrie_active;
          
          const newPrefs = {
            ...state.preferences,
            [userId]: {
              ...userPrefs,
              biometrie_active: newBiometrie
            }
          };
          
          return { preferences: newPrefs };
        });
      },
      
      toggleTheme: (userId) => {
        set((state) => {
          const userPrefs = state.preferences[userId] || {};
          const currentTheme = userPrefs.theme || state.currentTheme || 'dark';
          const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
          
          // Appliquer le nouveau thème
          document.documentElement.classList.toggle('dark', newTheme === 'dark');
          document.documentElement.classList.toggle('light', newTheme === 'light');
          localStorage.setItem('theme', newTheme);
          applyThemeToToasts(newTheme);
          
          const newPrefs = {
            ...state.preferences,
            [userId]: {
              ...userPrefs,
              theme: newTheme
            }
          };
          
          return { 
            preferences: newPrefs,
            currentTheme: newTheme
          };
        });
      },
      
      // Méthode pour récupérer les styles de thème
      getThemeStyles: (theme = null) => {
        const currentTheme = theme || get().currentTheme || 'dark';
        return getThemeAwareStyles(currentTheme);
      },
      
      // Réinitialiser toutes les préférences d'un utilisateur aux valeurs par défaut
      resetToDefaults: (userId) => {
        const defaults = {
          theme: 'dark',
          biometrie_active: false,
          notifications: {
            quiz_results: true,
            new_courses: true,
            announcements: true,
            email_notifications: false
          },
          language: 'fr',
          auto_save: true,
          text_size: 'medium',
          reduce_animations: false
        };
        
        set((state) => {
          const newPrefs = {
            ...state.preferences,
            [userId]: defaults
          };
          
          // Appliquer le thème par défaut
          document.documentElement.classList.toggle('dark', defaults.theme === 'dark');
          document.documentElement.classList.toggle('light', defaults.theme === 'light');
          localStorage.setItem('theme', defaults.theme);
          applyThemeToToasts(defaults.theme);
          
          return { 
            preferences: newPrefs,
            currentTheme: defaults.theme
          };
        });
        
        return defaults;
      }
    }),
    {
      name: 'preferences-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        currentTheme: state.currentTheme
      }),
      onRehydrateStorage: () => {
        // Après réhydratation, initialiser le thème
        return (state) => {
          if (state) {
            // Attendre que le DOM soit prêt
            setTimeout(() => {
              state.initializeTheme();
            }, 0);
          }
        };
      }
    }
  )
);