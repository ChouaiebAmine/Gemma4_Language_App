import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Error retrieving token:', err);
  }
  return config;
});

// Handle responses
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    console.error('API Error:', message);
    return Promise.reject(error);
  }
);


// Inside apiService.js[cite: 6]
export const languagesAPI = {
  // Matches @router.get("/all")
  getAll: () => api.get('/languages/all'),

  enroll: (userId, data) => api.post(`/languages/enroll/${userId}`, data),
  
  create: (data) => api.post('/languages', data),
  
  getOne: (languageId) => api.get(`/languages/${languageId}`),
  update: (languageId, data) => api.put(`/languages/${languageId}`, data),
  delete: (languageId) => api.delete(`/languages/${languageId}`),
};

//  Topics API 
export const topicsAPI = {
  getAll: (params) => api.get('/topics', { params }),
  getByLanguage: (languageId, userLang, targetLang) => 
    api.get(`/topics`, { 
      params: { 
        language_id: languageId,
        user_lang: userLang,
        target_lang: targetLang
      } 
    }),
  getOne: (topicId) => api.get(`/topics/${topicId}`),
  create: (data) => api.post('/topics', data),
  update: (topicId, data) => api.put(`/topics/${topicId}`, data),
  delete: (topicId) => api.delete(`/topics/${topicId}`),
};

//  Activities API 
export const activitiesAPI = {
  getAll: (params) => api.get('/activities', { params }),
  getByTopic: (topicId) => api.get('/activities', { params: { topic_id: topicId } }),
  getOne: (activityId) => api.get(`/activities/${activityId}`),
  create: (data) => api.post('/activities', data),
  update: (activityId, data) => api.put(`/activities/${activityId}`, data),
  delete: (activityId) => api.delete(`/activities/${activityId}`),
  generateActivities: (topicId) => api.post(`/activities/generate/${encodeURIComponent(topicId)}`),
};

//  Evaluate API 
export const evaluateAPI = {
  evaluateActivity: (activityId, answer) =>
    api.post(`/evaluate/${activityId}`, { answer }),
  getEvaluation: (evaluationId) => api.get(`/evaluate/${evaluationId}`),
  getUserEvaluations: (userId) => api.get(`/evaluate/user/${userId}`),
};

//  Achievements API 
export const achievementsAPI = {
  getAll: () => api.get('/achievements'),
  getUserAchievements: (userId) => api.get(`/achievements/user/${userId}`),
  unlockAchievement: (achievementId, userId) =>
    api.post(`/achievements/${achievementId}/unlock`, { userId }),
};

//  Analytics API 
export const analyticsAPI = {
  getUserStats: (userId) => api.get(`/analytics/user/${userId}`),
  getProgress: (userId) => api.get(`/analytics/progress/${userId}`),
  getStreak: (userId) => api.get(`/analytics/streak/${userId}`),
  getLearningPath: (userId) => api.get(`/analytics/learning-path/${userId}`),
};

//  Auth API (if needed)
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
};

//  Export API client 
export default api;