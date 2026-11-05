import type { PrismaClient } from "@prisma/client";

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type OperatorOrderStatus = (typeof ORDER_STATUSES)[number];

export function isOperatorOrderStatus(value: unknown): value is OperatorOrderStatus {
  return typeof value === "string" && ORDER_STATUSES.some((status) => status === value);
}

export type FulfillmentStatus = Exclude<OperatorOrderStatus, "PENDING">;

export function isFulfillmentStatus(value: unknown): value is FulfillmentStatus {
  return value === "ACCEPTED" || value === "REJECTED";
}

export function parseOperatorOrderId(value: string): number | undefined {
  if (!/^[1-9]\d*$/.test(value)) return undefined;
  const id = Number(value);
  // Prisma's Int maps to PostgreSQL's signed 32-bit integer.
  return Number.isSafeInteger(id) && id <= 2_147_483_647 ? id : undefined;
}

export class OperatorOrderError extends Error {
  readonly statusCode: number;
  readonly code: string;

  constructor(statusCode: number, code: string, message: string) {
    super(message);
    this.name = "OperatorOrderError";
    this.statusCode = statusCode;
    this.code = code;
  }
}

/** Claim a pending order before touching inventory; all writes commit or roll back together. */
export async function processOperatorOrder(
  prisma: Pick<PrismaClient, "$transaction">,
  id: number,
  status: FulfillmentStatus
) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // PostgreSQL locks the matching row and rechecks this predicate after
        // waiting for another writer. Only the winning request may restore stock.
        const claimed = await tx.order.updateMany({
          where: { id, status: "PENDING" },
          data: { status },
        });

        if (claimed.count !== 1) {
          const existing = await tx.order.findUnique({ where: { id }, select: { id: true } });
          if (!existing) {
            throw new OperatorOrderError(404, "ORDER_NOT_FOUND", "Order not found.");
          }
          throw new OperatorOrderError(
            409,
            "ORDER_ALREADY_PROCESSED",
            "This order has already been processed. Refresh the queue to see its current status."
          );
        }

        if (status === "REJECTED") {
          const items = await tx.orderItem.findMany({
            where: { orderId: id },
            select: { productId: true, quantity: true },
            // Consistent lock ordering reduces deadlocks between different orders.
            orderBy: [{ productId: "asc" }, { id: "asc" }],
          });
          for (const item of items) {
            await tx.product.update({
              where: { id: item.productId },
              data: { stockQuantity: { increment: item.quantity } },
            });
          }
        }

        const order = await tx.order.findUniqueOrThrow({
          where: { id },
          select: { id: true, orderNumber: true, status: true, updatedAt: true },
        });
        return { ...order, updatedAt: order.updatedAt.toISOString() };
      }, { isolationLevel: "ReadCommitted" });
    } catch (error) {
      // Retry the entire aborted transaction, never individual stock increments.
      const retryable = typeof error === "object" && error !== null &&
        "code" in error && error.code === "P2034";
      if (!retryable) throw error;
      if (attempt === maxAttempts) {
        throw new OperatorOrderError(
          409,
          "ORDER_PROCESSING_CONFLICT",
          "Order processing conflicted with another request. Refresh the queue and try again."
        );
      }
      await new Promise((resolve) => setTimeout(resolve, attempt * 20));
    }
  }
  throw new Error("Order processing attempts exhausted.");
}

/** Read the fulfillment queue without selecting credentials or live catalog prices. */
export async function listOperatorOrders(
  prisma: Pick<PrismaClient, "order">,
  status?: OperatorOrderStatus
) {
  const orders = await prisma.order.findMany({
    where: status === undefined ? {} : { status },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    select: {
      id: true,
      orderNumber: true,
      customerId: true,
      status: true,
      totalAmount: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { name: true, email: true } },
      items: {
        orderBy: { id: "asc" },
        select: {
          id: true,
          productId: true,
          unitPrice: true,
          quantity: true,
          subtotal: true,
          product: { select: { name: true, sku: true } },
        },
      },
    },
  });

  return orders.map((order) => ({
    id: order.id,
    orderNumber: order.orderNumber,
    customerId: order.customerId,
    customerName: order.customer.name,
    customerEmail: order.customer.email,
    status: order.status,
    totalAmount: order.totalAmount.toFixed(2),
    itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
    lineItemCount: order.items.length,
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      unitPrice: item.unitPrice.toFixed(2),
      quantity: item.quantity,
      subtotal: item.subtotal.toFixed(2),
    })),
  }));
}
