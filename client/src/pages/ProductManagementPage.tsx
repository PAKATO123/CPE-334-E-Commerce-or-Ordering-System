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

    try {
      setIsSubmitting(true);
      const payload: UpdateProductPayload = {
        name: editName.trim(),
        category: editCategory,
        price: priceNum,
        description: editDescription.trim(),
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

    const qty = Math.floor(restockAmount);
    if (isNaN(qty) || qty <= 0) {
      setErrorBanner("Restock quantity must be a positive integer.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await restockProductApi(restockingProduct.id, qty);
      setSuccessBanner(
        `Restocked ${res.data.restockedAmount} units for '${res.data.name}'. Previous: ${res.data.previousStock}, New Stock: ${res.data.newStock}.`
      );
      setRestockingProduct(null);
      await fetchProducts();
    } catch (err: any) {
      setErrorBanner(err.message || "Failed to restock product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="tt-page-container" style={{ maxWidth: "1200px", margin: "24px auto", padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, margin: 0 }}>Inventory & Catalog Management</h1>
          <p style={{ color: "#666", margin: "4px 0 0 0", fontSize: "14px" }}>
            Add new consumer electronics, adjust specs and active status, and restock warehouse quantities.
          </p>
        </div>
        <button
          type="button"
          data-testid="add-product-btn"
          onClick={() => {
            setErrorBanner(null);
            setShowAddModal(true);
          }}
          className="tt-btn"
          style={{
            backgroundColor: "#006B3C",
            color: "#FFF",
            padding: "10px 18px",
            borderRadius: "6px",
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
          }}
        >
          + Add New Product
        </button>
      </div>

      {/* Notifications */}
      {errorBanner && (
        <div
          data-testid="mgmt-error-banner"
          style={{
            backgroundColor: "#FDE8E8",
            borderLeft: "4px solid #E02424",
            color: "#9B1C1C",
            padding: "12px 16px",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "14px",
          }}
        >
          <strong>Error: </strong> {errorBanner}
        </div>
      )}

      {successBanner && (
        <div
          data-testid="mgmt-success-banner"
          style={{
            backgroundColor: "#DEF7EC",
            borderLeft: "4px solid #0E9F6E",
            color: "#03543F",
            padding: "12px 16px",
            borderRadius: "4px",
            marginBottom: "16px",
            fontSize: "14px",
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
          backgroundColor: "#F9FAFB",
          padding: "14px",
          borderRadius: "8px",
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
              borderRadius: "6px",
              border: "1px solid #D1D5DB",
              fontSize: "14px",
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
              borderRadius: "6px",
              border: "1px solid #D1D5DB",
              fontSize: "14px",
              backgroundColor: "#FFF",
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
              borderRadius: "6px",
              border: "1px solid #D1D5DB",
              fontSize: "14px",
              backgroundColor: "#FFF",
            }}
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Only</option>
            <option value="Inactive">Inactive / Discontinued</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", fontSize: "13px", color: "#6B7280" }}>
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div style={{ padding: "40px", textAlign: "center", color: "#6B7280" }}>Loading inventory...</div>
      ) : filteredProducts.length === 0 ? (
        <div
          data-testid="no-products-message"
          style={{
            padding: "40px",
            textAlign: "center",
            backgroundColor: "#F9FAFB",
            borderRadius: "8px",
            color: "#6B7280",
          }}
        >
          No products found matching the criteria.
        </div>
      ) : (
        <div style={{ overflowX: "auto", backgroundColor: "#FFF", borderRadius: "8px", border: "1px solid #E5E7EB" }}>
          <table data-testid="products-table" style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ backgroundColor: "#F3F4F6", borderBottom: "1px solid #E5E7EB", fontSize: "13px", color: "#4B5563" }}>
                <th style={{ padding: "12px 16px" }}>SKU</th>
                <th style={{ padding: "12px 16px" }}>Product Name</th>
                <th style={{ padding: "12px 16px" }}>Category</th>
                <th style={{ padding: "12px 16px" }}>Unit Price</th>
                <th style={{ padding: "12px 16px" }}>In Stock</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p) => (
                <tr
                  key={p.id}
                  data-testid={`product-row-${p.id}`}
                  style={{ borderBottom: "1px solid #F3F4F6", fontSize: "14px" }}
                >
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827" }}>
                    <code style={{ backgroundColor: "#F3F4F6", padding: "2px 6px", borderRadius: "4px" }}>{p.sku}</code>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div style={{ fontWeight: 600, color: "#1F2937" }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: "12px", color: "#6B7280", maxWidth: "320px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ fontSize: "12px", backgroundColor: "#E5EDFF", color: "#1E429F", padding: "3px 8px", borderRadius: "12px" }}>
                      {p.category}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: 600, color: "#111827" }}>
                    {formatUSD(p.price)}
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: p.stockQuantity === 0 ? "#E02424" : p.stockQuantity < 5 ? "#D97706" : "#0E9F6E",
                      }}
                    >
                      {p.stockQuantity}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    {p.isActive ? (
                      <span
                        data-testid={`status-badge-active-${p.id}`}
                        style={{ backgroundColor: "#DEF7EC", color: "#03543F", padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}
                      >
                        Active
                      </span>
                    ) : (
                      <span
                        data-testid={`status-badge-inactive-${p.id}`}
                        style={{ backgroundColor: "#FDE8E8", color: "#9B1C1C", padding: "3px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 600 }}
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
                          padding: "5px 10px",
                          backgroundColor: "#F3F4F6",
                          border: "1px solid #D1D5DB",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
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
                          padding: "5px 10px",
                          backgroundColor: "#006B3C",
                          color: "#FFF",
                          border: "none",
                          borderRadius: "4px",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
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
              backgroundColor: "#FFF",
              borderRadius: "8px",
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 16px 0" }}>Create New Tech Product</h2>
            <form onSubmit={handleCreateProduct}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  SKU (Item Code) *
                </label>
                <input
                  type="text"
                  data-testid="input-new-sku"
                  placeholder="e.g. CHG-GAN-100W"
                  required
                  value={newSku}
                  onChange={(e) => setNewSku(e.target.value.toUpperCase())}
                  style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  data-testid="input-new-name"
                  placeholder="e.g. 100W GaN Fast Charger USB-C"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Category *
                  </label>
                  <select
                    data-testid="input-new-category"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px", backgroundColor: "#FFF" }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
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
                    style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Initial Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  data-testid="input-new-stock"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value, 10) || 0)}
                  style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Description (Optional)
                </label>
                <textarea
                  data-testid="input-new-description"
                  rows={3}
                  placeholder="Device specifications, ports, accessories..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: "8px 14px", border: "1px solid #D1D5DB", borderRadius: "4px", backgroundColor: "#FFF", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-new-product-btn"
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#006B3C",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "4px",
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
              backgroundColor: "#FFF",
              borderRadius: "8px",
              maxWidth: "520px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 16px 0" }}>
              Edit Product ({editingProduct.sku})
            </h2>
            <form onSubmit={handleUpdateProduct}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Product Name *
                </label>
                <input
                  type="text"
                  data-testid="input-edit-name"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Category *
                  </label>
                  <select
                    data-testid="input-edit-category"
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px", backgroundColor: "#FFF" }}
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
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
                    style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                  Description
                </label>
                <textarea
                  data-testid="input-edit-description"
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
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
                  }}
                >
                  <input
                    type="checkbox"
                    data-testid="input-edit-is-active"
                    checked={editIsActive}
                    onChange={(e) => setEditIsActive(e.target.checked)}
                    style={{ width: "16px", height: "16px" }}
                  />
                  <span>Product is Active (uncheck to soft-delete / discontinue)</span>
                </label>
                <p style={{ margin: "4px 0 0 24px", fontSize: "12px", color: "#6B7280" }}>
                  Discontinued products remain stored for historical order receipts, but are hidden from the customer catalog.
                </p>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  style={{ padding: "8px 14px", border: "1px solid #D1D5DB", borderRadius: "4px", backgroundColor: "#FFF", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-edit-product-btn"
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#006B3C",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "4px",
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
              backgroundColor: "#FFF",
              borderRadius: "8px",
              maxWidth: "440px",
              width: "100%",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
          >
            <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: "0 0 8px 0" }}>
              Restock Warehouse Inventory
            </h2>
            <p style={{ fontSize: "14px", color: "#4B5563", marginBottom: "16px" }}>
              Adding units for <strong>{restockingProduct.name}</strong> ({restockingProduct.sku}).
            </p>

            <form onSubmit={handleRestock}>
              <div style={{ backgroundColor: "#F9FAFB", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span>Current Available Stock:</span>
                  <span style={{ fontWeight: 700 }}>{restockingProduct.stockQuantity}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span>Additional Units:</span>
                  <span style={{ fontWeight: 700, color: "#006B3C" }}>+{restockAmount || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", borderTop: "1px solid #E5E7EB", paddingTop: "6px", fontWeight: 700 }}>
                  <span>New Total Stock:</span>
                  <span>{restockingProduct.stockQuantity + (parseInt(String(restockAmount), 10) || 0)}</span>
                </div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
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
                  style={{ width: "100%", padding: "8px", border: "1px solid #D1D5DB", borderRadius: "4px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setRestockingProduct(null)}
                  style={{ padding: "8px 14px", border: "1px solid #D1D5DB", borderRadius: "4px", backgroundColor: "#FFF", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="submit-restock-btn"
                  style={{
                    padding: "8px 18px",
                    backgroundColor: "#006B3C",
                    color: "#FFF",
                    border: "none",
                    borderRadius: "4px",
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
