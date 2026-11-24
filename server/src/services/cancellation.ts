import type { PrismaClient } from "@prisma/client";
import { Role } from "../middleware/auth.js";

export class CancellationError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status: number = 400) {
    super(message);
    this.name = "CancellationError";
    this.code = code;
    this.status = status;
  }
}

export interface CancelOrderResult {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  status: string;
  paymentStatus: string;
  totalAmount: string;
  itemCount: number;
  lineItemCount: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string;
  cancellationReason: string | null;
  refundedAt?: string | null;
  items: Array<{
    id: number;
    productId: number;
    productName: string;
    sku: string;
    quantity: number;
    unitPrice: string;
    subtotal: string;
  }>;
}

export async function cancelCustomerOrder(
  prisma: PrismaClient,
  orderId: number,
  userId: number,
  userRole: Role,
  reason?: string
): Promise<CancelOrderResult> {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new CancellationError("INVALID_ID", "Order ID must be a positive integer.", 400);
  }

  if (reason && reason.length > 255) {
    throw new CancellationError("VALIDATION_ERROR", "Cancellation reason cannot exceed 255 characters.", 400);
  }

  // Check order existence and permission before transaction
  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true },
  });

  if (!existing) {
    throw new CancellationError("ORDER_NOT_FOUND", `Order ID ${orderId} does not exist.`, 404);
  }

  // Only the order owner (customer) or an admin can cancel the order
  if (userRole === "CUSTOMER" && existing.customerId !== userId) {
    throw new CancellationError("FORBIDDEN", "You do not have permission to cancel this order.", 403);
  }

  if (existing.status !== "PENDING") {
    throw new CancellationError(
      "ORDER_NOT_CANCELLABLE",
      `Only PENDING orders can be cancelled. Current status is ${existing.status}.`,
      409
    );
  }

  const now = new Date();
  const trimmedReason = reason && reason.trim().length > 0 ? reason.trim() : null;
  const isPaid = existing.paymentStatus === "PAID";
  const newPaymentStatus = isPaid ? "REFUNDED" : "VOID";

  return await prisma.$transaction(async (tx) => {
    // Atomic status transition check
    const claimed = await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: {
        status: "CANCELLED",
        cancelledAt: now,
        cancellationReason: trimmedReason,
        paymentStatus: newPaymentStatus,
        refundedAt: isPaid ? now : null,
      },
    });

    if (claimed.count === 0) {
      const current = await tx.order.findUnique({ where: { id: orderId } });
      if (!current) {
        throw new CancellationError("ORDER_NOT_FOUND", `Order ID ${orderId} does not exist.`, 404);
      }
      throw new CancellationError(
        "ORDER_NOT_CANCELLABLE",
        `Only PENDING orders can be cancelled. Current status is ${current.status}.`,
        409
      );
    }

    // Atomically restore reserved inventory for all line items
    for (const item of existing.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: {
          stockQuantity: { increment: item.quantity },
        },
      });
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        items: {
          include: { product: true },
        },
      },
    });

    const totalItemsCount = updated.items.reduce((sum, item) => sum + item.quantity, 0);

    return {
      id: updated.id,
      orderNumber: updated.orderNumber,
      customerId: updated.customerId,
      customerName: updated.customer.name,
      customerEmail: updated.customer.email,
      status: updated.status,
      paymentStatus: updated.paymentStatus,
      totalAmount: Number(updated.totalAmount).toFixed(2),
      itemCount: totalItemsCount,
      lineItemCount: updated.items.length,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      cancelledAt: updated.cancelledAt!.toISOString(),
      cancellationReason: updated.cancellationReason,
      refundedAt: updated.refundedAt ? updated.refundedAt.toISOString() : null,
      items: updated.items.map((item) => ({
        id: item.id,
        productId: item.productId,
        productName: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice).toFixed(2),
        subtotal: Number(item.subtotal).toFixed(2),
      })),
    };
  });
}
