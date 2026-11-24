import type { PrismaClient } from "@prisma/client";
import { Role } from "../middleware/auth.js";

export class PaymentError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(code: string, message: string, status: number = 400) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.status = status;
  }
}

export const SUPPORTED_PAYMENT_METHODS = [
  "SIMULATED_CARD",
  "SIMULATED_PROMPTPAY",
  "SIMULATED_MOCK",
] as const;

export type PaymentMethod = (typeof SUPPORTED_PAYMENT_METHODS)[number];

export function isSupportedPaymentMethod(value: unknown): value is PaymentMethod {
  return typeof value === "string" && (SUPPORTED_PAYMENT_METHODS as readonly string[]).includes(value);
}

export interface SimulatePaymentResult {
  id: number;
  orderNumber: string;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  paidAt: string;
  totalAmount: string;
  itemCount: number;
  lineItemCount: number;
  createdAt: string;
  updatedAt: string;
  cancelledAt?: string | null;
  cancellationReason?: string | null;
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

export async function simulateOrderPayment(
  prisma: PrismaClient,
  orderId: number,
  userId: number,
  userRole: Role,
  paymentMethod: unknown
): Promise<SimulatePaymentResult> {
  if (!Number.isInteger(orderId) || orderId <= 0) {
    throw new PaymentError("INVALID_ID", "Order ID must be a positive integer.", 400);
  }

  if (!isSupportedPaymentMethod(paymentMethod)) {
    throw new PaymentError(
      "INVALID_PAYMENT_METHOD",
      "Unsupported payment method.",
      400
    );
  }

  const existing = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      customer: { select: { id: true, name: true, email: true } },
      items: { include: { product: true } },
    },
  });

  if (!existing) {
    throw new PaymentError("ORDER_NOT_FOUND", "Order does not exist.", 404);
  }

  // Cross-customer data isolation: Customers can only pay their own orders
  if (userRole === "CUSTOMER" && existing.customerId !== userId) {
    throw new PaymentError("FORBIDDEN", "Access denied.", 403);
  }

  // Cannot pay a cancelled or rejected order
  if (existing.status === "CANCELLED" || existing.status === "REJECTED") {
    throw new PaymentError(
      "CANNOT_PAY_TERMINAL_ORDER",
      "Cannot pay a cancelled or rejected order.",
      422
    );
  }

  // Duplicate payment prevention
  if (existing.paymentStatus === "PAID") {
    throw new PaymentError(
      "ORDER_ALREADY_PAID",
      "Order has already been paid.",
      409
    );
  }

  const now = new Date();

  return await prisma.$transaction(async (tx) => {
    // Atomic status transition guard
    const claimed = await tx.order.updateMany({
      where: { id: orderId, paymentStatus: "UNPAID" },
      data: {
        paymentStatus: "PAID",
        paymentMethod,
        paidAt: now,
      },
    });

    if (claimed.count === 0) {
      const current = await tx.order.findUnique({ where: { id: orderId } });
      if (current?.paymentStatus === "PAID") {
        throw new PaymentError("ORDER_ALREADY_PAID", "Order has already been paid.", 409);
      }
      throw new PaymentError("PAYMENT_FAILED", "Order payment update could not be completed.", 400);
    }

    const updated = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
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
      paymentMethod: updated.paymentMethod!,
      paidAt: updated.paidAt!.toISOString(),
      totalAmount: Number(updated.totalAmount).toFixed(2),
      itemCount: totalItemsCount,
      lineItemCount: updated.items.length,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
      cancelledAt: updated.cancelledAt ? updated.cancelledAt.toISOString() : null,
      cancellationReason: updated.cancellationReason || null,
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
