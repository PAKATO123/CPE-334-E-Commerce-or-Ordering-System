import React, { useEffect, useState } from "react";
import { Product, CategoryFilter } from "../types/product";
import { getProductsApi, getCategoriesApi } from "../api";
import ProductCard from "../components/catalog/ProductCard";

export const CatalogPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
    // Trigger re-fetch without search parameter
    setLoading(true);
    getProductsApi({
      category: selectedCategory !== "All" ? selectedCategory : undefined,
    })
      .then((res) => setProducts(res.data))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "28px 20px" }}>
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
              onAddToCart={(p, qty) => {
                alert(`Added ${qty}x ${p.name} to order preview! (Sprint 1 Order Assembly: Feature 3)`);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default CatalogPage;
