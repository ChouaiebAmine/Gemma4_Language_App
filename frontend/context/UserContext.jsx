import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI, analyticsAPI } from '../services/apiService';

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  // Get user data
  const getUser = async (userId) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await analyticsAPI.getUserStats(userId);
      setUser({ 
      id: userId, 
      name: response.name, 
      native_language: response.native_language || 'english', 
      ...response 
    });
    return response;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user stats
  const updateStats = async (userId) => {
    try {
      const response = await analyticsAPI.getUserStats(userId);
      setStats(response);
      return response;
    } catch (err) {
      setError(err.message);
      return null;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.login(email, password);
      await SecureStore.setItemAsync('userToken', response.token);
      setUser(response.user);
      return response.user;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Register user
  const register = async (email, password, name) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await authAPI.register(email, password, name);
      await SecureStore.setItemAsync('userToken', response.token);
      setUser(response.user);
      return response.user;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout user
  const logout = async () => {
    try {
      setIsLoading(true);
      await authAPI.logout();
      await SecureStore.deleteItemAsync('userToken');
      setUser(null);
      setStats(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Check if user is authenticated
  const checkAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      return !!token;
    } catch (err) {
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    error,
    stats,
    getUser,
    updateStats,
    login,
    register,
    logout,
    checkAuth,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
