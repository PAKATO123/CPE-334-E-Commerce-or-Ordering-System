import React from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import ChangePasswordModal from "./auth/ChangePasswordModal";

export const AppShell: React.FC = () => {
  const { user, loading, logout } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p>Loading application...</p>
      </div>
    );
  }

  const isOperator = user?.role === "OPERATOR" || user?.role === "ADMIN";
  const isLoginPage = location.pathname === "/login";

  return (
    <div className="tt-shell">
      {user?.mustChangePassword && <ChangePasswordModal />}

      <header className="tt-header">
        <div className="tt-header-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 24px", maxWidth: "1200px", margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <Link to="/" className="tt-brand" style={{ fontWeight: 700, fontSize: "1.25rem", textDecoration: "none", color: "#FFFFFF" }}>
              ⛺ TechTent
            </Link>

            <nav className="tt-nav" style={{ display: "flex", gap: "12px" }}>
              <NavLink
                to="/"
                end
                className={({ isActive }) => `tt-nav-link ${isActive ? "active" : ""}`}
                style={({ isActive }) => ({
                  textDecoration: "none",
                  color: "#FFFFFF",
                  padding: "6px 12px",
                  borderRadius: "4px",
                  backgroundColor: isActive ? "rgba(255, 255, 255, 0.25)" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: "14px",
                })}
              >
                Catalog
              </NavLink>

              {user && (
                <NavLink
                  to="/orders"
                  className={({ isActive }) => `tt-nav-link ${isActive ? "active" : ""}`}
                  style={({ isActive }) => ({
                    textDecoration: "none",
                    color: "#FFFFFF",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: isActive ? "rgba(255, 255, 255, 0.25)" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "14px",
                  })}
                >
                  My Orders
                </NavLink>
              )}

              {isOperator && (
                <NavLink
                  to="/operator/orders"
                  className={({ isActive }) => `tt-nav-link ${isActive ? "active" : ""}`}
                  style={({ isActive }) => ({
                    textDecoration: "none",
                    color: "#FFFFFF",
                    padding: "6px 12px",
                    borderRadius: "4px",
                    backgroundColor: isActive ? "rgba(255, 255, 255, 0.25)" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                    fontSize: "14px",
                  })}
                >
                  Operator Queue
                </NavLink>
              )}
            </nav>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <span style={{ fontSize: "14px", color: "#FFFFFF" }}>
                  <strong>{user.name}</strong> <span style={{ opacity: 0.85, fontSize: "12px" }}>({user.role})</span>
                </span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="tt-btn tt-header-btn-nav"
                  style={{ padding: "6px 14px", height: "36px", cursor: "pointer", fontSize: "13px" }}
                >
                  Sign Out
                </button>
              </div>
            ) : !isLoginPage ? (
              <Link
                to="/login"
                className="tt-btn tt-header-btn-nav"
                style={{ padding: "6px 16px", height: "36px", textDecoration: "none", fontSize: "13px" }}
              >
                Sign In
              </Link>
            ) : null}
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
