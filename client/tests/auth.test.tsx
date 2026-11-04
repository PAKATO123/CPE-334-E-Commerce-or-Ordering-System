import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import LoginForm from "../src/components/auth/LoginForm";
import RoleGuard from "../src/components/RoleGuard";
import { AuthProvider } from "../src/context/AuthContext";
import * as api from "../src/api";

vi.mock("../src/api", () => ({
  loginApi: vi.fn(),
  logoutApi: vi.fn(),
  getMeApi: vi.fn().mockRejectedValue(new Error("Unauthorized")),
  changePasswordApi: vi.fn(),
}));

describe("Feature 1: Client Authentication Components", () => {
  it("renders login form with inputs and submit button", () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sign In/i })).toBeInTheDocument();
  });

  it("submits login form with user credentials", async () => {
    const mockLogin = vi.mocked(api.loginApi).mockResolvedValueOnce({
      user: {
        id: 1,
        email: "customer1@example.com",
        name: "Alice Customer",
        role: "CUSTOMER",
        mustChangePassword: false,
        isActive: true,
      },
    });

    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginForm />
        </MemoryRouter>
      </AuthProvider>
    );

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: "customer1@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: "Password123!" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: "customer1@example.com",
        password: "Password123!",
      });
    });
  });

  it("redirects unauthenticated user to /login via RoleGuard", async () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={["/protected"]}>
          <Routes>
            <Route path="/login" element={<div>Login Page Mock</div>} />
            <Route element={<RoleGuard />}>
              <Route path="/protected" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText("Login Page Mock")).toBeInTheDocument();
      expect(screen.queryByText("Protected Content")).not.toBeInTheDocument();
    });
  });
});
