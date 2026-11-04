import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../src/App";
import { AuthProvider } from "../src/context/AuthContext";
import { CartProvider } from "../src/context/CartContext";
import * as api from "../src/api";
import type { Role } from "../src/types/auth";

vi.mock("../src/api", () => ({
  getMeApi: vi.fn(), loginApi: vi.fn(), logoutApi: vi.fn(), changePasswordApi: vi.fn(),
  getOperatorOrdersApi: vi.fn(), processOperatorOrderApi: vi.fn(),
  getProductsApi: vi.fn(), getCategoriesApi: vi.fn(), getMyOrdersApi: vi.fn(), getOrderByIdApi: vi.fn(),
}));

beforeEach(() => {
  vi.resetAllMocks();
  sessionStorage.clear();
  vi.mocked(api.getOperatorOrdersApi).mockResolvedValue({ data: [] });
  vi.mocked(api.getProductsApi).mockResolvedValue({ data: [] });
  vi.mocked(api.getCategoriesApi).mockResolvedValue({ data: [] });
});

function renderRoute(role?: Role, path = "/operator/orders") {
  if (role) vi.mocked(api.getMeApi).mockResolvedValue({
    user: { id: 1, name: "Test User", email: "user@example.test", role, isActive: true, mustChangePassword: false },
  });
  else vi.mocked(api.getMeApi).mockRejectedValue(new Error("Unauthorized"));
  return render(<AuthProvider><CartProvider><MemoryRouter initialEntries={[path]}><AppRoutes /></MemoryRouter></CartProvider></AuthProvider>);
}

describe("F-05 real application route protection", () => {
  it("redirects anonymous visitors to login without fetching operator data", async () => {
    renderRoute();
    await screen.findByRole("heading", { name: "Sign In" });
    expect(api.getOperatorOrdersApi).not.toHaveBeenCalled();
  });
  it("redirects customers to catalog without fetching operator data", async () => {
    renderRoute("CUSTOMER");
    await screen.findByText("Everyday Tech Essentials");
    expect(api.getOperatorOrdersApi).not.toHaveBeenCalled();
    expect(screen.queryByRole("link", { name: "Operator Queue" })).not.toBeInTheDocument();
  });
  it.each(["OPERATOR", "ADMIN"] as const)("permits %s and hides customer-only navigation", async role => {
    renderRoute(role);
    await screen.findByRole("heading", { name: "Operator Orders Queue" });
    await waitFor(() => expect(api.getOperatorOrdersApi).toHaveBeenCalled());
    expect(screen.queryByRole("link", { name: "My Orders" })).not.toBeInTheDocument();
    expect(screen.queryByTestId("header-cart-button")).not.toBeInTheDocument();
  });
  it("prevents operators from entering customer history", async () => {
    renderRoute("OPERATOR", "/orders");
    await screen.findByText("Everyday Tech Essentials");
    expect(api.getMyOrdersApi).not.toHaveBeenCalled();
  });
  it("preserves customer history and cart navigation", async () => {
    vi.mocked(api.getMyOrdersApi).mockResolvedValue({ data: [] });
    renderRoute("CUSTOMER", "/orders");
    await screen.findByTestId("orders-empty-state");
    expect(screen.getByRole("link", { name: "My Orders" })).toBeInTheDocument();
    expect(screen.getByTestId("header-cart-button")).toBeInTheDocument();
  });
});
