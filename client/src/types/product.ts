export interface Product {
  id: number;
  sku: string;
  name: string;
  category: string;
  description: string | null;
  price: string;
  stockQuantity: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProductPayload {
  sku: string;
  name: string;
  category: string;
  description?: string;
  price: number | string;
  stockQuantity?: number;
}

export interface UpdateProductPayload {
  name?: string;
  category?: string;
  description?: string;
  price?: number | string;
  stockQuantity?: number;
  isActive?: boolean;
}

export interface RestockResult {
  id: number;
  sku: string;
  name: string;
  previousStock: number;
  restockedAmount: number;
  newStock: number;
}

export type CategoryFilter = "All" | string;

