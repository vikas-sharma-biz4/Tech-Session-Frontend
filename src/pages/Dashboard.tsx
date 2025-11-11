import React, { useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectUser } from '../store/selectors';
import BookList from '../components/BookList';
import AddBookForm from '../components/AddBookForm';
import { Book } from '../types/books';

const Dashboard: React.FC = () => {
  const user = useAppSelector(selectUser);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddBook = () => {
    setEditingBook(null);
    setShowAddForm(true);
  };

  const handleEditBook = (book: Book) => {
    setEditingBook(book);
    setShowAddForm(true);
  };

  const handleFormSuccess = () => {
    setShowAddForm(false);
    setEditingBook(null);
    setRefreshKey((prev) => prev + 1);
  };

  const handleFormCancel = () => {
    setShowAddForm(false);
    setEditingBook(null);
  };

  const handleRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 mb-6">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Seller Dashboard</h2>
          <p className="text-gray-600 mb-6">Manage your book listings on the platform.</p>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="text-base font-medium text-gray-900">{user?.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-base font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {!showAddForm ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Your Books</h2>
              <button
                onClick={handleAddBook}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-sm hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add New Book
              </button>
            </div>
            <BookList key={refreshKey} onEdit={handleEditBook} onRefresh={handleRefresh} />
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            <AddBookForm
              editingBook={editingBook}
              onSuccess={handleFormSuccess}
              onCancel={handleFormCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
