import axios from 'axios';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { storage } from '../utils/storageUtil';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// SecureStore doesn't work on web — fall back to localStorage
const getToken = async () => {
  try {
    if (Platform.OS === 'web') {
      return localStorage.getItem('userToken');
    }
    return await storage.getItemAsync('userToken');
  } catch {
    return null;
  }
};

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
    const token = await getToken();
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


// ─── Languages API ───────────────────────────────────────────────────────────
export const languagesAPI = {
  getAll: () => api.get('/languages/all'),
  getOne: (languageId) => api.get(`/languages/${languageId}`),
  create: (data) => api.post('/languages', data),
  update: (languageId, data) => api.put(`/languages/${languageId}`, data),
  delete: (languageId) => api.delete(`/languages/${languageId}`),
  enroll: (languageId, userId, data) => api.post(`/languages/${languageId}/enroll/${userId}`, data),
  getEnrolled: (userId) => api.get(`/languages/enrolled/${userId}`),
};

// ─── Topics API ──────────────────────────────────────────────────────────────
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

// ─── Activities API ──────────────────────────────────────────────────────────
export const activitiesAPI = {
  getAll: (params) => api.get('/activities', { params }),
  getByTopic: (topicId) => api.get('/activities', { params: { topic_id: topicId } }),
  getOne: (activityId) => api.get(`/activities/${activityId}`),
  create: (data) => api.post('/activities', data),
  update: (activityId, data) => api.put(`/activities/${activityId}`, data),
  delete: (activityId) => api.delete(`/activities/${activityId}`),
  generateActivities: (topicId, body) => 
    api.post(`/activities/generate/${encodeURIComponent(topicId)}`, body || {}),
  generateActivitiesForDifficulty: (topicId, difficulty, body) =>
    api.post(`/activities/generate/${encodeURIComponent(topicId)}/difficulty/${difficulty}`, body || {}),
  generateListening: (difficulty, body) => 
    api.post(`/activities/listening?difficulty=${difficulty}`, body),
  generateWriting: (difficulty, body) => 
    api.post(`/activities/writing?difficulty=${difficulty}`, body),
  generateReading: (difficulty, body) => 
    api.post(`/activities/reading?difficulty=${difficulty}`, body),
};

// ─── Evaluate API ────────────────────────────────────────────────────────────
export const evaluateAPI = {
  evaluateListeningEasy: (activityId, selectedWords, userId) =>
    api.post(`/evaluate/listening/easy`, { 
      activity_id: activityId, 
      selected_words: selectedWords,
      user_id: userId 
    }),
  evaluateListeningMedium: (activityId, transcription, userId) =>
    api.post(`/evaluate/listening/medium`, { 
      activity_id: activityId, 
      transcription,
      user_id: userId 
    }),
  evaluateListeningHard: (activityId, answers, userId) =>
    api.post(`/evaluate/listening/hard`, { 
      activity_id: activityId, 
      answers,
      user_id: userId 
    }),
  evaluateWritingEasy: (activityId, answers, userId) =>
    api.post(`/evaluate/writing/easy`, { 
      activity_id: activityId, 
      answers,
      user_id: userId 
    }),
  evaluateWritingMedium: (activityId, essay, userId) =>
    api.post(`/evaluate/writing/medium`, { 
      activity_id: activityId, 
      essay,
      user_id: userId 
    }),
  evaluateWritingHard: (activityId, essay, userId) =>
    api.post(`/evaluate/writing/hard`, { 
      activity_id: activityId, 
      essay,
      user_id: userId 
    }),
  evaluateReadingEasy: (activityId, answers, userId) =>
    api.post(`/evaluate/reading/easy`, { 
      activity_id: activityId, 
      answers,
      user_id: userId 
    }),
  evaluateReadingMedium: (activityId, answers, userId) =>
    api.post(`/evaluate/reading/medium`, { 
      activity_id: activityId, 
      answers,
      user_id: userId 
    }),
  evaluateReadingHard: (activityId, answers, userId) =>
    api.post(`/evaluate/reading/hard`, { 
      activity_id: activityId, 
      answers,
      user_id: userId 
    }),
  evaluateActivity: (activityId, answer) =>
    api.post(`/evaluate/${activityId}`, { answer }),
  getEvaluation: (evaluationId) => api.get(`/evaluate/${evaluationId}`),
  getUserEvaluations: (userId) => api.get(`/evaluate/user/${userId}`),
};

// ─── Achievements API ────────────────────────────────────────────────────────
export const achievementsAPI = {
  getAll: () => api.get('/achievements'),
  getUserAchievements: (userId) => api.get(`/achievements/user/${userId}`),
  unlockAchievement: (achievementId, userId) =>
    api.post(`/achievements/${achievementId}/unlock`, { userId }),
};

// ─── Analytics API 
export const analyticsAPI = {
  getUserStats: (userId) => api.get(`/analytics/user/${userId}`),
  getProgress: (userId) => api.get(`/analytics/progress/${userId}`),
  getStreak: (userId) => api.get(`/analytics/streak/${userId}`),
  getLearningPath: (userId, languageId) => api.get(`/analytics/learning-path/${userId}`, { params: languageId ? { language_id: languageId } : {} }),
  getPerformance: (userId) => api.get(`/analytics/${userId}`),
  getTopicProgress: (userId, languageId) => api.get(`/analytics/topic-progress/${userId}`, { params: languageId ? { language_id: languageId } : {} }),
};

// ─── Auth API ────────────────────────────────────────────────────────────────
export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) =>
    api.post('/auth/register', { email, password, name }),
  logout: () => api.post('/auth/logout'),
  refreshToken: () => api.post('/auth/refresh'),
};

// ─── Recommendation API ──────────────────────────────────────────────────────
export const recommendationAPI = {
  getNext: (userId, userLang, targetLang) =>
    api.post('/recommendation/next', {
      user_id: userId,
      user_language: userLang,
      target_language: targetLang
    }),
};

// ─── Export API client ───────────────────────────────────────────────────────
export default api;