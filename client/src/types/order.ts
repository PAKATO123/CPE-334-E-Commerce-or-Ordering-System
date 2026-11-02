export interface OrderItemData {
  id: number;
  productId: number;
  productName: string;
  sku: string;
  unitPrice: string;
  quantity: number;
  subtotal: string;
}

export interface OrderData {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  status: "PENDING" | "ACCEPTED" | "REJECTED";
  totalAmount: string;
  itemCount?: number;
  lineItemCount?: number;
  createdAt: string;
  updatedAt?: string;
  items: OrderItemData[];
}

export interface CreateOrderItemPayload {
  productId: number;
  quantity: number;
}

export interface CreateOrderPayload {
  items: CreateOrderItemPayload[];
}

