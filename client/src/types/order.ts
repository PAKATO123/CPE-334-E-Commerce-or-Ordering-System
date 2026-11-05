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

export type OrderStatus = OrderData["status"];
export type FulfillmentStatus = Exclude<OrderStatus, "PENDING">;
export type OperatorQueueFilter = "ALL" | OrderStatus;

export interface ProcessedOrderData {
  id: number;
  orderNumber: string;
  status: FulfillmentStatus;
  updatedAt: string;
}

