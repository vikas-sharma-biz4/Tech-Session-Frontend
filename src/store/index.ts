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
  PersistConfig,
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
  (inboundState: AuthStateForTransform) => {
    const { loading: _loading, error: _error, ...rest } = inboundState;
    return rest as AuthStateForTransform;
  },
  (outboundState: AuthStateForTransform) => {
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

type RootState = ReturnType<typeof rootReducer>;

const persistConfig: PersistConfig<RootState> = {
  key: 'root',
  storage: secureStorage,
  whitelist: ['auth'],
  transforms: [authTransform],
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

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

export type { RootState };
export type AppDispatch = typeof store.dispatch;
