/**
 * Generic types and extended types for type safety and reusability.
 * Demonstrates TypeScript generics and type extension patterns.
 */

// Generic API Response type
export interface ApiResponse<T> {
  message?: string;
  data: T;
}

// Generic Paginated Response type
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Generic Filter type
export interface Filter<T> {
  field: keyof T;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'in';
  value: unknown;
}

// Generic Sort type
export interface Sort<T> {
  field: keyof T;
  order: 'ASC' | 'DESC';
}

// Generic Query Parameters type
export interface QueryParams<T> {
  filters?: Filter<T>[];
  sort?: Sort<T>;
  page?: number;
  limit?: number;
}

// Extended Book type with additional computed properties
// Note: Book type is imported where this is used to avoid circular dependencies
export interface ExtendedBook {
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
  // Extended properties
  formattedPrice: string;
  formattedType: string;
  formattedCondition: string;
  isNew: boolean;
  daysSinceCreated: number;
}

// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// Generic CRUD operations interface
export interface CrudService<T extends BaseEntity, CreateInput, UpdateInput> {
  getAll: (params?: QueryParams<T>) => Promise<PaginatedResponse<T>>;
  getById: (id: string) => Promise<T>;
  create: (data: CreateInput) => Promise<T>;
  update: (id: string, data: UpdateInput) => Promise<T>;
  delete: (id: string) => Promise<void>;
}

// Generic form state type
export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// Generic action type for reducers
export type Action<T, P = unknown> = {
  type: T;
  payload?: P;
};
