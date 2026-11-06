import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { RequesterDashboardPage } from "../../src/pages/RequesterDashboardPage";
import * as api from "../../src/api";

vi.mock("../../src/api", async () => {
  const actual = await vi.importActual("../../src/api");
  return {
    ...actual,
    getRequesterDashboard: vi.fn(),
  };
});

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 1, name: "Alice Chen", email: "requester1@toktickit.local", role: "REQUESTER" },
    loading: false,
  }),
}));

vi.mock("../../src/context/RequesterContext", () => ({
  useRequester: () => ({
    selectedRequester: { id: 1, name: "Alice Chen", email: "requester1@toktickit.local" },
  }),
}));

describe("Lab 04 - Requester Dashboard UI Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render Requester dashboard metric cards and quick action links", async () => {
    vi.mocked(api.getRequesterDashboard).mockResolvedValueOnce({
      metrics: {
        totalOpen: 3,
        waitingForRequester: 1,
      },
      recentlyUpdated: [
        {
          id: 101,
          ticketNumber: "TK-1001",
          summary: "VPN Connection Intermittent",
          description: "Details",
          category: { id: 1, name: "Network" },
          relatedSystem: { id: 1, name: "VPN Gateway" },
          requestedPriority: "HIGH",
          itPriority: "High",
          currentStatus: "Open",
          isRequesterResolved: false,
          requesterId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      recentlyResolved: [],
    });

    render(
      <MemoryRouter>
        <RequesterDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, Alice Chen!/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Total Open Tickets")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
    expect(screen.getByText("Waiting for Your Input")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("#TK-1001")).toBeInTheDocument();
    expect(screen.getByText("VPN Connection Intermittent")).toBeInTheDocument();
  });
});
