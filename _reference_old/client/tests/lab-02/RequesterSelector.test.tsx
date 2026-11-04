import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { RequesterProvider } from "../../src/context/RequesterContext";
import { AppRoutes } from "../../src/App";

const mockRequesters = [
  { id: 1, name: "Alice Chen", email: "alice.chen@example.com", department: "Engineering" },
  { id: 2, name: "Bob Smith", email: "bob.smith@example.com", department: "Marketing" },
  { id: 3, name: "Carlos Ray", email: "carlos.ray@example.com", department: "Finance" },
  { id: 4, name: "Diana Prince", email: "diana.prince@example.com", department: "Operations" },
];

describe("Lab 02 Feature 4 — Development Requester Selector", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads active requesters from API and populates dropdown", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockRequesters }),
    } as Response);

    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(screen.getByText(/Loading Requesters/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByLabelText(/Development Requester/i)).toBeInTheDocument();
    });

    const select = screen.getByLabelText(/Development Requester/i) as HTMLSelectElement;
    expect(select.options.length).toBe(5); // default option + 4 requesters
    expect(screen.getByText(/Alice Chen \(Engineering\)/i)).toBeInTheDocument();
    expect(screen.queryByText(/Eve Inactive/i)).not.toBeInTheDocument();
  });

  it("selects a requester and navigates to /tickets upon Continue", async () => {
    const user = userEvent.setup();

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockRequesters }),
    } as Response);

    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>
      </RequesterProvider>
    );

    const select = await screen.findByLabelText(/Development Requester/i);
    await user.selectOptions(select, "1");

    const continueBtn = screen.getByRole("button", { name: /Continue/i });
    expect(continueBtn).not.toBeDisabled();

    await user.click(continueBtn);

    // Navigates to My Tickets page and shows requester badge in shell
    expect(await screen.findByRole("heading", { name: /My Tickets/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Alice Chen/i).length).toBeGreaterThan(0);
  });

  it("redirects to / when attempting to visit /tickets without selecting a requester", async () => {
    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets"]}>
          <AppRoutes />
        </MemoryRouter>
      </RequesterProvider>
    );

    // RequesterGuard redirects to /
    expect(await screen.findByText(/Select Development Requester/i)).toBeInTheDocument();
  });

  it("clears requester context and navigates to / when clicking Change Requester", async () => {
    const user = userEvent.setup();

    // Pre-populate sessionStorage with selected requester
    sessionStorage.setItem("toktickit_selected_requester", JSON.stringify(mockRequesters[0]));

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: mockRequesters }),
    } as Response);

    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/tickets"]}>
          <AppRoutes />
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByRole("heading", { name: /My Tickets/i })).toBeInTheDocument();

    const changeBtn = screen.getByRole("button", { name: /Change Requester/i });
    await user.click(changeBtn);

    // Redirected back to /
    expect(await screen.findByText(/Select Development Requester/i)).toBeInTheDocument();
    expect(sessionStorage.getItem("toktickit_selected_requester")).toBeNull();
  });

  it("displays safe error state when API fails", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      if (String(url).includes("/api/requesters")) {
        throw new Error("API Failure");
      }
      return { ok: true, json: async () => ({ user: null }) } as Response;
    });

    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByText(/Unable to load Development Requesters/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue/i })).toBeDisabled();
  });

  it("displays empty state and disables Continue button when API returns 0 active requesters", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(async (url: any) => {
      if (String(url).includes("/api/requesters")) {
        return { ok: true, json: async () => ({ data: [] }) } as Response;
      }
      return { ok: true, json: async () => ({ user: null }) } as Response;
    });

    render(
      <RequesterProvider>
        <MemoryRouter initialEntries={["/"]}>
          <AppRoutes />
        </MemoryRouter>
      </RequesterProvider>
    );

    expect(await screen.findByText(/No active Development Requesters found/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Continue/i })).toBeDisabled();
  });
});
