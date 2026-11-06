import React from "react";
import { useNavigate } from "react-router-dom";
import { OrderData } from "../../types/order";
import { formatUSD } from "../../utils/currency";

interface OrderConfirmationModalProps {
  order: OrderData | null;
  onClose: () => void;
}

export const OrderConfirmationModal: React.FC<OrderConfirmationModalProps> = ({ order, onClose }) => {
  const navigate = useNavigate();

  if (!order) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.65)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2100,
        padding: "16px",
      }}
      data-testid="order-confirmation-modal"
    >
      <div
        className="tt-card"
        style={{
          maxWidth: "520px",
          width: "100%",
          backgroundColor: "#FFFFFF",
          borderRadius: "10px",
          padding: "28px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
          animation: "tt-slide-up 0.2s ease-out",
        }}
      >
        {/* Header with success checkmark */}
        <div style={{ textAlign: "center", marginBottom: "20px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              backgroundColor: "#EAF6EF",
              color: "#006B3C",
              fontSize: "24px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 12px auto",
              border: "2px solid #006B3C",
            }}
          >
            ✓
          </div>
          <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px 0", color: "#1A2E22" }}>
            Order Placed Successfully!
          </h2>
          <p style={{ margin: 0, color: "#718096", fontSize: "14px" }}>
            Inventory has been reserved atomically. Store operators will review your order.
          </p>
        </div>

        {/* Order Identifier Banner */}
        <div
          style={{
            backgroundColor: "#F7FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "8px",
            padding: "14px 18px",
            marginBottom: "20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", color: "#718096", display: "block", textTransform: "uppercase" }}>
              Order Reference Number
            </span>
            <span
              data-testid="confirmed-order-number"
              style={{ fontSize: "16px", fontWeight: 700, fontFamily: "monospace", color: "#006B3C" }}
            >
              {order.orderNumber}
            </span>
          </div>

          <span
            data-testid="order-status-badge"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "#FEFCBF",
              color: "#B7791F",
              border: "1px solid #F6E05E",
            }}
          >
            {order.status}
          </span>
        </div>

        {/* Itemized Line Items */}
        <div style={{ maxHeight: "200px", overflowY: "auto", marginBottom: "20px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #E2E8F0", color: "#718096", textAlign: "left" }}>
                <th style={{ paddingBottom: "6px" }}>Item</th>
                <th style={{ paddingBottom: "6px", textAlign: "center" }}>Qty</th>
                <th style={{ paddingBottom: "6px", textAlign: "right" }}>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} style={{ borderBottom: "1px solid #EDF2F7" }}>
                  <td style={{ padding: "8px 0" }}>
                    <div style={{ fontWeight: 600, color: "#2D3748" }}>{item.productName}</div>
                    <div style={{ fontSize: "11px", color: "#A0AEC0", fontFamily: "monospace" }}>{item.sku}</div>
                  </td>
                  <td style={{ padding: "8px 0", textAlign: "center", color: "#4A5568" }}>
                    {item.quantity}
                  </td>
                  <td style={{ padding: "8px 0", textAlign: "right", fontWeight: 600, color: "#1A2E22" }}>
                    {formatUSD(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grand Total */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "12px",
            borderTop: "2px solid #E2E8F0",
            marginBottom: "24px",
          }}
        >
          <span style={{ fontSize: "15px", fontWeight: 600, color: "#2D3748" }}>Grand Total:</span>
          <span
            data-testid="confirmed-total-amount"
            style={{ fontSize: "20px", fontWeight: 700, color: "#006B3C" }}
          >
            {formatUSD(order.totalAmount)}
          </span>
        </div>

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/orders");
            }}
            className="tt-btn tt-btn-primary"
            data-testid="view-orders-btn"
            style={{ flex: 1, padding: "10px", fontSize: "14px", fontWeight: 600 }}
          >
            View My Orders
          </button>
          <button
            type="button"
            onClick={onClose}
            className="tt-btn"
            data-testid="continue-shopping-btn"
            style={{ flex: 1, padding: "10px", fontSize: "14px", fontWeight: 600 }}
          >
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationModal;

