import * as SecureStore from 'expo-secure-store';
import { client } from '@/api/client';

export interface LoginPayload {
  username: string;
  password: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: {
    id: number;
    nome: string;
    role: string;
    setor?: string;
  };
}

async function secureStoreAvailable() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function storeToken(key: string, value: string) {
  if (await secureStoreAvailable()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(key, value);
  }
}

async function deleteToken(key: string) {
  if (await secureStoreAvailable()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem(key);
  }
}

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const { data } = await client.post<AuthResponse>('auth/token/', payload);
  await storeToken('auth_token', data.access);
  await storeToken('auth_refresh', data.refresh);
  return data;
}

export async function logout() {
  await deleteToken('auth_token');
  await deleteToken('auth_refresh');
}
