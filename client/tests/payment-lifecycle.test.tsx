import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OrderDetailPage from "../src/pages/OrderDetailPage";
import OperatorOrdersPage from "../src/pages/OperatorOrdersPage";
import OrderConfirmationModal from "../src/components/cart/OrderConfirmationModal";
import * as api from "../src/api";
import { OrderData } from "../src/types/order";

vi.mock("../src/api", () => ({
  getOrderByIdApi: vi.fn(),
  cancelOrderApi: vi.fn(),
  payOrderApi: vi.fn(),
  getOperatorOrdersApi: vi.fn(),
  processOperatorOrderApi: vi.fn(),
}));

const UNPAID_ORDER: OrderData = {
  id: 50,
  orderNumber: "ORD-20261122-0050",
  customerId: 1,
  customerName: "Alice Customer",
  customerEmail: "alice@example.com",
  status: "PENDING",
  paymentStatus: "UNPAID",
  totalAmount: "299.00",
  createdAt: "2026-11-22T10:00:00.000Z",
  items: [
    {
      id: 1,
      productId: 10,
      productName: "Mechanical Gaming Keyboard",
      sku: "KB-MECH-01",
      unitPrice: "299.00",
      quantity: 1,
      subtotal: "299.00",
    },
  ],
};

const PAID_ORDER: OrderData = {
  ...UNPAID_ORDER,
  paymentStatus: "PAID",
  paymentMethod: "SIMULATED_CARD",
  paidAt: "2026-11-22T10:05:00.000Z",
};

const CANCELLED_ORDER: OrderData = {
  ...UNPAID_ORDER,
  status: "CANCELLED",
  paymentStatus: "VOID",
};

function renderOrderDetailPage(orderId = "50", operatorView = false) {
  return render(
    <MemoryRouter initialEntries={[`/orders/${orderId}`]}>
      <Routes>
        <Route path="/orders/:id" element={<OrderDetailPage operatorView={operatorView} />} />
      </Routes>
    </MemoryRouter>
  );
}

function renderOperatorQueue() {
  return render(
    <MemoryRouter initialEntries={["/operator/orders"]}>
      <Routes>
        <Route path="/operator/orders" element={<OperatorOrdersPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Feature 8: Payment State Machine & Extended Fulfillment UI (F-08)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
    HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  });

  describe("OrderDetailPage Payment Interactions", () => {
    it("renders 'Pay Now (Simulated)' button for UNPAID non-terminal order", async () => {
      vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: UNPAID_ORDER });

      renderOrderDetailPage();

      await screen.findByText("ORD-20261122-0050");
      expect(screen.getByTestId("pay-now-btn")).toBeInTheDocument();
      expect(screen.getAllByText("⚠️ Unpaid").length).toBeGreaterThan(0);
    });

    it("does not render 'Pay Now' button when order is already PAID", async () => {
      vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: PAID_ORDER });

      renderOrderDetailPage();

      await screen.findByText("ORD-20261122-0050");
      expect(screen.queryByTestId("pay-now-btn")).not.toBeInTheDocument();
      expect(screen.getAllByText("💳 Paid").length).toBeGreaterThan(0);
    });

    it("does not render 'Pay Now' button when order is CANCELLED", async () => {
      vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: CANCELLED_ORDER });

      renderOrderDetailPage();

      await screen.findByText("ORD-20261122-0050");
      expect(screen.queryByTestId("pay-now-btn")).not.toBeInTheDocument();
    });

    it("opens payment modal, submits simulated payment, and displays updated PAID receipt", async () => {
      vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: UNPAID_ORDER });
      vi.mocked(api.payOrderApi).mockResolvedValueOnce({ data: PAID_ORDER });

      renderOrderDetailPage();
      await screen.findByText("ORD-20261122-0050");

      // Click Pay Now
      fireEvent.click(screen.getByTestId("pay-now-btn"));

      expect(screen.getByTestId("pay-order-modal")).toBeInTheDocument();
      expect(screen.getByTestId("pay-method-card")).toBeChecked();

      // Submit payment
      fireEvent.click(screen.getByTestId("confirm-pay-btn"));

      await waitFor(() => {
        expect(api.payOrderApi).toHaveBeenCalledWith(50, "SIMULATED_CARD");
      });

      // Modal closed and success message displayed
      expect(screen.queryByTestId("pay-order-modal")).not.toBeInTheDocument();
      expect(screen.getByTestId("pay-success-banner")).toHaveTextContent("Payment of $299.00 received via Credit Card.");
      expect(screen.getAllByText("💳 Paid").length).toBeGreaterThan(0);
      expect(screen.getByTestId("order-receipt-payment-method")).toHaveTextContent("Credit Card (Simulated)");
    });

    it("allows selecting PromptPay in payment modal", async () => {
      vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: UNPAID_ORDER });
      const promptPayPaidOrder: OrderData = {
        ...UNPAID_ORDER,
        paymentStatus: "PAID",
        paymentMethod: "SIMULATED_PROMPTPAY",
        paidAt: "2026-11-22T10:05:00.000Z",
      };
      vi.mocked(api.payOrderApi).mockResolvedValueOnce({ data: promptPayPaidOrder });

      renderOrderDetailPage();
      await screen.findByText("ORD-20261122-0050");

      fireEvent.click(screen.getByTestId("pay-now-btn"));
      fireEvent.click(screen.getByTestId("pay-method-promptpay"));
      expect(screen.getByTestId("pay-method-promptpay")).toBeChecked();

      fireEvent.click(screen.getByTestId("confirm-pay-btn"));

      await waitFor(() => {
        expect(api.payOrderApi).toHaveBeenCalledWith(50, "SIMULATED_PROMPTPAY");
      });

      expect(screen.getByTestId("pay-success-banner")).toHaveTextContent("Payment of $299.00 received via PromptPay.");
    });

    it("displays error banner inside payment modal when pay API fails", async () => {
      vi.mocked(api.getOrderByIdApi).mockResolvedValueOnce({ data: UNPAID_ORDER });
      const error: any = new Error("Order has already been paid.");
      error.status = 409;
      vi.mocked(api.payOrderApi).mockRejectedValueOnce(error);

      renderOrderDetailPage();
      await screen.findByText("ORD-20261122-0050");

      fireEvent.click(screen.getByTestId("pay-now-btn"));
      fireEvent.click(screen.getByTestId("confirm-pay-btn"));

      await screen.findByTestId("pay-error-banner");
      expect(screen.getByTestId("pay-error-banner")).toHaveTextContent("Order has already been paid.");
    });
  });

  describe("OperatorOrdersPage Extended Fulfillment Progression", () => {
    it("renders 'Mark Packed' button for ACCEPTED orders and handles progression", async () => {
      const acceptedOrder: OrderData = {
        ...UNPAID_ORDER,
        id: 51,
        orderNumber: "ORD-20261122-0051",
        status: "ACCEPTED",
      };
      vi.mocked(api.getOperatorOrdersApi).mockResolvedValue({ data: [acceptedOrder] });
      vi.mocked(api.processOperatorOrderApi).mockResolvedValueOnce({
        data: {
          id: 51,
          orderNumber: "ORD-20261122-0051",
          status: "PACKED",
          updatedAt: new Date().toISOString(),
        },
      });

      renderOperatorQueue();

      await screen.findByText("ORD-20261122-0051");
      const packedBtn = screen.getByTestId("mark-packed-btn-51");
      expect(packedBtn).toBeInTheDocument();

      fireEvent.click(packedBtn);

      await waitFor(() => {
        expect(api.processOperatorOrderApi).toHaveBeenCalledWith(51, "PACKED");
      });
    });

    it("renders 'Mark Shipped' button for PACKED orders and handles progression", async () => {
      const packedOrder: OrderData = {
        ...UNPAID_ORDER,
        id: 52,
        orderNumber: "ORD-20261122-0052",
        status: "PACKED",
      };
      vi.mocked(api.getOperatorOrdersApi).mockResolvedValue({ data: [packedOrder] });
      vi.mocked(api.processOperatorOrderApi).mockResolvedValueOnce({
        data: {
          id: 52,
          orderNumber: "ORD-20261122-0052",
          status: "SHIPPED",
          updatedAt: new Date().toISOString(),
        },
      });

      renderOperatorQueue();

      await screen.findByText("ORD-20261122-0052");
      const shippedBtn = screen.getByTestId("mark-shipped-btn-52");
      expect(shippedBtn).toBeInTheDocument();

      fireEvent.click(shippedBtn);

      await waitFor(() => {
        expect(api.processOperatorOrderApi).toHaveBeenCalledWith(52, "SHIPPED");
      });
    });
  });

  describe("OrderConfirmationModal Navigation", () => {
    it("navigates directly to order detail page when 'View Order Details' is clicked", () => {
      const handleClose = vi.fn();
      render(
        <MemoryRouter initialEntries={["/cart"]}>
          <Routes>
            <Route
              path="/cart"
              element={<OrderConfirmationModal order={UNPAID_ORDER} onClose={handleClose} />}
            />
            <Route path="/orders/:id" element={<div data-testid="order-detail-view">Order 50 Details</div>} />
          </Routes>
        </MemoryRouter>
      );

      expect(screen.getByText("Order Placed Successfully!")).toBeInTheDocument();
      const viewDetailsBtn = screen.getByTestId("view-orders-btn");
      expect(viewDetailsBtn).toHaveTextContent("View Order Details");

      fireEvent.click(viewDetailsBtn);

      expect(handleClose).toHaveBeenCalled();
      expect(screen.getByTestId("order-detail-view")).toBeInTheDocument();
    });
  });

  describe("OrderDetailPage Operator Fulfillment Actions", () => {
    it("renders accept and reject buttons for PENDING orders and accepts order", async () => {
      vi.mocked(api.getOrderByIdApi)
        .mockResolvedValueOnce({ data: UNPAID_ORDER })
        .mockResolvedValueOnce({
          data: { ...UNPAID_ORDER, status: "ACCEPTED" },
        });
      vi.mocked(api.processOperatorOrderApi).mockResolvedValueOnce({
        data: { id: 50, orderNumber: "ORD-20261122-0050", status: "ACCEPTED", updatedAt: new Date().toISOString() },
      });

      renderOrderDetailPage("50", true);

      await screen.findByText("ORD-20261122-0050");
      const acceptBtn = screen.getByTestId("operator-accept-btn");
      const rejectBtn = screen.getByTestId("operator-reject-btn");
      expect(acceptBtn).toBeInTheDocument();
      expect(rejectBtn).toBeInTheDocument();

      fireEvent.click(acceptBtn);

      await waitFor(() => {
        expect(api.processOperatorOrderApi).toHaveBeenCalledWith(50, "ACCEPTED");
      });
    });

    it("opens reject dialog when operator clicks Reject and calls API on confirm", async () => {
      vi.mocked(api.getOrderByIdApi)
        .mockResolvedValueOnce({ data: UNPAID_ORDER })
        .mockResolvedValueOnce({
          data: { ...UNPAID_ORDER, status: "REJECTED", paymentStatus: "VOID" },
        });
      vi.mocked(api.processOperatorOrderApi).mockResolvedValueOnce({
        data: { id: 50, orderNumber: "ORD-20261122-0050", status: "REJECTED", updatedAt: new Date().toISOString() },
      });

      renderOrderDetailPage("50", true);

      await screen.findByText("ORD-20261122-0050");
      const rejectBtn = screen.getByTestId("operator-reject-btn");
      fireEvent.click(rejectBtn);

      expect(screen.getByText("Reject order ORD-20261122-0050?")).toBeInTheDocument();

      const dialog = screen.getByRole("dialog");
      const confirmBtn = within(dialog).getByRole("button", { name: "Confirm Rejection" });
      fireEvent.click(confirmBtn);

      await waitFor(() => {
        expect(api.processOperatorOrderApi).toHaveBeenCalledWith(50, "REJECTED");
      });
    });

    it("renders Mark Packed button for ACCEPTED orders and advances status", async () => {
      const acceptedOrder: OrderData = { ...UNPAID_ORDER, status: "ACCEPTED" };
      vi.mocked(api.getOrderByIdApi)
        .mockResolvedValueOnce({ data: acceptedOrder })
        .mockResolvedValueOnce({
          data: { ...acceptedOrder, status: "PACKED" },
        });
      vi.mocked(api.processOperatorOrderApi).mockResolvedValueOnce({
        data: { id: 50, orderNumber: "ORD-20261122-0050", status: "PACKED", updatedAt: new Date().toISOString() },
      });

      renderOrderDetailPage("50", true);

      await screen.findByText("ORD-20261122-0050");
      const packedBtn = screen.getByTestId("operator-mark-packed-btn");
      expect(packedBtn).toBeInTheDocument();

      fireEvent.click(packedBtn);

      await waitFor(() => {
        expect(api.processOperatorOrderApi).toHaveBeenCalledWith(50, "PACKED");
      });
    });

    it("renders Mark Shipped button for PACKED orders and advances status", async () => {
      const packedOrder: OrderData = { ...UNPAID_ORDER, status: "PACKED" };
      vi.mocked(api.getOrderByIdApi)
        .mockResolvedValueOnce({ data: packedOrder })
        .mockResolvedValueOnce({
          data: { ...packedOrder, status: "SHIPPED" },
        });
      vi.mocked(api.processOperatorOrderApi).mockResolvedValueOnce({
        data: { id: 50, orderNumber: "ORD-20261122-0050", status: "SHIPPED", updatedAt: new Date().toISOString() },
      });

      renderOrderDetailPage("50", true);

      await screen.findByText("ORD-20261122-0050");
      const shippedBtn = screen.getByTestId("operator-mark-shipped-btn");
      expect(shippedBtn).toBeInTheDocument();

      fireEvent.click(shippedBtn);

      await waitFor(() => {
        expect(api.processOperatorOrderApi).toHaveBeenCalledWith(50, "SHIPPED");
      });
    });
  });
});
