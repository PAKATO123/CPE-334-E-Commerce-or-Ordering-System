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
