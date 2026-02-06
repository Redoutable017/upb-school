import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const adminAPI = {
  // Matières
  getMatieres: () => api.get('/admin/matieres'),
  createMatiere: (data) => api.post('/admin/matieres', data),
  updateMatiere: (id, data) => api.put(`/admin/matieres/${id}`, data),
  deleteMatiere: (id) => api.delete(`/admin/matieres/${id}`),
  
  // Documents
  uploadCours: (formData) => api.post('/admin/upload-cours', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocuments: (matiereId) => api.get(`/admin/matieres/${matiereId}/documents`),
  deleteDocument: (id) => api.delete(`/admin/documents/${id}`),
  
  // Stats
  getStats: () => api.get('/admin/stats'),
  
  // Email
  sendMassEmail: (data) => api.post('/admin/send-mass-email', data),
};

export default adminAPI;
