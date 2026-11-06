import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ActionsTakenSection } from "../../src/components/ActionsTakenSection";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  getActionsTaken: vi.fn(),
  createActionTaken: vi.fn(),
  updateActionTaken: vi.fn(),
}));

const mockActions: api.ActionTaken[] = [
  {
    id: 1,
    ticketId: 1,
    actionDate: "2026-09-28T14:30:00Z",
    description: "Replaced faulty Ethernet cable",
    result: "Connection restored",
    performedById: 10,
    performedBy: { id: 10, name: "Jane Staff", email: "staff1@toktickit.local", role: "IT_STAFF" },
    followUpRequired: true,
    isFollowedUp: false,
    followUpNote: "Check ping stability tomorrow",
    attachmentNotes: "cable_diag.png",
    createdAt: "2026-09-28T14:30:00Z",
    updatedAt: "2026-09-28T14:30:00Z",
  },
];

describe("Lab 04 Client — ActionsTakenSection Component Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getActionsTaken as any).mockResolvedValue(mockActions);
  });

  it("renders Actions Taken list for IT Staff with Add button", async () => {
    render(<ActionsTakenSection ticketId={1} currentUserRole="IT_STAFF" ticketStatus="Open" />);

    await waitFor(() => {
      expect(screen.getByText("Replaced faulty Ethernet cable")).toBeInTheDocument();
      expect(screen.getByText("Connection restored")).toBeInTheDocument();
      expect(screen.getByText(/Jane Staff/)).toBeInTheDocument();
      expect(screen.getByText("+ Add Action Taken")).toBeInTheDocument();
      expect(screen.getByText("Follow-Up Required")).toBeInTheDocument();
    });
  });

  it("renders Actions Taken list for Requester without Add button", async () => {
    render(<ActionsTakenSection ticketId={1} currentUserRole="REQUESTER" ticketStatus="Open" />);

    await waitFor(() => {
      expect(screen.getByText("Replaced faulty Ethernet cable")).toBeInTheDocument();
      expect(screen.queryByText("+ Add Action Taken")).toBeNull();
    });
  });

  it("renders Followed up badge when isFollowedUp is true", async () => {
    (api.getActionsTaken as any).mockResolvedValue([
      {
        id: 2,
        ticketId: 1,
        actionDate: "2026-09-28T14:30:00Z",
        description: "Replaced faulty switch",
        result: "Working fine",
        performedById: 10,
        performedBy: { id: 10, name: "Jane Staff", email: "staff1@toktickit.local", role: "IT_STAFF" },
        followUpRequired: false,
        isFollowedUp: true,
        followUpNote: "Tested throughput",
        createdAt: "2026-09-28T14:30:00Z",
        updatedAt: "2026-09-28T14:30:00Z",
      },
    ]);

    render(<ActionsTakenSection ticketId={1} currentUserRole="IT_STAFF" ticketStatus="Open" />);

    await waitFor(() => {
      expect(screen.getByText("Followed up")).toBeInTheDocument();
      expect(screen.queryByText("Follow-Up Required")).toBeNull();
    });
  });

  it("opens modal and validates follow-up note when followUpRequired is checked", async () => {
    (api.createActionTaken as any).mockResolvedValue({
      id: 2,
      ticketId: 1,
      actionDate: "2026-09-28T15:00:00Z",
      description: "Updated software settings",
      result: "Done",
      performedById: 10,
      performedBy: { id: 10, name: "Jane Staff", email: "staff1@toktickit.local", role: "IT_STAFF" },
      followUpRequired: false,
      isFollowedUp: false,
      createdAt: "2026-09-28T15:00:00Z",
      updatedAt: "2026-09-28T15:00:00Z",
    });

    render(<ActionsTakenSection ticketId={1} currentUserRole="IT_STAFF" ticketStatus="Open" />);

    await waitFor(() => {
      expect(screen.getByText("+ Add Action Taken")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("+ Add Action Taken"));

    expect(screen.getByText("Add Action Taken")).toBeInTheDocument();

    // Fill form fields
    fireEvent.change(screen.getByPlaceholderText("Describe the action taken..."), {
      target: { value: "Reconfigured DNS settings" },
    });
    fireEvent.change(screen.getByPlaceholderText("Describe the result or outcome of the action..."), {
      target: { value: "DNS query latency dropped to 12ms" },
    });

    const checkbox = screen.getByLabelText("Follow-Up Required?");
    fireEvent.click(checkbox);

    // Enter follow-up note and submit successfully
    const followNoteTextarea = screen.getByPlaceholderText("Specify what follow-up action is required...");
    fireEvent.change(followNoteTextarea, {
      target: { value: "Perform follow-up ping sweep tomorrow." },
    });

    fireEvent.click(screen.getByText("Save Action"));

    await waitFor(() => {
      expect(api.createActionTaken).toHaveBeenCalledWith(1, expect.objectContaining({
        description: "Reconfigured DNS settings",
        result: "DNS query latency dropped to 12ms",
        followUpRequired: true,
        isFollowedUp: false,
        followUpNote: "Perform follow-up ping sweep tomorrow.",
      }));
    });
  });

  it("marks follow-up as done with isFollowedUp: true via modal confirmation", async () => {
    (api.updateActionTaken as any).mockResolvedValue({
      ...mockActions[0],
      followUpRequired: false,
      isFollowedUp: true,
    });

    render(<ActionsTakenSection ticketId={1} currentUserRole="IT_STAFF" ticketStatus="Open" />);

    await waitFor(() => {
      expect(screen.getByText("Mark done")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Mark done"));

    expect(screen.getByText("Confirm Follow-Up Completion")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Confirm Mark Done"));

    await waitFor(() => {
      expect(api.updateActionTaken).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({
          followUpRequired: false,
          isFollowedUp: true,
        })
      );
    });
  });
});
