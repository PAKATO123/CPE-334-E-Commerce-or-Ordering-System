import React, { useState, useEffect } from "react";
import { Product, CreateProductPayload, UpdateProductPayload } from "../types/product";
import { getProductsApi, createProductApi, updateProductApi, restockProductApi, getCategoriesApi } from "../api";
import { formatUSD } from "../utils/currency";

const DEFAULT_CATEGORIES = [
  "Smartphones",
  "Tablets",
  "Smart TVs",
  "Keyboards",
  "Chargers & Power",
];

type SortField = "none" | "price" | "stock" | "status";
type SortDirection = "asc" | "desc";

export const ProductManagementPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "Active" | "Inactive">("All");

  // Sorting
  const [sortField, setSortField] = useState<SortField>("none");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockingProduct, setRestockingProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // New product form state
  const [newSku, setNewSku] = useState<string>("");
  const [newName, setNewName] = useState<string>("");
  const [newCategory, setNewCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [newPrice, setNewPrice] = useState<string>("");
  const [newStock, setNewStock] = useState<number>(10);
  const [newDescription, setNewDescription] = useState<string>("");

  // Edit product form state
  const [editName, setEditName] = useState<string>("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editPrice, setEditPrice] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editIsActive, setEditIsActive] = useState<boolean>(true);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setErrorBanner(null);
      const res = await getProductsApi({ includeInactive: true });
      setProducts(res.data);
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await getCategoriesApi();
      if (res.data && res.data.length > 0) {
        const merged = Array.from(new Set([...DEFAULT_CATEGORIES, ...res.data]));
        setCategories(merged);
      }
    } catch {}
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Filter products locally for instant response
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "All" && p.category !== selectedCategory) return false;
    if (statusFilter === "Active" && !p.isActive) return false;
    if (statusFilter === "Inactive" && p.isActive) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = p.name.toLowerCase().includes(q);
      const matchSku = p.sku.toLowerCase().includes(q);
      const matchDesc = p.description?.toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchDesc) return false;
    }
    return true;
  });

  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortField === "none") return 0;
    if (sortField === "price") {
      const priceA = parseFloat(a.price);
      const priceB = parseFloat(b.price);
      return sortDirection === "asc" ? priceA - priceB : priceB - priceA;
    }
    if (sortField === "stock") {
      return sortDirection === "asc" ? a.stockQuantity - b.stockQuantity : b.stockQuantity - a.stockQuantity;
    }
    if (sortField === "status") {
      const statusA = a.isActive ? 1 : 0;
      const statusB = b.isActive ? 1 : 0;
      return sortDirection === "asc" ? statusA - statusB : statusB - statusA;
    }
    return 0;
  });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField("none");
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorBanner(null);
    setSuccessBanner(null);

    const priceNum = parseFloat(newPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorBanner("Price must be a positive number greater than 0.");
      return;
    }

    if (!newSku.trim()) {
      setErrorBanner("SKU is required.");
      return;
    }

    if (newName.trim().length < 3) {
      setErrorBanner("Product name must be at least 3 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateProductPayload = {
        sku: newSku.trim(),
        name: newName.trim(),
        category: newCategory,
        price: priceNum,
        stockQuantity: Math.max(0, Math.floor(newStock)),
        description: newDescription.trim() || undefined,
      };

      const res = await createProductApi(payload);
      setSuccessBanner(`Product '${res.data.name}' (${res.data.sku}) created successfully.`);
      setShowAddModal(false);
      resetAddForm();
      await fetchProducts();
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to create product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetAddForm = () => {
    setNewSku("");
    setNewName("");
    setNewCategory(categories[0] || DEFAULT_CATEGORIES[0]);
    setNewPrice("");
    setNewStock(10);
    setNewDescription("");
  };

  const openEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditCategory(p.category);
    setEditPrice(p.price);
    setEditDescription(p.description || "");
    setEditIsActive(p.isActive);
    setErrorBanner(null);
    setSuccessBanner(null);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setErrorBanner(null);
    setSuccessBanner(null);

    const priceNum = parseFloat(editPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setErrorBanner("Price must be a positive number greater than 0.");
      return;
    }

    if (editName.trim().length < 3) {
      setErrorBanner("Product name must be at least 3 characters.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: UpdateProductPayload = {
        name: editName.trim(),
        category: editCategory,
        price: priceNum,
        description: editDescription.trim() || undefined,
        isActive: editIsActive,
      };

      const res = await updateProductApi(editingProduct.id, payload);
      setSuccessBanner(`Product '${res.data.name}' updated successfully.`);
      setEditingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to update product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingProduct) return;
    setErrorBanner(null);
    setSuccessBanner(null);

    const qty = parseInt(String(restockAmount), 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorBanner("Restock quantity must be a positive integer (at least 1).");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await restockProductApi(restockingProduct.id, qty);
      setSuccessBanner(`Restocked ${res.data.restockedAmount} units for '${res.data.name}'. New stock: ${res.data.newStock}.`);
      setRestockingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to restock product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="product-management-page" style={{ maxWidth: "1200px", margin: "0 auto", padding: "24px 16px" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: "0 0 6px 0", fontSize: "24px", fontWeight: 700, color: "var(--color-text-main, #1A2E22)" }}>
            Catalog & Inventory Management
          </h1>
          <p style={{ margin: 0, color: "var(--color-text-muted, #718096)", fontSize: "14px" }}>
            Add consumer electronics, update device specifications, toggle availability, and restock warehouse stock.
          </p>
        </div>
        <button
          type="button"
          data-testid="add-product-btn"
          onClick={() => {
            resetAddForm();
            setErrorBanner(null);
            setSuccessBanner(null);
            setShowAddModal(true);
          }}
          style={{
            backgroundColor: "var(--color-primary-green, #006B3C)",
            color: "#FFF",
            padding: "10px 18px",
            borderRadius: "var(--radius-sm, 6px)",
            border: "none",
            fontWeight: 600,
            fontSize: "14px",
            cursor: "pointer",
            boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))",
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            transition: "background-color 0.15s ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-secondary-green, #0B7A46)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-primary-green, #006B3C)")}
        >
          <span>+</span> Add New Product
        </button>
      </div>

      {/* Notifications */}
      {errorBanner && (
        <div
          data-testid="mgmt-error-banner"
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
          <strong>Error: </strong> {errorBanner}
        </div>
      )}

      {successBanner && (
        <div
          data-testid="mgmt-success-banner"
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
          <strong>Success: </strong> {successBanner}
        </div>
      )}

      {/* Filter and Search Controls */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          backgroundColor: "var(--color-surface, #FFFFFF)",
          padding: "16px",
          borderRadius: "var(--radius-md, 8px)",
          border: "1px solid var(--color-border, #E2E8F0)",
          boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))",
          marginBottom: "20px",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ flex: "1 1 240px" }}>
          <input
            type="text"
            data-testid="mgmt-search-input"
            placeholder="Search by name, SKU, description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "8px 12px",
              borderRadius: "var(--radius-sm, 6px)",
              border: "1px solid var(--color-border-input, #CBD5E0)",
              fontSize: "14px",
              color: "var(--color-text-main, #1A2E22)",
              backgroundColor: "var(--color-surface, #FFFFFF)",
            }}
          />
        </div>

        <div>
          <select
            data-testid="mgmt-category-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm, 6px)",
              border: "1px solid var(--color-border-input, #CBD5E0)",
              fontSize: "14px",
              backgroundColor: "var(--color-surface, #FFFFFF)",
              color: "var(--color-text-main, #1A2E22)",
            }}
          >
            <option value="All">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            data-testid="mgmt-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm, 6px)",
              border: "1px solid var(--color-border-input, #CBD5E0)",
              fontSize: "14px",
              backgroundColor: "var(--color-surface, #FFFFFF)",
              color: "var(--color-text-main, #1A2E22)",
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Discontinued Only</option>
          </select>
        </div>

        {/* Sort Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <label style={{ fontSize: "13px", color: "var(--color-text-muted, #718096)", fontWeight: 500 }}>Sort:</label>
          <select
            data-testid="mgmt-sort-select"
            value={sortField === "none" ? "none" : `${sortField}-${sortDirection}`}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "none") {
                setSortField("none");
              } else {
                const [field, dir] = val.split("-") as [SortField, SortDirection];
                setSortField(field);
                setSortDirection(dir);
              }
            }}
            style={{
              padding: "8px 12px",
              borderRadius: "var(--radius-sm, 6px)",
              border: "1px solid var(--color-border-input, #CBD5E0)",
              fontSize: "14px",
              backgroundColor: "var(--color-surface, #FFFFFF)",
              color: "var(--color-text-main, #1A2E22)",
            }}
          >
            <option value="none">Default Order</option>
            <option value="price-asc">Price: Low to High</option>
            <option value="price-desc">Price: High to Low</option>
            <option value="stock-asc">In Stock: Low to High</option>
            <option value="stock-desc">In Stock: High to Low</option>
            <option value="status-desc">Status: Active First</option>
            <option value="status-asc">Status: Discontinued First</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", fontSize: "13px", color: "var(--color-text-muted, #718096)" }}>
          Showing {sortedProducts.length} of {products.length} products
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted, #718096)", backgroundColor: "var(--color-surface, #FFFFFF)", borderRadius: "var(--radius-md, 8px)" }}>
          Loading inventory...
        </div>
      ) : sortedProducts.length === 0 ? (
        <div
          data-testid="no-products-message"
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "var(--color-surface, #FFFFFF)",
            borderRadius: "var(--radius-md, 8px)",
            border: "1px solid var(--color-border, #E2E8F0)",
            color: "var(--color-text-muted, #718096)",
          }}
        >
          No products found matching the criteria.
        </div>
      ) : (
        <div style={{ overflowX: "auto", backgroundColor: "var(--color-surface, #FFFFFF)", borderRadius: "var(--radius-md, 8px)", border: "1px solid var(--color-border, #E2E8F0)", boxShadow: "var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.05))" }}>
          <table data-testid="products-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--color-readonly-bg, #F0F4F1)", borderBottom: "1px solid var(--color-border, #E2E8F0)", fontSize: "13px", color: "var(--color-text-main, #1A2E22)" }}>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>SKU</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Product Name</th>
                <th style={{ padding: "12px 16px", fontWeight: 600 }}>Category</th>
                <th
                  data-testid="sort-header-price"
                  onClick={() => toggleSort("price")}
                  style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
                  title="Click to sort by Unit Price"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>Unit Price</span>
                    <span style={{ fontSize: "12px", color: sortField === "price" ? "var(--color-primary-green, #006B3C)" : "var(--color-text-muted, #718096)" }}>
                      {sortField === "price" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </th>
                <th
                  data-testid="sort-header-stock"
                  onClick={() => toggleSort("stock")}
                  style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
                  title="Click to sort by Stock Quantity"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>In Stock</span>
                    <span style={{ fontSize: "12px", color: sortField === "stock" ? "var(--color-primary-green, #006B3C)" : "var(--color-text-muted, #718096)" }}>
                      {sortField === "stock" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </th>
                <th
                  data-testid="sort-header-status"
                  onClick={() => toggleSort("status")}
                  style={{ padding: "12px 16px", fontWeight: 600, cursor: "pointer", userSelect: "none" }}
                  title="Click to sort by Status"
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>Status</span>
                    <span style={{ fontSize: "12px", color: sortField === "status" ? "var(--color-primary-green, #006B3C)" : "var(--color-text-muted, #718096)" }}>
                      {sortField === "status" ? (sortDirection === "asc" ? "▲" : "▼") : "↕"}
                    </span>
                  </div>
                </th>
                <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: 600 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedProducts.map((p) => (
                <tr
                  key={p.id}
                  data-testid={`product-row-${p.id}`}
                  style={{ borderBottom: "1px solid var(--color-border, #E2E8F0)", fontSize: "14px", transition: "background-color 0.15s ease" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F7FAF8")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-main, #1A2E22)" }}>
                    <code style={{ backgroundColor: "var(--color-readonly-bg, #F0F4F1)", border: "1px solid var(--color-border, #E2E8F0)", padding: "2px 6px", borderRadius: "var(--radius-sm, 4px)", fontSize: "12px" }}>
                      {p.sku}
                    </code>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "var(--color-text-main, #1A2E22)" }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: "12px", color: "var(--color-text-muted, #718096)", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontSize: "12px",
                        backgroundColor: "var(--color-pale-green, #EAF6EF)",
                        color: "var(--color-primary-green, #006B3C)",
                        border: "1px solid #C6E7D2",
                        padding: "3px 8px",
                        borderRadius: "12px",
                        fontWeight: 500,
                      }}
                    >
                      {p.category}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-main, #1A2E22)" }}>
                    {formatUSD(p.price)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: p.stockQuantity === 0 ? "var(--color-error, #C53030)" : p.stockQuantity < 5 ? "var(--color-warning, #D69E2E)" : "var(--color-primary-green, #006B3C)",
                      }}
                    >
                      {p.stockQuantity}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.isActive ? (
                      <span
                        data-testid={`status-badge-active-${p.id}`}
                        style={{
                          backgroundColor: "var(--color-pale-green, #EAF6EF)",
                          color: "var(--color-primary-green, #006B3C)",
                          border: "1px solid #A7F3D0",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Active
                      </span>
                    ) : (
                      <span
                        data-testid={`status-badge-inactive-${p.id}`}
                        style={{
                          backgroundColor: "var(--color-error-bg, #FFF5F5)",
                          color: "var(--color-error, #C53030)",
                          border: "1px solid var(--color-urgent-border, #FEB2B2)",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          fontSize: "12px",
                          fontWeight: 600,
                        }}
                      >
                        Discontinued
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: "8px" }}>
                      <button
                        type="button"
                        data-testid={`edit-btn-${p.id}`}
                        onClick={() => openEditModal(p)}
                        style={{
                          padding: "5px 12px",
                          backgroundColor: "var(--color-surface, #FFFFFF)",
                          border: "1px solid var(--color-border-input, #CBD5E0)",
                          borderRadius: "var(--radius-sm, 4px)",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--color-text-main, #1A2E22)",
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-readonly-bg, #F0F4F1)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-surface, #FFFFFF)")}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        data-testid={`restock-btn-${p.id}`}
                        onClick={() => {
                          setRestockingProduct(p);
                          setRestockAmount(10);
                        }}
                        style={{
                          padding: "5px 12px",
                          backgroundColor: "var(--color-primary-green, #006B3C)",
                          color: "#FFF",
                          border: "none",
                          borderRadius: "var(--radius-sm, 4px)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          transition: "background-color 0.15s ease",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-secondary-green, #0B7A46)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "var(--color-primary-green, #006B3C)")}
                      >
                        Restock
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Product */}
      {showAddModal && (
        <div
          data-testid="add-product-modal"
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
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--color-border, #E2E8F0)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 16px 0", color: "var(--color-text-main, #1A2E22)" }}>
              Create New Tech Product
            </h2>
            <form onSubmit={handleCreateProduct}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                  SKU (Item Code) *
                </label>
                <input
                  type="text"
                  data-testid="input-new-sku"
                  placeholder="e.g. CHG-GAN-100W"
                  required
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  data-testid="input-new-name"
                  placeholder="e.g. 100W GaN Fast Charger USB-C"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                    Category *
                  </label>
                  <select
                    data-testid="input-new-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)", backgroundColor: "#FFF" }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                    Unit Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    data-testid="input-new-price"
                    placeholder="49.99"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  data-testid="input-new-stock"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                  Description (Optional)
                </label>
                <textarea
                  data-testid="input-new-description"
                  rows={3}
                  placeholder="Device specifications, ports, accessories..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "8px 14px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)", backgroundColor: "#FFF", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-new-product-btn"
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "var(--color-primary-green, #006B3C)",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "var(--radius-sm, 4px)",
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Product */}
      {editingProduct && (
        <div
          data-testid="edit-product-modal"
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
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--color-border, #E2E8F0)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 16px 0", color: "var(--color-text-main, #1A2E22)" }}>
              Edit Product ({editingProduct.sku})
            </h2>
            <form onSubmit={handleUpdateProduct}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  data-testid="input-edit-name"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                    Category *
                  </label>
                  <select
                    data-testid="input-edit-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)", backgroundColor: "#FFF" }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                    Unit Price ($ USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    data-testid="input-edit-price"
                    required
                    value={editPrice}
                    onChange={(e) => setEditPrice(e.target.value)}
                    style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                  Description
                </label>
                <textarea
                  data-testid="input-edit-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "var(--color-text-main, #1A2E22)",
                  }}
                >
                  <input
                    type="checkbox"
                    data-testid="input-edit-is-active"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "var(--color-primary-green, #006B3C)" }}
                  />
                  <span>Product is Active (uncheck to soft-delete / discontinue)</span>
                </label>
                <p style={{ margin: "4px 0 0 24px", fontSize: "12px", color: "var(--color-text-muted, #718096)" }}>
                  Discontinued products remain stored for historical order receipts, but are hidden from the customer catalog.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ padding: "8px 14px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)", backgroundColor: "#FFF", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-edit-product-btn"
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "var(--color-primary-green, #006B3C)",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "var(--radius-sm, 4px)",
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Restock Inventory */}
      {restockingProduct && (
        <div
          data-testid="restock-modal"
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
              maxWidth: "440px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
              border: "1px solid var(--color-border, #E2E8F0)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px 0", color: "var(--color-text-main, #1A2E22)" }}>
              Restock Warehouse Inventory
            </h2>
            <p style={{ fontSize: "14px", color: "var(--color-text-muted, #718096)", marginBottom: "16px" }}>
              Adding units for <strong>{restockingProduct.name}</strong> ({restockingProduct.sku}).
            </p>

            <form onSubmit={handleRestock}>
              <div style={{ backgroundColor: "var(--color-readonly-bg, #F0F4F1)", padding: "12px", borderRadius: "var(--radius-sm, 6px)", marginBottom: "16px", border: "1px solid var(--color-border, #E2E8F0)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span>Current Available Stock:</span>
                  <span style={{ fontWeight: 700 }}>{restockingProduct.stockQuantity}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span>Additional Units:</span>
                  <span style={{ fontWeight: 700, color: "var(--color-primary-green, #006B3C)" }}>+{restockAmount || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", borderTop: "1px solid var(--color-border, #E2E8F0)", paddingTop: "6px", fontWeight: 700 }}>
                  <span>New Total Stock:</span>
                  <span>{restockingProduct.stockQuantity + (parseInt(String(restockAmount), 10) || 0)}</span>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px", color: "var(--color-text-main, #1A2E22)" }}>
                  Units to Add *
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  data-testid="input-restock-qty"
                  required
                  value={restockAmount}
                  onChange={(e) => setRestockAmount(parseInt(e.target.value, 10) || 0)}
                  style={{ width: "100%", padding: "8px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRestockingProduct(null)}
                  style={{ padding: "8px 14px", border: "1px solid var(--color-border-input, #CBD5E0)", borderRadius: "var(--radius-sm, 4px)", backgroundColor: "#FFF", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-restock-btn"
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "var(--color-primary-green, #006B3C)",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "var(--radius-sm, 4px)",
                    fontWeight: 600,
                    cursor: isSubmitting ? "not-allowed" : "pointer",
                  }}
                >
                  {isSubmitting ? "Updating..." : "Confirm Restock"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagementPage;
