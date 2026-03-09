import { secureStorageHelper } from '@/utils/secureStorage';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store'; // <-- ADDED: For secure token storage
import { createContext, useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';

// Helper to handle SecureStore on web (fallback to AsyncStorage)
const secureStorageHelperOld = {
  async getItem(key: string) {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.getItem(`secure_${key}`);
      }
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.warn(`Failed to get item ${key} from secure storage:`, error);
      // Fallback to AsyncStorage
      return await AsyncStorage.getItem(`secure_${key}`);
    }
  },
  async setItem(key: string, value: string) {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.setItem(`secure_${key}`, value);
      }
      return await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.warn(`Failed to set item ${key} in secure storage:`, error);
      // Fallback to AsyncStorage
      return await AsyncStorage.setItem(`secure_${key}`, value);
    }
  },
  async removeItem(key: string) {
    try {
      if (Platform.OS === 'web') {
        return await AsyncStorage.removeItem(`secure_${key}`);
      }
      return await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.warn(`Failed to remove item ${key} from secure storage:`, error);
      // Fallback to AsyncStorage
      return await AsyncStorage.removeItem(`secure_${key}`);
    }
  },
};

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
      // Load token securely from SecureStore (with web fallback)
      const storedToken = await secureStorageHelper.getItem('userToken');
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

      // Save token securely using SecureStore (with web fallback)
      await secureStorageHelper.setItem('userToken', authToken);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      await AsyncStorage.setItem('userId', userData.id.toString()); // Keeping this for backwards compatibility

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
      // Clear SecureStore token and AsyncStorage data (with web fallback)
      await secureStorageHelper.removeItem('userToken');
      await AsyncStorage.multiRemove(['userData', 'userId']);

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

// HOC to protect routes
export const withAuth = (Component: React.ComponentType<any>) => {
  return (props: any) => {
    const { isAuthenticated, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.replace('/(auth)/login');
      }
    }, [isAuthenticated, isLoading]);

    if (isLoading) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#63b0a3" />
        </View>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    return <Component {...props} />;
  };
};