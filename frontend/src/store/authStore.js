import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';
import { applyThemeToToasts } from '../utils/themeUtils';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,
      
      // Login avec email/password
      login: async (identifier, password) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.login({ identifier, password });
          const { token, user } = response.data;
          
          // Appliquer le thème de l'utilisateur
          const userTheme = user.theme_preference || 'dark';
          document.documentElement.classList.toggle('dark', userTheme === 'dark');
          document.documentElement.classList.toggle('light', userTheme === 'light');
          localStorage.setItem('theme', userTheme);
          
          // Appliquer le thème aux toasts
          applyThemeToToasts(userTheme);
          
          // Sauvegarder les infos de session
          localStorage.setItem('last_user_id', user.id);
          localStorage.setItem('last_user_name', user.pseudo || user.prenom);
          
          set({ 
            user, 
            token, 
            isLoading: false,
            error: null 
          });
          
          return { success: true, user, token };
          
        } catch (error) {
          console.error('Erreur login:', error);
          const errorMsg = error.response?.data?.error || error.message || 'Erreur de connexion';
          
          set({ 
            isLoading: false, 
            error: errorMsg 
          });
          
          return { 
            success: false, 
            error: errorMsg 
          };
        }
      },
      
      // Login biométrique
      biometricLogin: async (userId) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.biometricLogin(userId);
          const { token, user } = response.data;
          
          // Appliquer le thème de l'utilisateur
          const userTheme = user.theme_preference || 'dark';
          document.documentElement.classList.toggle('dark', userTheme === 'dark');
          document.documentElement.classList.toggle('light', userTheme === 'light');
          localStorage.setItem('theme', userTheme);
          
          // Appliquer le thème aux toasts
          applyThemeToToasts(userTheme);
          
          // Sauvegarder les infos de session
          localStorage.setItem('last_user_id', user.id);
          localStorage.setItem('last_user_name', user.pseudo || user.prenom);
          
          set({ 
            user, 
            token, 
            isLoading: false,
            error: null 
          });
          
          return { success: true, user, token };
          
        } catch (error) {
          console.error('Erreur login biométrique:', error);
          const errorMsg = error.response?.data?.error || error.message || 'Erreur de connexion biométrique';
          
          set({ 
            isLoading: false, 
            error: errorMsg 
          });
          
          return { 
            success: false, 
            error: errorMsg 
          };
        }
      },
      
      // Register
      register: async (userData) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.register(userData);
          const { token, user } = response.data;
          
          // Appliquer le thème par défaut (dark)
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          localStorage.setItem('theme', 'dark');
          applyThemeToToasts('dark');
          
          // Sauvegarder les infos de session
          localStorage.setItem('last_user_id', user.id);
          localStorage.setItem('last_user_name', user.pseudo || user.prenom);
          
          set({ 
            user, 
            token, 
            isLoading: false,
            error: null 
          });
          
          return { success: true, user, token };
          
        } catch (error) {
          console.error('Erreur register:', error);
          const errorMsg = error.response?.data?.error || error.message || 'Erreur lors de l\'inscription';
          
          set({ 
            isLoading: false, 
            error: errorMsg 
          });
          
          return { 
            success: false, 
            error: errorMsg 
          };
        }
      },
      
      // Logout
      logout: async () => {
        try {
          // Appeler l'API logout si disponible
          await authAPI.logout().catch(() => {
            // Ignorer les erreurs (le token pourrait être expiré)
          });
        } finally {
          // Forcer le thème dark à la déconnexion (pour la page login)
          document.documentElement.classList.add('dark');
          document.documentElement.classList.remove('light');
          localStorage.setItem('theme', 'dark');
          
          // Nettoyer le localStorage
          const userId = get().user?.id;
          if (userId) {
            // Garder le last_user_id et les credentials biométriques pour la reconnexion
            localStorage.setItem('last_user_id', userId);
            // NE PAS supprimer les credentials biométriques pour permettre la reconnexion
          }
          
          // Supprimer l'avatar
          localStorage.removeItem('user_avatar');
          
          // Réinitialiser le store
          set({ 
            user: null, 
            token: null,
            isLoading: false,
            error: null 
          });
        }
      },
      
      // Mettre à jour les infos utilisateur
      updateUser: (userData) => {
        set((state) => {
          const updatedUser = { ...state.user, ...userData };
          
          // Si le thème a changé, l'appliquer
          if (userData.theme_preference && userData.theme_preference !== state.user?.theme_preference) {
            document.documentElement.classList.toggle('dark', userData.theme_preference === 'dark');
            document.documentElement.classList.toggle('light', userData.theme_preference === 'light');
            localStorage.setItem('theme', userData.theme_preference);
            
            // Notifier le changement de thème
            const event = new CustomEvent('theme-changed', { detail: userData.theme_preference });
            window.dispatchEvent(event);
          }
          
          // Sauvegarder la photo de profil
          if (userData.photo_profil) {
            localStorage.setItem('user_avatar', userData.photo_profil);
          }
          
          return { user: updatedUser };
        });
      },
      
      // Mettre à jour le token
      setToken: (token) => set({ token }),
      
      // Mettre à jour l'utilisateur directement
      setUser: (user) => {
        set({ user });
        
        // Appliquer le thème de l'utilisateur
        if (user?.theme_preference) {
          document.documentElement.classList.toggle('dark', user.theme_preference === 'dark');
          document.documentElement.classList.toggle('light', user.theme_preference === 'light');
          localStorage.setItem('theme', user.theme_preference);
          
          // Notifier le changement de thème
          const event = new CustomEvent('theme-changed', { detail: user.theme_preference });
          window.dispatchEvent(event);
        }
        
        // Sauvegarder la photo de profil
        if (user?.photo_profil) {
          localStorage.setItem('user_avatar', user.photo_profil);
        }
      },
      
      // Vérifier si l'utilisateur est connecté
      isAuthenticated: () => {
        const { token } = get();
        return !!token;
      },
      
      // Vérifier si c'est l'admin
      isAdmin: () => {
        const { user } = get();
        return user?.pseudo?.toLowerCase() === 'admin' || user?.email === 'upb.school1@gmail.com';
      },
      
      // Rafraîchir le token
      refreshToken: async () => {
        try {
          const response = await authAPI.refreshToken();
          const { token } = response.data;
          set({ token });
          return token;
        } catch (error) {
          console.error('Erreur rafraîchissement token:', error);
          // En cas d'erreur, déconnecter l'utilisateur
          get().logout();
          throw error;
        }
      },
      
      // Valider la session
      validateSession: async () => {
        const { token } = get();
        
        if (!token) {
          return false;
        }
        
        try {
          await authAPI.validateToken();
          return true;
        } catch (error) {
          console.error('Session invalide:', error);
          
          // Si token expiré, essayer de le rafraîchir
          if (error.response?.status === 401) {
            try {
              await get().refreshToken();
              return true;
            } catch (refreshError) {
              console.error('Impossible de rafraîchir le token:', refreshError);
              get().logout();
              return false;
            }
          }
          
          get().logout();
          return false;
        }
      },
      
      // Réinitialiser l'état d'erreur
      clearError: () => set({ error: null }),
      
      // Réinitialiser l'état de chargement
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        // Ne pas persister isLoading et error
      }),
      onRehydrateStorage: () => {
        // Après réhydratation du storage
        return (state) => {
          if (state) {
            // Appliquer le thème de l'utilisateur après réhydratation
            const userTheme = state.user?.theme_preference || 'dark';
            document.documentElement.classList.toggle('dark', userTheme === 'dark');
            document.documentElement.classList.toggle('light', userTheme === 'light');
            localStorage.setItem('theme', userTheme);
            
            // Notifier le changement de thème
            setTimeout(() => {
              const event = new CustomEvent('theme-changed', { detail: userTheme });
              window.dispatchEvent(event);
            }, 100);
          }
        };
      }
    }
  )
);