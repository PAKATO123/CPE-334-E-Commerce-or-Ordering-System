import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginForm from "../../src/components/auth/LoginForm";
import { AuthProvider } from "../../src/context/AuthContext";
import * as api from "../../src/api";

vi.mock("../../src/api", () => ({
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  getMeApi: vi.fn().mockRejectedValue(new Error("Not authenticated")),
  changePasswordApi: vi.fn(),
}));

describe("Lab 03 Client — Login Component (Login.test.tsx)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders email and password inputs with Sign In button", () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </MemoryRouter>
    );

    expect(screen.getByTestId("email-input")).toBeDefined();
    expect(screen.getByTestId("password-input")).toBeDefined();
    expect(screen.getByTestId("submit-button")).toBeDefined();
  });

  it("submits valid credentials and initializes user session", async () => {
    const mockUser = {
      id: 1,
      email: "requester1@toktickit.local",
      name: "Alice Smith",
      role: "REQUESTER" as const,
      mustChangePassword: false,
      isActive: true,
    };
    (api.loginApi as any).mockResolvedValueOnce({ user: mockUser });

    const onSuccess = vi.fn();
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginForm onSuccess={onSuccess} />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "requester1@toktickit.local" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "Password123!" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(api.loginApi).toHaveBeenCalledWith({
        email: "requester1@toktickit.local",
        password: "Password123!",
      });
      expect(onSuccess).toHaveBeenCalled();
    });
  });

  it("displays error alert when login fails", async () => {
    (api.loginApi as any).mockRejectedValueOnce(new Error("Invalid email address or password."));

    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginForm />
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByTestId("email-input"), { target: { value: "requester1@toktickit.local" } });
    fireEvent.change(screen.getByTestId("password-input"), { target: { value: "WrongPassword!" } });
    fireEvent.click(screen.getByTestId("submit-button"));

    await waitFor(() => {
      expect(screen.getByTestId("error-alert")).toBeDefined();
      expect(screen.getByTestId("error-alert").textContent).toContain("Invalid email address or password.");
    });
  });
});
