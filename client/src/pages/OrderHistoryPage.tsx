import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyOrdersApi } from "../api";
import { OrderData } from "../types/order";
import { formatUSD } from "../utils/currency";

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getMyOrdersApi();
      setOrders(res.data);
    } catch (err: any) {
      console.error("Failed to fetch order history:", err);
      setError(err.message || "Failed to load order history.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const renderStatusBadge = (status: OrderData["status"]) => {
    switch (status) {
      case "ACCEPTED":
        return (
          <span
            data-testid="order-status-badge"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "#EAF6EF",
              color: "#0B7A46",
              border: "1px solid #C6E7D2",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ✓ Accepted
          </span>
        );
      case "REJECTED":
        return (
          <span
            data-testid="order-status-badge"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "#FFF5F5",
              color: "#C53030",
              border: "1px solid #FEB2B2",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ✕ Rejected
          </span>
        );
      case "PENDING":
      default:
        return (
          <span
            data-testid="order-status-badge"
            style={{
              fontSize: "12px",
              fontWeight: 700,
              padding: "4px 10px",
              borderRadius: "12px",
              backgroundColor: "#FEFCBF",
              color: "#975A16",
              border: "1px solid #F6E05E",
              display: "inline-flex",
              alignItems: "center",
              gap: "4px",
            }}
          >
            ⏳ Pending
          </span>
        );
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 20px" }}>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "24px",
          borderBottom: "1px solid #EDF2F7",
          paddingBottom: "18px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: "#1A2E22",
              margin: "0 0 6px 0",
            }}
          >
            My Orders
          </h1>
          <p style={{ margin: 0, color: "#718096", fontSize: "14px" }}>
            Track your everyday electronics orders and review preserved purchase receipts.
          </p>
        </div>

        <Link
          to="/"
          className="tt-btn tt-btn-primary"
          style={{ textDecoration: "none", padding: "8px 16px", fontSize: "14px" }}
        >
          + Assemble New Order
        </Link>
      </div>

      {/* Error Banner */}
      {error && (
        <div
          className="tt-alert tt-alert-error"
          data-testid="orders-error-banner"
          style={{
            padding: "14px",
            backgroundColor: "#FFF5F5",
            color: "#C53030",
            border: "1px solid #FEB2B2",
            borderRadius: "8px",
            marginBottom: "24px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span>⚠️ {error}</span>
          <button
            type="button"
            onClick={fetchOrders}
            className="tt-btn tt-btn-danger"
            style={{ height: "32px", fontSize: "12px", padding: "0 12px" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "#718096", fontSize: "15px" }}>Loading your orders...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && orders.length === 0 && (
        <div
          className="tt-card"
          data-testid="orders-empty-state"
          style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
          }}
        >
          <span style={{ fontSize: "42px", display: "block", marginBottom: "12px" }}>📦</span>
          <h3 style={{ fontSize: "18px", color: "#2D3748", marginBottom: "8px" }}>No Orders Yet</h3>
          <p style={{ color: "#718096", fontSize: "14px", marginBottom: "20px" }}>
            You haven't placed any electronics orders yet. Browse our catalog to assemble an order!
          </p>
          <Link
            to="/"
            className="tt-btn tt-btn-primary"
            style={{ textDecoration: "none", padding: "10px 22px" }}
          >
            Explore TechTent Catalog
          </Link>
        </div>
      )}

      {/* Orders List */}
      {!loading && !error && orders.length > 0 && (
        <div
          data-testid="orders-list"
          style={{ display: "flex", flexDirection: "column", gap: "16px" }}
        >
          {orders.map((order) => {
            const formattedDate = new Date(order.createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            });

            const totalDevices =
              order.itemCount ||
              order.items?.reduce((sum, i) => sum + i.quantity, 0) ||
              order.items?.length ||
              1;

            return (
              <div
                key={order.id}
                className="tt-card"
                data-testid={`order-card-${order.orderNumber}`}
                style={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E2E8F0",
                  borderRadius: "8px",
                  padding: "20px",
                  boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "12px",
                    borderBottom: "1px solid #EDF2F7",
                    paddingBottom: "14px",
                    marginBottom: "14px",
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <span
                        data-testid={`order-number-${order.orderNumber}`}
                        style={{
                          fontFamily: "monospace",
                          fontSize: "15px",
                          fontWeight: 700,
                          color: "#1A2E22",
                          backgroundColor: "#F7FAFC",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          border: "1px solid #E2E8F0",
                        }}
                      >
                        {order.orderNumber}
                      </span>
                      {renderStatusBadge(order.status)}
                    </div>
                    <span style={{ fontSize: "13px", color: "#718096" }}>
                      Placed on {formattedDate}
                    </span>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: "11px", color: "#718096", textTransform: "uppercase" }}>
                      Authoritative Total
                    </div>
                    <span
                      data-testid={`order-total-${order.orderNumber}`}
                      style={{ fontSize: "20px", fontWeight: 700, color: "#006B3C" }}
                    >
                      {formatUSD(order.totalAmount)}
                    </span>
                  </div>
                </div>

                {/* Items Summary Preview */}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: "260px" }}>
                    <span style={{ fontSize: "12px", color: "#718096", display: "block", marginBottom: "4px" }}>
                      {totalDevices} {totalDevices === 1 ? "device" : "devices"} in order:
                    </span>
                    <div style={{ fontSize: "14px", color: "#2D3748", fontWeight: 500 }}>
                      {order.items && order.items.length > 0 ? (
                        order.items.map((i) => `${i.quantity}x ${i.productName}`).join(" • ")
                      ) : (
                        <span>{order.lineItemCount || 1} line items</span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="tt-btn tt-btn-primary"
                    data-testid={`view-receipt-btn-${order.orderNumber}`}
                    style={{
                      padding: "8px 18px",
                      fontSize: "13px",
                      fontWeight: 600,
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}
                  >
                    {order.status === "ACCEPTED" ? "📄 View Order Receipt" : "🔍 View Order Details"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryPage;
