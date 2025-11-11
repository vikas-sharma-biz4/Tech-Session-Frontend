import api from './api';
import { Book, BooksResponse, BookFormData } from '../types/books';
import { ApiResponse } from '../types';

export const bookService = {
  // Get all books (for buyers)
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
    if (params?.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params?.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params?.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<ApiResponse<BooksResponse>>(
      `/books${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
    );
    if (!response.data.data) {
      throw new Error('Failed to fetch books');
    }
    return response.data.data;
  },

  // Get seller's own books
  getMyBooks: async (): Promise<Book[]> => {
    const response = await api.get<ApiResponse<BooksResponse>>('/books/seller/my-books');
    return response.data.data?.books || [];
  },

  // Create a new book
  createBook: async (bookData: BookFormData): Promise<Book> => {
    const response = await api.post<ApiResponse<Book>>('/books', bookData);
    if (!response.data.data) {
      throw new Error('Failed to create book');
    }
    return response.data.data;
  },

  // Update a book
  updateBook: async (id: string, bookData: Partial<BookFormData>): Promise<Book> => {
    const response = await api.put<ApiResponse<Book>>(`/books/${id}`, bookData);
    if (!response.data.data) {
      throw new Error('Failed to update book');
    }
    return response.data.data;
  },

  // Delete a book
  deleteBook: async (id: string): Promise<void> => {
    await api.delete<ApiResponse>(`/books/${id}`);
  },
};
