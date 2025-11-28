import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure storage helper with web fallback
 * - On native: uses expo-secure-store
 * - On web: uses AsyncStorage with 'secure_' prefix
 */
export const secureStorageHelper = {
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
