import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProductCard from "../src/components/catalog/ProductCard";
import CatalogPage from "../src/pages/CatalogPage";
import * as api from "../src/api";
import { Product } from "../src/types/product";

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
  getProductsApi: vi.fn(),
  getCategoriesApi: vi.fn(),
}));

describe("Feature 2: Product Catalog & Category Browsing (F-02)", () => {
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
    vi.mocked(api.getProductsApi).mockResolvedValueOnce({ data: MOCK_PRODUCTS });
    vi.mocked(api.getCategoriesApi).mockResolvedValueOnce({
      data: ["Smartphones", "Keyboards"],
    });

    render(<CatalogPage />);

    expect(screen.getByText(/Loading TechTent inventory/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Everyday Tech Essentials")).toBeInTheDocument();
      expect(screen.getByText("Flagship Pro Smartphone 256GB")).toBeInTheDocument();
      expect(screen.getByText("Wireless Mechanical Keyboard")).toBeInTheDocument();
      expect(screen.getByText("All Items")).toBeInTheDocument();
    });
  });
});
