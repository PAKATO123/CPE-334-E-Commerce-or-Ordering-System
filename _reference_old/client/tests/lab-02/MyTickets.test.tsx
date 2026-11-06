import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequesterProvider } from "../../src/context/RequesterContext";
import MyTicketsPage from "../../src/pages/MyTicketsPage";

describe("Lab 02 Feature 8 — My Tickets Screen", () => {
  beforeEach(() => {
    sessionStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({ id: 1, name: "Alice Chen", email: "alice@example.com", department: "Engineering" })
    );

    // Mock API requests
    vi.spyOn(globalThis, "fetch").mockImplementation((url: RequestInfo | URL) => {
      const urlStr = url.toString();
      if (urlStr.includes("/api/categories")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                { id: 1, name: "Account and Access" },
                { id: 2, name: "Hardware" },
              ],
            }),
        } as Response);
      }

      if (urlStr.includes("/api/related-systems")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                { id: 1, name: "Email & Collaboration" },
                { id: 2, name: "VPN & Remote Access" },
              ],
            }),
        } as Response);
      }

      if (urlStr.includes("/api/tickets")) {
        if (urlStr.includes("search=nonexistent")) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({
                data: [],
                pagination: { page: 1, pageSize: 10, totalItems: 0, totalPages: 1, hasPreviousPage: false, hasNextPage: false },
              }),
          } as Response);
        }

        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              data: [
                {
                  id: 1,
                  ticketNumber: "TICK-2026-0001",
                  summary: "Email access issue",
                  category: { id: 1, name: "Account and Access" },
                  relatedSystem: { id: 1, name: "Email & Collaboration" },
                  requestedPriority: "HIGH",
                  currentStatus: "New",
                  createdAt: "2026-08-26T09:00:00.000Z",
                },
                {
                  id: 2,
                  ticketNumber: "TICK-2026-0002",
                  summary: "Laptop screen flicker",
                  category: { id: 2, name: "Hardware" },
                  relatedSystem: { id: 2, name: "VPN & Remote Access" },
                  requestedPriority: "URGENT",
                  currentStatus: "In Progress",
                  createdAt: "2026-08-26T10:00:00.000Z",
                },
              ],
              pagination: {
                page: 1,
                pageSize: 10,
                totalItems: 2,
                totalPages: 1,
                hasPreviousPage: false,
                hasNextPage: false,
              },
            }),
        } as Response);
      }

      return Promise.reject(new Error("Unknown route"));
    });
  });

  it("renders My Tickets page title and ticket list table", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets"]}>
          <Routes>
            <Route path="/tickets" element={<MyTicketsPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByRole("heading", { name: /My Tickets/i })).toBeInTheDocument();
    expect(await screen.findByText(/TICK-2026-0001/i)).toBeInTheDocument();
    expect(screen.getByText(/Email access issue/i)).toBeInTheDocument();
    expect(screen.getByText(/TICK-2026-0002/i)).toBeInTheDocument();
    expect(screen.getByText(/Laptop screen flicker/i)).toBeInTheDocument();
  });

  it("renders priority and status badges", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets"]}>
          <Routes>
            <Route path="/tickets" element={<MyTicketsPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByText(/High/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Urgent/i).length).toBeGreaterThan(0);
  });

  it("toggles sorting when clicking Priority and Status headers", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets"]}>
          <Routes>
            <Route path="/tickets" element={<MyTicketsPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    const priorityHeader = await screen.findByText(/Priority/i);
    fireEvent.click(priorityHeader);

    const statusHeader = screen.getByText(/Status/i);
    fireEvent.click(statusHeader);
  });

  it("displays no-results state with Clear Filters button when search matches 0 items", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets"]}>
          <Routes>
            <Route path="/tickets" element={<MyTicketsPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    await screen.findByText(/TICK-2026-0001/i);

    const searchInput = screen.getByPlaceholderText(/Search by ticket number/i);
    fireEvent.change(searchInput, { target: { value: "nonexistent" } });

    expect(await screen.findByText(/No matching tickets found/i)).toBeInTheDocument();

    const clearBtns = screen.getAllByRole("button", { name: /Clear Filters/i });
    expect(clearBtns.length).toBeGreaterThan(0);
  });
});
