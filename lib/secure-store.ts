import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * SecureStore has size limits and is unavailable on web.
 * Fall back to in-memory + localStorage on web for Expo Go / web previews.
 */
const memoryStore = new Map<string, string>();

async function getWebItem(key: string): Promise<string | null> {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem(key);
  }
  return memoryStore.get(key) ?? null;
}

async function setWebItem(key: string, value: string): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(key, value);
    return;
  }
  memoryStore.set(key, value);
}

async function removeWebItem(key: string): Promise<void> {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(key);
    return;
  }
  memoryStore.delete(key);
}

export const secureStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (Platform.OS === 'web') {
      return getWebItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await setWebItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (Platform.OS === 'web') {
      await removeWebItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};
