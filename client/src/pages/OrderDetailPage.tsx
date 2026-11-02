import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { getOrderByIdApi } from "../api";
import { OrderData } from "../types/order";
import { formatUSD } from "../utils/currency";

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

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
              backgroundColor: "#EAF6EF",
              color: "#0B7A46",
              border: "1px solid #C6E7D2",
            }}
          >
            ✓ Accepted
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
              backgroundColor: "#FFF5F5",
              color: "#C53030",
              border: "1px solid #FEB2B2",
            }}
          >
            ✕ Rejected
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
              backgroundColor: "#FEFCBF",
              color: "#975A16",
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
        <p style={{ color: "#718096", fontSize: "16px" }}>Loading order receipt...</p>
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
            backgroundColor: "#FFFFFF",
            border: "1px solid #FEB2B2",
            borderRadius: "8px",
            padding: "36px 24px",
            textAlign: "center",
          }}
        >
          <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🔒</span>
          <h2 style={{ fontSize: "20px", color: "#C53030", marginBottom: "8px" }}>
            Access Restricted
          </h2>
          <p
            data-testid="order-error-message"
            style={{ color: "#4A5568", fontSize: "14px", marginBottom: "24px" }}
          >
            {error || "Order not found or permission denied."}
          </p>
          <Link
            to="/orders"
            className="tt-btn tt-btn-primary"
            style={{ textDecoration: "none", padding: "10px 24px" }}
          >
            ← Return to My Orders
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

  return (
    <div className="receipt-page-container" style={{ maxWidth: "840px", margin: "0 auto", padding: "28px 20px" }}>
      {/* Top Navigation Breadcrumb */}
      <div className="no-print" style={{ marginBottom: "20px" }}>
        <Link
          to="/orders"
          data-testid="back-to-orders-link"
          style={{
            textDecoration: "none",
            color: "#006B3C",
            fontWeight: 600,
            fontSize: "14px",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Back to Order History
        </Link>
      </div>

      {/* Main Printable Receipt Card */}
      <div
        className="tt-card tt-receipt-card"
        data-testid="order-receipt-card"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #E2E8F0",
          borderRadius: "8px",
          padding: "32px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
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
            borderBottom: "2px solid #1A2E22",
            paddingBottom: "20px",
            marginBottom: "24px",
          }}
        >
          <div>
            <div style={{ fontSize: "20px", fontWeight: 800, color: "#1A2E22", marginBottom: "4px" }}>
              ⛺ TechTent Electronics
            </div>
            <div style={{ fontSize: "13px", color: "#718096" }}>
              Official Customer Purchase Receipt & Fulfillment Order
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              data-testid="order-receipt-number"
              style={{
                fontFamily: "monospace",
                fontSize: "16px",
                fontWeight: 700,
                color: "#1A2E22",
                backgroundColor: "#F7FAFC",
                padding: "4px 10px",
                borderRadius: "4px",
                border: "1px solid #E2E8F0",
                display: "inline-block",
                marginBottom: "6px",
              }}
            >
              {order.orderNumber}
            </div>
            <div>{renderStatusBadge(order.status)}</div>
          </div>
        </div>

        {/* Metadata Summary Details */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "16px",
            backgroundColor: "#F8FAFC",
            borderRadius: "6px",
            padding: "16px 20px",
            marginBottom: "28px",
            border: "1px solid #EDF2F7",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", color: "#718096", display: "block", textTransform: "uppercase" }}>
              Order Date
            </span>
            <span
              data-testid="order-receipt-date"
              style={{ fontSize: "13px", fontWeight: 600, color: "#2D3748" }}
            >
              {formattedDate}
            </span>
          </div>

          <div>
            <span style={{ fontSize: "11px", color: "#718096", display: "block", textTransform: "uppercase" }}>
              Customer Details
            </span>
            <span
              data-testid="order-receipt-customer"
              style={{ fontSize: "13px", fontWeight: 600, color: "#2D3748" }}
            >
              {order.customerName || "Customer Account"}
            </span>
            {order.customerEmail && (
              <span style={{ fontSize: "12px", color: "#718096", display: "block" }}>
                {order.customerEmail}
              </span>
            )}
          </div>
        </div>

        {/* Itemized Table */}
        <div style={{ overflowX: "auto", marginBottom: "28px" }}>
          <table
            data-testid="order-items-table"
            style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}
          >
            <thead>
              <tr style={{ borderBottom: "2px solid #E2E8F0" }}>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "#718096", textTransform: "uppercase" }}>
                  Item Description
                </th>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "#718096", textTransform: "uppercase" }}>
                  SKU
                </th>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", textAlign: "right" }}>
                  Unit Price
                </th>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", textAlign: "center" }}>
                  Qty
                </th>
                <th style={{ padding: "12px 8px", fontSize: "12px", color: "#718096", textTransform: "uppercase", textAlign: "right" }}>
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr
                  key={item.id}
                  data-testid={`receipt-row-${item.sku}`}
                  style={{ borderBottom: "1px solid #EDF2F7" }}
                >
                  <td style={{ padding: "14px 8px" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "#1A2E22" }}>
                      {item.productName}
                    </div>
                  </td>
                  <td style={{ padding: "14px 8px" }}>
                    <span
                      style={{
                        fontFamily: "monospace",
                        fontSize: "12px",
                        color: "#718096",
                        backgroundColor: "#F7FAFC",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        border: "1px solid #E2E8F0",
                      }}
                    >
                      {item.sku}
                    </span>
                  </td>
                  <td
                    data-testid={`item-price-${item.sku}`}
                    style={{ padding: "14px 8px", textAlign: "right", fontSize: "14px", color: "#4A5568" }}
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
                    style={{ padding: "14px 8px", textAlign: "right", fontSize: "14px", fontWeight: 700, color: "#006B3C" }}
                  >
                    {formatUSD(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals Calculation Summary */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "28px" }}>
          <div style={{ width: "100%", maxWidth: "320px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "#4A5568" }}>
              <span>Items Subtotal:</span>
              <span>{formatUSD(order.totalAmount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: "14px", color: "#4A5568" }}>
              <span>Standard Electronics Delivery:</span>
              <span style={{ color: "#0B7A46", fontWeight: 600 }}>FREE</span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "12px 0 6px 0",
                borderTop: "2px solid #E2E8F0",
                marginTop: "6px",
              }}
            >
              <span style={{ fontSize: "16px", fontWeight: 700, color: "#1A2E22" }}>Grand Total:</span>
              <span
                data-testid="order-receipt-grand-total"
                style={{ fontSize: "22px", fontWeight: 700, color: "#006B3C" }}
              >
                {formatUSD(order.totalAmount)}
              </span>
            </div>
            <p style={{ fontSize: "11px", color: "#718096", margin: "8px 0 0 0", lineHeight: 1.4 }}>
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
            borderTop: "1px solid #EDF2F7",
            paddingTop: "20px",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={() => window.print()}
            className="tt-btn"
            style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 600 }}
          >
            🖨️ Print Receipt
          </button>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => navigate("/orders")}
              className="tt-btn"
              style={{ padding: "8px 18px", fontSize: "13px", fontWeight: 600 }}
            >
              My Orders
            </button>
            <Link
              to="/"
              className="tt-btn tt-btn-primary"
              style={{ textDecoration: "none", padding: "8px 18px", fontSize: "13px" }}
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

