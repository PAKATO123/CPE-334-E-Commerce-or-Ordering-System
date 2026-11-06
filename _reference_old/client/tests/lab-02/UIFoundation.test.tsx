import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequesterProvider } from "../../src/context/RequesterContext";
import AppShell from "../../src/components/AppShell";
import RequesterSelectorPage from "../../src/pages/RequesterSelectorPage";
import MyTicketsPage from "../../src/pages/MyTicketsPage";
import CreateTicketPage from "../../src/pages/CreateTicketPage";
import TicketDetailPage from "../../src/pages/TicketDetailPage";

describe("Lab 02 Feature 3 — UI Foundation & Application Shell", () => {
  it("renders AppShell brand wordmark and navigation links", () => {
    sessionStorage.setItem("toktickit_selected_requester", JSON.stringify({ id: 1, name: "Alice Chen" }));
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/"]}>
          <AppShell>
            <div>Content</div>
          </AppShell>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(screen.getByRole("link", { name: /TokTickIT Home/i })).toBeInTheDocument();
    expect(screen.getByText(/My Tickets/i)).toBeInTheDocument();
    expect(screen.getByText(/Create Ticket/i)).toBeInTheDocument();
    expect(screen.getByText(/Alice Chen/i)).toBeInTheDocument();
  });

  it("renders Requester Selector page at route /", () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route index element={<RequesterSelectorPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(screen.getByText(/Select Development Requester/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue/i })).toBeInTheDocument();
  });

  it("renders My Tickets page at route /tickets", () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets"]}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route path="tickets" element={<MyTicketsPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(screen.getByRole("heading", { name: /My Tickets/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Search/i)).toBeInTheDocument();
  });

  it("renders Create Ticket page at route /tickets/new", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/new"]}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route path="tickets/new" element={<CreateTicketPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(screen.getByRole("heading", { name: /Create New Ticket/i })).toBeInTheDocument();
    expect(await screen.findByRole("button", { name: /Submit Ticket/i })).toBeInTheDocument();
  });

  it("renders Ticket Detail page at route /tickets/:id", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementationOnce(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            data: {
              id: 99,
              ticketNumber: "TICK-2026-0099",
              requesterId: 1,
              category: { id: 1, name: "Account and Access" },
              relatedSystem: { id: 1, name: "Email & Collaboration" },
              summary: "Sample ticket summary",
              description: "Sample ticket description.",
              requestedPriority: "MEDIUM",
              currentStatus: "New",
              createdAt: "2026-08-26T09:00:00.000Z",
              updatedAt: "2026-08-26T09:00:00.000Z",
              attachments: [],
            },
          }),
      } as Response)
    );

    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/99"]}>
          <Routes>
            <Route path="/" element={<AppShell />}>
              <Route path="tickets/:id" element={<TicketDetailPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByText(/Ticket #TICK-2026-0099/i)).toBeInTheDocument();
  });
});
