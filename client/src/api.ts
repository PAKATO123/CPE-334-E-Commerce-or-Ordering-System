import { SessionUser, LoginCredentials, ChangePasswordPayload } from "./types/auth";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

// ---------------------------------------------------------------------------
// Authentication & Session API Calls
// ---------------------------------------------------------------------------

export async function loginApi(credentials: LoginCredentials): Promise<{ user: SessionUser }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Invalid credentials.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}

export async function logoutApi(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error?.message || "Logout failed.");
  }
}

export async function getMeApi(): Promise<{ user: SessionUser }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Not authenticated.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}

export async function changePasswordApi(payload: ChangePasswordPayload): Promise<{ user: SessionUser; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to change password.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}

// ---------------------------------------------------------------------------
// Product Catalog & Inventory API Calls (F-02)
// ---------------------------------------------------------------------------

import { Product } from "./types/product";

export async function getProductsApi(params?: { category?: string; search?: string }): Promise<{ data: Product[] }> {
  const query = new URLSearchParams();
  if (params?.category && params.category !== "All") {
    query.set("category", params.category);
  }
  if (params?.search && params.search.trim()) {
    query.set("search", params.search.trim());
  }

  const qs = query.toString() ? `?${query.toString()}` : "";
  const res = await fetch(`${API_BASE_URL}/api/products${qs}`, {
    method: "GET",
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Failed to fetch products.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}

export async function getProductByIdApi(id: number): Promise<{ data: Product }> {
  const res = await fetch(`${API_BASE_URL}/api/products/${id}`, {
    method: "GET",
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Product not found.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}

export async function getCategoriesApi(): Promise<{ data: string[] }> {
  const res = await fetch(`${API_BASE_URL}/api/categories`, {
    method: "GET",
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Failed to fetch categories.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}

// ---------------------------------------------------------------------------
// Order Management API Calls (F-03, F-04)
// ---------------------------------------------------------------------------

import { OrderData, CreateOrderPayload } from "./types/order";

export async function createOrderApi(payload: CreateOrderPayload): Promise<{ data: OrderData }> {
  const res = await fetch(`${API_BASE_URL}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Failed to submit order.");
    error.status = res.status;
    error.code = json.error?.code;
    error.productId = json.error?.productId;
    error.sku = json.error?.sku;
    throw error;
  }
  return json;
}
