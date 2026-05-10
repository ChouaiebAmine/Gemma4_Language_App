import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI, analyticsAPI } from '../services/apiService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userToken, setUserToken] = useState(null);

  // Check if user is already logged in
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const token = await SecureStore.getItemAsync('userToken');
        if (token) {
          setUserToken(token);
          // You can fetch user data here if needed
        }
      } catch (e) {
        console.error('Failed to restore token', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  // Get user stats
  const getStats = useCallback(async (userId) => {
    try {
      const response = await analyticsAPI.getUserStats(userId);
      setStats(response.data || response);
      return response;
    } catch (err) {
      console.error('Error fetching stats:', err);
      return null;
    }
  }, []);

  // Update stats
  const updateStats = useCallback(async (userId) => {
    try {
      const response = await analyticsAPI.getUserStats(userId);
      setStats(response.data || response);
      return response;
    } catch (err) {
      console.error('Error updating stats:', err);
      return null;
    }
  }, []);

  // Login
  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.login(email, password);
      const userData = response.data || response;
      
      if (userData.token) {
        await SecureStore.setItemAsync('userToken', userData.token);
        setUserToken(userData.token);
      }
      
      setUser(userData.user || userData);
      
      // Fetch user stats
      if (userData.user?.id || userData.id) {
        const userId = userData.user?.id || userData.id;
        await getStats(userId);
      }
      
      return userData;
    } catch (err) {
      setError(err.message);
      console.error('Login error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [getStats]);

  // Register
  const register = useCallback(async (email, password, name) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await authAPI.register(email, password, name);
      const userData = response.data || response;
      
      if (userData.token) {
        await SecureStore.setItemAsync('userToken', userData.token);
        setUserToken(userData.token);
      }
      
      setUser(userData.user || userData);
      
      return userData;
    } catch (err) {
      setError(err.message);
      console.error('Registration error:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(async () => {
    try {
      await authAPI.logout();
      await SecureStore.deleteItemAsync('userToken');
      setUserToken(null);
      setUser(null);
      setStats(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  }, []);

  // Check auth status
  const checkAuth = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      return !!token;
    } catch (err) {
      console.error('Auth check error:', err);
      return false;
    }
  }, []);

  const value = {
    user,
    stats,
    isLoading,
    error,
    userToken,
    login,
    register,
    logout,
    checkAuth,
    getStats,
    updateStats,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
