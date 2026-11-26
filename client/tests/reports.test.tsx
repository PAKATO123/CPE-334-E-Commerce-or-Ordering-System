import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import OperatorReportsPage from "../src/pages/OperatorReportsPage";
import * as api from "../src/api";

vi.mock("../src/api", () => ({
  getSalesSummaryApi: vi.fn(),
  getTurnaroundMetricsApi: vi.fn(),
}));

const MOCK_SALES_SUMMARY: api.SalesSummaryData = {
  totalRevenue: "12845.50",
  totalOrders: 42,
  averageOrderValue: "338.04",
  statusCounts: {
    PENDING: 4,
    ACCEPTED: 6,
    PACKED: 8,
    SHIPPED: 20,
    CANCELLED: 2,
    REJECTED: 2,
  },
  paymentStatusCounts: {
    UNPAID: 4,
    PAID: 34,
    REFUNDED: 3,
    VOID: 1,
  },
};

const MOCK_TURNAROUND: api.TurnaroundMetricsData = {
  shippedOrderCount: 20,
  averageTurnaroundHours: 4.25,
  averageTurnaroundMinutes: 255,
  fastestTurnaroundMinutes: 18,
  slowestTurnaroundMinutes: 720,
};

function renderReportsPage() {
  return render(
    <MemoryRouter initialEntries={["/operator/reports"]}>
      <Routes>
        <Route path="/operator/reports" element={<OperatorReportsPage />} />
      </Routes>
    </MemoryRouter>
  );
}

describe("Feature 9: Operator Reports Dashboard Client Tests (F-09)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders page header and metric KPI cards from API response", async () => {
    vi.mocked(api.getSalesSummaryApi).mockResolvedValueOnce({ data: MOCK_SALES_SUMMARY });
    vi.mocked(api.getTurnaroundMetricsApi).mockResolvedValueOnce({ data: MOCK_TURNAROUND });

    renderReportsPage();

    expect(screen.getByText("Loading reporting metrics...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("sales-summary-revenue")).toHaveTextContent("$12845.50");
    });

    expect(screen.getByTestId("reports-title")).toHaveTextContent("Store Analytics & Fulfillment Reports");
    expect(screen.getByTestId("sales-summary-orders")).toHaveTextContent("42");
    expect(screen.getByTestId("sales-summary-aov")).toHaveTextContent("$338.04");
    expect(screen.getByTestId("reports-turnaround-avg")).toHaveTextContent("4.25 hrs");
  });

  it("renders status distributions and turnaround extremes correctly", async () => {
    vi.mocked(api.getSalesSummaryApi).mockResolvedValueOnce({ data: MOCK_SALES_SUMMARY });
    vi.mocked(api.getTurnaroundMetricsApi).mockResolvedValueOnce({ data: MOCK_TURNAROUND });

    renderReportsPage();

    await screen.findByTestId("sales-summary-revenue");

    expect(screen.getByTestId("status-count-PENDING")).toHaveTextContent("4 (9.5%)");
    expect(screen.getByTestId("status-count-ACCEPTED")).toHaveTextContent("6 (14.3%)");
    expect(screen.getByTestId("status-count-SHIPPED")).toHaveTextContent("20 (47.6%)");

    expect(screen.getByTestId("payment-status-count-PAID")).toHaveTextContent("34 (81.0%)");
    expect(screen.getByTestId("payment-status-count-UNPAID")).toHaveTextContent("4 (9.5%)");

    expect(screen.getByText("18 mins")).toBeInTheDocument();
    expect(screen.getByText("720 mins")).toBeInTheDocument();
  });

  it("triggers new API fetch when changing date filter to 'Last 7 Days'", async () => {
    vi.mocked(api.getSalesSummaryApi).mockResolvedValue({ data: MOCK_SALES_SUMMARY });
    vi.mocked(api.getTurnaroundMetricsApi).mockResolvedValue({ data: MOCK_TURNAROUND });

    renderReportsPage();
    await screen.findByTestId("sales-summary-revenue");

    const filter7dBtn = screen.getByTestId("filter-7d-btn");
    fireEvent.click(filter7dBtn);

    await waitFor(() => {
      // Called with start and end date timestamps
      expect(api.getSalesSummaryApi).toHaveBeenCalledTimes(2);
      expect(api.getSalesSummaryApi).toHaveBeenLastCalledWith(
        expect.any(String),
        expect.any(String)
      );
    });
  });

  it("displays error banner when API fails", async () => {
    vi.mocked(api.getSalesSummaryApi).mockRejectedValueOnce(new Error("Unable to connect to database"));
    vi.mocked(api.getTurnaroundMetricsApi).mockResolvedValueOnce({ data: MOCK_TURNAROUND });

    renderReportsPage();

    await screen.findByTestId("reports-error-banner");
    expect(screen.getByTestId("reports-error-banner")).toHaveTextContent("Unable to connect to database");
  });
});
