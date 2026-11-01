import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChangePasswordModal from "./auth/ChangePasswordModal";

export const AppShell: React.FC = () => {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p>Loading application...</p>
      </div>
    );
  }

  const isOperator = user?.role === "OPERATOR" || user?.role === "ADMIN";

  return (
    <div className="tt-shell">
      {user?.mustChangePassword && <ChangePasswordModal />}

      <header className="tt-header">
        <div className="tt-header-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link to="/" className="tt-brand" style={{ fontWeight: 700, fontSize: "1.25rem", textDecoration: "none", color: "inherit" }}>
              ⛺ TechTent
            </Link>

            <nav className="tt-nav" style={{ display: "flex", gap: "16px" }}>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `tt-nav-link ${isActive ? "active" : ""}`}
                style={{ textDecoration: "none", color: "inherit", padding: "6px 12px", borderRadius: "4px" }}
              >
                Catalog
              </NavLink>

              {user && (
                <NavLink
                  to="/orders"
                  className={({ isActive }) => `tt-nav-link ${isActive ? "active" : ""}`}
                  style={{ textDecoration: "none", color: "inherit", padding: "6px 12px", borderRadius: "4px" }}
                >
                  My Orders
                </NavLink>
              )}

              {isOperator && (
                <NavLink
                  to="/operator/orders"
                  className={({ isActive }) => `tt-nav-link ${isActive ? "active" : ""}`}
                  style={{ textDecoration: "none", color: "inherit", padding: "6px 12px", borderRadius: "4px" }}
                >
                  Operator Queue
                </NavLink>
              )}
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "14px" }}>
                  <strong>{user.name}</strong> <span style={{ opacity: 0.7 }}>({user.role})</span>
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="tt-btn tt-btn-outline"
                  style={{ padding: "6px 12px", cursor: "pointer" }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="tt-btn tt-btn-primary"
                style={{ padding: "6px 14px", textDecoration: "none", borderRadius: "4px" }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="tt-main-container">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
