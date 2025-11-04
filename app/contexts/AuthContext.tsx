// contexts/AuthContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

type User = {
  id: string;
  name: string;
  email: string;
  username: string;
};

type AuthContextType = {
  user: User | null;
  userId: string | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('userToken');
      const storedUser = await AsyncStorage.getItem('userData');

      if (storedToken && storedUser) {
        const userData: User = JSON.parse(storedUser);

        setToken(storedToken);
        setUser(userData);
        setUserId(userData.id ?? null);
      }
    } catch (error) {
      console.error('Error loading auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (authToken: string, userData: User) => {
    try {
      if (!authToken || !userData || !userData.id) {
        console.error("Invalid login data:", { authToken, userData });
        return;
      }

      await AsyncStorage.setItem('userToken', authToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('userId', userData.id.toString());

      setToken(authToken);
      setUser(userData);
      setUserId(userData.id.toString());
    } catch (error) {
      console.error('Error saving auth data:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.multiRemove(['userToken', 'userData', 'userId']);
      setToken(null);
      setUser(null);
      setUserId(null);
    } catch (error) {
      console.error('Error clearing auth data:', error);
    }
  };

  const updateUser = async (userData: User) => {
    try {
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error('Error updating user data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    userId,
    token,
    isLoading,
    isAuthenticated: !!user && !!token,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// ✅ DEFAULT EXPORT (fixes Expo route warning)
export default AuthProvider;