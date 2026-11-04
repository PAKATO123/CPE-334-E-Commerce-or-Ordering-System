import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { UserManagementPage } from "../../src/pages/UserManagementPage";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  getUsersList: vi.fn(),
  createUserAccount: vi.fn(),
  updateUserAccount: vi.fn(),
  resetUserInitialPassword: vi.fn(),
  getMeApi: vi.fn(),
}));

const mockAdminUser = {
  id: 1,
  email: "admin@toktickit.local",
  name: "System Admin",
  role: "ADMINISTRATOR" as const,
  mustChangePassword: false,
  isActive: true,
};

const mockUserList: api.UserAdminListItem[] = [
  {
    id: 1,
    email: "admin@toktickit.local",
    name: "System Admin",
    role: "ADMINISTRATOR",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-01T00:00:00.000Z",
  },
  {
    id: 2,
    email: "staff1@toktickit.local",
    name: "Jane Staff",
    role: "IT_STAFF",
    isActive: true,
    mustChangePassword: false,
    createdAt: "2026-09-02T00:00:00.000Z",
  },
  {
    id: 3,
    email: "requester1@toktickit.local",
    name: "Alice Requester",
    role: "REQUESTER",
    isActive: true,
    mustChangePassword: true,
    createdAt: "2026-09-03T00:00:00.000Z",
  },
];

describe("Lab 03 Client — Admin User Management Component (UserManagement.test.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.getMeApi as any).mockResolvedValue({ user: mockAdminUser });
    (api.getUsersList as any).mockResolvedValue(mockUserList);
  });

  const renderComponent = () =>
    render(
      <AuthProvider>
        <MemoryRouter>
          <UserManagementPage />
        </MemoryRouter>
      </AuthProvider>
    );

  it("renders user table with name, email, role badge, and status pill", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("users-table")).toBeInTheDocument();
    });

    expect(screen.getByText("System Admin")).toBeInTheDocument();
    expect(screen.getByText("Jane Staff")).toBeInTheDocument();
    expect(screen.getByText("Alice Requester")).toBeInTheDocument();
    expect(screen.getByText("admin@toktickit.local")).toBeInTheDocument();
    expect(screen.getAllByText("Admin").length).toBeGreaterThan(0);
    expect(screen.getAllByText("IT Staff").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Requester").length).toBeGreaterThan(0);
  });

  it("filters user list by name search and role filter", async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("user-search-input")).toBeInTheDocument();
    });

    fireEvent.change(screen.getByTestId("user-search-input"), { target: { value: "Jane" } });
    await waitFor(() => {
      expect(api.getUsersList).toHaveBeenCalledWith(expect.objectContaining({ search: "Jane" }));
    });

    fireEvent.change(screen.getByTestId("user-role-filter"), { target: { value: "IT_STAFF" } });
    await waitFor(() => {
      expect(api.getUsersList).toHaveBeenCalledWith(expect.objectContaining({ role: "IT_STAFF" }));
    });
  });

  it("opens Create User modal and submits new account", async () => {
    (api.createUserAccount as any).mockResolvedValue({
      id: 4,
      name: "Bob NewUser",
      email: "bob@toktickit.local",
      role: "REQUESTER",
      isActive: true,
      mustChangePassword: true,
      createdAt: "2026-09-15T00:00:00.000Z",
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("add-user-button")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("add-user-button"));
    expect(screen.getByTestId("create-user-modal")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("create-user-name"), { target: { value: "Bob NewUser" } });
    fireEvent.change(screen.getByTestId("create-user-email"), { target: { value: "bob@toktickit.local" } });
    fireEvent.change(screen.getByTestId("create-user-password"), { target: { value: "Password123!" } });

    fireEvent.click(screen.getByTestId("submit-create-user"));

    await waitFor(() => {
      expect(api.createUserAccount).toHaveBeenCalledWith({
        name: "Bob NewUser",
        email: "bob@toktickit.local",
        role: "REQUESTER",
        initialPassword: "Password123!",
      });
    });
  });

  it("opens Edit User modal and updates account details", async () => {
    (api.updateUserAccount as any).mockResolvedValue({
      id: 2,
      name: "Jane Staff Updated",
      email: "staff1@toktickit.local",
      role: "IT_STAFF",
      isActive: true,
      mustChangePassword: false,
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("edit-user-button-2")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-user-button-2"));
    expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("edit-user-name"), { target: { value: "Jane Staff Updated" } });
    fireEvent.click(screen.getByTestId("submit-edit-user"));

    await waitFor(() => {
      expect(api.updateUserAccount).toHaveBeenCalledWith(2, {
        name: "Jane Staff Updated",
        email: "staff1@toktickit.local",
        role: "IT_STAFF",
        isActive: true,
      });
    });
  });

  it("opens Set Initial Password modal", async () => {
    (api.resetUserInitialPassword as any).mockResolvedValue(undefined);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("reset-password-button-3")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("reset-password-button-3"));
    expect(screen.getByTestId("reset-password-modal")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("reset-password-input"), { target: { value: "NewInitialPass123!" } });
    fireEvent.click(screen.getByTestId("submit-reset-password"));

    await waitFor(() => {
      expect(api.resetUserInitialPassword).toHaveBeenCalledWith(3, "NewInitialPass123!");
    });
  });

  it("displays safety alert when self-deactivation is attempted", async () => {
    const error: any = new Error("Administrators cannot deactivate their own active account.");
    error.code = "SELF_DEACTIVATION_PROHIBITED";
    (api.updateUserAccount as any).mockRejectedValue(error);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByTestId("edit-user-button-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("edit-user-button-1"));
    expect(screen.getByTestId("edit-user-modal")).toBeInTheDocument();

    // Toggle active off
    fireEvent.click(screen.getByTestId("edit-user-active"));
    fireEvent.click(screen.getByTestId("submit-edit-user"));

    await waitFor(() => {
      expect(screen.getByTestId("edit-user-error")).toBeInTheDocument();
      expect(screen.getByTestId("edit-user-error")).toHaveTextContent(
        "Administrators cannot deactivate their own active account."
      );
    });
  });
});
