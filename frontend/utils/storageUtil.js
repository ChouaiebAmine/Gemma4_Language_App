import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const isWeb = Platform.OS === 'web'

export const storage = {
  setItemAsync: async (key, value) => {
    if (isWeb) {
      return AsyncStorage.setItem(key, value)
    } else {
      return SecureStore.setItemAsync(key, value)
    }
  },
  getItemAsync: async (key) => {
    if (isWeb) {
      return AsyncStorage.getItem(key)
    } else {
      return SecureStore.getItemAsync(key)
    }
  },
  deleteItemAsync: async (key) => {
    if (isWeb) {
      return AsyncStorage.removeItem(key)
    } else {
      return SecureStore.deleteItemAsync(key)
    }
  },
}
