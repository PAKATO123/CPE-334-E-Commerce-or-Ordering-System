/**
 * Pricing Engine Utility - Lab 7 (CR-LAB7-01 / BR-01 Revised)
 *
 * Authoritative Server-Side Calculation with Tiered Volume Discounts & Free Shipping Threshold:
 * 1. Subtotal: Authoritative sum of all line items (unitPrice * quantity)
 * 2. Volume Discount:
 *    - Tier 2 (>= $1,000.00): 10% discount on merchandise subtotal
 *    - Tier 1 (>= $500.00 and < $1,000.00): 5% discount on merchandise subtotal
 *    - Tier 0 (< $500.00): 0% discount
 * 3. Shipping Fee:
 *    - Free Shipping ($0.00) if net merchandise (subtotal - discountAmount) >= $200.00
 *    - Flat Delivery Fee ($15.00) if net merchandise < $200.00
 * 4. Grand Total:
 *    - totalAmount = round(subtotal - discountAmount + shippingFee, 2)
 */

export interface OrderPricingSummary {
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  totalAmount: string;
}

export function serializeOrderPricing(order: {
  usesLab7Pricing: boolean;
  totalAmount: { toFixed: (digits: number) => string };
  subtotal: { toFixed: (digits: number) => string };
  discountAmount: { toFixed: (digits: number) => string };
  shippingFee: { toFixed: (digits: number) => string };
}): OrderPricingSummary {
  const totalAmount = order.totalAmount.toFixed(2);
  return {
    subtotal: order.usesLab7Pricing ? order.subtotal.toFixed(2) : totalAmount,
    discountAmount: order.usesLab7Pricing ? order.discountAmount.toFixed(2) : "0.00",
    shippingFee: order.usesLab7Pricing ? order.shippingFee.toFixed(2) : "0.00",
    totalAmount,
  };
}

export function calculateOrderTotals(itemsSubtotal: number): OrderPricingSummary {
  if (!Number.isFinite(itemsSubtotal) || itemsSubtotal < 0) {
    throw new Error("Invalid items subtotal");
  }

  // 1. Merchandise subtotal
  const subtotal = Number(itemsSubtotal.toFixed(2));

  // 2. Tiered volume discount
  let discountRate = 0;
  if (subtotal >= 1000) {
    discountRate = 0.10;
  } else if (subtotal >= 500) {
    discountRate = 0.05;
  }
  const discountAmount = Number((subtotal * discountRate).toFixed(2));

  // 3. Logistics & Free shipping threshold
  const netMerchandise = Number((subtotal - discountAmount).toFixed(2));
  const shippingFee = netMerchandise >= 200 ? 0 : 15.00;

  // 4. Authoritative Grand Total
  const totalAmount = Number((netMerchandise + shippingFee).toFixed(2));

  return {
    subtotal: subtotal.toFixed(2),
    discountAmount: discountAmount.toFixed(2),
    shippingFee: shippingFee.toFixed(2),
    totalAmount: totalAmount.toFixed(2),
  };
}
