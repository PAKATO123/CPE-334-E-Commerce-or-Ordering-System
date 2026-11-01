export type Role = "CUSTOMER" | "OPERATOR" | "ADMIN";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: Role;
  mustChangePassword: boolean;
  isActive: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}
