/**
 * Pricing Engine Utility - Pre-Change Sprint 1 Baseline
 *
 * Implemented behavior from Sprint 1 baseline:
 * Strictly linear pricing: totalAmount = itemsSubtotal.
 * No volume discounts, no shipping fees.
 */

export interface OrderPricingSummary {
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
}

export function calculateOrderTotals(itemsSubtotal: number): OrderPricingSummary {
  if (typeof itemsSubtotal !== "number" || isNaN(itemsSubtotal) || itemsSubtotal < 0) {
    throw new Error("Invalid items subtotal");
  }

  // Pre-change Sprint 1 behavior: linear pricing only
  const subtotalStr = itemsSubtotal.toFixed(2);
  return {
    subtotal: subtotalStr,
    discountAmount: "0.00",
    shippingFee: "0.00",
    totalAmount: subtotalStr,
  };
}
