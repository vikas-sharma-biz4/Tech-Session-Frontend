import React, { useState, useEffect } from 'react';
import { bookService } from '../services/books';
import { Book } from '../types/books';
import LoadingSpinner from './LoadingSpinner';

interface BookListProps {
  onEdit: (book: Book) => void;
  onRefresh: () => void;
}

const BookList: React.FC<BookListProps> = ({ onEdit, onRefresh }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      setError(null);
      const myBooks = await bookService.getMyBooks();
      setBooks(myBooks);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const handleDelete = async (id: string) => {
    // eslint-disable-next-line no-alert
    const confirmed = window.confirm('Are you sure you want to delete this book?');
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setDeleteError(null);
      await bookService.deleteBook(id);
      setBooks(books.filter((book) => book.id !== id));
      onRefresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete book';
      setDeleteError(errorMessage);
      setTimeout(() => {
        setDeleteError(null);
      }, 5000);
    } finally {
      setDeletingId(null);
    }
  };

  const formatPrice = (price: number): string => {
    return `$${price.toFixed(2)}`;
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

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={fetchBooks}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
        >
          Retry
        </button>
      </div>
    );
  }

  if (books.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">No books listed yet</h3>
        <p className="text-gray-600">Start by adding your first book!</p>
      </div>
    );
  }

  return (
    <div>
      {deleteError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600">{deleteError}</p>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {books.map((book) => (
          <div
            key={book.id}
            className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow overflow-hidden"
          >
            {book.image_url && (
              <div className="w-full h-48 bg-gray-100 overflow-hidden">
                <img src={book.image_url} alt={book.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-1">{book.title}</h3>
              <p className="text-sm text-gray-600 mb-2">by {book.author}</p>
              {book.isbn && <p className="text-xs text-gray-500 mb-3">ISBN: {book.isbn}</p>}
              <div className="flex gap-2 mb-3">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {formatType(book.type)}
                </span>
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                  {formatCondition(book.condition)}
                </span>
              </div>
              <p className="text-lg font-bold text-gray-900 mb-2">{formatPrice(book.price)}</p>
              {book.description && (
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{book.description}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => onEdit(book)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(book.id)}
                  disabled={deletingId === book.id}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deletingId === book.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BookList;
