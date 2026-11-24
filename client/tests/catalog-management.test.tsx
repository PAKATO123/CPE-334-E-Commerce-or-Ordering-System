import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProductManagementPage from "../src/pages/ProductManagementPage";
import * as api from "../src/api";
import { Product } from "../src/types/product";

vi.mock("../src/api", () => ({
  getProductsApi: vi.fn(),
  getCategoriesApi: vi.fn(),
  createProductApi: vi.fn(),
  updateProductApi: vi.fn(),
  restockProductApi: vi.fn(),
}));

const mockProducts: Product[] = [
  {
    id: 1,
    sku: "PHON-PRO-256",
    name: "Flagship Pro Smartphone 256GB",
    category: "Smartphones",
    description: "6.7-inch OLED display, 5G flagship processor.",
    price: "899.00",
    stockQuantity: 10,
    isActive: true,
  },
  {
    id: 2,
    sku: "KB-MECH-RGB",
    name: "Wireless Mechanical Keyboard",
    category: "Keyboards",
    description: "Hot-swap RGB mechanical keyboard.",
    price: "79.00",
    stockQuantity: 15,
    isActive: true,
  },
  {
    id: 3,
    sku: "DISCONT-OLD",
    name: "Discontinued Cable",
    category: "Chargers & Power",
    description: "Legacy 30-pin cable.",
    price: "9.99",
    stockQuantity: 0,
    isActive: false,
  },
];

function renderManagementPage() {
  return render(
    <MemoryRouter initialEntries={["/operator/products"]}>
      <Routes>
        <Route path="/operator/products" element={<ProductManagementPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Feature 6: Product Catalog Management Component (F-06)", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(api.getProductsApi).mockResolvedValue({ data: [...mockProducts] });
    vi.mocked(api.getCategoriesApi).mockResolvedValue({
      data: ["Smartphones", "Tablets", "Smart TVs", "Keyboards", "Chargers & Power"],
    });
  });

  it("renders product management table with all products and status badges", async () => {
    renderManagementPage();

    expect(screen.getByText("Loading inventory...")).toBeInTheDocument();

    await screen.findByText("Flagship Pro Smartphone 256GB");
    expect(screen.getByText("PHON-PRO-256")).toBeInTheDocument();
    expect(screen.getByText("KB-MECH-RGB")).toBeInTheDocument();
    expect(screen.getByText("DISCONT-OLD")).toBeInTheDocument();

    // Check status badges
    expect(screen.getByTestId("status-badge-active-1")).toHaveTextContent("Active");
    expect(screen.getByTestId("status-badge-inactive-3")).toHaveTextContent("Discontinued");
    expect(screen.getByText("Showing 3 of 3 products")).toBeInTheDocument();
  });

  it("filters products by search query and category", async () => {
    renderManagementPage();
    await screen.findByText("Flagship Pro Smartphone 256GB");

    // Search for "Keyboard"
    const searchInput = screen.getByTestId("mgmt-search-input");
    fireEvent.change(searchInput, { target: { value: "Keyboard" } });

    expect(screen.getByText("Wireless Mechanical Keyboard")).toBeInTheDocument();
    expect(screen.queryByText("Flagship Pro Smartphone 256GB")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 3 products")).toBeInTheDocument();

    // Reset search
    fireEvent.change(searchInput, { target: { value: "" } });
    expect(screen.getByText("Flagship Pro Smartphone 256GB")).toBeInTheDocument();

    // Filter by Active Only status
    const statusSelect = screen.getByTestId("mgmt-status-filter");
    fireEvent.change(statusSelect, { target: { value: "Active" } });
    expect(screen.queryByText("Discontinued Cable")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 2 of 3 products")).toBeInTheDocument();
  });

  it("opens Add Product modal and submits valid new product", async () => {
    const newProduct: Product = {
      id: 4,
      sku: "CHG-WIRELESS-15W",
      name: "15W Magnetic Wireless Charging Pad",
      category: "Chargers & Power",
      description: "Qi fast charger",
      price: "39.99",
      stockQuantity: 20,
      isActive: true,
    };
    vi.mocked(api.createProductApi).mockResolvedValueOnce({ data: newProduct });

    renderManagementPage();
    await screen.findByText("Flagship Pro Smartphone 256GB");

    fireEvent.click(screen.getByTestId("add-product-btn"));
    expect(screen.getByTestId("add-product-modal")).toBeInTheDocument();

    // Fill form
    fireEvent.change(screen.getByTestId("input-new-sku"), { target: { value: "CHG-WIRELESS-15W" } });
    fireEvent.change(screen.getByTestId("input-new-name"), { target: { value: "15W Magnetic Wireless Charging Pad" } });
    fireEvent.change(screen.getByTestId("input-new-category"), { target: { value: "Chargers & Power" } });
    fireEvent.change(screen.getByTestId("input-new-price"), { target: { value: "39.99" } });
    fireEvent.change(screen.getByTestId("input-new-stock"), { target: { value: "20" } });
    fireEvent.change(screen.getByTestId("input-new-description"), { target: { value: "Qi fast charger" } });

    fireEvent.click(screen.getByTestId("submit-new-product-btn"));

    await waitFor(() => {
      expect(api.createProductApi).toHaveBeenCalledWith({
        sku: "CHG-WIRELESS-15W",
        name: "15W Magnetic Wireless Charging Pad",
        category: "Chargers & Power",
        price: 39.99,
        stockQuantity: 20,
        description: "Qi fast charger",
      });
    });

    await screen.findByTestId("mgmt-success-banner");
    expect(screen.getByTestId("mgmt-success-banner")).toHaveTextContent("created successfully");
  });

  it("opens Edit modal and updates product active status", async () => {
    const updatedProd: Product = {
      ...mockProducts[0],
      name: "Updated Pro Smartphone 256GB",
      isActive: false,
    };
    vi.mocked(api.updateProductApi).mockResolvedValueOnce({ data: updatedProd });

    renderManagementPage();
    await screen.findByText("Flagship Pro Smartphone 256GB");

    fireEvent.click(screen.getByTestId("edit-btn-1"));
    expect(screen.getByTestId("edit-product-modal")).toBeInTheDocument();
    expect(screen.getByTestId("input-edit-name")).toHaveValue("Flagship Pro Smartphone 256GB");

    // Uncheck isActive
    const activeCheckbox = screen.getByTestId("input-edit-is-active");
    expect(activeCheckbox).toBeChecked();
    fireEvent.click(activeCheckbox);
    expect(activeCheckbox).not.toBeChecked();

    fireEvent.click(screen.getByTestId("submit-edit-product-btn"));

    await waitFor(() => {
      expect(api.updateProductApi).toHaveBeenCalledWith(1, {
        name: "Flagship Pro Smartphone 256GB",
        category: "Smartphones",
        price: 899.0,
        description: "6.7-inch OLED display, 5G flagship processor.",
        isActive: false,
      });
    });

    await screen.findByTestId("mgmt-success-banner");
    expect(screen.getByTestId("mgmt-success-banner")).toHaveTextContent("updated successfully");
  });

  it("opens Restock modal and submits atomic stock quantity addition", async () => {
    vi.mocked(api.restockProductApi).mockResolvedValueOnce({
      data: {
        id: 2,
        sku: "KB-MECH-RGB",
        name: "Wireless Mechanical Keyboard",
        previousStock: 15,
        restockedAmount: 25,
        newStock: 40,
      },
    });

    renderManagementPage();
    await screen.findByText("Wireless Mechanical Keyboard");

    fireEvent.click(screen.getByTestId("restock-btn-2"));
    expect(screen.getByTestId("restock-modal")).toBeInTheDocument();
    expect(screen.getByText(/Adding units for/)).toBeInTheDocument();

    const qtyInput = screen.getByTestId("input-restock-qty");
    fireEvent.change(qtyInput, { target: { value: "25" } });

    fireEvent.click(screen.getByTestId("submit-restock-btn"));

    await waitFor(() => {
      expect(api.restockProductApi).toHaveBeenCalledWith(2, 25);
    });

    await screen.findByTestId("mgmt-success-banner");
    expect(screen.getByTestId("mgmt-success-banner")).toHaveTextContent("Restocked 25 units");
  });

  it("displays error banner when API returns error", async () => {
    const error: any = new Error("A product with this SKU already exists.");
    error.status = 409;
    vi.mocked(api.createProductApi).mockRejectedValueOnce(error);

    renderManagementPage();
    await screen.findByText("Flagship Pro Smartphone 256GB");

    fireEvent.click(screen.getByTestId("add-product-btn"));
    fireEvent.change(screen.getByTestId("input-new-sku"), { target: { value: "PHON-PRO-256" } });
    fireEvent.change(screen.getByTestId("input-new-name"), { target: { value: "Duplicate Phone" } });
    fireEvent.change(screen.getByTestId("input-new-price"), { target: { value: "500" } });

    fireEvent.click(screen.getByTestId("submit-new-product-btn"));

    await screen.findByTestId("mgmt-error-banner");
    expect(screen.getByTestId("mgmt-error-banner")).toHaveTextContent("A product with this SKU already exists.");
  });
});
