import React, { createContext, useContext, useState, useCallback } from 'react';
import { languagesAPI, topicsAPI, activitiesAPI } from '../services/apiService';
import { useUser } from './UserContext';
const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const {user} = useUser();
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
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Select a language and fetch its topics
  const selectLanguage = useCallback(async (languageId) => {
  if (!languageId) {
    console.warn("Attempted to select language with undefined ID");
    return;
  }
  
  try {
    setIsLoading(true);
    // This now prevents calling /languages/undefined
    const langResponse = await languagesAPI.getOne(languageId);
      setSelectedLanguage(langResponse.data || langResponse);
      
      // Fetch topics for selected language
      const topicsResponse = await topicsAPI.getByLanguage(languageId);
      setTopics(topicsResponse.data || topicsResponse);
      
      return langResponse;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get topics for selected language
  const fetchTopics = useCallback(async (languageId) => {
    try {
      setIsLoading(true);
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
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedLanguage]);
// generate ai topics for selected language
const generateAiTopics = useCallback(async () => {
  try {
    setIsLoading(true);
    // This calls the agent.py logic via your router[cite: 9]
    const response = await topicsAPI.getByLanguage(selectedLanguage?._id || selectedLanguage?.id); 
    
    setTopics(response.data || response);
  } catch (err) {
    setError("Failed to generate AI topics");
  } finally {
    setIsLoading(false);
  }
}, []);
  // Get activities for a topic
  const fetchActivities = useCallback(async (topicId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await activitiesAPI.getByTopic(topicId);
      setActivities(response.data || response);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Generate activities using AI
  const generateActivities = useCallback(async (topicId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await activitiesAPI.generateActivities(topicId);
      setActivities(response.data || response);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

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
