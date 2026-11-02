import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import ProductCard from "../src/components/catalog/ProductCard";
import CatalogPage from "../src/pages/CatalogPage";
import * as api from "../src/api";
import { Product } from "../src/types/product";
import { AuthProvider } from "../src/context/AuthContext";
import { CartProvider } from "../src/context/CartContext";

const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    sku: "PHON-PRO-256",
    name: "Flagship Pro Smartphone 256GB",
    category: "Smartphones",
    description: "6.7-inch OLED display",
    price: "899.00",
    stockQuantity: 10,
    isActive: true,
  },
  {
    id: 2,
    sku: "PHON-FLIP-LTD",
    name: "Flip Smartphone Limited Edition",
    category: "Smartphones",
    description: "Foldable AMOLED display",
    price: "999.00",
    stockQuantity: 0, // Out of stock
    isActive: true,
  },
  {
    id: 3,
    sku: "KB-MECH-RGB",
    name: "Wireless Mechanical Keyboard",
    category: "Keyboards",
    description: "Hot-swap switches",
    price: "79.00",
    stockQuantity: 15,
    isActive: true,
  },
];

vi.mock("../src/api", () => ({
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  getMeApi: vi.fn(),
  changePasswordApi: vi.fn(),
  getProductsApi: vi.fn(),
  getCategoriesApi: vi.fn(),
}));

describe("Feature 2: Product Catalog & Category Browsing (F-02)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders product card with authoritative USD price ($899.00) and in-stock badge", () => {
    render(<ProductCard product={MOCK_PRODUCTS[0]} />);

    expect(screen.getByText("Flagship Pro Smartphone 256GB")).toBeInTheDocument();
    expect(screen.getByText("PHON-PRO-256")).toBeInTheDocument();
    expect(screen.getByText("Smartphones")).toBeInTheDocument();
    expect(screen.getByTestId("product-price")).toHaveTextContent("$899.00");
    expect(screen.getByTestId("in-stock-badge")).toHaveTextContent("In Stock (10)");

    const button = screen.getByRole("button", { name: /Add to Order/i });
    expect(button).toBeEnabled();
  });

  it("TEST-CAT-03: renders Out of Stock badge and disables button when stockQuantity is 0", () => {
    render(<ProductCard product={MOCK_PRODUCTS[1]} />);

    expect(screen.getByText("Flip Smartphone Limited Edition")).toBeInTheDocument();
    expect(screen.getByTestId("product-price")).toHaveTextContent("$999.00");
    expect(screen.getByTestId("out-of-stock-badge")).toHaveTextContent("Out of Stock");

    const button = screen.getByRole("button", { name: /Out of Stock/i });
    expect(button).toBeDisabled();
  });

  it("loads and displays product grid with category filter pills on CatalogPage", async () => {
    vi.mocked(api.getMeApi).mockRejectedValueOnce(new Error("Unauthorized"));
    vi.mocked(api.getProductsApi).mockResolvedValueOnce({ data: MOCK_PRODUCTS });
    vi.mocked(api.getCategoriesApi).mockResolvedValueOnce({
      data: ["Smartphones", "Keyboards"],
    });

    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter>
            <CatalogPage />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    expect(screen.getByText(/Loading TechTent inventory/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Everyday Tech Essentials")).toBeInTheDocument();
      expect(screen.getByText("Flagship Pro Smartphone 256GB")).toBeInTheDocument();
      expect(screen.getByText("Wireless Mechanical Keyboard")).toBeInTheDocument();
      expect(screen.getByText("All Items")).toBeInTheDocument();
    });
  });

  it("redirects anonymous visitor to /login when clicking 'Add to Order' without showing toast", async () => {
    // getMeApi fails -> user is null (Anonymous)
    vi.mocked(api.getMeApi).mockRejectedValueOnce(new Error("Unauthorized"));
    vi.mocked(api.getProductsApi).mockResolvedValueOnce({ data: MOCK_PRODUCTS });
    vi.mocked(api.getCategoriesApi).mockResolvedValueOnce({ data: ["Smartphones"] });

    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/"]}>
            <Routes>
              <Route path="/" element={<CatalogPage />} />
              <Route path="/login" element={<div>Sign In Destination Mock</div>} />
            </Routes>
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Flagship Pro Smartphone 256GB")).toBeInTheDocument();
    });

    // Click "Add to Order" as anonymous
    const addBtn = screen.getByTestId("add-to-order-btn-PHON-PRO-256");
    fireEvent.click(addBtn);

    // Verifies immediate redirect to /login and zero toast notification shown
    await waitFor(() => {
      expect(screen.getByText("Sign In Destination Mock")).toBeInTheDocument();
      expect(screen.queryByTestId("toast-notification")).not.toBeInTheDocument();
    });
  });

  it("renders custom bottom-right notification stack and pushes older notification up on successive additions", async () => {
    vi.mocked(api.getMeApi).mockResolvedValue({
      user: {
        id: 1,
        email: "customer1@example.com",
        name: "Alice Customer",
        role: "CUSTOMER",
        mustChangePassword: false,
        isActive: true,
      },
    });
    vi.mocked(api.getProductsApi).mockResolvedValue({ data: MOCK_PRODUCTS });
    vi.mocked(api.getCategoriesApi).mockResolvedValue({ data: ["Smartphones", "Keyboards"] });

    render(
      <AuthProvider>
        <CartProvider>
          <MemoryRouter initialEntries={["/"]}>
            <CatalogPage />
          </MemoryRouter>
        </CartProvider>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Flagship Pro Smartphone 256GB")).toBeInTheDocument();
    });

    // 1. Add first product (Phone)
    const phoneBtn = screen.getByTestId("add-to-order-btn-PHON-PRO-256");
    fireEvent.click(phoneBtn);

    await waitFor(() => {
      const toasts = screen.getAllByTestId("toast-notification");
      expect(toasts.length).toBe(1);
      expect(toasts[0]).toHaveTextContent("1x Flagship Pro Smartphone 256GB");
      expect(toasts[0]).toHaveTextContent("NEW");
    });

    // 2. Add second product (Keyboard)
    const kbBtn = screen.getByTestId("add-to-order-btn-KB-MECH-RGB");
    fireEvent.click(kbBtn);

    // Both should now be visible in stack: Keyboard is newest (NEW), Phone is pushed up (PREVIOUS)
    await waitFor(() => {
      const toasts = screen.getAllByTestId("toast-notification");
      expect(toasts.length).toBe(2);

      // Newest toast (Keyboard)
      expect(toasts[0]).toHaveTextContent("1x Wireless Mechanical Keyboard");
      expect(toasts[0]).toHaveTextContent("NEW");

      // Older pushed-up toast (Phone)
      expect(toasts[1]).toHaveTextContent("1x Flagship Pro Smartphone 256GB");
      expect(toasts[1]).toHaveTextContent("PREVIOUS");
    });

    // Dismiss first toast via close button
    const closeButtons = screen.getAllByTestId("close-toast-btn");
    fireEvent.click(closeButtons[0]);

    await waitFor(() => {
      const remainingToasts = screen.getAllByTestId("toast-notification");
      expect(remainingToasts.length).toBe(1);
      expect(remainingToasts[0]).toHaveTextContent("1x Flagship Pro Smartphone 256GB");
    });
  });
});
