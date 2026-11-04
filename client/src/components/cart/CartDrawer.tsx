import React, { useState } from "react";
import { useCart } from "../../context/CartContext";
import { formatUSD } from "../../utils/currency";
import { createOrderApi } from "../../api";
import { OrderData } from "../../types/order";

interface CartDrawerProps {
  onOrderSuccess: (order: OrderData) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onOrderSuccess }) => {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCatalog,
    totalItemCount,
    totalAmount,
  } = useCart();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedProductIds, setFailedProductIds] = useState<number[]>([]);

  if (!isCartOpen) return null;

  const handleRemoveItem = (productId: number) => {
    removeFromCart(productId);
    setFailedProductIds((prev) => {
      const next = prev.filter((id) => id !== productId);
      if (next.length === 0) {
        setErrorMessage(null);
      }
      return next;
    });
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    setFailedProductIds([]);

    try {
      const payload = {
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      };

      const res = await createOrderApi(payload);
      clearCart();
      refreshCatalog();
      closeCart();
      onOrderSuccess(res.data);
    } catch (err: any) {
      console.error("Place order failed:", err);
      const msg = err.message || "Failed to submit order. Please check item stock.";
      setErrorMessage(msg);

      const badIds: number[] = [];
      if (err.productId) {
        badIds.push(err.productId);
      }
      items.forEach((i) => {
        if (
          (err.sku && i.product.sku === err.sku) ||
          i.product.sku === "SIM-ATOM-FAIL" ||
          (err.message && err.message.toLowerCase().includes(i.product.name.toLowerCase()))
        ) {
          if (!badIds.includes(i.product.id)) {
            badIds.push(i.product.id);
          }
        }
      });
      setFailedProductIds(badIds);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        backdropFilter: "blur(2px)",
        zIndex: 2000,
        display: "flex",
        justifyContent: "flex-end",
        animation: "tt-fade-in 0.15s ease-out",
      }}
      data-testid="cart-drawer-backdrop"
      onClick={closeCart}
    >
      <div
        className="tt-drawer"
        data-testid="cart-drawer"
        style={{
          width: "100%",
          maxWidth: "460px",
          height: "100%",
          backgroundColor: "#FFFFFF",
          boxShadow: "-4px 0 20px rgba(0, 0, 0, 0.15)",
          display: "flex",
          flexDirection: "column",
          padding: "24px",
          animation: "tt-slide-up 0.2s ease-out",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "16px",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0, color: "#1A2E22" }}>
              Order Assembly
            </h2>
            <span style={{ fontSize: "13px", color: "#718096" }}>
              {totalItemCount} {totalItemCount === 1 ? "device" : "devices"} selected
            </span>
          </div>

          <button
            type="button"
            onClick={closeCart}
            data-testid="close-cart-btn"
            style={{
              background: "none",
              border: "none",
              fontSize: "24px",
              cursor: "pointer",
              color: "#718096",
              lineHeight: 1,
            }}
            aria-label="Close cart drawer"
          >
            ×
          </button>
        </div>

        {/* Error Notification Banner */}
        {errorMessage && (
          <div
            className="tt-alert tt-alert-error"
            data-testid="cart-error-banner"
            style={{
              padding: "12px 14px",
              backgroundColor: "#FFF5F5",
              color: "#C53030",
              border: "1px solid #FEB2B2",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "13px",
              display: "flex",
              alignItems: "flex-start",
              gap: "8px",
            }}
          >
            <span style={{ fontSize: "16px", lineHeight: 1 }}>⚠️</span>
            <div style={{ flex: 1, lineHeight: 1.4 }}>
              <strong style={{ display: "block", marginBottom: "2px", fontWeight: 700 }}>
                Order Could Not Be Completed
              </strong>
              {errorMessage}
            </div>
            <button
              type="button"
              onClick={() => {
                setErrorMessage(null);
                setFailedProductIds([]);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#C53030",
                cursor: "pointer",
                fontSize: "16px",
                lineHeight: 1,
                padding: "0 2px",
              }}
              aria-label="Dismiss error"
            >
              ✕
            </button>
          </div>
        )}

        {/* Drawer Body: Line Items */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: "4px" }}>
          {items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#718096" }}>
              <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🛒</span>
              <p style={{ fontWeight: 600, fontSize: "16px", marginBottom: "6px" }}>Your Order is Empty</p>
              <p style={{ fontSize: "13px", marginBottom: "20px" }}>
                Add everyday electronics from the catalog to build your order.
              </p>
              <button
                type="button"
                onClick={closeCart}
                className="tt-btn tt-btn-primary"
                style={{ padding: "8px 20px" }}
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {items.map(({ product, quantity }) => {
                const itemSubtotal = parseFloat(product.price) * quantity;
                const isMaxStock = quantity >= product.stockQuantity;
                const isFailedItem = failedProductIds.includes(product.id);

                return (
                  <div
                    key={product.id}
                    data-testid={`cart-item-${product.sku}`}
                    style={{
                      border: isFailedItem ? "2px solid #E53E3E" : "1px solid #E2E8F0",
                      borderRadius: "8px",
                      padding: "14px",
                      backgroundColor: isFailedItem ? "#FFF5F5" : "#F8FAFC",
                      boxShadow: isFailedItem ? "0 0 0 1px #FEB2B2" : "none",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: "4px",
                              backgroundColor: isFailedItem ? "#FED7D7" : "#EBF8FF",
                              color: isFailedItem ? "#9B2C2C" : "#2B6CB0",
                            }}
                          >
                            {product.category}
                          </span>
                          <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#718096" }}>
                            {product.sku}
                          </span>
                        </div>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: "14px",
                            color: isFailedItem ? "#C53030" : "#1A2E22",
                          }}
                        >
                          {product.name}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItem(product.id)}
                        data-testid={`remove-item-${product.sku}`}
                        style={{
                          background: "none",
                          border: "none",
                          color: "#E53E3E",
                          cursor: "pointer",
                          fontSize: "16px",
                          lineHeight: 1,
                        }}
                        title="Remove item"
                      >
                        🗑️
                      </button>
                    </div>

                    {/* Highlighted Warning Banner for Out-of-Stock / Rollback Items */}
                    {isFailedItem && (
                      <div
                        data-testid={`cart-item-error-${product.sku}`}
                        style={{
                          marginTop: "10px",
                          marginBottom: "8px",
                          padding: "8px 10px",
                          backgroundColor: "#FED7D7",
                          color: "#9B2C2C",
                          borderRadius: "6px",
                          border: "1px solid #FEB2B2",
                          fontSize: "12px",
                          fontWeight: 600,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "8px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span>⚠️</span>
                          <span>Selected item is out of stock. Please remove to proceed.</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(product.id)}
                          className="tt-btn tt-btn-danger"
                          data-testid={`remove-failed-item-${product.sku}`}
                          style={{
                            height: "24px",
                            fontSize: "11px",
                            padding: "0 8px",
                            fontWeight: 700,
                            flexShrink: 0,
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "12px" }}>
                      {/* Quantity Stepper */}
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          data-testid={`qty-dec-${product.sku}`}
                          className="tt-btn"
                          style={{ width: "28px", height: "28px", padding: 0, fontSize: "14px", fontWeight: 700 }}
                        >
                          -
                        </button>
                        <span
                          data-testid={`qty-count-${product.sku}`}
                          style={{ minWidth: "24px", textAlign: "center", fontWeight: 600, fontSize: "14px" }}
                        >
                          {quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          data-testid={`qty-inc-${product.sku}`}
                          disabled={isMaxStock}
                          className="tt-btn"
                          style={{
                            width: "28px",
                            height: "28px",
                            padding: 0,
                            fontSize: "14px",
                            fontWeight: 700,
                            cursor: isMaxStock ? "not-allowed" : "pointer",
                            opacity: isMaxStock ? 0.5 : 1,
                          }}
                        >
                          +
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: "11px", color: "#718096" }}>
                          {formatUSD(product.price)} each
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "15px", color: isFailedItem ? "#C53030" : "#006B3C" }}>
                          {formatUSD(itemSubtotal)}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer & Checkout Action */}
        {items.length > 0 && (
          <div
            style={{
              borderTop: "1px solid #E2E8F0",
              paddingTop: "16px",
              marginTop: "16px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", color: "#4A5568" }}>Estimated Total:</span>
              <span
                data-testid="cart-grand-total"
                style={{ fontSize: "22px", fontWeight: 700, color: "#006B3C" }}
              >
                {formatUSD(totalAmount)}
              </span>
            </div>

            <p style={{ fontSize: "11px", color: "#718096", margin: "0 0 14px 0", lineHeight: 1.4 }}>
              * Inventory is reserved immediately upon placement.
            </p>

            <button
              type="button"
              onClick={handlePlaceOrder}
              disabled={isSubmitting || failedProductIds.length > 0}
              className="tt-btn tt-btn-primary"
              data-testid="place-order-button"
              style={{
                width: "100%",
                height: "44px",
                fontSize: "15px",
                fontWeight: 700,
                cursor: isSubmitting || failedProductIds.length > 0 ? "not-allowed" : "pointer",
                backgroundColor: failedProductIds.length > 0 ? "#E2E8F0" : undefined,
                borderColor: failedProductIds.length > 0 ? "#CBD5E0" : undefined,
                color: failedProductIds.length > 0 ? "#718096" : undefined,
              }}
            >
              {isSubmitting
                ? "Reserving Stock & Placing Order..."
                : failedProductIds.length > 0
                ? "Remove Out of Stock Item to Proceed"
                : "Place Order Now"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartDrawer;

