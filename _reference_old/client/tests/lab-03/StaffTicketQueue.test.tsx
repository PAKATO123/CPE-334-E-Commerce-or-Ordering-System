import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import StaffQueuePage from "../../src/pages/StaffQueuePage";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  getStaffQueue: vi.fn(),
  getCategories: vi.fn().mockResolvedValue([
    { id: 1, name: "Account and Access", isActive: true },
    { id: 2, name: "Hardware", isActive: true },
  ]),
  getRelatedSystems: vi.fn().mockResolvedValue([
    { id: 1, name: "Email & Collaboration", description: "Email", isActive: true },
  ]),
  getMeApi: vi.fn(),
}));

const mockStaffUser = {
  id: 10,
  email: "staff1@toktickit.local",
  name: "Jane Staff",
  role: "IT_STAFF" as const,
  mustChangePassword: false,
  isActive: true,
};

const mockQueueItem: api.StaffQueueTicketItem = {
  id: 1,
  ticketNumber: "TICK-2026-0001",
  summary: "VPN connection drops every 15 mins",
  description: "VPN disconnects unexpectedly during work hours.",
  currentStatus: "Open",
  requestedPriority: "HIGH",
  itPriority: "High",
  isRequesterResolved: false,
  createdAt: "2026-09-13T10:00:00Z",
  category: { id: 1, name: "Account and Access" },
  relatedSystem: { id: 1, name: "Email & Collaboration" },
  requester: { id: 1, name: "Alice Smith", email: "requester1@toktickit.local" },
  assignedTo: { id: 10, name: "Jane Staff", email: "staff1@toktickit.local" },
  _count: { attachments: 1, publicComments: 2, internalNotes: 1 },
};

describe("Lab 03 Client — Staff Ticket Queue Component (StaffTicketQueue.test.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getMeApi as any).mockResolvedValue({ user: mockStaffUser });
    (api.getStaffQueue as any).mockResolvedValue({
      data: [mockQueueItem],
      pagination: {
        total: 1,
        page: 1,
        pageSize: 10,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
    });
  });

  it("renders queue table with status, priority, and assignment badges", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <StaffQueuePage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("staff-queue-table")).toBeDefined();
      expect(screen.getByText("TICK-2026-0001")).toBeDefined();
      expect(screen.getByText("Alice Smith")).toBeDefined();
      expect(screen.getByTestId("status-badge")).toBeDefined();
      expect(screen.getByTestId("priority-badge")).toBeDefined();
      expect(screen.getByText(/Jane Staff/)).toBeDefined();
    });
  });

  it("filters tickets dynamically by search keyword, status, priority, and assignment", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <StaffQueuePage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("search-input")).toBeDefined();
    });

    fireEvent.change(screen.getByTestId("search-input"), { target: { value: "VPN" } });

    await waitFor(() => {
      expect(api.getStaffQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          search: "VPN",
        })
      );
    });

    fireEvent.change(screen.getByTestId("status-filter"), { target: { value: "Open" } });

    await waitFor(() => {
      expect(api.getStaffQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          status: "Open",
        })
      );
    });
  });

  it("paginates tickets with selectable page sizes", async () => {
    (api.getStaffQueue as any).mockResolvedValue({
      data: [mockQueueItem],
      pagination: {
        total: 30,
        page: 1,
        pageSize: 10,
        totalPages: 3,
        hasPreviousPage: false,
        hasNextPage: true,
      },
    });

    render(
      <MemoryRouter>
        <AuthProvider>
          <StaffQueuePage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("page-size-select")).toBeDefined();
      expect(screen.getByTestId("next-page")).toBeDefined();
    });

    fireEvent.change(screen.getByTestId("page-size-select"), { target: { value: "25" } });

    await waitFor(() => {
      expect(api.getStaffQueue).toHaveBeenCalledWith(
        expect.objectContaining({
          pageSize: 25,
        })
      );
    });
  });

  it("rejects non-staff requester user with access denied view", async () => {
    const requesterUser = {
      id: 2,
      email: "requester1@toktickit.local",
      name: "Alice Smith",
      role: "REQUESTER" as const,
      mustChangePassword: false,
      isActive: true,
    };
    (api.getMeApi as any).mockResolvedValue({ user: requesterUser });

    render(
      <MemoryRouter>
        <AuthProvider>
          <StaffQueuePage />
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("403 Access Denied")).toBeDefined();
      expect(screen.getByText(/The IT Staff Queue is restricted/)).toBeDefined();
    });
  });
});
