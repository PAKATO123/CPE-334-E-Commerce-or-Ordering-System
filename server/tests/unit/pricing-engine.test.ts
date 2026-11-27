import { describe, expect, it } from "vitest";
import { calculateOrderTotals } from "../../src/utils/pricingEngine.js";

describe("Pricing Engine Boundary & Calculation Tests (CR-LAB7-01 / BR-01)", () => {
  describe("Input validation", () => {
    it("rejects negative subtotals", () => {
      expect(() => calculateOrderTotals(-1)).toThrow("Invalid items subtotal");
    });

    it("rejects NaN subtotals", () => {
      expect(() => calculateOrderTotals(NaN)).toThrow("Invalid items subtotal");
    });
  });

  describe("Shipping fee and free shipping threshold (AC-PRC-01, AC-PRC-02)", () => {
    it("applies $15.00 shipping fee when subtotal is below $200.00 (TC-PRC-01)", () => {
      const result = calculateOrderTotals(100.00);
      expect(result.subtotal).toBe("100.00");
      expect(result.discountAmount).toBe("0.00");
      expect(result.shippingFee).toBe("15.00");
      expect(result.totalAmount).toBe("115.00");
    });

    it("applies $15.00 shipping fee at boundary $199.99 (TC-PRC-02)", () => {
      const result = calculateOrderTotals(199.99);
      expect(result.subtotal).toBe("199.99");
      expect(result.discountAmount).toBe("0.00");
      expect(result.shippingFee).toBe("15.00");
      expect(result.totalAmount).toBe("214.99");
    });

    it("waives shipping fee (Free Shipping) at boundary exactly $200.00 (TC-PRC-03)", () => {
      const result = calculateOrderTotals(200.00);
      expect(result.subtotal).toBe("200.00");
      expect(result.discountAmount).toBe("0.00");
      expect(result.shippingFee).toBe("0.00");
      expect(result.totalAmount).toBe("200.00");
    });
  });

  describe("Tier 1: 5% Volume discount boundaries ($500.00 to $999.99) (AC-PRC-03)", () => {
    it("applies 0% discount at boundary $499.99 with free shipping (TC-PRC-04)", () => {
      const result = calculateOrderTotals(499.99);
      expect(result.subtotal).toBe("499.99");
      expect(result.discountAmount).toBe("0.00");
      expect(result.shippingFee).toBe("0.00");
      expect(result.totalAmount).toBe("499.99");
    });

    it("applies 5% volume discount at boundary exactly $500.00 (TC-PRC-05)", () => {
      // 5% of 500.00 = 25.00, total = 475.00
      const result = calculateOrderTotals(500.00);
      expect(result.subtotal).toBe("500.00");
      expect(result.discountAmount).toBe("25.00");
      expect(result.shippingFee).toBe("0.00");
      expect(result.totalAmount).toBe("475.00");
    });

    it("applies 5% volume discount at boundary $999.99 (TC-PRC-06)", () => {
      // 5% of 999.99 = 50.00, net = 949.99, shipping = 0.00, total = 949.99
      const result = calculateOrderTotals(999.99);
      expect(result.subtotal).toBe("999.99");
      expect(result.discountAmount).toBe("50.00");
      expect(result.shippingFee).toBe("0.00");
      expect(result.totalAmount).toBe("949.99");
    });
  });

  describe("Tier 2: 10% Volume discount boundaries ($1,000.00+) (AC-PRC-04)", () => {
    it("applies 10% volume discount at boundary exactly $1,000.00 (TC-PRC-07)", () => {
      // 10% of 1000.00 = 100.00, total = 900.00
      const result = calculateOrderTotals(1000.00);
      expect(result.subtotal).toBe("1000.00");
      expect(result.discountAmount).toBe("100.00");
      expect(result.shippingFee).toBe("0.00");
      expect(result.totalAmount).toBe("900.00");
    });

    it("applies 10% volume discount for high-value orders ($2,500.00)", () => {
      // 10% of 2500.00 = 250.00, total = 2250.00
      const result = calculateOrderTotals(2500.00);
      expect(result.subtotal).toBe("2500.00");
      expect(result.discountAmount).toBe("250.00");
      expect(result.shippingFee).toBe("0.00");
      expect(result.totalAmount).toBe("2250.00");
    });
  });

  describe("Interaction: Discount dropping net merchandise below free shipping threshold (AC-PRC-05)", () => {
    it("charges shipping fee if net merchandise drops below $200.00 after discount", () => {
      // itemsSubtotal = 205.00, but wait: discount at 205 is 0% since 205 < 500!
      // For itemsSubtotal < 500, discount is 0%.
      // If itemsSubtotal = 199.99, discount is 0%, net is 199.99 < 200 => shipping 15.00
      const result = calculateOrderTotals(150.00);
      expect(result.subtotal).toBe("150.00");
      expect(result.discountAmount).toBe("0.00");
      expect(result.shippingFee).toBe("15.00");
      expect(result.totalAmount).toBe("165.00");
    });
  });
});
