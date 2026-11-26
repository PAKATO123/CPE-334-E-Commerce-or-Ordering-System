import type { PrismaClient } from "@prisma/client";

export class ReportsError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = "ReportsError";
    this.status = status;
    this.code = code;
  }
}

export interface SalesSummaryFilters {
  startDate?: string;
  endDate?: string;
}

export interface StatusCounts {
  PENDING: number;
  ACCEPTED: number;
  PACKED: number;
  SHIPPED: number;
  CANCELLED: number;
  REJECTED: number;
}

export interface PaymentStatusCounts {
  UNPAID: number;
  PAID: number;
  REFUNDED: number;
  VOID: number;
}

export interface SalesSummaryResult {
  totalRevenue: string;
  totalOrders: number;
  averageOrderValue: string;
  statusCounts: StatusCounts;
  paymentStatusCounts: PaymentStatusCounts;
}

export interface TurnaroundMetricsResult {
  shippedOrderCount: number;
  averageTurnaroundHours: number;
  averageTurnaroundMinutes: number;
  fastestTurnaroundMinutes: number;
  slowestTurnaroundMinutes: number;
}

export async function getSalesSummary(
  prisma: PrismaClient,
  filters?: SalesSummaryFilters
): Promise<SalesSummaryResult> {
  const createdAt: { gte?: Date; lte?: Date } = {};

  if (filters?.startDate) {
    const start = new Date(filters.startDate);
    if (isNaN(start.getTime())) {
      throw new ReportsError(400, "INVALID_DATE", "Invalid startDate format. Use ISO-8601 string.");
    }
    createdAt.gte = start;
  }

  if (filters?.endDate) {
    const end = new Date(filters.endDate);
    if (isNaN(end.getTime())) {
      throw new ReportsError(400, "INVALID_DATE", "Invalid endDate format. Use ISO-8601 string.");
    }
    createdAt.lte = end;
  }

  if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) {
    throw new ReportsError(400, "INVALID_DATE", "startDate must be on or before endDate.");
  }

  const where = Object.keys(createdAt).length > 0 ? { createdAt } : {};

  const [allOrders, nonTerminalOrders] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
      },
    }),
    prisma.order.findMany({
      where: {
        ...where,
        status: { notIn: ["CANCELLED", "REJECTED"] },
      },
      select: {
        totalAmount: true,
      },
    }),
  ]);

  const totalRevenueNum = nonTerminalOrders.reduce(
    (sum, order) => sum + Number(order.totalAmount),
    0
  );

  const nonTerminalCount = nonTerminalOrders.length;
  const aovNum = nonTerminalCount > 0 ? totalRevenueNum / nonTerminalCount : 0;

  const statusCounts: StatusCounts = {
    PENDING: 0,
    ACCEPTED: 0,
    PACKED: 0,
    SHIPPED: 0,
    CANCELLED: 0,
    REJECTED: 0,
  };

  const paymentStatusCounts: PaymentStatusCounts = {
    UNPAID: 0,
    PAID: 0,
    REFUNDED: 0,
    VOID: 0,
  };

  for (const order of allOrders) {
    if (order.status in statusCounts) {
      statusCounts[order.status as keyof StatusCounts]++;
    }
    if (order.paymentStatus in paymentStatusCounts) {
      paymentStatusCounts[order.paymentStatus as keyof PaymentStatusCounts]++;
    }
  }

  return {
    totalRevenue: totalRevenueNum.toFixed(2),
    totalOrders: allOrders.length,
    averageOrderValue: aovNum.toFixed(2),
    statusCounts,
    paymentStatusCounts,
  };
}

export async function getTurnaroundMetrics(
  prisma: PrismaClient
): Promise<TurnaroundMetricsResult> {
  const shippedOrders = await prisma.order.findMany({
    where: { status: "SHIPPED" },
    select: { createdAt: true, updatedAt: true },
  });

  if (shippedOrders.length === 0) {
    return {
      shippedOrderCount: 0,
      averageTurnaroundHours: 0,
      averageTurnaroundMinutes: 0,
      fastestTurnaroundMinutes: 0,
      slowestTurnaroundMinutes: 0,
    };
  }

  const durationsMinutes = shippedOrders.map((order) => {
    const diffMs = order.updatedAt.getTime() - order.createdAt.getTime();
    return Math.max(0, Math.round(diffMs / (1000 * 60)));
  });

  const sumMinutes = durationsMinutes.reduce((acc, m) => acc + m, 0);
  const avgMinutes = Math.round(sumMinutes / durationsMinutes.length);
  const avgHours = Number((avgMinutes / 60).toFixed(2));
  const fastest = Math.min(...durationsMinutes);
  const slowest = Math.max(...durationsMinutes);

  return {
    shippedOrderCount: shippedOrders.length,
    averageTurnaroundHours: avgHours,
    averageTurnaroundMinutes: avgMinutes,
    fastestTurnaroundMinutes: fastest,
    slowestTurnaroundMinutes: slowest,
  };
}
