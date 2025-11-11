import { combineReducers, configureStore } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import { createPersistConfig } from '@/lib/persistConfig';
import { authReducer } from './authSlice';
import { bootstrapReducer } from './bootstrapSlice';
import { offlineReducer } from './offlineSlice';

const rootReducer = combineReducers({
  auth: persistReducer(createPersistConfig('auth', ['user', 'accessToken', 'refreshToken']), authReducer),
  bootstrap: persistReducer(createPersistConfig('bootstrap', ['lastSyncAt', 'config']), bootstrapReducer),
  offline: persistReducer(createPersistConfig('offline', ['autos']), offlineReducer),
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: getDefaultMiddleware =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
