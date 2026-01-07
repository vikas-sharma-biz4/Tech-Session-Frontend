/**
 * Custom hook using useReducer for book management.
 * Demonstrates useReducer pattern for complex state management.
 */
import { useReducer, useCallback, useMemo } from 'react';
import { Book } from '../types/books';
import { Action } from '../types/generics';

// Book state interface
interface BookState {
  books: Book[];
  loading: boolean;
  error: string | null;
  deletingId: string | null;
  deleteError: string | null;
}

// Action types
type BookAction =
  | Action<'FETCH_START'>
  | Action<'FETCH_SUCCESS', Book[]>
  | Action<'FETCH_ERROR', string>
  | Action<'DELETE_START', string>
  | Action<'DELETE_SUCCESS', string>
  | Action<'DELETE_ERROR', { id: string; error: string }>
  | Action<'CLEAR_DELETE_ERROR'>
  | Action<'ADD_BOOK', Book>
  | Action<'UPDATE_BOOK', Book>
  | Action<'RESET'>;

// Initial state
const initialState: BookState = {
  books: [],
  loading: false,
  error: null,
  deletingId: null,
  deleteError: null,
};

// Reducer function
function bookReducer(state: BookState, action: BookAction): BookState {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };

    case 'FETCH_SUCCESS':
      return {
        ...state,
        books: action.payload || [],
        loading: false,
        error: null,
      };

    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload || 'Failed to fetch books',
      };

    case 'DELETE_START':
      return {
        ...state,
        deletingId: action.payload || null,
        deleteError: null,
      };

    case 'DELETE_SUCCESS':
      return {
        ...state,
        books: state.books.filter((book) => book.id !== action.payload),
        deletingId: null,
        deleteError: null,
      };

    case 'DELETE_ERROR':
      return {
        ...state,
        deletingId: null,
        deleteError: action.payload?.error || 'Failed to delete book',
      };

    case 'CLEAR_DELETE_ERROR':
      return {
        ...state,
        deleteError: null,
      };

    case 'ADD_BOOK':
      if (!action.payload) {
        return state;
      }
      return {
        ...state,
        books: [...state.books, action.payload],
      };

    case 'UPDATE_BOOK':
      if (!action.payload) {
        return state;
      }
      const updatedBook = action.payload;
      return {
        ...state,
        books: state.books.map((book) => (book.id === updatedBook.id ? updatedBook : book)),
      };

    case 'RESET':
      return initialState;

    default:
      return state;
  }
}

/**
 * Custom hook for book state management using useReducer.
 * Provides actions and state for book operations.
 */
export function useBookReducer() {
  const [state, dispatch] = useReducer(bookReducer, initialState);

  const fetchBooks = useCallback(async (fetchFn: () => Promise<Book[]>) => {
    dispatch({ type: 'FETCH_START' });
    try {
      const books = await fetchFn();
      dispatch({ type: 'FETCH_SUCCESS', payload: books });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch books';
      dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
    }
  }, []);

  const deleteBook = useCallback(async (id: string, deleteFn: (id: string) => Promise<void>) => {
    dispatch({ type: 'DELETE_START', payload: id });
    try {
      await deleteFn(id);
      dispatch({ type: 'DELETE_SUCCESS', payload: id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete book';
      dispatch({
        type: 'DELETE_ERROR',
        payload: { id, error: errorMessage },
      });
    }
  }, []);

  const addBook = useCallback((book: Book) => {
    dispatch({ type: 'ADD_BOOK', payload: book });
  }, []);

  const updateBook = useCallback((book: Book) => {
    dispatch({ type: 'UPDATE_BOOK', payload: book });
  }, []);

  const clearDeleteError = useCallback(() => {
    dispatch({ type: 'CLEAR_DELETE_ERROR' });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: 'RESET' });
  }, []);

  // Memoize actions object to prevent unnecessary re-renders
  const actions = useMemo(
    () => ({
      fetchBooks,
      deleteBook,
      addBook,
      updateBook,
      clearDeleteError,
      reset,
    }),
    [fetchBooks, deleteBook, addBook, updateBook, clearDeleteError, reset]
  );

  return {
    state,
    actions,
  };
}
