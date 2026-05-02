import React, { createContext, useContext, useState, useCallback } from 'react';
import { languagesAPI, topicsAPI, activitiesAPI } from '../services/apiService';
import { useUser } from './UserContext';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { user } = useUser();
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState(null);
  const [topics, setTopics] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get all languages
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

  // Select a language and fetch its topics
  const selectLanguage = useCallback(async (languageData) => {
    const languageId = typeof languageData === 'object' ? (languageData._id || languageData.id) : languageData;

    if (!languageId) {
      console.warn("Attempted to select language with undefined ID");
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const langResponse = await languagesAPI.getOne(languageId);
      setSelectedLanguage(langResponse.data || langResponse);
      
      const userMotherLanguage = user?.native_language || 'english';
      const targetLanguageName = (langResponse.data || langResponse).name || 'spanish';
      
      const topicsResponse = await topicsAPI.getByLanguage(
        languageId,
        userMotherLanguage,
        targetLanguageName
      );
      setTopics(topicsResponse.data || topicsResponse);
      
      return langResponse;
    } catch (err) {
      setError(err.message);
      console.error('Error selecting language:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Get topics for selected language
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

  // Generate AI topics for selected language
  const generateAiTopics = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (!selectedLanguage) {
        setError("No language selected");
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
      setError("Failed to generate AI topics");
      console.error('Error generating topics:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedLanguage]);

  // Get activities for a topic
  const fetchActivities = useCallback(async (topicData) => {
    const topicId = typeof topicData === 'object' ? (topicData.id || topicData._id) : topicData;
    
    try {
      setIsLoading(true);
      setError(null);
      
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

  // Generate activities using AI
  const generateActivities = useCallback(async (topicData) => {
    const topicId = typeof topicData === 'object' ? (topicData.id || topicData._id) : topicData;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (!selectedLanguage) {
        setError("No language selected");
        return null;
      }
      
      const body = {
        user_id: user?.id || "user",
        topic: selectedLanguage.name || "General",
        user_language: user?.native_language || "english",
        target_language: selectedLanguage.name || "spanish",
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

  const value = {
    languages,
    selectedLanguage,
    topics,
    activities,
    isLoading,
    error,
    fetchLanguages,
    selectLanguage,
    fetchTopics,
    fetchActivities,
    generateActivities,
    generateAiTopics,
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
