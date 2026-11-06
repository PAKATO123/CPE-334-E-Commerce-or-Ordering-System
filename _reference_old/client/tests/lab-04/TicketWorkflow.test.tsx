import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { TicketDetailPage } from "../../src/pages/TicketDetailPage";
import * as api from "../../src/api";

vi.mock("../../src/api", async () => {
  const actual = await vi.importActual("../../src/api");
  return {
    ...actual,
    getTicketDetail: vi.fn(),
    getPublicComments: vi.fn(),
    getInternalNotes: vi.fn(),
    getStaffUsers: vi.fn(),
    getActionsTaken: vi.fn(),
  };
});

vi.mock("../../src/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: 10, name: "Bob Staff", email: "staff1@toktickit.local", role: "IT_STAFF" },
    loading: false,
  }),
}));

vi.mock("../../src/context/RequesterContext", () => ({
  useRequester: () => ({
    selectedRequester: null,
  }),
}));

describe("Lab 04 - Ticket Workflow UI Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render permitted status transitions for IT Staff", async () => {
    vi.mocked(api.getTicketDetail).mockResolvedValueOnce({
      id: 1,
      ticketNumber: "TK-1001",
      summary: "Network Connectivity Outage",
      description: "Unable to connect to internal Wi-Fi",
      category: { id: 1, name: "Network" },
      relatedSystem: { id: 1, name: "Wi-Fi AP" },
      requestedPriority: "HIGH",
      itPriority: "High",
      currentStatus: "Open",
      isRequesterResolved: false,
      requesterId: 1,
      requester: { id: 1, name: "Alice Requester", email: "requester1@toktickit.local" },
      assignedTo: { id: 10, name: "Bob Staff", email: "staff1@toktickit.local", role: "IT_STAFF" },
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    vi.mocked(api.getPublicComments).mockResolvedValueOnce([]);
    vi.mocked(api.getInternalNotes).mockResolvedValueOnce([]);
    vi.mocked(api.getStaffUsers).mockResolvedValueOnce([]);
    vi.mocked(api.getActionsTaken).mockResolvedValueOnce([]);

    render(
      <MemoryRouter initialEntries={["/tickets/1"]}>
        <Routes>
          <Route path="/tickets/:id" element={<TicketDetailPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/TK-1001/)).toBeInTheDocument();
    });

    const statusSelect = screen.getByTestId("status-select");
    expect(statusSelect).toBeInTheDocument();
    expect(statusSelect).toHaveValue("Open");

    // Check permitted status transition options rendered in combobox
    const options = Array.from(statusSelect.querySelectorAll("option")).map((opt) => opt.value);
    expect(options).toContain("Open");
    expect(options).toContain("In Progress");
    expect(options).toContain("Waiting for Requester");
    expect(options).toContain("Pending Verification");
    expect(options).toContain("Resolved");
    expect(options).toContain("Cancelled");
  });
});

