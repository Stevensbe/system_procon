import { Platform } from 'react-native';

let mmkv: import('react-native-mmkv').MMKV | null = null;

if (Platform.OS !== 'web') {
  const { MMKV } = require('react-native-mmkv');
  mmkv = new MMKV();
}

const noopStorage = {
  setItem() {},
  getItem() {
    return null;
  },
  removeItem() {},
};

export const mmkvStorage = {
  setItem(key: string, value: string) {
    if (mmkv) {
      mmkv.set(key, value);
    }
  },
  getItem(key: string) {
    if (!mmkv) {
      return null;
    }
    const value = mmkv.getString(key);
    return value ?? null;
  },
  removeItem(key: string) {
    if (mmkv) {
      mmkv.delete(key);
    }
  },
};

export const mmkvInstance = mmkv;
