// Base types for entities
export interface BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}

// Common response type for API calls
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: 'success' | 'error';
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  hasMore: boolean;
} 