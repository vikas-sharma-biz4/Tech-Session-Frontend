import { RootState } from './index';

export const selectUser = (state: RootState) => state.auth?.user ?? null;
export const selectLoading = (state: RootState) => state.auth?.loading ?? false;
export const selectError = (state: RootState) => state.auth?.error ?? null;
export const selectIsAuthenticated = (state: RootState) => state.auth?.isAuthenticated ?? false;
