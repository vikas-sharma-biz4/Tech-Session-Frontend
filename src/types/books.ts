export interface Book {
  id: string;
  title: string;
  author: string;
  isbn?: string;
  type: 'fiction' | 'non-fiction' | 'academic' | 'biography' | 'other';
  price: number;
  description?: string;
  seller_id: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  image_url?: string;
  created_at: string;
  updated_at: string;
  seller?: {
    id: string;
    name: string;
    email: string;
  };
}

// FastAPI response structure
export interface BooksResponse {
  data: Book[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface BookFormData {
  title: string;
  author: string;
  isbn?: string;
  type: 'fiction' | 'non-fiction' | 'academic' | 'biography' | 'other';
  price: number;
  description?: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'poor';
  image_url?: string;
}
