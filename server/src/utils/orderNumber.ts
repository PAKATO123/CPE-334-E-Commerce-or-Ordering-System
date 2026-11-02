import { PrismaClient } from "@prisma/client";

/**
 * Generates official TechTent Order Numbers conforming to ORD-YYYYMMDD-XXXX (FR-05, BR-01).
 * E.g., ORD-20261102-0001
 */
export async function generateOrderNumber(prisma: PrismaClient | any): Promise<string> {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const dateStr = `${year}${month}${day}`;
  const prefix = `ORD-${dateStr}-`;

  const existingOrders = await prisma.order.findMany({
    where: {
      orderNumber: { startsWith: prefix },
    },
    select: { orderNumber: true },
  });

  let maxSeq = 0;
  for (const o of existingOrders) {
    const parts = o.orderNumber.split("-");
    const seq = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(seq) && seq > maxSeq) {
      maxSeq = seq;
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(4, "0");
  return `${prefix}${nextSeq}`;
}
