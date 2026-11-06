import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export interface AdminGuardProps {
  children?: React.ReactNode;
}

export const AdminGuard: React.FC<AdminGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <p style={{ color: "#718096" }}>Loading session...</p>
      </div>
    );
  }

  if (!user || user.role !== "ADMINISTRATOR") {
    return <Navigate to="/staff/queue" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default AdminGuard;
