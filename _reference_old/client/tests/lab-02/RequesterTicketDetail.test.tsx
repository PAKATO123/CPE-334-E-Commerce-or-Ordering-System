import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequesterProvider } from "../../src/context/RequesterContext";
import TicketDetailPage from "../../src/pages/TicketDetailPage";

describe("Lab 02 Feature 9 — Ticket Detail Screen", () => {
  beforeEach(() => {
    sessionStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({ id: 1, name: "Alice Chen", email: "alice@example.com", department: "Engineering" })
    );
  });

  it("renders ticket detail and attachments for owner", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve({
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
              summary: "Email access issue",
              description: "Detailed description of email access issue.",
              requestedPriority: "HIGH",
              currentStatus: "New",
              createdAt: "2026-08-26T09:00:00.000Z",
              updatedAt: "2026-08-26T09:00:00.000Z",
              attachments: [
                {
                  id: 10,
                  fileName: "error_screenshot.png",
                  contentType: "image/png",
                  fileSize: 154321,
                  createdAt: "2026-08-26T09:00:00.000Z",
                },
              ],
            },
          }),
      } as Response)
    );

    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/1"]}>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByRole("heading", { name: /Ticket #TICK-2026-0001/i })).toBeInTheDocument();
    expect(screen.getAllByDisplayValue(/Email access issue/i).length).toBeGreaterThan(0);
    expect(screen.getByDisplayValue(/Detailed description of email access issue./i)).toBeInTheDocument();
    expect(screen.getByText(/error_screenshot.png/i)).toBeInTheDocument();
  });

  it("displays 403 Access Denied view when accessing another requester's ticket", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 403,
        json: () =>
          Promise.resolve({
            error: {
              code: "FORBIDDEN",
              message: "You do not have permission to view this ticket.",
            },
          }),
      } as Response)
    );

    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/14"]}>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByText(/403 Access Denied/i)).toBeInTheDocument();
    expect(screen.getByText(/You do not have permission to view this ticket/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to My Tickets/i })).toBeInTheDocument();
  });

  it("displays 404 Ticket Not Found view for invalid ticket ID", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve({
        ok: false,
        status: 404,
        json: () =>
          Promise.resolve({
            error: {
              code: "TICKET_NOT_FOUND",
              message: "The requested ticket could not be found.",
            },
          }),
      } as Response)
    );

    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/99999"]}>
          <Routes>
            <Route path="/tickets/:id" element={<TicketDetailPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByText(/404 Ticket Not Found/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Return to My Tickets/i })).toBeInTheDocument();
  });
});
