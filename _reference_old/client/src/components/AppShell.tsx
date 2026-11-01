import React, { useState } from "react";
import { Link, NavLink, useNavigate, Outlet } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";
import { useAuth } from "../context/AuthContext";
import LoginForm from "./auth/LoginForm";
import ChangePasswordModal from "./auth/ChangePasswordModal";

export interface AppShellProps {
  children?: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const navigate = useNavigate();
  const { selectedRequester, clearSelectedRequester, isFormDirty, setIsFormDirty } = useRequester();
  const { user, loading, logout } = useAuth();
  const [showDirtyModal, setShowDirtyModal] = useState<boolean>(false);

  const handleChangeRequesterClick = () => {
    if (isFormDirty) {
      setShowDirtyModal(true);
    } else {
      executeChangeRequester();
    }
  };

  const executeChangeRequester = () => {
    setShowDirtyModal(false);
    setIsFormDirty(false);
    clearSelectedRequester();
    navigate("/");
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
        <p>Loading application session...</p>
      </div>
    );
  }

  if (!user && !children) {
    return (
      <div className="tt-shell">
        <header className="tt-header">
          <div className="tt-header-inner">
            <Link to="/" className="tt-brand" aria-label="TokTickIT Home">
              <span role="img" aria-label="ticket icon">🎫</span> TokTickIT
            </Link>
          </div>
        </header>
        <main className="tt-main-container">
          <LoginForm />
        </main>
      </div>
    );
  }

  const showRequesterNav = !user || user.role === "REQUESTER";

  return (
    <div className="tt-shell">
      {user?.mustChangePassword && <ChangePasswordModal />}

      <header className="tt-header">
        <div className="tt-header-inner">
          <Link
            to={
              user?.role === "ADMINISTRATOR"
                ? "/admin/dashboard"
                : user?.role === "IT_STAFF"
                ? "/staff/dashboard"
                : "/requester/dashboard"
            }
            className="tt-brand"
            aria-label="TokTickIT Home"
          >
            <span role="img" aria-label="ticket icon">🎫</span> TokTickIT
          </Link>

          <nav className="tt-nav" aria-label="Main Navigation">
            {showRequesterNav && (
              <>
                <NavLink
                  to="/requester/dashboard"
                  className={({ isActive }) =>
                    `tt-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/requester/tickets"
                  className={({ isActive }) =>
                    `tt-nav-link ${isActive ? "active" : ""}`
                  }
                  end
                >
                  My Tickets
                </NavLink>
                <NavLink
                  to="/requester/tickets/new"
                  className={({ isActive }) =>
                    `tt-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  Create Ticket
                </NavLink>
              </>
            )}

            {user?.role === "IT_STAFF" && (
              <>
                <NavLink
                  to="/staff/dashboard"
                  className={({ isActive }) =>
                    `tt-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/staff/queue"
                  className={({ isActive }) =>
                    `tt-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  Staff Queue
                </NavLink>
              </>
            )}

            {user?.role === "ADMINISTRATOR" && (
              <>
                <NavLink
                  to="/admin/dashboard"
                  className={({ isActive }) =>
                    `tt-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/staff/queue"
                  className={({ isActive }) =>
                    `tt-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  Staff Queue
                </NavLink>
                <NavLink
                  to="/admin/users"
                  className={({ isActive }) =>
                    `tt-nav-link ${isActive ? "active" : ""}`
                  }
                >
                  User Management
                </NavLink>
              </>
            )}
          </nav>

          <div className="tt-header-right" style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span className="tt-requester-badge" title="Active Authenticated User" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span>👤 {user?.name || "Guest"}</span>
              {user?.role === "IT_STAFF" && (
                <span className="tt-badge" style={{ backgroundColor: "#EBF8FF", color: "#2B6CB0", border: "1px solid #63B3ED", fontSize: "11px", padding: "2px 6px" }}>
                  IT Staff
                </span>
              )}
              {user?.role === "ADMINISTRATOR" && (
                <span className="tt-badge" style={{ backgroundColor: "#FAF5FF", color: "#6B46C1", border: "1px solid #B794F4", fontSize: "11px", padding: "2px 6px" }}>
                  Admin
                </span>
              )}
              {user?.role === "REQUESTER" && (
                <span className="tt-badge" style={{ backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0", fontSize: "11px", padding: "2px 6px" }}>
                  Requester
                </span>
              )}
            </span>

            <button
              type="button"
              className="tt-btn tt-btn-outline"
              onClick={logout}
              data-testid="sign-out-button"
              style={{ borderColor: "#FFFFFF", color: "#FFFFFF", height: "32px", fontSize: "12px" }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="tt-main-container">
        {children ? children : <Outlet />}
      </main>

      {showDirtyModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
          }}
        >
          <div className="tt-card" style={{ maxWidth: "450px", width: "90%", margin: 0 }}>
            <h3>Discard Unsaved Draft?</h3>
            <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>
              Switching requester will discard your unsaved ticket draft. Do you want to continue?
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button
                type="button"
                className="tt-btn tt-btn-outline"
                onClick={() => setShowDirtyModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tt-btn tt-btn-danger"
                onClick={executeChangeRequester}
              >
                Discard & Switch
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="tt-footer">
        TokTickIT &copy; {new Date().getFullYear()} &middot; Enterprise IT Support Portal
      </footer>
    </div>
  );
};

export default AppShell;
