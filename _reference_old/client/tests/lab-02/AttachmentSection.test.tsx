import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequesterProvider } from "../../src/context/RequesterContext";
import TicketDetailPage from "../../src/pages/TicketDetailPage";

describe("Lab 02 Feature 10 — Attachment Section & Previews", () => {
  beforeEach(() => {
    sessionStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({ id: 1, name: "Alice Chen", email: "alice@example.com", department: "Engineering" })
    );

    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/tickets/1")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: {
                id: 1,
                ticketNumber: "TICK-2026-0001",
                requesterId: 1,
                requester: { id: 1, name: "Alice Chen", email: "alice@example.com", department: "Engineering" },
                category: { id: 1, name: "Account and Access" },
                relatedSystem: { id: 1, name: "Email & Collaboration" },
                summary: "Email sync failure",
                description: "Cannot sync emails.",
                requestedPriority: "HIGH",
                currentStatus: "New",
                createdAt: "2026-08-26T09:00:00.000Z",
                updatedAt: "2026-08-26T09:00:00.000Z",
                attachments: [
                  {
                    id: 10,
                    fileName: "active_error_log.png",
                    contentType: "image/png",
                    fileSize: 154321,
                    isDeleted: false,
                    createdAt: "2026-08-26T09:00:00.000Z",
                  },
                  {
                    id: 11,
                    fileName: "old_screenshot.png",
                    contentType: "image/png",
                    fileSize: 84321,
                    isDeleted: true,
                    removalReason: "Uploaded wrong image",
                    deletedAt: "2026-08-26T09:30:00.000Z",
                    createdAt: "2026-08-26T09:00:00.000Z",
                  },
                ],
              },
            }),
        } as Response);
      }

      return Promise.reject(new Error("Unknown route"));
    });
  });

  it("renders active attachment filename link and soft-removed attachment with X cross icon", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/1"]}>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    // Active attachment filename
    expect(await screen.findByText(/active_error_log.png/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Download/i })).toBeInTheDocument();

    // Soft-removed attachment rendered at bottom with X icon and removal reason
    expect(screen.getByText(/old_screenshot.png/i)).toBeInTheDocument();
    expect(screen.getByText(/Uploaded wrong image/i)).toBeInTheDocument();
    expect(screen.getByText(/❌/i)).toBeInTheDocument();
  });

  it("opens Preview Modal when clicking active attachment filename metadata", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/1"]}>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    const filenameBtn = await screen.findByRole("button", { name: /active_error_log.png/i });
    fireEvent.click(filenameBtn);

    expect(await screen.findByText(/Preview: active_error_log.png/i)).toBeInTheDocument();
  });

  it("opens Removal Reason Modal and requires non-empty reason before confirming", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/1"]}>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    const removeBtn = await screen.findByRole("button", { name: /Remove/i });
    fireEvent.click(removeBtn);

    expect(await screen.findByText(/Remove Attachment/i)).toBeInTheDocument();

    const confirmBtn = screen.getByRole("button", { name: /Confirm Removal/i });
    expect(confirmBtn).toBeDisabled();

    const reasonInput = screen.getByPlaceholderText(/Enter reason for removing/i);
    fireEvent.change(reasonInput, { target: { value: "A" } });

    expect(confirmBtn).not.toBeDisabled();
  });
});
