import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OrderDetailPage from "../src/pages/OrderDetailPage";
import * as api from "../src/api";
import { OrderData } from "../src/types/order";

vi.mock("../src/api", () => ({
  getOrderByIdApi: vi.fn(),
  cancelOrderApi: vi.fn(),
}));

const PENDING_ORDER: OrderData = {
  id: 42,
  orderNumber: "ORD-20261122-0042",
  customerId: 1,
  customerName: "Alice Customer",
  customerEmail: "alice@example.com",
  status: "PENDING",
  paymentStatus: "UNPAID",
  totalAmount: "899.00",
  createdAt: "2026-11-22T10:00:00.000Z",
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
  ],
};

const CANCELLED_ORDER: OrderData = {
  ...PENDING_ORDER,
  status: "CANCELLED",
  paymentStatus: "VOID",
  cancelledAt: "2026-11-22T10:15:00.000Z",
  cancellationReason: "Ordered wrong color",
};

const ACCEPTED_ORDER: OrderData = {
  ...PENDING_ORDER,
  status: "ACCEPTED",
};

function renderOrderDetailPage(orderId = "42") {
  return render(
    <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Feature 7: Customer Order Cancellation Component (F-07)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders 'Cancel Order' button when order status is PENDING", async () => {
    vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: PENDING_ORDER });

    renderOrderDetailPage();

    await screen.findByText("ORD-20261122-0042");
    expect(screen.getByTestId("order-receipt-status")).toHaveTextContent("Pending Confirmation");
    expect(screen.getByTestId("cancel-order-btn")).toBeInTheDocument();
  });

  it("does not render 'Cancel Order' button when order status is ACCEPTED", async () => {
    vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: ACCEPTED_ORDER });

    renderOrderDetailPage();

    await screen.findByText("ORD-20261122-0042");
    expect(screen.getByTestId("order-receipt-status")).toHaveTextContent("Accepted");
    expect(screen.queryByTestId("cancel-order-btn")).not.toBeInTheDocument();
  });

  it("opens cancellation modal on button click and allows closing with 'Keep Order'", async () => {
    vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: PENDING_ORDER });

    renderOrderDetailPage();
    await screen.findByText("ORD-20261122-0042");

    fireEvent.click(screen.getByTestId("cancel-order-btn"));

    expect(screen.getByTestId("cancel-order-modal")).toBeInTheDocument();
    expect(screen.getByText(/Are you sure you want to cancel this order\?/)).toBeInTheDocument();

    fireEvent.click(screen.getByText("Keep Order"));
    expect(screen.queryByTestId("cancel-order-modal")).not.toBeInTheDocument();
  });

  it("submits cancellation with reason and displays updated CANCELLED state and details", async () => {
    vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: PENDING_ORDER });
    vi.mocked(api.cancelOrderApi).mockResolvedValueOnce({ data: CANCELLED_ORDER });

    renderOrderDetailPage();
    await screen.findByText("ORD-20261122-0042");

    fireEvent.click(screen.getByTestId("cancel-order-btn"));

    const reasonInput = screen.getByTestId("cancel-reason-input");
    fireEvent.change(reasonInput, { target: { value: "Ordered wrong color" } });

    fireEvent.click(screen.getByTestId("confirm-cancel-btn"));

    await waitFor(() => {
      expect(api.cancelOrderApi).toHaveBeenCalledWith(42, "Ordered wrong color");
    });

    // Check modal closed and success banner displayed
    expect(screen.queryByTestId("cancel-order-modal")).not.toBeInTheDocument();
    expect(screen.getByTestId("cancel-success-banner")).toHaveTextContent("Your order has been successfully cancelled");

    // Status badge updated
    expect(screen.getByTestId("order-receipt-status")).toHaveTextContent("Cancelled");

    // Cancellation details banner rendered
    expect(screen.getByTestId("cancellation-details-banner")).toBeInTheDocument();
    expect(screen.getByText(/Ordered wrong color/)).toBeInTheDocument();

    // Verify all item details and date remain displayed without reload
    expect(screen.getByText("Flagship Pro Smartphone 256GB")).toBeInTheDocument();
    expect(screen.getByText("PHON-PRO-256")).toBeInTheDocument();
    expect(screen.getByTestId("order-receipt-original-total")).toHaveTextContent("$899.00");
    expect(screen.getByTestId("order-receipt-grand-total")).toHaveTextContent("$854.05");
  });

  it("displays error banner in modal when cancellation API returns 409 conflict", async () => {
    vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: PENDING_ORDER });
    const conflictError: any = new Error("Only PENDING orders can be cancelled. Current status is ACCEPTED.");
    conflictError.status = 409;
    vi.mocked(api.cancelOrderApi).mockRejectedValueOnce(conflictError);

    renderOrderDetailPage();
    await screen.findByText("ORD-20261122-0042");

    fireEvent.click(screen.getByTestId("cancel-order-btn"));
    fireEvent.click(screen.getByTestId("confirm-cancel-btn"));

    await screen.findByTestId("cancel-error-banner");
    expect(screen.getByTestId("cancel-error-banner")).toHaveTextContent(
      "Only PENDING orders can be cancelled. Current status is ACCEPTED."
    );
  });
});
