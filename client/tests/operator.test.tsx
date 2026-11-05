import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import OperatorOrdersPage from "../src/pages/OperatorOrdersPage";
import OrderDetailPage from "../src/pages/OrderDetailPage";
import * as api from "../src/api";
import { OrderData } from "../src/types/order";

vi.mock("../src/api", () => ({
  getOperatorOrdersApi: vi.fn(),
  processOperatorOrderApi: vi.fn(),
  getOrderByIdApi: vi.fn(),
}));

const order: OrderData = {
  id: 42, orderNumber: "ORD-20261105-0042", customerId: 2,
  customerName: "Bob Customer", customerEmail: "bob@example.com",
  status: "PENDING", totalAmount: "158.00", itemCount: 2,
  createdAt: "2026-11-05T01:00:00.000Z",
  items: [{ id: 1, productId: 3, productName: "Keyboard", sku: "KB-MECH-RGB", unitPrice: "79.00", quantity: 2, subtotal: "158.00" }],
};

function renderQueue(path = "/operator/orders") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/operator/orders" element={<OperatorOrdersPage />} />
        <Route path="/orders/:id" element={<OrderDetailPage operatorView />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.resetAllMocks();
  // jsdom does not implement native modal behavior. Browser focus trapping is
  // verified separately; this shim only permits component interaction checks.
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute("open", ""); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute("open"); };
  vi.mocked(api.getOperatorOrdersApi).mockResolvedValue({ data: [order] });
  vi.mocked(api.getOrderByIdApi).mockResolvedValue({ data: order });
});

describe("F-05 operator queue", () => {
  it("renders loading, customer information, preserved totals and pending controls", async () => {
    renderQueue();
    expect(screen.getByRole("status")).toHaveTextContent("Loading orders");
    await screen.findByText("Bob Customer");
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
    expect(screen.getByText("$158.00")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: `Accept order ${order.orderNumber}` })).toBeEnabled();
    expect(screen.getByRole("button", { name: `Reject order ${order.orderNumber}` })).toBeEnabled();
  });

  it("filters server requests and preserves selection on refresh", async () => {
    renderQueue();
    await screen.findByText("Bob Customer");
    fireEvent.click(screen.getByRole("button", { name: "Pending" }));
    await waitFor(() => expect(api.getOperatorOrdersApi).toHaveBeenLastCalledWith("PENDING", expect.any(AbortSignal)));
    await screen.findByText("Bob Customer");
    fireEvent.click(screen.getByRole("button", { name: "Refresh Queue" }));
    await waitFor(() => expect(api.getOperatorOrdersApi).toHaveBeenLastCalledWith("PENDING", expect.any(AbortSignal)));
    expect(screen.getByRole("button", { name: "Pending" })).toHaveAttribute("aria-pressed", "true");
  });

  it("accepts once while a request is pending, then removes terminal controls", async () => {
    let resolve!: (result: Awaited<ReturnType<typeof api.processOperatorOrderApi>>) => void;
    vi.mocked(api.processOperatorOrderApi).mockImplementation(() => new Promise(done => { resolve = done; }));
    renderQueue();
    const accept = await screen.findByRole("button", { name: `Accept order ${order.orderNumber}` });
    fireEvent.click(accept);
    fireEvent.click(accept);
    expect(api.processOperatorOrderApi).toHaveBeenCalledTimes(1);
    expect(accept).toBeDisabled();
    vi.mocked(api.getOperatorOrdersApi).mockResolvedValue({ data: [{ ...order, status: "ACCEPTED" }] });
    resolve({ data: { id: 42, orderNumber: order.orderNumber, status: "ACCEPTED", updatedAt: order.createdAt } });
    await screen.findByText("ACCEPTED");
    expect(screen.getByRole("status")).toHaveTextContent("accepted");
    expect(screen.queryByRole("button", { name: `Accept order ${order.orderNumber}` })).not.toBeInTheDocument();
  });

  it("requires rejection confirmation and restores focus when cancelled", async () => {
    renderQueue();
    const reject = await screen.findByRole("button", { name: `Reject order ${order.orderNumber}` });
    reject.focus();
    fireEvent.click(reject);
    expect(screen.getByRole("dialog")).toHaveAccessibleName(`Reject order ${order.orderNumber}?`);
    expect(screen.getByText(/restore all reserved items/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Keep Order" })).toHaveFocus();
    expect(api.processOperatorOrderApi).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Keep Order" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(reject).toHaveFocus();
  });

  it("confirms rejection and retains the selected pending filter", async () => {
    renderQueue("/operator/orders?status=PENDING");
    fireEvent.click(await screen.findByRole("button", { name: `Reject order ${order.orderNumber}` }));
    vi.mocked(api.processOperatorOrderApi).mockResolvedValue({ data: { id: 42, orderNumber: order.orderNumber, status: "REJECTED", updatedAt: order.createdAt } });
    vi.mocked(api.getOperatorOrdersApi).mockResolvedValue({ data: [] });
    fireEvent.click(screen.getByRole("button", { name: "Confirm Rejection" }));
    await screen.findByText("No pending orders");
    expect(api.processOperatorOrderApi).toHaveBeenCalledWith(42, "REJECTED");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Reserved inventory has been restored");
    expect(api.getOperatorOrdersApi).toHaveBeenLastCalledWith("PENDING", expect.any(AbortSignal));
  });

  it("keeps rejection errors inside the dialog without success feedback", async () => {
    vi.mocked(api.processOperatorOrderApi).mockRejectedValue(new Error("Processing unavailable"));
    renderQueue();
    fireEvent.click(await screen.findByRole("button", { name: `Reject order ${order.orderNumber}` }));
    fireEvent.click(screen.getByRole("button", { name: "Confirm Rejection" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("dialog")).toHaveTextContent("Processing unavailable");
    expect(screen.queryByText(/Reserved inventory has been restored/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Confirm Rejection" })).toBeEnabled();
  });

  it("refreshes after a 409 and shows current terminal status without success feedback", async () => {
    renderQueue();
    const accept = await screen.findByRole("button", { name: `Accept order ${order.orderNumber}` });
    vi.mocked(api.processOperatorOrderApi).mockRejectedValue(Object.assign(new Error("Already processed"), { status: 409 }));
    vi.mocked(api.getOperatorOrdersApi).mockResolvedValue({ data: [{ ...order, status: "REJECTED" }] });
    fireEvent.click(accept);
    await screen.findByText("REJECTED");
    expect(screen.getByRole("alert")).toHaveTextContent("Already processed");
    expect(screen.queryByText(`Order ${order.orderNumber} accepted.`)).not.toBeInTheDocument();
  });

  it("shows an empty state and permits retry after a queue failure", async () => {
    vi.mocked(api.getOperatorOrdersApi).mockRejectedValueOnce(new Error("Queue unavailable"));
    renderQueue();
    expect(await screen.findByRole("alert")).toHaveTextContent("Queue unavailable");
    vi.mocked(api.getOperatorOrdersApi).mockResolvedValue({ data: [] });
    fireEvent.click(screen.getByRole("button", { name: "Retry Queue" }));
    await screen.findByText("No orders");
  });

  it("opens a preserved-price receipt and returns to the selected operator filter", async () => {
    renderQueue("/operator/orders?status=PENDING");
    fireEvent.click(await screen.findByRole("link", { name: `View details for ${order.orderNumber}` }));
    await screen.findByTestId("order-receipt-card");
    expect(screen.getByTestId("item-price-KB-MECH-RGB")).toHaveTextContent("$79.00");
    expect(screen.getByTestId("back-to-orders-link")).toHaveAttribute("href", "/operator/orders?status=PENDING");
    fireEvent.click(screen.getByTestId("back-to-orders-link"));
    await screen.findByText("Bob Customer");
    expect(screen.getByRole("button", { name: "Pending" })).toHaveAttribute("aria-pressed", "true");
  });

  it("reports successful processing separately from a failed queue refresh", async () => {
    renderQueue();
    const accept = await screen.findByRole("button", { name: `Accept order ${order.orderNumber}` });
    vi.mocked(api.processOperatorOrderApi).mockResolvedValue({ data: { id: 42, orderNumber: order.orderNumber, status: "ACCEPTED", updatedAt: order.createdAt } });
    vi.mocked(api.getOperatorOrdersApi).mockRejectedValue(new Error("Refresh unavailable"));
    fireEvent.click(accept);
    await screen.findByRole("alert");
    expect(screen.getByRole("status")).toHaveTextContent(`Order ${order.orderNumber} accepted.`);
    expect(screen.getByRole("alert")).toHaveTextContent("Refresh unavailable");
    expect(screen.queryByRole("button", { name: `Accept order ${order.orderNumber}` })).not.toBeInTheDocument();
  });

  it("ignores an obsolete queue response after switching filters", async () => {
    let resolveOld!: (result: { data: OrderData[] }) => void;
    vi.mocked(api.getOperatorOrdersApi).mockImplementationOnce(() => new Promise(done => { resolveOld = done; }));
    renderQueue();
    vi.mocked(api.getOperatorOrdersApi).mockResolvedValue({ data: [{ ...order, status: "ACCEPTED" }] });
    fireEvent.click(screen.getByRole("button", { name: "Accepted" }));
    await screen.findByText("ACCEPTED");
    resolveOld({ data: [order] });
    await waitFor(() => expect(screen.queryByRole("button", { name: `Accept order ${order.orderNumber}` })).not.toBeInTheDocument());
    expect(screen.getByText("ACCEPTED")).toBeInTheDocument();
  });
});
