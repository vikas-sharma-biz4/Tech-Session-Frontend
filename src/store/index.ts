import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  createTransform,
} from 'redux-persist';
import secureStorage from '../utils/secureStorage';
import authReducer from './slices/authSlice';

type AuthStateForTransform = {
  user: unknown;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
};

const authTransform = createTransform<AuthStateForTransform, AuthStateForTransform>(
  (inboundState) => {
    const { loading: _loading, error: _error, ...rest } = inboundState;
    return rest as AuthStateForTransform;
  },
  (outboundState) => {
    return {
      ...outboundState,
      loading: false,
      error: null,
    };
  },
  { whitelist: ['auth'] }
);

const rootReducer = combineReducers({
  auth: authReducer,
});

const persistConfig = {
  key: 'root',
  storage: secureStorage,
  whitelist: ['auth'],
  transforms: [authTransform],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const persistedReducer = persistReducer(persistConfig, rootReducer as any);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
