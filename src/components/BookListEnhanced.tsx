/**
 * Enhanced BookList component demonstrating:
 * - useReducer for state management
 * - memoization with React.memo
 * - Generic types
 * - Extended types
 * - useRef to prevent duplicate API calls
 */
import React, { useEffect, useMemo, memo, useRef } from 'react';
import { bookService } from '../services/books';
import { Book } from '../types/books';
import LoadingSpinner from './LoadingSpinner';
import { useBookReducer } from '../hooks/useBookReducer';
import { useAppSelector } from '../store/hooks';
import { selectIsAuthenticated } from '../store/selectors';
import secureStorage from '../utils/secureStorage';

// Extended Book type with additional computed properties
interface ExtendedBook extends Book {
  formattedPrice: string;
  formattedType: string;
  formattedCondition: string;
  isNew: boolean;
  daysSinceCreated: number;
}

interface BookListProps {
  onEdit: (book: Book) => void;
  onRefresh: () => void;
}

// Memoized BookCard component to prevent unnecessary re-renders
interface BookCardProps {
  book: ExtendedBook;
  onEdit: (book: Book) => void;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

const BookCard = memo<BookCardProps>(({ book, onEdit, onDelete, isDeleting }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col h-full">
      {book.image_url && (
        <div className="w-full h-48 bg-gray-100 overflow-hidden flex-shrink-0">
          <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
        <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
        <p className="text-xs text-gray-500 mb-3">ISBN: {book.isbn || 'NA'}</p>
        <div className="flex gap-2 mb-3">
          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
            {book.formattedType}
          </span>
          <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            {book.formattedCondition}
          </span>
          {book.isNew && (
            <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
              New
            </span>
          )}
        </div>
        <p className="text-lg font-bold text-gray-900 mb-2">{book.formattedPrice}</p>
        <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5rem]">
          {book.description || 'NA'}
        </p>
        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => onEdit(book)}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(book.id)}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
});

BookCard.displayName = 'BookCard';

// Helper function to extend Book with computed properties
function extendBook(book: Book): ExtendedBook {
  const formatPrice = (price: number | string): string => {
    // Convert to number if it's a string
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    // Handle NaN or invalid numbers
    if (isNaN(numPrice) || !isFinite(numPrice)) {
      return '$0.00';
    }
    return `$${numPrice.toFixed(2)}`;
  };

  const formatType = (type: string): string => {
    return type
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  };

  const formatCondition = (condition: string): string => {
    return condition
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('-');
  };

  const daysSinceCreated = Math.floor(
    (Date.now() - new Date(book.created_at).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    ...book,
    formattedPrice: formatPrice(book.price),
    formattedType: formatType(book.type),
    formattedCondition: formatCondition(book.condition),
    isNew: daysSinceCreated < 7,
    daysSinceCreated,
  };
}

const BookListEnhanced: React.FC<BookListProps> = ({ onEdit, onRefresh }) => {
  const { state, actions } = useBookReducer();
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasFetchedRef = useRef(false);

  // Memoized extended books to prevent recalculation on every render
  const extendedBooks = useMemo<ExtendedBook[]>(() => {
    return state.books.map(extendBook);
  }, [state.books]);

  // Fetch books only once on mount (refreshKey in parent will remount component when needed)
  // Use ref to prevent duplicate calls from React StrictMode double renders
  useEffect(() => {
    // Only fetch if user is authenticated
    if (!isAuthenticated) {
      return;
    }

    // Check if user is authenticated before making API calls
    const checkAuthAndFetch = async () => {
      const token = await secureStorage.getItem('token');
      if (!token) {
        // No token, don't make API calls
        return;
      }

      if (!hasFetchedRef.current && !state.loading && state.books.length === 0) {
        hasFetchedRef.current = true;
        actions.fetchBooks(() => bookService.getMyBooks());
      }
    };

    checkAuthAndFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // Depend on isAuthenticated

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure you want to delete this book?');
    if (!confirmed) {
      return;
    }

    await actions.deleteBook(id, (bookId: string) => bookService.deleteBook(bookId));
    onRefresh();
  };

  // Auto-clear delete error after 5 seconds
  useEffect(() => {
    if (state.deleteError) {
      const timer = setTimeout(() => {
        actions.clearDeleteError();
      }, 5000);
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.deleteError]); // Only depend on deleteError, actions is stable

  if (state.loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600 mb-4">{state.error}</p>
        <button
          onClick={() => actions.fetchBooks(() => bookService.getMyBooks())}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (extendedBooks.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No books listed yet</h3>
        <p className="text-gray-600">Start by adding your first book!</p>
      </div>
    );
  }

  return (
    <div>
      {state.deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{state.deleteError}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {extendedBooks.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            onEdit={onEdit}
            onDelete={handleDelete}
            isDeleting={state.deletingId === book.id}
          />
        ))}
      </div>
    </div>
  );
};

// Memoize the main component to prevent unnecessary re-renders
export default memo(BookListEnhanced);
