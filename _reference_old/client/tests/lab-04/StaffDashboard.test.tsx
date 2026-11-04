import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { StaffDashboardPage } from "../../src/pages/StaffDashboardPage";
import * as api from "../../src/api";

vi.mock("../../src/api", async () => {
  const actual = await vi.importActual("../../src/api");
  return {
    ...actual,
    getStaffDashboard: vi.fn(),
  };
});

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 10, name: "Bob Smith", email: "staff1@toktickit.local", role: "IT_STAFF" },
    loading: false,
  }),
}));

describe("Lab 04 - Staff Dashboard UI Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render IT Staff dashboard metric cards and status breakdown grid", async () => {
    vi.mocked(api.getStaffDashboard).mockResolvedValueOnce({
      metrics: {
        unassignedCount: 4,
        myOwnedCount: 2,
        urgentHighCount: 1,
        followUpCount: 3,
      },
      statusDistribution: {
        New: 2,
        Open: 3,
        "In Progress": 1,
        "Waiting for Requester": 1,
        Resolved: 0,
        Closed: 0,
        Reopened: 0,
        Cancelled: 0,
      },
      recentActivity: [
        {
          id: 201,
          ticketNumber: "TK-2001",
          summary: "Database Performance Issue",
          description: "Slow queries",
          category: { id: 2, name: "Database" },
          relatedSystem: { id: 2, name: "PostgreSQL" },
          requestedPriority: "URGENT",
          itPriority: "Urgent",
          currentStatus: "In Progress",
          isRequesterResolved: false,
          requesterId: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    render(
      <MemoryRouter>
        <StaffDashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/IT Staff Operations Dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByText("Unassigned Tickets")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
    expect(screen.getByText("My Assigned Tickets")).toBeInTheDocument();
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getByText("Urgent & High Priority")).toBeInTheDocument();
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getByText("#TK-2001")).toBeInTheDocument();
    expect(screen.getByText("Database Performance Issue")).toBeInTheDocument();
  });
});
