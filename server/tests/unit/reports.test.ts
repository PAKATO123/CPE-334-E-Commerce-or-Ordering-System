import { describe, it, expect, vi } from "vitest";
import {
  getSalesSummary,
  getTurnaroundMetrics,
  ReportsError,
} from "../../src/services/reports.js";

describe("Feature 9: Sales Reporting Engine Unit Tests (F-09)", () => {
  it("returns zero metrics and empty distributions when no orders exist", async () => {
    const mockPrisma: any = {
      order: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const summary = await getSalesSummary(mockPrisma);
    expect(summary.totalRevenue).toBe("0.00");
    expect(summary.totalOrders).toBe(0);
    expect(summary.averageOrderValue).toBe("0.00");
    expect(summary.statusCounts).toEqual({
      PENDING: 0,
      ACCEPTED: 0,
      PACKED: 0,
      SHIPPED: 0,
      CANCELLED: 0,
      REJECTED: 0,
    });
    expect(summary.paymentStatusCounts).toEqual({
      UNPAID: 0,
      PAID: 0,
      REFUNDED: 0,
      VOID: 0,
    });
  });

  it("calculates total revenue excluding CANCELLED and REJECTED orders and computes AOV", async () => {
    const allOrders = [
      { id: 1, status: "PENDING", paymentStatus: "UNPAID", totalAmount: "100.00" },
      { id: 2, status: "SHIPPED", paymentStatus: "PAID", totalAmount: "250.00" },
      { id: 3, status: "CANCELLED", paymentStatus: "VOID", totalAmount: "50.00" },
      { id: 4, status: "REJECTED", paymentStatus: "REFUNDED", totalAmount: "75.00" },
    ];
    const nonTerminalOrders = [
      { totalAmount: "100.00" },
      { totalAmount: "250.00" },
    ];

    const mockPrisma: any = {
      order: {
        findMany: vi
          .fn()
          .mockResolvedValueOnce(allOrders)
          .mockResolvedValueOnce(nonTerminalOrders),
      },
    };

    const summary = await getSalesSummary(mockPrisma);
    // 100 + 250 = 350.00
    expect(summary.totalRevenue).toBe("350.00");
    expect(summary.totalOrders).toBe(4);
    // 350 / 2 non-terminal = 175.00
    expect(summary.averageOrderValue).toBe("175.00");

    expect(summary.statusCounts.PENDING).toBe(1);
    expect(summary.statusCounts.SHIPPED).toBe(1);
    expect(summary.statusCounts.CANCELLED).toBe(1);
    expect(summary.statusCounts.REJECTED).toBe(1);

    expect(summary.paymentStatusCounts.UNPAID).toBe(1);
    expect(summary.paymentStatusCounts.PAID).toBe(1);
    expect(summary.paymentStatusCounts.VOID).toBe(1);
    expect(summary.paymentStatusCounts.REFUNDED).toBe(1);
  });

  it("passes date filters to Prisma findMany query", async () => {
    const mockPrisma: any = {
      order: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const startDate = "2026-11-01T00:00:00.000Z";
    const endDate = "2026-11-15T23:59:59.999Z";

    await getSalesSummary(mockPrisma, { startDate, endDate });

    expect(mockPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
      })
    );
  });

  it("throws ReportsError(400) on malformed startDate", async () => {
    const mockPrisma: any = { order: { findMany: vi.fn() } };

    await expect(
      getSalesSummary(mockPrisma, { startDate: "not-a-date" })
    ).rejects.toThrow(ReportsError);

    await expect(
      getSalesSummary(mockPrisma, { startDate: "not-a-date" })
    ).rejects.toMatchObject({
      status: 400,
      code: "INVALID_DATE",
    });
  });

  it("computes turnaround metrics for SHIPPED orders accurately", async () => {
    const baseTime = new Date("2026-11-20T10:00:00.000Z").getTime();
    const shippedOrders = [
      // Order 1 took 2 hours (120 minutes)
      {
        createdAt: new Date(baseTime),
        updatedAt: new Date(baseTime + 120 * 60 * 1000),
      },
      // Order 2 took 4 hours (240 minutes)
      {
        createdAt: new Date(baseTime),
        updatedAt: new Date(baseTime + 240 * 60 * 1000),
      },
    ];

    const mockPrisma: any = {
      order: {
        findMany: vi.fn().mockResolvedValue(shippedOrders),
      },
    };

    const metrics = await getTurnaroundMetrics(mockPrisma);
    expect(metrics.shippedOrderCount).toBe(2);
    // (120 + 240) / 2 = 180 min
    expect(metrics.averageTurnaroundMinutes).toBe(180);
    // 180 / 60 = 3.00 hours
    expect(metrics.averageTurnaroundHours).toBe(3);
    expect(metrics.fastestTurnaroundMinutes).toBe(120);
    expect(metrics.slowestTurnaroundMinutes).toBe(240);
  });

  it("returns zero metrics when no orders are SHIPPED", async () => {
    const mockPrisma: any = {
      order: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };

    const metrics = await getTurnaroundMetrics(mockPrisma);
    expect(metrics.shippedOrderCount).toBe(0);
    expect(metrics.averageTurnaroundHours).toBe(0);
    expect(metrics.averageTurnaroundMinutes).toBe(0);
  });
});
