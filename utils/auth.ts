import AsyncStorage from '@react-native-async-storage/async-storage';
import { secureStorageHelper } from './secureStorage';

export const storeToken = async (token: string) => {
  try {
    await secureStorageHelper.setItem('userToken', token);
  } catch (error) {
    console.error('Error storing token:', error);
  }
};

export const getToken = async () => {
  try {
    return await secureStorageHelper.getItem('userToken');
  } catch (error) {
    console.error('Error getting token:', error);
    return null;
  }
};

export const removeToken = async () => {
  try {
    await secureStorageHelper.removeItem('userToken');
  } catch (error) {
    console.error('Error removing token:', error);
  }
};

export const storeUserData = async (userData: any) => {
  try {
    await AsyncStorage.setItem('userData', JSON.stringify(userData));
  } catch (error) {
    console.error('Error storing user data:', error);
  }
};

export const getUserData = async () => {
  try {
    const data = await AsyncStorage.getItem('userData');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};