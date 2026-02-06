import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use((config) => {
  const authStorage = localStorage.getItem('auth-storage');
  if (authStorage) {
    const { state } = JSON.parse(authStorage);
    if (state.token) {
      config.headers.Authorization = `Bearer ${state.token}`;
    }
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;

// ========== AUTH ==========
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  logout: () => Promise.resolve(),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  verifyResetCode: (email, code) => api.post('/auth/verify-reset-code', { email, code }),
  resetPassword: (email, code, newPassword) => api.post('/auth/reset-password', { email, code, newPassword }),
  biometricLogin: (userId) => api.post('/auth/biometric-login', { userId }),
  validateToken: () => api.get('/auth/validate'),
  refreshToken: () => api.post('/auth/refresh-token'),
};

// ========== USER ==========
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  uploadPhoto: (formData) => api.post('/user/profile/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  deleteAccount: () => api.delete('/user/account'),
  updatePreferences: (data) => api.put('/user/preferences', data),
  getStats: () => api.get('/user/stats'),
};

// ========== COURSES ==========
export const coursesAPI = {
  getAll: (filiere) => api.get('/courses', { params: { filiere } }),
  getById: (id) => api.get(`/courses/${id}`),
  getByMatiere: (matiere) => api.get(`/courses/matiere/${matiere}`),
  getMatieresByFiliere: (filiere, niveau) => api.get(`/courses/filieres/${filiere}/matieres${niveau ? `?niveau=${niveau}` : ''}`),
};

// ========== QUIZ ==========
export const quizAPI = {
  submit: (data) => api.post('/quiz/submit', data),
  canRetry: (matiere) => api.get(`/quiz/can-retry/${matiere}`),
  getHistory: () => api.get('/quiz/history'),
  getLeaderboard: () => api.get('/quiz/leaderboard'),
};

// ========== AI ==========
export const aiAPI = {
  chat: (message, matiere) => api.post('/ai/chat', { message, matiere }),
  generateQuiz: (matiere, contenu_cours, nombre_questions) => 
    api.post('/ai/generate-quiz', { matiere, contenu_cours, nombre_questions }),
  explain: (matiere, sujet, question) => api.post('/ai/explain', { matiere, sujet, question }),
  getConversations: () => api.get('/ai/conversations'),
};
