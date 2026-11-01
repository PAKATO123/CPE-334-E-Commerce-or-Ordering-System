import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import TicketDetailPage from "../../src/pages/TicketDetailPage";
import { AuthProvider } from "../../src/context/AuthContext";
import { RequesterProvider } from "../../src/context/RequesterContext";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  getTicketDetail: vi.fn(),
  claimTicket: vi.fn(),
  assignTicket: vi.fn(),
  updateItPriority: vi.fn(),
  updateTicketStatus: vi.fn(),
  getPublicComments: vi.fn(),
  postPublicComment: vi.fn(),
  getInternalNotes: vi.fn(),
  postInternalNote: vi.fn(),
  getStaffUsers: vi.fn(),
  getMeApi: vi.fn(),
  getRequesters: vi.fn().mockResolvedValue([]),
  getAttachmentDownloadUrl: vi.fn().mockReturnValue("/mock-download"),
  getAttachmentPreviewUrl: vi.fn().mockReturnValue("/mock-preview"),
  requestResolutionIndication: vi.fn(),
}));

const mockStaffUser = {
  id: 10,
  email: "staff1@toktickit.local",
  name: "Jane Staff",
  role: "IT_STAFF" as const,
  mustChangePassword: false,
  isActive: true,
};

const mockRequesterUser = {
  id: 1,
  email: "requester1@toktickit.local",
  name: "Alice Smith",
  role: "REQUESTER" as const,
  mustChangePassword: false,
  isActive: true,
};

const mockTicketDetail: api.TicketDetailData = {
  id: 1,
  ticketNumber: "TICK-2026-0001",
  requesterId: 1,
  summary: "VPN connection drops repeatedly",
  description: "Unable to stay connected to office VPN.",
  currentStatus: "Open",
  requestedPriority: "HIGH",
  itPriority: "HIGH",
  isRequesterResolved: false,
  assignedTo: null,
  createdAt: "2026-09-13T10:00:00Z",
  updatedAt: "2026-09-13T10:00:00Z",
  category: { id: 1, name: "Account and Access" },
  relatedSystem: { id: 1, name: "Email & Collaboration" },
  requester: { id: 1, name: "Alice Smith", email: "requester1@toktickit.local" },
  attachments: [],
};

const mockStaffUsersList = [
  { id: 10, name: "Jane Staff", email: "staff1@toktickit.local", role: "IT_STAFF", isActive: true },
  { id: 11, name: "Bob Staff", email: "staff2@toktickit.local", role: "IT_STAFF", isActive: true },
];

const mockComments = [
  {
    id: 101,
    ticketId: 1,
    authorId: 1,
    content: "Please check VPN server logs.",
    createdAt: "2026-09-14T10:00:00Z",
    author: { id: 1, name: "Alice Smith", role: "REQUESTER", email: "requester1@toktickit.local" },
  },
];

const mockNotes = [
  {
    id: 201,
    ticketId: 1,
    authorId: 10,
    content: "Investigating gateway node #4.",
    createdAt: "2026-09-14T11:00:00Z",
    author: { id: 10, name: "Jane Staff", role: "IT_STAFF", email: "staff1@toktickit.local" },
  },
];

describe("Lab 03 Client — Staff Ticket Detail Component (StaffTicketDetail.test.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getMeApi as any).mockResolvedValue({ user: mockStaffUser });
    (api.getTicketDetail as any).mockResolvedValue(mockTicketDetail);
    (api.getPublicComments as any).mockResolvedValue(mockComments);
    (api.getInternalNotes as any).mockResolvedValue(mockNotes);
    (api.getStaffUsers as any).mockResolvedValue(mockStaffUsersList);
  });

  it("renders claim button, reassign dropdown, IT Priority selector, and status transition matrix", async () => {
    render(
      <MemoryRouter initialEntries={["/tickets/1"]}>
        <AuthProvider>
          <RequesterProvider>
            <Routes>
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Routes>
          </RequesterProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("claim-ticket-button")).toBeDefined();
      expect(screen.getByTestId("assignee-select")).toBeDefined();
      expect(screen.getByTestId("it-priority-select")).toBeDefined();
      expect(screen.getByTestId("status-select")).toBeDefined();
    });
  });

  it("renders tabbed Public Comments feed and confidential Internal Notes feed", async () => {
    render(
      <MemoryRouter initialEntries={["/tickets/1"]}>
        <AuthProvider>
          <RequesterProvider>
            <Routes>
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Routes>
          </RequesterProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("comments-tab")).toBeDefined();
      expect(screen.getByTestId("notes-tab")).toBeDefined();
      expect(screen.getByTestId("comments-feed")).toBeDefined();
      expect(screen.getByText("Please check VPN server logs.")).toBeDefined();
    });

    // Switch to Internal Notes Tab
    fireEvent.click(screen.getByTestId("notes-tab"));

    await waitFor(() => {
      expect(screen.getByTestId("notes-feed")).toBeDefined();
      expect(screen.getByText("Investigating gateway node #4.")).toBeDefined();
    });
  });

  it("displays confirmation modal when Requester clicks Mark as Resolved", async () => {
    (api.getMeApi as any).mockResolvedValue({ user: mockRequesterUser });

    render(
      <MemoryRouter initialEntries={["/tickets/1"]}>
        <AuthProvider>
          <RequesterProvider>
            <Routes>
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Routes>
          </RequesterProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("request-resolution-button")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("request-resolution-button"));

    await waitFor(() => {
      expect(screen.getByTestId("resolution-confirmation-modal")).toBeDefined();
      expect(screen.getByTestId("confirm-resolution-button")).toBeDefined();
    });
  });

  it("greys out button after resolution request confirmation", async () => {
    (api.getMeApi as any).mockResolvedValue({ user: mockRequesterUser });
    const resolvedTicket = { ...mockTicketDetail, isRequesterResolved: true, currentStatus: "Pending Verification" };
    (api.getTicketDetail as any).mockResolvedValue(resolvedTicket);

    render(
      <MemoryRouter initialEntries={["/tickets/1"]}>
        <AuthProvider>
          <RequesterProvider>
            <Routes>
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Routes>
          </RequesterProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      const badge = screen.getByTestId("resolution-requested-badge");
      expect(badge).toBeDefined();
      expect(badge.hasAttribute("disabled")).toBe(true);
    });
  });

  it("allows Staff to revert Pending Verification ticket back to In Progress", async () => {
    const pendingTicket = { ...mockTicketDetail, isRequesterResolved: true, currentStatus: "Pending Verification" };
    (api.getTicketDetail as any).mockResolvedValue(pendingTicket);
    (api.updateTicketStatus as any).mockResolvedValue({ ...pendingTicket, currentStatus: "In Progress", isRequesterResolved: false });

    render(
      <MemoryRouter initialEntries={["/tickets/1"]}>
        <AuthProvider>
          <RequesterProvider>
            <Routes>
              <Route path="/tickets/:id" element={<TicketDetailPage />} />
            </Routes>
          </RequesterProvider>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId("revert-verification-button")).toBeDefined();
    });

    fireEvent.click(screen.getByTestId("revert-verification-button"));

    await waitFor(() => {
      expect(api.updateTicketStatus).toHaveBeenCalledWith(1, "In Progress");
    });
  });
});
