import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OrderHistoryPage from "../src/pages/OrderHistoryPage";
import OrderDetailPage from "../src/pages/OrderDetailPage";
import * as api from "../src/api";
import { OrderData } from "../src/types/order";

const MOCK_ORDERS: OrderData[] = [
  {
    id: 10,
    orderNumber: "ORD-20261102-0001",
    customerId: 1,
    status: "PENDING",
    totalAmount: "1057.00",
    itemCount: 3,
    lineItemCount: 2,
    createdAt: "2026-11-02T15:00:00.000Z",
    items: [
      {
        id: 101,
        productId: 1,
        productName: "Flagship Pro Smartphone 256GB",
        sku: "PHON-PRO-256",
        unitPrice: "899.00",
        quantity: 1,
        subtotal: "899.00",
      },
      {
        id: 102,
        productId: 2,
        productName: "Wireless Mechanical Keyboard",
        sku: "KB-MECH-RGB",
        unitPrice: "79.00",
        quantity: 2,
        subtotal: "158.00",
      },
    ],
  },
  {
    id: 11,
    orderNumber: "ORD-20261102-0002",
    customerId: 1,
    status: "ACCEPTED",
    totalAmount: "549.00",
    itemCount: 1,
    lineItemCount: 1,
    createdAt: "2026-11-02T16:00:00.000Z",
    items: [
      {
        id: 103,
        productId: 3,
        productName: "Ultra Tablet 11\" 128GB",
        sku: "TAB-ULTRA-11",
        unitPrice: "549.00",
        quantity: 1,
        subtotal: "549.00",
      },
    ],
  },
];

vi.mock("../src/api", () => ({
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  getMeApi: vi.fn(),
  changePasswordApi: vi.fn(),
  getProductsApi: vi.fn(),
  getCategoriesApi: vi.fn(),
  createOrderApi: vi.fn(),
  getMyOrdersApi: vi.fn(),
  getOrderByIdApi: vi.fn(),
}));

describe("Feature 4: Customer Order History & Receipt Details (F-04)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Order History List
  // -------------------------------------------------------------------------

  it("loads and displays customer order history with order numbers, status badges, and USD totals", async () => {
    vi.mocked(api.getMyOrdersApi).mockResolvedValueOnce({ data: MOCK_ORDERS });

    render(
      <MemoryRouter>
        <OrderHistoryPage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading your orders/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("order-card-ORD-20261102-0001")).toBeInTheDocument();
      expect(screen.getByTestId("order-card-ORD-20261102-0002")).toBeInTheDocument();
    });

    // Check Order 1 details (PENDING -> "🔍 View Order Details")
    expect(screen.getByTestId("order-number-ORD-20261102-0001")).toHaveTextContent("ORD-20261102-0001");
    expect(screen.getByTestId("order-total-ORD-20261102-0001")).toHaveTextContent("$1,057.00");
    expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    expect(screen.getByTestId("view-receipt-btn-ORD-20261102-0001")).toHaveTextContent("🔍 View Order Details");

    // Check Order 2 details (ACCEPTED -> "📄 View Order Receipt")
    expect(screen.getByTestId("order-number-ORD-20261102-0002")).toHaveTextContent("ORD-20261102-0002");
    expect(screen.getByTestId("order-total-ORD-20261102-0002")).toHaveTextContent("$549.00");
    expect(screen.getByText(/Accepted/i)).toBeInTheDocument();
    expect(screen.getByTestId("view-receipt-btn-ORD-20261102-0002")).toHaveTextContent("📄 View Order Receipt");
  });

  it("renders empty state when customer has not placed any orders yet", async () => {
    vi.mocked(api.getMyOrdersApi).mockResolvedValueOnce({ data: [] });

    render(
      <MemoryRouter>
        <OrderHistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("orders-empty-state")).toBeInTheDocument();
      expect(screen.getByText(/You haven't placed any electronics orders yet/i)).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /Explore TechTent Catalog/i })).toHaveAttribute("href", "/");
    });
  });

  it("renders error banner with retry button when order list API call fails", async () => {
    vi.mocked(api.getMyOrdersApi).mockRejectedValueOnce(new Error("Unable to fetch orders from database"));

    render(
      <MemoryRouter>
        <OrderHistoryPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("orders-error-banner")).toBeInTheDocument();
      expect(screen.getByText(/Unable to fetch orders from database/i)).toBeInTheDocument();
    });

    // Mock successful retry
    vi.mocked(api.getMyOrdersApi).mockResolvedValueOnce({ data: MOCK_ORDERS });
    fireEvent.click(screen.getByRole("button", { name: /Retry/i }));

    await waitFor(() => {
      expect(screen.getByTestId("order-card-ORD-20261102-0001")).toBeInTheDocument();
    });
  });

  // -------------------------------------------------------------------------
  // Order Detail & Itemized Receipt
  // -------------------------------------------------------------------------

  it("loads and displays itemized receipt with preserved historic prices and subtotal breakdown", async () => {
    const singleOrder: OrderData = {
      ...MOCK_ORDERS[0],
      customerName: "Alice Customer",
      customerEmail: "customer1@example.com",
    };

    vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: singleOrder });

    render(
      <MemoryRouter initialEntries={["/orders/10"]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/Loading order receipt/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("order-receipt-card")).toBeInTheDocument();
      expect(screen.getByTestId("order-receipt-number")).toHaveTextContent("ORD-20261102-0001");
      expect(screen.getByTestId("order-receipt-customer")).toHaveTextContent("Alice Customer");
      expect(screen.getByTestId("order-receipt-grand-total")).toHaveTextContent("$1,057.00");
    });

    // Verify historical preserved prices in table
    expect(screen.getByTestId("item-price-PHON-PRO-256")).toHaveTextContent("$899.00");
    expect(screen.getByTestId("item-qty-PHON-PRO-256")).toHaveTextContent("1");
    expect(screen.getByTestId("item-subtotal-PHON-PRO-256")).toHaveTextContent("$899.00");

    expect(screen.getByTestId("item-price-KB-MECH-RGB")).toHaveTextContent("$79.00");
    expect(screen.getByTestId("item-qty-KB-MECH-RGB")).toHaveTextContent("2");
    expect(screen.getByTestId("item-subtotal-KB-MECH-RGB")).toHaveTextContent("$158.00");
  });

  it("renders permission denied / access restricted card when customer enters another customer's order ID", async () => {
    vi.mocked(api.getOrderByIdApi).mockRejectedValueOnce(
      new Error("Order not found or permission denied.")
    );

    render(
      <MemoryRouter initialEntries={["/orders/99"]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("order-error-card")).toBeInTheDocument();
      expect(screen.getByTestId("order-error-message")).toHaveTextContent("Order not found or permission denied.");
      expect(screen.getByRole("link", { name: /Return to My Orders/i })).toHaveAttribute("href", "/orders");
    });
  });

  it("hides Continue Shopping button and renders Return to Operator Queue for operator view", async () => {
    const singleOrder: OrderData = {
      ...MOCK_ORDERS[0],
      customerName: "Alice Customer",
      customerEmail: "customer1@example.com",
    };

    vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: singleOrder });

    render(
      <MemoryRouter initialEntries={["/orders/10"]}>
        <Routes>
          <Route path="/orders/:id" element={<OrderDetailPage operatorView={true} />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("order-receipt-card")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("continue-shopping-link")).not.toBeInTheDocument();
    expect(screen.getByTestId("return-orders-btn")).toHaveTextContent("← Return to Operator Queue");
    expect(screen.getByText("Customer Order Details & Fulfillment Status")).toBeInTheDocument();
  });
});

