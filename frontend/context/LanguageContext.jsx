import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { languagesAPI, topicsAPI, activitiesAPI, analyticsAPI } from '../services/apiService';
import { useUser } from './UserContext';

const LanguageContext = createContext();

const ENROLLED_KEY = 'enrolled_languages';

export const LanguageProvider = ({ children }) => {
  const { user } = useUser();
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [enrolledLanguages, setEnrolledLanguages] = useState([]);
  const [languageProgress, setLanguageProgress] = useState({});
  const [topicProgress, setTopicProgress] = useState({}); // { topic_id: { easy_completed, easy_types_done, medium_completed, hard_completed } }
  const [easyProgressPct, setEasyProgressPct] = useState(0); // 0-100 % of easy topics completed
  const [topics, setTopics] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load persisted enrolled languages on mount
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(ENROLLED_KEY);
        if (stored) setEnrolledLanguages(JSON.parse(stored));
      } catch (e) {
        console.warn('Failed to load enrolled languages', e);
      }
    })();
  }, []);

  // Persist whenever enrolledLanguages changes
  useEffect(() => {
    AsyncStorage.setItem(ENROLLED_KEY, JSON.stringify(enrolledLanguages)).catch(() => {});
  }, [enrolledLanguages]);

  // ── helpers ────────────────────────────────────────────────────────────────

  /**
   * Compute per-language progress from the analytics learning-path endpoint.
   * difficulty_levels: { listening: 0|1|2, writing: 0|1|2, reading: 0|1|2 }
   * Each completed level adds 1/9 ≈ 11% (3 types × 3 difficulties = 9 milestones).
   * We add 1 per completed level (difficulty reached means that level is done).
   */
  const computeProgress = (difficultyLevels = {}) => {
    const types = ['listening', 'writing', 'reading'];
    let milestonesDone = 0;
    const nextLevels = [];

    for (const type of types) {
      const maxDiff = difficultyLevels[type]; // highest difficulty completed for this type
      if (maxDiff === undefined) {
        // not started — next level is beginner (0)
        nextLevels.push({ type, difficulty: 0, label: 'Beginner' });
      } else {
        milestonesDone += maxDiff + 1; // completed 0..maxDiff
        if (maxDiff < 2) {
          const labels = ['Intermediate', 'Advanced'];
          nextLevels.push({ type, difficulty: maxDiff + 1, label: labels[maxDiff] });
        }
      }
    }

    const pct = Math.round((milestonesDone / 9) * 100);
    return { pct, nextLevels };
  };

  const fetchLanguageProgress = useCallback(async (languageId) => {
    const userId = user?.id || 'user';
    try {
      const data = await analyticsAPI.getLearningPath(userId, languageId);
      const difficultyLevels = data?.difficulty_levels || {};
      const result = computeProgress(difficultyLevels);
      setLanguageProgress(prev => ({ ...prev, [languageId]: result }));
      return result;
    } catch (e) {
      console.warn('Progress fetch failed', e);
      return { pct: 0, nextLevels: [] };
    }
  }, [user]);

  const fetchTopicProgress = useCallback(async (languageId) => {
    const userId = user?.id || 'user';
    try {
      const data = await analyticsAPI.getTopicProgress(userId, languageId || undefined);
      const completions = data?.topic_completions || {};
      setTopicProgress(completions);
      setEasyProgressPct(data?.easy_progress_pct || 0);
      return data;
    } catch (e) {
      console.warn('Topic progress fetch failed', e);
      return { topic_completions: {}, easy_progress_pct: 0 };
    }
  }, [user]);

  // Refresh progress for all enrolled languages
  const refreshAllProgress = useCallback(async () => {
    for (const lang of enrolledLanguages) {
      const langId = lang._id || lang.id;
      await fetchLanguageProgress(langId);
      await fetchTopicProgress(langId);
    }
  }, [enrolledLanguages, fetchLanguageProgress, fetchTopicProgress]);

  // ── public API ─────────────────────────────────────────────────────────────

  const fetchLanguages = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await languagesAPI.getAll();
      setLanguages(response.data || response);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching languages:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const selectLanguage = useCallback(async (languageData) => {
    const languageId = typeof languageData === 'object'
      ? (languageData._id || languageData.id)
      : languageData;

    if (!languageId) {
      console.warn('Attempted to select language with undefined ID');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const langResponse = await languagesAPI.getOne(languageId);
      const lang = langResponse.data || langResponse;
      setSelectedLanguage(lang);

      // Add to enrolled list if not already there
      setEnrolledLanguages(prev => {
        const alreadyIn = prev.some(l => (l._id || l.id) === languageId);
        return alreadyIn ? prev : [...prev, lang];
      });

      const userMotherLanguage = user?.native_language || 'english';
      const targetLanguageName = lang.name || 'spanish';

      const topicsResponse = await topicsAPI.getByLanguage(
        languageId,
        userMotherLanguage,
        targetLanguageName
      );
      setTopics(topicsResponse.data || topicsResponse);

      // Fetch progress for this language
      await fetchLanguageProgress(languageId);
      await fetchTopicProgress(languageId);

      return langResponse;
    } catch (err) {
      setError(err.message);
      console.error('Error selecting language:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchLanguageProgress]);

  const fetchTopics = useCallback(async (languageId) => {
    try {
      setIsLoading(true);
      setError(null);

      const userMotherLanguage = user?.native_language || 'english';
      const targetLanguageName = selectedLanguage?.name || 'spanish';

      const response = await topicsAPI.getByLanguage(
        languageId,
        userMotherLanguage,
        targetLanguageName
      );
      setTopics(response.data || response);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching topics:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedLanguage]);

  const generateAiTopics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!selectedLanguage) {
        setError('No language selected');
        return null;
      }

      const languageId = selectedLanguage._id || selectedLanguage.id;
      const userMotherLanguage = user?.native_language || 'english';
      const targetLanguageName = selectedLanguage.name || 'spanish';

      const response = await topicsAPI.getByLanguage(
        languageId,
        userMotherLanguage,
        targetLanguageName
      );

      setTopics(response.data || response);
      return response;
    } catch (err) {
      setError('Failed to generate AI topics');
      console.error('Error generating topics:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedLanguage]);

  const fetchActivities = useCallback(async (topicData) => {
    const topicId = typeof topicData === 'object' ? (topicData.id || topicData._id) : topicData;
    try {
      setIsLoading(true);
      setError(null);
      // Pass topic_id as query param so backend filters correctly
      const response = await activitiesAPI.getByTopic(topicId);
      setActivities(response.data || response);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error fetching activities:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const generateActivities = useCallback(async (topicData) => {
    // topicData can be a full topic object { id, name, target_name } or just an id string
    const topicId = typeof topicData === 'object' ? (topicData.id || topicData._id) : topicData;
    // Use the topic's own name for the AI prompt — not the language name
    const topicName = typeof topicData === 'object'
      ? (topicData.target_name || topicData.name || 'General')
      : 'General';

    try {
      setIsLoading(true);
      setError(null);

      if (!selectedLanguage) {
        setError('No language selected');
        return null;
      }

      const body = {
        user_id: user?.id || 'user',
        topic: topicName,           // actual topic name for AI (e.g. "Greetings", "Food")
        topic_id: topicId,          // DB id so activities can be fetched later by topic
        user_language: user?.native_language || 'english',
        target_language: selectedLanguage.name || 'spanish',
      };

      const response = await activitiesAPI.generateActivities(topicId, body);
      const generatedActivities = response.activities || response.data?.activities || [];
      setActivities(generatedActivities);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error generating activities:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedLanguage]);

  const generateActivitiesForDifficulty = useCallback(async (topicData, difficulty) => {
    const topicId = typeof topicData === 'object' ? (topicData.id || topicData._id) : topicData;
    const topicName = typeof topicData === 'object'
      ? (topicData.target_name || topicData.name || 'General')
      : 'General';

    try {
      setIsLoading(true);
      setError(null);

      if (!selectedLanguage) {
        setError('No language selected');
        return null;
      }

      const body = {
        user_id: user?.id || 'user',
        topic: topicName,
        topic_id: topicId,
        user_language: user?.native_language || 'english',
        target_language: selectedLanguage.name || 'spanish',
      };

      const response = await activitiesAPI.generateActivitiesForDifficulty(topicId, difficulty, body);
      // After generating, re-fetch all activities for the topic
      const allActivities = await activitiesAPI.getByTopic(topicId);
      setActivities(allActivities.data || allActivities);
      return response;
    } catch (err) {
      setError(err.message);
      console.error('Error generating activities for difficulty:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedLanguage]);

  const value = {
    languages,
    selectedLanguage,
    enrolledLanguages,
    languageProgress,
    topicProgress,
    easyProgressPct,
    topics,
    activities,
    isLoading,
    error,
    fetchLanguages,
    selectLanguage,
    fetchTopics,
    fetchActivities,
    generateActivities,
    generateActivitiesForDifficulty,
    generateAiTopics,
    fetchLanguageProgress,
    fetchTopicProgress,
    refreshAllProgress,
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};