import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ChangePasswordModal from "../../src/components/auth/ChangePasswordModal";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  getMeApi: vi.fn().mockResolvedValue({
    user: {
      id: 1,
      email: "requester1@toktickit.local",
      name: "Alice Smith",
      role: "REQUESTER",
      mustChangePassword: true,
      isActive: true,
    },
  }),
  changePasswordApi: vi.fn(),
}));

describe("Lab 03 Client — Mandatory Password Change Component (ChangePassword.test.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders non-dismissible password change modal when mustChangePassword = true", async () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ChangePasswordModal />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("change-password-modal")).toBeDefined();
    expect(screen.getByTestId("current-password-input")).toBeDefined();
    expect(screen.getByTestId("new-password-input")).toBeDefined();
    expect(screen.getByTestId("confirm-password-input")).toBeDefined();
  });

  it("displays real-time password rule validation checklist", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ChangePasswordModal />
        </AuthProvider>
      </MemoryRouter>
    );

    const checklist = screen.getByTestId("complexity-checklist");
    expect(checklist).toBeDefined();
    expect(checklist.textContent).toContain("At least 8 characters long");
    expect(checklist.textContent).toContain("uppercase letter");
    expect(checklist.textContent).toContain("lowercase letter");
    expect(checklist.textContent).toContain("numeric digit");
  });

  it("disables save button until password complexity requirements pass", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <ChangePasswordModal />
        </AuthProvider>
      </MemoryRouter>
    );

    const saveButton = screen.getByTestId("save-password-button") as HTMLButtonElement;
    expect(saveButton.disabled).toBe(true);

    // Enter current password and weak new password
    fireEvent.change(screen.getByTestId("current-password-input"), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByTestId("new-password-input"), { target: { value: "weak" } });
    fireEvent.change(screen.getByTestId("confirm-password-input"), { target: { value: "weak" } });

    expect(saveButton.disabled).toBe(true);
  });

  it("submits valid new password and unlocks application shell", async () => {
    const mockUpdatedUser = {
      id: 1,
      email: "requester1@toktickit.local",
      name: "Alice Smith",
      role: "REQUESTER" as const,
      mustChangePassword: false,
      isActive: true,
    };

    (api.changePasswordApi as any).mockResolvedValueOnce({
      user: mockUpdatedUser,
      message: "Password changed successfully",
    });

    const onSuccess = vi.fn();
    render(
      <MemoryRouter>
        <AuthProvider>
          <ChangePasswordModal onSuccess={onSuccess} />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByTestId("current-password-input"), { target: { value: "Password123!" } });
    fireEvent.change(screen.getByTestId("new-password-input"), { target: { value: "NewPassword123!" } });
    fireEvent.change(screen.getByTestId("confirm-password-input"), { target: { value: "NewPassword123!" } });

    const saveButton = screen.getByTestId("save-password-button") as HTMLButtonElement;
    expect(saveButton.disabled).toBe(false);

    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(api.changePasswordApi).toHaveBeenCalledWith({
        currentPassword: "Password123!",
        newPassword: "NewPassword123!",
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });
});
