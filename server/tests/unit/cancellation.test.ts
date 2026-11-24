import { describe, expect, it, vi, beforeEach } from "vitest";
import { cancelCustomerOrder, CancellationError } from "../../src/services/cancellation.js";

describe("Order Cancellation Unit Tests (F-07)", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    };
  });

  describe("Validation boundaries", () => {
    it("rejects non-positive order IDs", async () => {
      await expect(cancelCustomerOrder(mockPrisma, 0, 1, "CUSTOMER")).rejects.toMatchObject({
        code: "INVALID_ID",
        status: 400,
      });

      await expect(cancelCustomerOrder(mockPrisma, -5, 1, "CUSTOMER")).rejects.toMatchObject({
        code: "INVALID_ID",
        status: 400,
      });

      await expect(cancelCustomerOrder(mockPrisma, 1.5, 1, "CUSTOMER")).rejects.toMatchObject({
        code: "INVALID_ID",
        status: 400,
      });
    });

    it("rejects reason longer than 255 characters", async () => {
      const longReason = "A".repeat(256);
      await expect(cancelCustomerOrder(mockPrisma, 1, 1, "CUSTOMER", longReason)).rejects.toMatchObject({
        code: "VALIDATION_ERROR",
        status: 400,
      });
    });
  });

  describe("Authorization & Existence checks", () => {
    it("rejects if order does not exist with 404", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(cancelCustomerOrder(mockPrisma, 999, 1, "CUSTOMER")).rejects.toMatchObject({
        code: "ORDER_NOT_FOUND",
        status: 404,
      });
    });

    it("rejects if customer attempts to cancel another customer's order with 403", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 10,
        customerId: 2, // Belongs to customer 2
        status: "PENDING",
        items: [],
      });

      // Customer 1 attempts cancellation
      await expect(cancelCustomerOrder(mockPrisma, 10, 1, "CUSTOMER")).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });

    it("allows ADMIN to cancel another customer's order", async () => {
      const mockOrder = {
        id: 10,
        orderNumber: "ORD-20261122-0010",
        customerId: 2,
        status: "PENDING",
        paymentStatus: "UNPAID",
        totalAmount: 150.0,
        createdAt: new Date("2026-11-22T09:00:00Z"),
        updatedAt: new Date("2026-11-22T09:00:00Z"),
        customer: { id: 2, name: "Bob Customer", email: "bob@example.com" },
        items: [
          {
            id: 1,
            productId: 5,
            quantity: 2,
            unitPrice: 75.0,
            subtotal: 150.0,
            product: { name: "Test Device", sku: "TEST-DEV" },
          },
        ],
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          order: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: vi.fn().mockResolvedValue({
              ...mockOrder,
              status: "CANCELLED",
              cancelledAt: new Date("2026-11-22T10:00:00Z"),
              cancellationReason: "Admin override",
              paymentStatus: "VOID",
            }),
          },
          product: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await cancelCustomerOrder(mockPrisma, 10, 99, "ADMIN", "Admin override");
      expect(result.status).toBe("CANCELLED");
      expect(result.cancellationReason).toBe("Admin override");
      expect(result.customerName).toBe("Bob Customer");
      expect(result.items[0].productName).toBe("Test Device");
      expect(result.items[0].sku).toBe("TEST-DEV");
    });
  });

  describe("Order status state machine constraints", () => {
    it("rejects cancellation of ACCEPTED order with 409", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 10,
        customerId: 1,
        status: "ACCEPTED",
        items: [],
      });

      await expect(cancelCustomerOrder(mockPrisma, 10, 1, "CUSTOMER")).rejects.toMatchObject({
        code: "ORDER_NOT_CANCELLABLE",
        status: 409,
      });
    });

    it("rejects cancellation of already CANCELLED order with 409", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 10,
        customerId: 1,
        status: "CANCELLED",
        items: [],
      });

      await expect(cancelCustomerOrder(mockPrisma, 10, 1, "CUSTOMER")).rejects.toMatchObject({
        code: "ORDER_NOT_CANCELLABLE",
        status: 409,
      });
    });

    it("rejects cancellation of REJECTED order with 409", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 10,
        customerId: 1,
        status: "REJECTED",
        items: [],
      });

      await expect(cancelCustomerOrder(mockPrisma, 10, 1, "CUSTOMER")).rejects.toMatchObject({
        code: "ORDER_NOT_CANCELLABLE",
        status: 409,
      });
    });
  });

  describe("Atomic inventory restoration & payment state update", () => {
    it("successfully cancels PENDING order, restores stock for each line item, and sets paymentStatus to VOID", async () => {
      const mockOrder = {
        id: 15,
        orderNumber: "ORD-20261122-0015",
        customerId: 1,
        status: "PENDING",
        paymentStatus: "UNPAID",
        totalAmount: 1200.0,
        createdAt: new Date("2026-11-22T08:00:00Z"),
        updatedAt: new Date("2026-11-22T08:00:00Z"),
        customer: { id: 1, name: "Alice Customer", email: "alice@example.com" },
        items: [
          { id: 1, productId: 101, quantity: 2, unitPrice: 500.0, subtotal: 1000.0, product: { name: "Pro Phone", sku: "PHON-PRO" } },
          { id: 2, productId: 102, quantity: 1, unitPrice: 200.0, subtotal: 200.0, product: { name: "Mechanical KB", sku: "KB-MECH" } },
        ],
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      const txProductUpdate = vi.fn().mockResolvedValue({});
      const txOrderUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
      const txOrderFindUniqueOrThrow = vi.fn().mockResolvedValue({
        ...mockOrder,
        status: "CANCELLED",
        cancelledAt: new Date("2026-11-22T10:00:00Z"),
        cancellationReason: "Changed my mind",
        paymentStatus: "VOID",
      });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          order: {
            updateMany: txOrderUpdateMany,
            findUniqueOrThrow: txOrderFindUniqueOrThrow,
          },
          product: {
            update: txProductUpdate,
          },
        };
        return callback(tx);
      });

      const result = await cancelCustomerOrder(mockPrisma, 15, 1, "CUSTOMER", "  Changed my mind  ");

      expect(result.status).toBe("CANCELLED");
      expect(result.cancellationReason).toBe("Changed my mind");
      expect(result.paymentStatus).toBe("VOID");
      expect(result.customerName).toBe("Alice Customer");
      expect(result.items[0].productName).toBe("Pro Phone");

      // Verify atomic inventory increments for both products
      expect(txProductUpdate).toHaveBeenCalledTimes(2);
      expect(txProductUpdate).toHaveBeenCalledWith({
        where: { id: 101 },
        data: { stockQuantity: { increment: 2 } },
      });
      expect(txProductUpdate).toHaveBeenCalledWith({
        where: { id: 102 },
        data: { stockQuantity: { increment: 1 } },
      });
    });

    it("sets paymentStatus to REFUNDED with timestamp if order was PAID", async () => {
      const mockOrder = {
        id: 20,
        orderNumber: "ORD-20261122-0020",
        customerId: 1,
        status: "PENDING",
        paymentStatus: "PAID",
        totalAmount: 300.0,
        createdAt: new Date("2026-11-22T08:00:00Z"),
        updatedAt: new Date("2026-11-22T08:00:00Z"),
        customer: { id: 1, name: "Alice Customer", email: "alice@example.com" },
        items: [{ id: 1, productId: 50, quantity: 3, unitPrice: 100.0, subtotal: 300.0, product: { name: "Charger", sku: "CHG-65W" } }],
      };

      mockPrisma.order.findUnique.mockResolvedValue(mockOrder);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          order: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: vi.fn().mockResolvedValue({
              ...mockOrder,
              status: "CANCELLED",
              cancelledAt: new Date("2026-11-22T10:00:00Z"),
              cancellationReason: null,
              paymentStatus: "REFUNDED",
              refundedAt: new Date("2026-11-22T10:00:00Z"),
            }),
          },
          product: {
            update: vi.fn().mockResolvedValue({}),
          },
        };
        return callback(tx);
      });

      const result = await cancelCustomerOrder(mockPrisma, 20, 1, "CUSTOMER");
      expect(result.status).toBe("CANCELLED");
      expect(result.paymentStatus).toBe("REFUNDED");
      expect(result.items[0].sku).toBe("CHG-65W");
    });

    it("handles race condition if order was accepted between existence check and transaction", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 30,
        customerId: 1,
        status: "PENDING",
        items: [],
      });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          order: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }), // Another writer claimed it first!
            findUnique: vi.fn().mockResolvedValue({
              id: 30,
              status: "ACCEPTED",
            }),
          },
        };
        return callback(tx);
      });

      await expect(cancelCustomerOrder(mockPrisma, 30, 1, "CUSTOMER")).rejects.toMatchObject({
        code: "ORDER_NOT_CANCELLABLE",
        status: 409,
      });
    });
  });
});
