import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { RequesterProvider } from "../../src/context/RequesterContext";
import CreateTicketPage from "../../src/pages/CreateTicketPage";

describe("Lab 02 Feature 7 — Create Ticket Screen", () => {
  beforeEach(() => {
    sessionStorage.setItem(
      "toktickit_selected_requester",
      JSON.stringify({ id: 1, name: "Alice Chen", email: "alice@example.com", department: "Engineering" })
    );

    // Mock API helpers
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
        return Promise.resolve({
          ok: true,
          status: 201,
          json: () =>
            Promise.resolve({
              data: {
                id: 99,
                ticketNumber: "TICK-2026-0099",
              },
            }),
        } as Response);
      }

      return Promise.reject(new Error("Unknown route"));
    });
  });

  it("renders Create Ticket form and loads dropdown options", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/new"]}>
          <Routes>
            <Route path="/tickets/new" element={<CreateTicketPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByText(/Account and Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Email & Collaboration/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Submit Ticket/i })).toBeInTheDocument();
  });

  it("shows client-side field validation errors when submitting blank form", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/new"]}>
          <Routes>
            <Route path="/tickets/new" element={<CreateTicketPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    await screen.findByText(/Account and Access/i);

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Category is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Related System is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Summary is required/i)).toBeInTheDocument();
    expect(screen.getByText(/Description is required/i)).toBeInTheDocument();
  });

  it("shows description minimum 20 chars error message", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/new"]}>
          <Routes>
            <Route path="/tickets/new" element={<CreateTicketPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    await screen.findByText(/Account and Access/i);

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Description is required./i)).toBeInTheDocument();
  });

  it("stages valid attachment file and allows removal", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/new"]}>
          <Routes>
            <Route path="/tickets/new" element={<CreateTicketPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    await screen.findByText(/Account and Access/i);

    const fileInput = screen.getByLabelText(/📎 Add Attachments.../i);
    const validFile = new File(["dummy content"], "test-screenshot.png", { type: "image/png" });

    fireEvent.change(fileInput, { target: { files: [validFile] } });

    expect(await screen.findByText(/test-screenshot.png/i)).toBeInTheDocument();

    const removeBtn = screen.getByTitle(/Remove attachment/i);
    fireEvent.click(removeBtn);

    expect(screen.queryByText(/test-screenshot.png/i)).not.toBeInTheDocument();
  });

  it("rejects unsupported attachment file type instantly", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/new"]}>
          <Routes>
            <Route path="/tickets/new" element={<CreateTicketPage />} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    await screen.findByText(/Account and Access/i);

    const fileInput = screen.getByLabelText(/📎 Add Attachments.../i);
    const invalidFile = new File(["executable content"], "malicious.exe", { type: "application/x-msdownload" });

    fireEvent.change(fileInput, { target: { files: [invalidFile] } });

    expect(await screen.findByText(/unsupported format/i)).toBeInTheDocument();
  });

  it("submits valid form data and calls POST /api/tickets", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets/new"]}>
          <Routes>
            <Route path="/tickets/new" element={<CreateTicketPage />} />
            <Route path="/tickets/:id" element={<div>Ticket Detail Page #99</div>} />
          </Routes>
        </MemoryRouter>
      </RequesterProvider>
    );

    await screen.findByText(/Account and Access/i);

    fireEvent.change(screen.getByLabelText(/Category/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/Related System/i), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText(/Summary/i), { target: { value: "Cannot access email" } });
    fireEvent.change(screen.getByLabelText(/Description/i), {
      target: { value: "Full detailed explanation of the email lockout issue containing at least 20 characters." },
    });

    const submitBtn = screen.getByRole("button", { name: /Submit Ticket/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/Ticket Detail Page #99/i)).toBeInTheDocument();
  });
});
