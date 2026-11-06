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

export type CategoryFilter = "All" | string;

