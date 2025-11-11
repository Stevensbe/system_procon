import { Platform } from 'react-native';
import { PersistConfig } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { mmkvStorage } from './mmkv';

const storage =
  Platform.OS === 'web'
    ? AsyncStorage
    : {
        setItem: (key: string, value: string) => {
          mmkvStorage.setItem(key, value);
          return Promise.resolve(true);
        },
        getItem: (key: string) => Promise.resolve(mmkvStorage.getItem(key)),
        removeItem: (key: string) => {
          mmkvStorage.removeItem(key);
          return Promise.resolve();
        },
      };

export const createPersistConfig = <T extends object>(
  key: string,
  whitelist: (keyof T)[],
): PersistConfig<T> => ({
  key,
  storage,
  whitelist,
});
