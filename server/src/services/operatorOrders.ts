import type { PrismaClient } from "@prisma/client";

const ORDER_STATUSES = ["PENDING", "ACCEPTED", "REJECTED"] as const;
export type OperatorOrderStatus = (typeof ORDER_STATUSES)[number];

export function isOperatorOrderStatus(value: unknown): value is OperatorOrderStatus {
  return typeof value === "string" && ORDER_STATUSES.some((status) => status === value);
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
