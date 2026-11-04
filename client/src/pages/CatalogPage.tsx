import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Product, CategoryFilter } from "../types/product";
import { getProductsApi, getCategoriesApi } from "../api";
import ProductCard from "../components/catalog/ProductCard";

interface ToastNotificationItem {
  id: number;
  title: string;
  text: string;
  sku?: string;
  timestamp: number;
}

export const CatalogPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotificationItem[]>([]);

  const fetchCatalog = async () => {
    setLoading(true);
    setError(null);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        getProductsApi({
          category: selectedCategory !== "All" ? selectedCategory : undefined,
          search: searchQuery.trim() || undefined,
        }),
        getCategoriesApi().catch(() => ({ data: [] })),
      ]);

      setProducts(productsRes.data);
      if (categoriesRes.data.length > 0 && categories.length === 0) {
        setCategories(categoriesRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load catalog:", err);
      setError(err.message || "Unable to load product catalog.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCatalog();
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setLoading(true);
    getProductsApi({
      category: selectedCategory !== "All" ? selectedCategory : undefined,
    })
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  const removeToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAddToCart = (product: Product, quantity: number = 1) => {
    // Anonymous user redirection: prompt login before cart interaction
    if (!user) {
      navigate("/login");
      return;
    }

    const toastId = Date.now() + Math.random();
    const newToast: ToastNotificationItem = {
      id: toastId,
      title: "Added to Order",
      text: `${quantity}x ${product.name}`,
      sku: product.sku,
      timestamp: Date.now(),
    };

    // Prepend so index 0 is always the newest item (at the bottom of column-reverse)
    setToasts((prev) => [newToast, ...prev].slice(0, 4));

    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      removeToast(toastId);
    }, 4000);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 20px" }}>
      {/* Stacked Bottom-Right Notifications (Old pushes up, New arrives at bottom) */}
      {toasts.length > 0 && (
        <div
          className="tt-toast-stack"
          role="status"
          aria-live="polite"
          data-testid="toast-stack-container"
        >
          {toasts.map((toast, index) => {
            const isNewest = index === 0;
            return (
              <div
                key={toast.id}
                className={`tt-toast-item ${isNewest ? "tt-toast-item-new" : "tt-toast-item-old"}`}
                data-testid="toast-notification"
                data-toast-sku={toast.sku}
                style={{
                  transform: isNewest ? "none" : `scale(${Math.max(0.92, 1 - index * 0.03)})`,
                }}
              >
                {/* Status Indicator Icon */}
                <div
                  style={{
                    width: "22px",
                    height: "22px",
                    borderRadius: "50%",
                    backgroundColor: isNewest ? "#006B3C" : "#718096",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    fontWeight: 700,
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  ✓
                </div>

                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "2px" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: "14px",
                        color: isNewest ? "#006B3C" : "#2D3748",
                      }}
                    >
                      {toast.title}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: "4px",
                        backgroundColor: isNewest ? "#006B3C" : "#E2E8F0",
                        color: isNewest ? "#FFFFFF" : "#4A5568",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {isNewest ? "NEW" : "PREVIOUS"}
                    </span>
                  </div>

                  <div style={{ fontSize: "13px", color: isNewest ? "#1A2E22" : "#4A5568", lineHeight: 1.4 }}>
                    {toast.text}
                  </div>
                </div>

                {/* Dismiss Button */}
                <button
                  type="button"
                  onClick={() => removeToast(toast.id)}
                  data-testid="close-toast-btn"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "18px",
                    lineHeight: 1,
                    padding: "0 2px",
                    color: isNewest ? "#006B3C" : "#718096",
                  }}
                  aria-label="Close notification"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Hero / Header Section */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1A2E22", marginBottom: "6px" }}>
          Everyday Tech Essentials
        </h1>
        <p style={{ color: "#718096", fontSize: "15px", margin: 0 }}>
          High-performance electronics, smartphones, displays, and accessories with real-time stock availability.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "16px",
          marginBottom: "24px",
          backgroundColor: "#FFFFFF",
          padding: "16px 20px",
          borderRadius: "8px",
          border: "1px solid #E2E8F0",
        }}
      >
        {/* Category Pills */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "13px", fontWeight: 600, color: "#4A5568", marginRight: "4px" }}>
            Category:
          </span>
          <button
            type="button"
            onClick={() => setSelectedCategory("All")}
            className="tt-btn"
            style={{
              height: "32px",
              padding: "0 14px",
              fontSize: "13px",
              fontWeight: 600,
              borderRadius: "16px",
              backgroundColor: selectedCategory === "All" ? "#006B3C" : "#EDF2F7",
              color: selectedCategory === "All" ? "#FFFFFF" : "#2D3748",
              borderColor: selectedCategory === "All" ? "#006B3C" : "#CBD5E0",
              cursor: "pointer",
            }}
          >
            All Items
          </button>

          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className="tt-btn"
                style={{
                  height: "32px",
                  padding: "0 14px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "16px",
                  backgroundColor: isSelected ? "#006B3C" : "#EDF2F7",
                  color: isSelected ? "#FFFFFF" : "#2D3748",
                  borderColor: isSelected ? "#006B3C" : "#CBD5E0",
                  cursor: "pointer",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Search Input Form */}
        <form onSubmit={handleSearchSubmit} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search phones, TV, keyboards..."
            style={{
              padding: "8px 12px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid #CBD5E0",
              outline: "none",
              width: "220px",
            }}
          />
          <button
            type="submit"
            className="tt-btn tt-btn-primary"
            style={{ height: "36px", padding: "0 14px", fontSize: "13px", cursor: "pointer" }}
          >
            Search
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="tt-btn"
              style={{ height: "36px", padding: "0 10px", fontSize: "12px", cursor: "pointer" }}
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Error Alert */}
      {error && (
        <div
          className="tt-alert tt-alert-error"
          style={{
            padding: "16px",
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
            onClick={() => fetchCatalog()}
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
          <p style={{ color: "#718096", fontSize: "15px" }}>Loading TechTent inventory...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && products.length === 0 && (
        <div
          className="tt-card"
          style={{
            textAlign: "center",
            padding: "60px 20px",
            backgroundColor: "#FFFFFF",
            borderRadius: "8px",
            border: "1px solid #E2E8F0",
          }}
        >
          <span style={{ fontSize: "36px", display: "block", marginBottom: "12px" }}>🔍</span>
          <h3 style={{ fontSize: "18px", color: "#2D3748", marginBottom: "8px" }}>No Products Found</h3>
          <p style={{ color: "#718096", fontSize: "14px", marginBottom: "16px" }}>
            No electronic devices matched your current filter criteria.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory("All");
              handleClearSearch();
            }}
            className="tt-btn tt-btn-primary"
            style={{ padding: "8px 18px", height: "auto" }}
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Product Grid */}
      {!loading && !error && products.length > 0 && (
        <div
          data-testid="product-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={handleAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
