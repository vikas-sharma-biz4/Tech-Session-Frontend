import { fastApi } from './api';
import { Book, BooksResponse, BookFormData } from '../types/books';
import { ApiResponse } from '../types';

export const bookService = {
  // Get all books (for buyers) - Updated for FastAPI
  getBooks: async (params?: {
    type?: string;
    search?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    page?: number;
    limit?: number;
  }): Promise<BooksResponse> => {
    const queryParams = new URLSearchParams();

    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.condition) queryParams.append('condition', params.condition);
    if (params?.minPrice) queryParams.append('min_price', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('max_price', params.maxPrice.toString());
    if (params?.sortBy) queryParams.append('sort_by', params.sortBy);
    if (params?.sortOrder) queryParams.append('sort_order', params.sortOrder);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await fastApi.get<BooksResponse>(
      `/api/books${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );

    // FastAPI returns data directly, transform to match expected format
    return {
      data: response.data.data || [],
      total: response.data.total || 0,
      page: response.data.page || 1,
      limit: response.data.limit || 20,
      total_pages: response.data.total_pages || 0,
    };
  },

  // Get seller's own books - Updated for FastAPI
  getMyBooks: async (): Promise<Book[]> => {
    const response = await fastApi.get<BooksResponse>('/api/books/my-books');
    return response.data.data || [];
  },

  // Create a new book - Updated for FastAPI
  createBook: async (bookData: BookFormData): Promise<Book> => {
    const response = await fastApi.post<Book>('/api/books', bookData);
    if (!response.data) {
      throw new Error('Failed to create book');
    }
    return response.data;
  },

  // Update a book - Updated for FastAPI
  updateBook: async (id: string, bookData: Partial<BookFormData>): Promise<Book> => {
    const response = await fastApi.put<Book>(`/api/books/${id}`, bookData);
    if (!response.data) {
      throw new Error('Failed to update book');
    }
    return response.data;
  },

  // Delete a book - Updated for FastAPI
  deleteBook: async (id: string): Promise<void> => {
    await fastApi.delete<ApiResponse>(`/api/books/${id}`);
  },
};
