import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { bookService } from '../services/books';
import { Book, BookFormData } from '../types/books';

interface AddBookFormProps {
  onSuccess: () => void;
  editingBook?: Book | null;
  onCancel?: () => void;
}

const bookSchema = yup.object().shape({
  title: yup.string().required('Title is required').min(2, 'Title must be at least 2 characters'),
  author: yup
    .string()
    .required('Author is required')
    .min(2, 'Author must be at least 2 characters'),
  isbn: yup.string().optional(),
  type: yup
    .string()
    .oneOf(['fiction', 'non-fiction', 'academic', 'biography', 'other'])
    .required('Type is required'),
  price: yup
    .number()
    .required('Price is required')
    .positive('Price must be positive')
    .min(0.01, 'Price must be at least $0.01'),
  description: yup.string().optional(),
  condition: yup
    .string()
    .oneOf(['new', 'like-new', 'good', 'fair', 'poor'])
    .required('Condition is required'),
  image_url: yup.string().url('Must be a valid URL').optional(),
});

const AddBookForm: React.FC<AddBookFormProps> = ({ onSuccess, editingBook, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<BookFormData>({
    resolver: yupResolver(bookSchema),
    defaultValues: {
      title: '',
      author: '',
      isbn: '',
      type: 'fiction',
      price: 0,
      description: '',
      condition: 'new',
      image_url: '',
    },
  });

  useEffect(() => {
    if (editingBook) {
      setValue('title', editingBook.title);
      setValue('author', editingBook.author);
      setValue('isbn', editingBook.isbn || '');
      setValue('type', editingBook.type);
      setValue('price', editingBook.price);
      setValue('description', editingBook.description || '');
      setValue('condition', editingBook.condition);
      setValue('image_url', editingBook.image_url || '');
    } else {
      reset();
    }
  }, [editingBook, setValue, reset]);

  const onSubmit = async (data: BookFormData) => {
    try {
      setLoading(true);
      setError(null);

      if (editingBook) {
        await bookService.updateBook(editingBook.id, data);
      } else {
        await bookService.createBook(data);
      }

      reset();
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save book');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        {editingBook ? 'Edit Book' : 'Add New Book'}
      </h2>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title *
          </label>
          <input
            id="title"
            type="text"
            {...register('title')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>

        <div>
          <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
            Author *
          </label>
          <input
            id="author"
            type="text"
            {...register('author')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.author ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.author && <p className="mt-1 text-sm text-red-600">{errors.author.message}</p>}
        </div>

        <div>
          <label htmlFor="isbn" className="block text-sm font-medium text-gray-700 mb-1">
            ISBN
          </label>
          <input
            id="isbn"
            type="text"
            {...register('isbn')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.isbn ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.isbn && <p className="mt-1 text-sm text-red-600">{errors.isbn.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              Type *
            </label>
            <select
              id="type"
              {...register('type')}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.type ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="fiction">Fiction</option>
              <option value="non-fiction">Non-Fiction</option>
              <option value="academic">Academic</option>
              <option value="biography">Biography</option>
              <option value="other">Other</option>
            </select>
            {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
          </div>

          <div>
            <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">
              Condition *
            </label>
            <select
              id="condition"
              {...register('condition')}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.condition ? 'border-red-500' : 'border-gray-300'
              }`}
            >
              <option value="new">New</option>
              <option value="like-new">Like New</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
            {errors.condition && (
              <p className="mt-1 text-sm text-red-600">{errors.condition.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
            Price ($) *
          </label>
          <input
            id="price"
            type="number"
            step="0.01"
            min="0.01"
            {...register('price', { valueAsNumber: true })}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.price ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
        </div>

        <div>
          <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
            Image URL
          </label>
          <input
            id="image_url"
            type="url"
            {...register('image_url')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.image_url ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="https://example.com/image.jpg"
          />
          {errors.image_url && (
            <p className="mt-1 text-sm text-red-600">{errors.image_url.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            id="description"
            rows={4}
            {...register('description')}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              errors.description ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="flex gap-3 pt-4">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Saving...' : editingBook ? 'Update Book' : 'Add Book'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddBookForm;
