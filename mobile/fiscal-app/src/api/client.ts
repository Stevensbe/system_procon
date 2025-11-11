import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

client.interceptors.request.use(async config => {
  let token: string | null = null;
  try {
    if (await SecureStore.isAvailableAsync()) {
      token = await SecureStore.getItemAsync('auth_token');
    } else if (typeof sessionStorage !== 'undefined') {
      token = sessionStorage.getItem('auth_token');
    }
  } catch (error) {
    console.warn('Falha ao recuperar token seguro', error);
  }

  if (token) {
    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${token}`,
    };
  }

  const headers = {
    ...config.headers,
  } as Record<string, any>;

  if (Platform.OS !== 'web') {
    headers['X-Device-Id'] = headers['X-Device-Id'] || 'unknown-device';
  }

  config.headers = headers;
  return config;
});

export { client };
