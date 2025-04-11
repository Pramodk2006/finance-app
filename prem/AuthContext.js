import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, register, logout, getUserProfile } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('userToken'));

  useEffect(() => {
    // Check if user is already logged in
    const checkLoggedIn = async () => {
      try {
        const storedToken = localStorage.getItem('userToken');
        const userData = localStorage.getItem('userData');
        
        if (storedToken && userData) {
          try {
            // Verify token and get fresh user data
            const freshUserData = await getUserProfile();
            setUser(freshUserData);
            setToken(storedToken);
          } catch (error) {
            console.error('Failed to verify token:', error);
            // Clear invalid data
            localStorage.removeItem('userToken');
            localStorage.removeItem('userData');
            setUser(null);
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }
      } catch (error) {
        console.error('Authentication error:', error);
        setUser(null);
        setToken(null);
      } finally {
        setLoading(false);
      }
    };

    checkLoggedIn();
  }, []);

  const loginUser = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await login(email, password);
      setUser(userData);
      setToken(userData.token);
      return userData;
    } catch (error) {
      setError(error.toString());
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const registerUser = async (name, email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await register(name, email, password);
      setUser(userData);
      setToken(userData.token);
      return userData;
    } catch (error) {
      setError(error.toString());
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logoutUser = () => {
    logout();
    setUser(null);
    setToken(null);
  };

  const refreshUserProfile = async () => {
    try {
      const userData = await getUserProfile();
      setUser(userData);
      return userData;
    } catch (error) {
      console.error('Failed to refresh user profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    login: loginUser,
    register: registerUser,
    logout: logoutUser,
    refreshUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
