import type { PrismaClient } from "@prisma/client";

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "PACKED", "SHIPPED", "REJECTED", "CANCELLED"] as const;
export type OperatorOrderStatus = (typeof ORDER_STATUSES)[number];

export function isOperatorOrderStatus(value: unknown): value is OperatorOrderStatus {
  return typeof value === "string" && ORDER_STATUSES.some((status) => status === value);
}

const FULFILLMENT_STATUSES = ["ACCEPTED", "PACKED", "SHIPPED", "REJECTED"] as const;
export type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

export function isFulfillmentStatus(value: unknown): value is FulfillmentStatus {
  return typeof value === "string" && FULFILLMENT_STATUSES.some((status) => status === value);
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

/** Claim an order according to fulfillment state progression; all writes commit or roll back together. */
export async function processOperatorOrder(
  prisma: Pick<PrismaClient, "$transaction">,
  id: number,
  status: FulfillmentStatus
) {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await prisma.$transaction(async (tx) => {
        // Inspect current order state
        const existing = await tx.order.findUnique({
          where: { id },
          select: { status: true },
        });

        if (!existing) {
          throw new OperatorOrderError(404, "ORDER_NOT_FOUND", "Order not found.");
        }

        // Terminal states cannot be transitioned further
        if (existing.status === "SHIPPED" || existing.status === "REJECTED" || existing.status === "CANCELLED") {
          throw new OperatorOrderError(
            409,
            "ORDER_ALREADY_PROCESSED",
            "This order has already been processed. Refresh the queue to see its current status."
          );
        }

        // Enforce valid state machine transitions:
        // PENDING -> ACCEPTED or REJECTED
        // ACCEPTED -> PACKED
        // PACKED -> SHIPPED
        if (existing.status === "PENDING") {
          if (status !== "ACCEPTED" && status !== "REJECTED") {
            throw new OperatorOrderError(
              400,
              "INVALID_TRANSITION",
              `Cannot transition from PENDING to ${status}.`
            );
          }
        } else if (existing.status === "ACCEPTED") {
          if (status === "ACCEPTED" || status === "REJECTED") {
            throw new OperatorOrderError(
              409,
              "ORDER_ALREADY_PROCESSED",
              "This order has already been processed. Refresh the queue to see its current status."
            );
          }
          if (status === "SHIPPED") {
            throw new OperatorOrderError(
              400,
              "INVALID_TRANSITION",
              "Cannot transition from ACCEPTED to SHIPPED. Order must be PACKED first."
            );
          }
        } else if (existing.status === "PACKED") {
          if (status === "ACCEPTED" || status === "REJECTED" || status === "PACKED") {
            throw new OperatorOrderError(
              409,
              "ORDER_ALREADY_PROCESSED",
              "This order has already been processed. Refresh the queue to see its current status."
            );
          }
          if (status !== "SHIPPED") {
            throw new OperatorOrderError(
              400,
              "INVALID_TRANSITION",
              `Cannot transition from PACKED to ${status}.`
            );
          }
        }

        const claimed = await tx.order.updateMany({
          where: { id, status: existing.status },
          data: { status },
        });

        if (claimed.count !== 1) {
          throw new OperatorOrderError(
            409,
            "ORDER_ALREADY_PROCESSED",
            "This order has already been processed. Refresh the queue to see its current status."
          );
        }

        if (status === "REJECTED") {
          // Read under the lock held by the fulfillment claim.
          const { paymentStatus } = await tx.order.findUniqueOrThrow({
            where: { id },
            select: { paymentStatus: true },
          });
          if (paymentStatus === "PAID" || paymentStatus === "UNPAID") {
            await tx.order.update({
              where: { id },
              data: {
                paymentStatus: paymentStatus === "PAID" ? "REFUNDED" : "VOID",
                refundedAt: paymentStatus === "PAID" ? new Date() : null,
              },
            });
          }
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
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            refundedAt: true,
            updatedAt: true,
          },
        });
        return {
          ...order,
          updatedAt: order.updatedAt.toISOString(),
          refundedAt: order.refundedAt ? order.refundedAt.toISOString() : null,
        };
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
      paymentStatus: true,
      paymentMethod: true,
      paidAt: true,
      refundedAt: true,
      cancelledAt: true,
      cancellationReason: true,
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
    paymentStatus: order.paymentStatus || "UNPAID",
    paymentMethod: order.paymentMethod || null,
    paidAt: order.paidAt ? order.paidAt.toISOString() : null,
    refundedAt: order.refundedAt ? order.refundedAt.toISOString() : null,
    cancelledAt: order.cancelledAt ? order.cancelledAt.toISOString() : null,
    cancellationReason: order.cancellationReason || null,
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
