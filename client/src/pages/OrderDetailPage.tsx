import React, { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate, useLocation } from "react-router-dom";
import { getOrderByIdApi, cancelOrderApi, payOrderApi, processOperatorOrderApi } from "../api";
import { OrderData, FulfillmentStatus } from "../types/order";
import { formatUSD } from "../utils/currency";
import { AuthContext } from "../context/AuthContext";
import RejectOrderDialog from "../components/operator/RejectOrderDialog";

export const OrderDetailPage: React.FC<{ operatorView?: boolean }> = ({ operatorView = false }) => {
  const auth = useContext(AuthContext);
  const isOperator = operatorView || auth?.user?.role === "OPERATOR" || auth?.user?.role === "ADMIN";
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cancellation state (F-07)
  const [showCancelModal, setShowCancelModal] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>("");
  const [cancelling, setCancelling] = useState<boolean>(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);

  // Payment state (F-08)
  const [showPayModal, setShowPayModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>("SIMULATED_CARD");
  const [paying, setPaying] = useState<boolean>(false);
  const [payError, setPayError] = useState<string | null>(null);
  const [paySuccess, setPaySuccess] = useState<string | null>(null);

  // Operator fulfillment action state
  const [processingOperatorAction, setProcessingOperatorAction] = useState<boolean>(false);
  const [operatorActionError, setOperatorActionError] = useState<string | null>(null);
  const [operatorActionNotice, setOperatorActionNotice] = useState<string | null>(null);
  const [showRejectDialog, setShowRejectDialog] = useState<boolean>(false);

  const navigate = useNavigate();
  const location = useLocation();
  const queueSearch = location.state?.operatorQueueSearch;
  const returnPath = isOperator
    ? `/operator/orders${typeof queueSearch === "string" && queueSearch.startsWith("?") ? queueSearch : ""}`
    : "/orders";
  const returnLabel = isOperator ? "← Return to Operator Queue" : "My Orders";

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    getOrderByIdApi(id)
      .then((res) => {
        setOrder(res.data);
      })
      .catch((err: any) => {
        console.error("Failed to load order receipt:", err);
        setError(err.message || "Order not found or permission denied.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  useEffect(() => {
    if (order) {
      document.title = `Receipt - ${order.orderNumber} | TechTent`;
    } else {
      document.title = "TechTent - Everyday Electronics";
    }
    return () => {
      document.title = "TechTent - Everyday Electronics";
    };
  }, [order]);

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await cancelOrderApi(order.id, cancelReason);
      setOrder((prev) => (prev ? { ...prev, ...res.data } : res.data));
      setShowCancelModal(false);
      setCancelSuccess("Your order has been successfully cancelled.");
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel order.");
    } finally {
      setCancelling(false);
    }
  };

  const handlePayOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setPaying(true);
    setPayError(null);
    try {
      const res = await payOrderApi(order.id, selectedPaymentMethod);
      setOrder((prev) => (prev ? { ...prev, ...res.data } : res.data));
      setShowPayModal(false);
      const methodName =
        selectedPaymentMethod === "SIMULATED_PROMPTPAY"
          ? "PromptPay"
          : selectedPaymentMethod === "SIMULATED_MOCK"
          ? "Mock"
          : "Credit Card";
      setPaySuccess(`Payment of ${formatUSD(order.totalAmount)} received via ${methodName}.`);
    } catch (err: any) {
      setPayError(err.message || "Failed to process payment.");
    } finally {
      setPaying(false);
    }
  };

  const handleOperatorAction = async (targetStatus: FulfillmentStatus) => {
    if (!order || processingOperatorAction) return;
    setProcessingOperatorAction(true);
    setOperatorActionError(null);
    setOperatorActionNotice(null);
    try {
      await processOperatorOrderApi(order.id, targetStatus);
      setShowRejectDialog(false);
      const updated = await getOrderByIdApi(order.id);
      setOrder(updated.data);
      setOperatorActionNotice(
        targetStatus === "ACCEPTED"
          ? `Order ${order.orderNumber} accepted.`
          : targetStatus === "PACKED"
          ? `Order ${order.orderNumber} marked as packed.`
          : targetStatus === "SHIPPED"
          ? `Order ${order.orderNumber} marked as shipped.`
          : `Order ${order.orderNumber} rejected. Reserved inventory has been restored.`
      );
    } catch (err: any) {
      setOperatorActionError(err.message || "Failed to update order status.");
    } finally {
      setProcessingOperatorAction(false);
    }
  };

  const renderPaymentBadge = (status?: string) => {
    switch (status) {
      case "PAID":
        return (
          <span
            data-testid="order-receipt-payment-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "var(--color-pale-green, #EAF6EF)",
              color: "var(--color-primary-green, #006B3C)",
              border: "1px solid #C6E7D2",
            }}
          >
            💳 Paid
          </span>
        );
      case "REFUNDED":
        return (
          <span
            data-testid="order-receipt-payment-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "#EBF8FF",
              color: "#2B6CB0",
              border: "1px solid #BEE3F8",
            }}
          >
            ↩ Refunded
          </span>
        );
      case "VOID":
        return (
          <span
            data-testid="order-receipt-payment-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "var(--color-readonly-bg, #F0F4F1)",
              color: "var(--color-text-muted, #718096)",
              border: "1px solid var(--color-border, #E2E8F0)",
            }}
          >
            ✕ Void
          </span>
        );
      case "UNPAID":
      default:
        return (
          <span
            data-testid="order-receipt-payment-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "var(--color-warning-bg, #FEFCBF)",
              color: "var(--color-warning, #D69E2E)",
              border: "1px solid #F6E05E",
            }}
          >
            ⚠️ Unpaid
          </span>
        );
    }
  };

  const renderStatusBadge = (status: OrderData["status"]) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span
            data-testid="order-receipt-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "var(--color-pale-green, #EAF6EF)",
              color: "var(--color-primary-green, #006B3C)",
              border: "1px solid #C6E7D2",
            }}
          >
            ✓ Accepted
          </span>
        );
      case "PACKED":
        return (
          <span
            data-testid="order-receipt-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "#EBF8FF",
              color: "#2B6CB0",
              border: "1px solid #BEE3F8",
            }}
          >
            📦 Packed
          </span>
        );
      case "SHIPPED":
        return (
          <span
            data-testid="order-receipt-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "#FAF5FF",
              color: "#6B46C1",
              border: "1px solid #E9D8FD",
            }}
          >
            🚚 Shipped
          </span>
        );
      case "REJECTED":
        return (
          <span
            data-testid="order-receipt-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "var(--color-error-bg, #FFF5F5)",
              color: "var(--color-error, #C53030)",
              border: "1px solid var(--color-urgent-border, #FEB2B2)",
            }}
          >
            ✕ Rejected
          </span>
        );
      case "CANCELLED":
        return (
          <span
            data-testid="order-receipt-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "var(--color-error-bg, #FFF5F5)",
              color: "var(--color-error, #C53030)",
              border: "1px solid var(--color-urgent-border, #FEB2B2)",
            }}
          >
            ✕ Cancelled
          </span>
        );
      case "PENDING":
      default:
        return (
          <span
            data-testid="order-receipt-status"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "var(--color-warning-bg, #FEFCBF)",
              color: "var(--color-warning, #D69E2E)",
              border: "1px solid #F6E05E",
            }}
          >
            ⏳ Pending Confirmation
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "800px", margin: "60px auto", textAlign: "center" }}>
        <p style={{ color: "var(--color-text-muted, #718096)", fontSize: "16px" }}>Loading order receipt...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div style={{ maxWidth: "600px", margin: "60px auto", padding: "0 20px" }}>
        <div
          className="tt-card"
          data-testid="order-error-card"
          style={{
            backgroundColor: "var(--color-surface, #FFFFFF)",
            border: "1px solid var(--color-urgent-border, #FEB2B2)",
            borderRadius: "var(--radius-md, 8px)",
            padding: "36px 24px",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🔒</span>
          <h2 style={{ fontSize: "20px", color: "var(--color-error, #C53030)", marginBottom: "8px" }}>
            Access Restricted
          </h2>
          <p
            data-testid="order-error-message"
            style={{ color: "var(--color-text-main, #1A2E22)", fontSize: "14px", marginBottom: "24px" }}
          >
            {error || "Order not found or permission denied."}
          </p>
          <Link
            to={returnPath}
            className="tt-btn tt-btn-primary"
            style={{ textDecoration: "none", padding: "10px 24px" }}
          >
            ← Return to {returnLabel}
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // Robust pricing calculations for receipt view (CR-LAB7-01 / BR-01)
  const itemsSum = order.items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
  const rawSubtotal = Number(order.subtotal) > 0 ? Number(order.subtotal) : itemsSum;

  let discountVal = Number(order.discountAmount || 0);
  let discountRate = 0;
  if (discountVal === 0 && rawSubtotal >= 500) {
    discountRate = rawSubtotal >= 1000 ? 0.10 : 0.05;
    discountVal = Math.round(rawSubtotal * discountRate * 100) / 100;
  } else if (discountVal > 0 && rawSubtotal > 0) {
    discountRate = rawSubtotal >= 1000 ? 0.10 : 0.05;
  }

  const netMerchandise = rawSubtotal - discountVal;
  const shippingVal = order.shippingFee !== undefined && Number(order.shippingFee) >= 0
    ? Number(order.shippingFee)
    : (netMerchandise >= 200 ? 0 : 15.00);

  const grandTotalVal = Number(order.totalAmount) < rawSubtotal && Number(order.totalAmount) > 0
    ? Number(order.totalAmount)
    : (discountVal > 0 ? Math.round((netMerchandise + shippingVal) * 100) / 100 : Number(order.totalAmount));

  return (
    <div className="receipt-page-container" style={{ maxWidth: "840px", margin: "0 auto", padding: "28px 20px" }}>
      {/* Top Navigation Breadcrumb */}
      <div className="no-print" style={{ marginBottom: "20px" }}>
        <Link
          to={returnPath}
          data-testid="back-to-orders-link"
          style={{
            textDecoration: "none",
            color: "var(--color-primary-green, #006B3C)",
            fontWeight: 600,
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Back to {operatorView ? "Operator Queue" : "Order History"}
        </Link>
      </div>

      {/* Notifications */}
      {cancelSuccess && (
        <div
          data-testid="cancel-success-banner"
          style={{
            backgroundColor: "var(--color-pale-green, #EAF6EF)",
            borderLeft: "4px solid var(--color-primary-green, #006B3C)",
            color: "var(--color-primary-green, #006B3C)",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm, 6px)",
            marginBottom: "16px",
            fontSize: "14px",
            boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))",
          }}
        >
          <strong>Success: </strong> {cancelSuccess}
        </div>
      )}

      {paySuccess && (
        <div
          data-testid="pay-success-banner"
          style={{
            backgroundColor: "var(--color-pale-green, #EAF6EF)",
            borderLeft: "4px solid var(--color-primary-green, #006B3C)",
            color: "var(--color-primary-green, #006B3C)",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm, 6px)",
            marginBottom: "16px",
            fontSize: "14px",
            boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))",
          }}
        >
          <strong>Success: </strong> {paySuccess}
        </div>
      )}

      {operatorActionNotice && (
        <div
          data-testid="operator-action-notice"
          style={{
            backgroundColor: "var(--color-pale-green, #EAF6EF)",
            borderLeft: "4px solid var(--color-primary-green, #006B3C)",
            color: "var(--color-primary-green, #006B3C)",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm, 6px)",
            marginBottom: "16px",
            fontSize: "14px",
            boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))",
          }}
        >
          <strong>Success: </strong> {operatorActionNotice}
        </div>
      )}

      {operatorActionError && (
        <div
          data-testid="operator-action-error"
          style={{
            backgroundColor: "var(--color-error-bg, #FFF5F5)",
            borderLeft: "4px solid var(--color-error, #C53030)",
            color: "var(--color-error, #C53030)",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm, 6px)",
            marginBottom: "16px",
            fontSize: "14px",
            boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))",
          }}
        >
          <strong>Error: </strong> {operatorActionError}
        </div>
      )}

      {/* Main Printable Receipt Card */}
      <div
        className="tt-card tt-receipt-card"
        data-testid="order-receipt-card"
        style={{
          backgroundColor: "var(--color-surface, #FFFFFF)",
          border: "1px solid var(--color-border, #E2E8F0)",
          borderRadius: "var(--radius-md, 8px)",
          padding: "32px",
          boxShadow: "var(--shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.08))",
        }}
      >
        {/* Receipt Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: "16px",
            borderBottom: "2px solid var(--color-primary-green, #006B3C)",
            paddingBottom: "20px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "var(--color-text-main, #1A2E22)", marginBottom: "4px" }}>
              ⛺ TechTent Electronics
            </div>
            <div style={{ fontSize: "13px", color: "var(--color-text-muted, #718096)" }}>
              {order.status === "ACCEPTED"
                ? "Official Customer Purchase Receipt & Fulfillment Order"
                : order.status === "REJECTED"
                ? "Customer Order Summary & Rejection Notice"
                : order.status === "CANCELLED"
                ? "Customer Order Summary & Cancellation Notice"
                : "Customer Order Details & Fulfillment Status"}
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              data-testid="order-receipt-number"
              style={{
                fontFamily: "monospace",
                fontSize: "16px",
                fontWeight: 700,
                color: "var(--color-text-main, #1A2E22)",
                backgroundColor: "var(--color-readonly-bg, #F0F4F1)",
                padding: "4px 10px",
                borderRadius: "var(--radius-sm, 4px)",
                border: "1px solid var(--color-border, #E2E8F0)",
                display: "inline-block",
                marginBottom: "6px",
              }}
            >
              {order.orderNumber}
            </div>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", flexWrap: "wrap" }}>
              {renderPaymentBadge(order.paymentStatus)}
              {renderStatusBadge(order.status)}
            </div>
          </div>
        </div>

        {/* Cancellation Details Banner */}
        {order.status === "CANCELLED" && (
          <div
            data-testid="cancellation-details-banner"
            style={{
              backgroundColor: "var(--color-error-bg, #FFF5F5)",
              border: "1px solid var(--color-urgent-border, #FEB2B2)",
              borderRadius: "var(--radius-sm, 6px)",
              padding: "16px 20px",
              marginBottom: "24px",
              fontSize: "14px",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--color-error, #C53030)", marginBottom: "6px", fontSize: "15px" }}>
              Order Cancelled
            </div>
            <div style={{ color: "var(--color-text-main, #1A2E22)" }}>
              {order.cancelledAt && (
                <div style={{ marginBottom: "4px" }}>
                  <strong>Cancelled Date:</strong> {new Date(order.cancelledAt).toLocaleString()}
                </div>
              )}
              {order.cancellationReason && (
                <div style={{ marginBottom: "4px" }}>
                  <strong>Reason:</strong> {order.cancellationReason}
                </div>
              )}
              {order.paymentStatus && (
                <div style={{ marginBottom: "4px" }}>
                  <strong>Payment Status:</strong> {order.paymentStatus}
                </div>
              )}
              <div style={{ fontSize: "12px", color: "var(--color-text-muted, #718096)", marginTop: "6px" }}>
                This order has been cancelled and will not be processed or delivered.
              </div>
            </div>
          </div>
        )}

        {/* Metadata Summary Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            backgroundColor: "var(--color-readonly-bg, #F0F4F1)",
            borderRadius: "var(--radius-sm, 6px)",
            padding: "16px 20px",
            marginBottom: "28px",
            border: "1px solid var(--color-border, #E2E8F0)",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted, #718096)", display: "block", textTransform: "uppercase" }}>
              Order Date
            </span>
            <span
              data-testid="order-receipt-date"
              style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main, #1A2E22)" }}
            >
              {formattedDate}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted, #718096)", display: "block", textTransform: "uppercase" }}>
              Customer Details
            </span>
            <span
              data-testid="order-receipt-customer"
              style={{ fontSize: "13px", fontWeight: 600, color: "var(--color-text-main, #1A2E22)" }}
            >
              {order.customerName || "Customer Account"}
            </span>
            {order.customerEmail && (
              <span style={{ fontSize: "12px", color: "var(--color-text-muted, #718096)", display: "block" }}>
                {order.customerEmail}
              </span>
            )}
          </div>

          <div>
            <span style={{ fontSize: "11px", color: "var(--color-text-muted, #718096)", display: "block", textTransform: "uppercase" }}>
              Payment Information
            </span>
            <div style={{ marginTop: "4px" }}>
              {renderPaymentBadge(order.paymentStatus)}
            </div>
            {order.paymentMethod && (
              <span data-testid="order-receipt-payment-method" style={{ fontSize: "12px", color: "var(--color-text-main, #1A2E22)", display: "block", marginTop: "4px" }}>
                Method: <strong>{order.paymentMethod === "SIMULATED_CARD" ? "Credit Card (Simulated)" : order.paymentMethod === "SIMULATED_PROMPTPAY" ? "PromptPay (Simulated)" : order.paymentMethod}</strong>
              </span>
            )}
            {order.paidAt && (
              <span data-testid="order-receipt-paid-at" style={{ fontSize: "11px", color: "var(--color-text-muted, #718096)", display: "block", marginTop: "2px" }}>
                Paid Date: {new Date(order.paidAt).toLocaleString()}
              </span>
            )}
            {order.refundedAt && (
              <span data-testid="order-receipt-refunded-at" style={{ fontSize: "11px", color: "var(--color-error, #C53030)", display: "block", marginTop: "2px" }}>
                Refunded: {new Date(order.refundedAt).toLocaleString()}
              </span>
            )}
          </div>
        </div>

        {/* Volume Discount Banner */}
        {discountVal > 0 && (
          <div
            data-testid="order-savings-banner"
            style={{
              backgroundColor: "#F0FFF4",
              border: "1px solid #C6F6D5",
              borderRadius: "8px",
              padding: "14px 18px",
              marginBottom: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              color: "#22543D",
              flexWrap: "wrap",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ fontSize: "24px" }}>🎉</span>
              <div>
                <strong style={{ fontSize: "15px", display: "block", color: "#22543D" }}>
                  Tiered Volume Discount Applied ({discountRate * 100}% off)
                </strong>
                <span style={{ fontSize: "13px", color: "#2F855A" }}>
                  You saved {formatUSD(discountVal)} on this order with complimentary free shipping!
                </span>
              </div>
            </div>
            <span
              style={{
                fontSize: "13px",
                fontWeight: 700,
                backgroundColor: "#006B3C",
                color: "#FFFFFF",
                padding: "6px 12px",
                borderRadius: "16px",
              }}
            >
              Saved -{formatUSD(discountVal)}
            </span>
          </div>
        )}

        {/* Itemized Table */}
        <div style={{ overflowX: "auto", marginBottom: "28px" }}>
          <table
            data-testid="order-items-table"
            style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid var(--color-border, #E2E8F0)" }}>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "var(--color-text-muted, #718096)", textTransform: "uppercase" }}>
                  Item Description
                </th>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "var(--color-text-muted, #718096)", textTransform: "uppercase" }}>
                  SKU
                </th>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "var(--color-text-muted, #718096)", textTransform: "uppercase", textAlign: "right" }}>
                  Unit Price
                </th>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "var(--color-text-muted, #718096)", textTransform: "uppercase", textAlign: "center" }}>
                  Qty
                </th>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "var(--color-text-muted, #718096)", textTransform: "uppercase", textAlign: "right" }}>
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  data-testid={`receipt-row-${item.sku}`}
                  style={{ borderBottom: "1px solid var(--color-border, #E2E8F0)" }}
                >
                  <td style={{ padding: "14px 8px" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--color-text-main, #1A2E22)" }}>
                      {item.productName}
                    </div>
                  </td>
                  <td style={{ padding: "14px 8px" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "var(--color-text-muted, #718096)",
                        backgroundColor: "var(--color-readonly-bg, #F0F4F1)",
                        padding: "2px 6px",
                        borderRadius: "var(--radius-sm, 4px)",
                        border: "1px solid var(--color-border, #E2E8F0)",
                      }}
                    >
                      {item.sku}
                    </span>
                  </td>
                  <td
                    data-testid={`item-price-${item.sku}`}
                    style={{ padding: "14px 8px", textAlign: "right", fontSize: "14px", color: "var(--color-text-main, #1A2E22)" }}
                  >
                    {formatUSD(item.unitPrice)}
                  </td>
                  <td
                    data-testid={`item-qty-${item.sku}`}
                    style={{ padding: "14px 8px", textAlign: "center", fontSize: "14px", fontWeight: 600 }}
                  >
                    {item.quantity}
                  </td>
                  <td
                    data-testid={`item-subtotal-${item.sku}`}
                    style={{ padding: "14px 8px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: "var(--color-primary-green, #006B3C)" }}
                  >
                    {discountRate > 0 && (
                      <span
                        style={{
                          textDecoration: "line-through",
                          color: "#A0AEC0",
                          fontSize: "12px",
                          marginRight: "6px",
                          fontWeight: 400,
                        }}
                      >
                        {formatUSD(item.subtotal)}
                      </span>
                    )}
                    <span>{formatUSD(parseFloat(item.subtotal) * (1 - discountRate))}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "28px" }}>
          <div style={{ width: "100%", maxWidth: "340px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "var(--color-text-muted, #718096)" }}>
              <span>Items Subtotal:</span>
              <span data-testid="order-receipt-subtotal">{formatUSD(rawSubtotal)}</span>
            </div>
            {discountVal > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "var(--color-primary-green, #006B3C)", fontWeight: 600 }}>
                <span>Volume Discount ({discountRate * 100}% off):</span>
                <span data-testid="order-receipt-discount">-{formatUSD(discountVal)}</span>
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "var(--color-text-muted, #718096)" }}>
              <span>Standard Electronics Delivery:</span>
              <span data-testid="order-receipt-shipping" style={{ color: shippingVal > 0 ? "var(--color-text-main, #1A2E22)" : "var(--color-secondary-green, #0B7A46)", fontWeight: 600 }}>
                {shippingVal > 0 ? formatUSD(shippingVal) : "FREE"}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "12px 0 6px 0",
                borderTop: "2px solid var(--color-border, #E2E8F0)",
                marginTop: "6px",
              }}
            >
              <span style={{ fontSize: "16px", fontWeight: 700, color: "var(--color-text-main, #1A2E22)" }}>Grand Total:</span>
              <div style={{ textAlign: "right" }}>
                {discountVal > 0 && (
                  <span
                    data-testid="order-receipt-original-total"
                    style={{
                      fontSize: "15px",
                      color: "#A0AEC0",
                      textDecoration: "line-through",
                      marginRight: "8px",
                      fontWeight: 500,
                    }}
                  >
                    {formatUSD(rawSubtotal + shippingVal)}
                  </span>
                )}
                <span
                  data-testid="order-receipt-grand-total"
                  style={{ fontSize: "22px", fontWeight: 700, color: "var(--color-primary-green, #006B3C)" }}
                >
                  {formatUSD(grandTotalVal)}
                </span>
                {discountVal > 0 && (
                  <div style={{ fontSize: "12px", color: "var(--color-primary-green, #006B3C)", fontWeight: 700, marginTop: "2px" }}>
                    Total Savings: -{formatUSD(discountVal)}
                  </div>
                )}
              </div>
            </div>
            <p style={{ fontSize: "11px", color: "var(--color-text-muted, #718096)", margin: "8px 0 0 0", lineHeight: 1.4 }}>
              * Historical purchase-time unit prices are locked authoritatively in the system.
            </p>
          </div>
        </div>

        {/* Footer Actions (Hidden on Print) */}
        <div
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderTop: "1px solid var(--color-border, #E2E8F0)",
            paddingTop: "20px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => window.print()}
              className="tt-btn"
              style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 600 }}
            >
              🖨️ Print Receipt
            </button>

            {/* Cancel Order Button: Visible for Customer on PENDING orders */}
            {order.status === "PENDING" && !isOperator && (
              <button
                type="button"
                data-testid="cancel-order-btn"
                onClick={() => {
                  setCancelReason("");
                  setCancelError(null);
                  setShowCancelModal(true);
                }}
                style={{
                  padding: "8px 18px",
                  fontSize: "13px",
                  fontWeight: 600,
                  backgroundColor: "var(--color-surface, #FFFFFF)",
                  color: "var(--color-error, #C53030)",
                  border: "1px solid var(--color-urgent-border, #FEB2B2)",
                  borderRadius: "var(--radius-sm, 6px)",
                  cursor: "pointer",
                  transition: "background-color 0.15s ease",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-error-bg, #FFF5F5)")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface, #FFFFFF)")}
              >
                Cancel Order
              </button>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {isOperator ? (
              <>
                {order.status === "PENDING" && (
                  <>
                    <button
                      type="button"
                      data-testid="operator-reject-btn"
                      className="tt-btn tt-btn-danger"
                      disabled={processingOperatorAction}
                      onClick={() => {
                        setOperatorActionError(null);
                        setShowRejectDialog(true);
                      }}
                      style={{ padding: "9px 18px", fontSize: "13px", fontWeight: 600 }}
                    >
                      Reject Order
                    </button>
                    <button
                      type="button"
                      data-testid="operator-accept-btn"
                      className="tt-btn tt-btn-primary"
                      disabled={processingOperatorAction}
                      onClick={() => handleOperatorAction("ACCEPTED")}
                      style={{ padding: "9px 20px", fontSize: "13px", fontWeight: 700 }}
                    >
                      {processingOperatorAction ? "Processing..." : "Accept Order"}
                    </button>
                  </>
                )}
                {order.status === "ACCEPTED" && (
                  <button
                    type="button"
                    data-testid="operator-mark-packed-btn"
                    className="tt-btn tt-btn-primary"
                    disabled={processingOperatorAction}
                    onClick={() => handleOperatorAction("PACKED")}
                    style={{ padding: "9px 20px", fontSize: "13px", fontWeight: 700 }}
                  >
                    {processingOperatorAction ? "Processing..." : "Mark Packed"}
                  </button>
                )}
                {order.status === "PACKED" && (
                  <button
                    type="button"
                    data-testid="operator-mark-shipped-btn"
                    className="tt-btn tt-btn-primary"
                    disabled={processingOperatorAction}
                    onClick={() => handleOperatorAction("SHIPPED")}
                    style={{ padding: "9px 20px", fontSize: "13px", fontWeight: 700 }}
                  >
                    {processingOperatorAction ? "Processing..." : "Mark Shipped"}
                  </button>
                )}
              </>
            ) : (
              /* Pay Now Button (F-08): Placed on the right side for customer */
              order.paymentStatus === "UNPAID" &&
              order.status !== "CANCELLED" &&
              order.status !== "REJECTED" && (
                <button
                  type="button"
                  data-testid="pay-now-btn"
                  onClick={() => {
                    setPayError(null);
                    setSelectedPaymentMethod("SIMULATED_CARD");
                    setShowPayModal(true);
                  }}
                  className="tt-btn tt-btn-primary"
                  style={{
                    padding: "9px 22px",
                    fontSize: "14px",
                    fontWeight: 700,
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  💳 Pay Now (Simulated)
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Modal: Customer Cancellation (F-07) */}
      {showCancelModal && (
        <div
          data-testid="cancel-order-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface, #FFFFFF)",
              borderRadius: "var(--radius-lg, 12px)",
              maxWidth: "480px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid var(--color-border, #E2E8F0)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px 0", color: "var(--color-text-main, #1A2E22)" }}>
              Cancel Order {order.orderNumber}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-muted, #718096)", marginBottom: "16px" }}>
              Are you sure you want to cancel this order? This action cannot be undone.
            </p>

            {cancelError && (
              <div
                data-testid="cancel-error-banner"
                style={{
                  backgroundColor: "var(--color-error-bg, #FFF5F5)",
                  color: "var(--color-error, #C53030)",
                  border: "1px solid var(--color-urgent-border, #FEB2B2)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm, 6px)",
                  fontSize: "13px",
                  marginBottom: "14px",
                }}
              >
                {cancelError}
              </div>
            )}

            <form onSubmit={handleCancelOrder}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                  Reason for Cancellation (Optional)
                </label>
                <textarea
                  data-testid="cancel-reason-input"
                  rows={3}
                  maxLength={255}
                  placeholder="e.g. Ordered incorrect model, change of delivery plans..."
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    border: "1px solid var(--color-border-input, #CBD5E0)",
                    borderRadius: "var(--radius-sm, 6px)",
                    fontSize: "14px",
                    fontFamily: "inherit",
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCancelModal(false)}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid var(--color-border-input, #CBD5E0)",
                    borderRadius: "var(--radius-sm, 6px)",
                    backgroundColor: "#FFF",
                    color: "var(--color-text-main, #1A2E22)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={cancelling}
                  data-testid="confirm-cancel-btn"
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "var(--color-error, #C53030)",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "var(--radius-sm, 6px)",
                    fontWeight: 600,
                    cursor: cancelling ? "not-allowed" : "pointer",
                  }}
                >
                  {cancelling ? "Cancelling..." : "Confirm Cancellation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Operator Reject Order Dialog (F-08) */}
      {showRejectDialog && order && (
        <RejectOrderDialog
          orderNumber={order.orderNumber}
          busy={processingOperatorAction}
          error={operatorActionError}
          onCancel={() => {
            setShowRejectDialog(false);
            setOperatorActionError(null);
          }}
          onConfirm={() => handleOperatorAction("REJECTED")}
        />
      )}

      {/* Modal: Customer Simulated Payment (F-08) */}
      {showPayModal && (
        <div
          data-testid="pay-order-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "16px",
          }}
        >
          <div
            style={{
              backgroundColor: "var(--color-surface, #FFFFFF)",
              borderRadius: "var(--radius-lg, 12px)",
              maxWidth: "480px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
              border: "1px solid var(--color-border, #E2E8F0)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px 0", color: "var(--color-text-main, #1A2E22)" }}>
              Pay Order {order.orderNumber}
            </h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-muted, #718096)", marginBottom: "16px" }}>
              Total Amount Due: <strong style={{ color: "var(--color-primary-green, #006B3C)" }}>{formatUSD(order.totalAmount)}</strong>
            </p>

            {payError && (
              <div
                data-testid="pay-error-banner"
                style={{
                  backgroundColor: "var(--color-error-bg, #FFF5F5)",
                  color: "var(--color-error, #C53030)",
                  border: "1px solid var(--color-urgent-border, #FEB2B2)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm, 6px)",
                  fontSize: "13px",
                  marginBottom: "14px",
                }}
              >
                {payError}
              </div>
            )}

            <form onSubmit={handlePayOrder}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "8px", color: "var(--color-text-main, #1A2E22)" }}>
                  Select Payment Method
                </label>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm, 6px)",
                      border: "1px solid var(--color-border, #E2E8F0)",
                      cursor: "pointer",
                      backgroundColor: selectedPaymentMethod === "SIMULATED_CARD" ? "var(--color-pale-green, #EAF6EF)" : "#FFF",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="SIMULATED_CARD"
                      data-testid="pay-method-card"
                      checked={selectedPaymentMethod === "SIMULATED_CARD"}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    />
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-main, #1A2E22)" }}>
                      💳 Credit / Debit Card (Simulated)
                    </span>
                  </label>

                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      padding: "10px 14px",
                      borderRadius: "var(--radius-sm, 6px)",
                      border: "1px solid var(--color-border, #E2E8F0)",
                      cursor: "pointer",
                      backgroundColor: selectedPaymentMethod === "SIMULATED_PROMPTPAY" ? "var(--color-pale-green, #EAF6EF)" : "#FFF",
                    }}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="SIMULATED_PROMPTPAY"
                      data-testid="pay-method-promptpay"
                      checked={selectedPaymentMethod === "SIMULATED_PROMPTPAY"}
                      onChange={(e) => setSelectedPaymentMethod(e.target.value)}
                    />
                    <span style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-main, #1A2E22)" }}>
                      📱 PromptPay QR (Simulated)
                    </span>
                  </label>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setShowPayModal(false)}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid var(--color-border-input, #CBD5E0)",
                    borderRadius: "var(--radius-sm, 6px)",
                    backgroundColor: "#FFF",
                    color: "var(--color-text-main, #1A2E22)",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  data-testid="confirm-pay-btn"
                  className="tt-btn tt-btn-primary"
                  style={{
                    padding: "8px 20px",
                    fontWeight: 600,
                    cursor: paying ? "not-allowed" : "pointer",
                  }}
                >
                  {paying ? "Processing..." : "Complete Payment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
