import React from "react";
import { Product } from "../../types/product";
import { formatUSD } from "../../utils/currency";

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product, quantity: number) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.stockQuantity === 0;

  return (
    <div
      className="tt-card tt-product-card"
      data-testid={`product-card-${product.sku}`}
      style={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        borderRadius: "8px",
        border: "1px solid #E2E8F0",
        backgroundColor: "#FFFFFF",
        padding: "20px",
        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
        opacity: isOutOfStock ? 0.75 : 1,
        transition: "transform 0.15s ease, box-shadow 0.15s ease",
      }}
    >
      <div>
        {/* Top Badges: Category & SKU */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              padding: "4px 8px",
              borderRadius: "4px",
              backgroundColor: "#EBF8FF",
              color: "#2B6CB0",
            }}
          >
            {product.category}
          </span>

          <span
            style={{
              fontSize: "11px",
              fontFamily: "monospace",
              color: "#718096",
              backgroundColor: "#F7FAFC",
              padding: "3px 6px",
              borderRadius: "4px",
              border: "1px solid #E2E8F0",
            }}
          >
            {product.sku}
          </span>
        </div>

        {/* Product Title */}
        <h3
          style={{
            fontSize: "17px",
            fontWeight: 600,
            marginBottom: "8px",
            lineHeight: 1.35,
            color: "#1A2E22",
          }}
        >
          {product.name}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: "13px",
            color: "#4A5568",
            marginBottom: "16px",
            lineHeight: 1.5,
            minHeight: "38px",
          }}
        >
          {product.description || "Everyday tech essential."}
        </p>
      </div>

      <div>
        {/* Price & Stock Display */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            marginBottom: "14px",
            paddingTop: "12px",
            borderTop: "1px solid #EDF2F7",
          }}
        >
          <div>
            <span style={{ fontSize: "11px", color: "#718096", display: "block", textTransform: "uppercase" }}>
              Price (USD)
            </span>
            <span
              data-testid="product-price"
              style={{
                fontSize: "20px",
                fontWeight: 700,
                color: "#006B3C",
              }}
            >
              {formatUSD(product.price)}
            </span>
          </div>

          <div>
            {isOutOfStock ? (
              <span
                data-testid="out-of-stock-badge"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "12px",
                  backgroundColor: "#FFF5F5",
                  color: "#C53030",
                  border: "1px solid #FEB2B2",
                }}
              >
                Out of Stock
              </span>
            ) : (
              <span
                data-testid="in-stock-badge"
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  padding: "4px 10px",
                  borderRadius: "12px",
                  backgroundColor: "#EAF6EF",
                  color: "#0B7A46",
                  border: "1px solid #C6E7D2",
                }}
              >
                In Stock ({product.stockQuantity})
              </span>
            )}
          </div>
        </div>

        {/* Action Button */}
        <button
          type="button"
          disabled={isOutOfStock}
          onClick={() => onAddToCart && onAddToCart(product, 1)}
          className={isOutOfStock ? "tt-btn" : "tt-btn tt-btn-primary"}
          data-testid={`add-to-order-btn-${product.sku}`}
          style={{
            width: "100%",
            height: "40px",
            fontWeight: 600,
            fontSize: "14px",
            cursor: isOutOfStock ? "not-allowed" : "pointer",
          }}
        >
          {isOutOfStock ? "Out of Stock" : "Add to Order"}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
