import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  simulateOrderPayment,
  PaymentError,
  isSupportedPaymentMethod,
} from "../../src/services/payment.js";

describe("Payment State Machine Unit Tests (F-08)", () => {
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      order: {
        findUnique: vi.fn(),
      },
      $transaction: vi.fn(),
    };
  });

  describe("Validation boundaries & method predicates", () => {
    it("accepts supported payment methods", () => {
      expect(isSupportedPaymentMethod("SIMULATED_CARD")).toBe(true);
      expect(isSupportedPaymentMethod("SIMULATED_PROMPTPAY")).toBe(true);
      expect(isSupportedPaymentMethod("SIMULATED_MOCK")).toBe(true);
    });

    it("rejects unsupported or malformed payment methods", () => {
      expect(isSupportedPaymentMethod("BITCOIN")).toBe(false);
      expect(isSupportedPaymentMethod("")).toBe(false);
      expect(isSupportedPaymentMethod(null)).toBe(false);
      expect(isSupportedPaymentMethod(undefined)).toBe(false);
      expect(isSupportedPaymentMethod(123)).toBe(false);
    });

    it("rejects non-positive order IDs with 400", async () => {
      await expect(
        simulateOrderPayment(mockPrisma, 0, 1, "CUSTOMER", "SIMULATED_CARD")
      ).rejects.toMatchObject({
        code: "INVALID_ID",
        status: 400,
      });

      await expect(
        simulateOrderPayment(mockPrisma, -1, 1, "CUSTOMER", "SIMULATED_CARD")
      ).rejects.toMatchObject({
        code: "INVALID_ID",
        status: 400,
      });

      await expect(
        simulateOrderPayment(mockPrisma, 2.5, 1, "CUSTOMER", "SIMULATED_CARD")
      ).rejects.toMatchObject({
        code: "INVALID_ID",
        status: 400,
      });
    });

    it("rejects unsupported payment method in simulateOrderPayment with 400", async () => {
      await expect(
        simulateOrderPayment(mockPrisma, 1, 1, "CUSTOMER", "INVALID_METHOD")
      ).rejects.toMatchObject({
        code: "INVALID_PAYMENT_METHOD",
        status: 400,
      });
    });
  });

  describe("Authorization & Existence checks", () => {
    it("rejects with 404 when order does not exist", async () => {
      mockPrisma.order.findUnique.mockResolvedValue(null);

      await expect(
        simulateOrderPayment(mockPrisma, 999, 1, "CUSTOMER", "SIMULATED_CARD")
      ).rejects.toMatchObject({
        code: "ORDER_NOT_FOUND",
        status: 404,
      });
    });

    it("rejects with 403 when customer attempts to pay another customer's order", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 10,
        customerId: 2, // Belongs to customer 2
        status: "PENDING",
        paymentStatus: "UNPAID",
      });

      await expect(
        simulateOrderPayment(mockPrisma, 10, 1, "CUSTOMER", "SIMULATED_CARD")
      ).rejects.toMatchObject({
        code: "FORBIDDEN",
        status: 403,
      });
    });

    it("permits ADMIN to simulate payment for any customer's order", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 10,
        customerId: 2,
        status: "PENDING",
        paymentStatus: "UNPAID",
      });

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          order: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: vi.fn().mockResolvedValue({
              id: 10,
              orderNumber: "ORD-20261122-0010",
              customerId: 2,
              status: "PENDING",
              paymentStatus: "PAID",
              paymentMethod: "SIMULATED_CARD",
              paidAt: new Date(),
              totalAmount: 199.99,
              createdAt: new Date(),
              updatedAt: new Date(),
              customer: { id: 2, name: "Other Customer", email: "other@example.com" },
              items: [],
            }),
          },
        };
        return callback(tx);
      });

      const res = await simulateOrderPayment(mockPrisma, 10, 999, "ADMIN", "SIMULATED_CARD");
      expect(res.paymentStatus).toBe("PAID");
      expect(res.paymentMethod).toBe("SIMULATED_CARD");
    });
  });

  describe("State machine guards", () => {
    it("rejects with 422 when order is CANCELLED", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 15,
        customerId: 1,
        status: "CANCELLED",
        paymentStatus: "UNPAID",
      });

      await expect(
        simulateOrderPayment(mockPrisma, 15, 1, "CUSTOMER", "SIMULATED_CARD")
      ).rejects.toMatchObject({
        code: "CANNOT_PAY_TERMINAL_ORDER",
        status: 422,
      });
    });

    it("rejects with 422 when order is REJECTED", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 16,
        customerId: 1,
        status: "REJECTED",
        paymentStatus: "UNPAID",
      });

      await expect(
        simulateOrderPayment(mockPrisma, 16, 1, "CUSTOMER", "SIMULATED_CARD")
      ).rejects.toMatchObject({
        code: "CANNOT_PAY_TERMINAL_ORDER",
        status: 422,
      });
    });

    it("rejects with 409 when order has already been PAID", async () => {
      mockPrisma.order.findUnique.mockResolvedValue({
        id: 17,
        customerId: 1,
        status: "PENDING",
        paymentStatus: "PAID",
      });

      await expect(
        simulateOrderPayment(mockPrisma, 17, 1, "CUSTOMER", "SIMULATED_CARD")
      ).rejects.toMatchObject({
        code: "ORDER_ALREADY_PAID",
        status: 409,
      });
    });
  });

  describe("Successful payment transaction", () => {
    it("atomically transitions UNPAID order to PAID and populates paidAt and paymentMethod", async () => {
      const existing = {
        id: 20,
        orderNumber: "ORD-20261122-0020",
        customerId: 1,
        status: "PENDING",
        paymentStatus: "UNPAID",
      };
      mockPrisma.order.findUnique.mockResolvedValue(existing);

      mockPrisma.$transaction.mockImplementation(async (callback: any) => {
        const tx = {
          order: {
            updateMany: vi.fn().mockResolvedValue({ count: 1 }),
            findUniqueOrThrow: vi.fn().mockResolvedValue({
              id: 20,
              orderNumber: "ORD-20261122-0020",
              customerId: 1,
              status: "PENDING",
              paymentStatus: "PAID",
              paymentMethod: "SIMULATED_PROMPTPAY",
              paidAt: new Date("2026-11-22T10:00:00Z"),
              totalAmount: 499.0,
              createdAt: new Date("2026-11-22T09:00:00Z"),
              updatedAt: new Date("2026-11-22T10:00:00Z"),
              customer: { id: 1, name: "Alice", email: "alice@example.com" },
              items: [
                {
                  id: 1,
                  productId: 10,
                  product: { name: "Mechanical Keyboard", sku: "KB-MECH-01" },
                  quantity: 1,
                  unitPrice: 499.0,
                  subtotal: 499.0,
                },
              ],
            }),
          },
        };
        return callback(tx);
      });

      const result = await simulateOrderPayment(
        mockPrisma,
        20,
        1,
        "CUSTOMER",
        "SIMULATED_PROMPTPAY"
      );

      expect(result.status).toBe("PENDING");
      expect(result.paymentStatus).toBe("PAID");
      expect(result.paymentMethod).toBe("SIMULATED_PROMPTPAY");
      expect(result.paidAt).toBe("2026-11-22T10:00:00.000Z");
      expect(result.items).toHaveLength(1);
      expect(result.items[0].productName).toBe("Mechanical Keyboard");
    });
  });
});
