import React, { createContext, useContext, useState, useEffect } from "react";
import { SessionUser, LoginCredentials, ChangePasswordPayload } from "../types/auth";
import { loginApi, logoutApi, getMeApi, changePasswordApi } from "../api";

interface AuthContextType {
  user: SessionUser | null;
  loading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
  refreshUser: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMeApi();
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setLoading(true);
    try {
      const data = await loginApi(credentials);
      setUser(data.user);
    } catch (err: any) {
      setError(err.message || "Invalid credentials.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await logoutApi();
    } catch (err: any) {
      console.error("Logout error:", err);
    } finally {
      setUser(null);
      setLoading(false);
      try {
        sessionStorage.clear();
      } catch {}
    }
  };

  const changePassword = async (payload: ChangePasswordPayload) => {
    setError(null);
    try {
      const res = await changePasswordApi(payload);
      setUser(res.user);
    } catch (err: any) {
      setError(err.message || "Failed to update password.");
      throw err;
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        login,
        logout,
        changePassword,
        refreshUser,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
