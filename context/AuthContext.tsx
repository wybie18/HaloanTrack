import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../services/api';

interface AuthContextType {
  isLoading: boolean;
  userToken: string | null;
  userInfo: any | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, password_confirmation: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  setUserToken: (token: string) => Promise<void>;
  setUserInfo: (user: any) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setTokenState] = useState<string | null>(null);
  const [userInfo, setUserInfoState] = useState<any | null>(null);

  const isLoggedIn = async () => {
    try {
      setIsLoading(true);
      let token = await AsyncStorage.getItem('userToken');
      let userInfoStr = await AsyncStorage.getItem('userInfo');
      
      if (token) {
        setTokenState(token);
        if (userInfoStr) {
          setUserInfoState(JSON.parse(userInfoStr));
        }
      }
    } catch (e) {
      console.log(`isLoggedIn error ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    isLoggedIn();
  }, []);

  const setUserToken = async (token: string) => {
    setTokenState(token);
    await AsyncStorage.setItem('userToken', token);
  };

  const setUserInfo = async (user: any) => {
    setUserInfoState(user);
    await AsyncStorage.setItem('userInfo', JSON.stringify(user));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/login', {
        email,
        password,
      });

      const { token, user } = response.data;
      
      await setUserToken(token);
      await setUserInfo(user);
      
      router.replace('/(tabs)');
    } catch (error: any) {
      console.log('Login error', error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string, password_confirmation: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/register', {
        name,
        email,
        password,
        password_confirmation,
      });

      const { token, user } = response.data;

      await setUserToken(token);
      await setUserInfo(user);

      router.replace('/(tabs)');
    } catch (error: any) {
      console.log('Register error', error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await api.post('/logout');
    } catch (e) {
      console.log('Logout error', e);
    } finally {
      setTokenState(null);
      setUserInfoState(null);
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userInfo');
      setIsLoading(false);
      router.replace('/login');
    }
  };

  const updateProfile = async (name: string) => {
    setIsLoading(true);
    try {
      const response = await api.put('/profile', { name });
      const updatedUser = response.data.user;
      
      setUserInfoState(updatedUser);
      await AsyncStorage.setItem('userInfo', JSON.stringify(updatedUser));
    } catch (error: any) {
      console.log('Update profile error', error.response?.data || error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isLoading, 
      userToken, 
      userInfo, 
      login, 
      register, 
      logout, 
      updateProfile,
      setUserToken,
      setUserInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};