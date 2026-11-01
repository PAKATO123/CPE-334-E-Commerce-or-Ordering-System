import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getAdminDashboard, AdminDashboardData } from "../api";

export const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [dashboardData, setDashboardData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAdminDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error("Error loading Admin Dashboard:", err);
      setError(err.message || "Failed to load Administrator dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const renderStatusBadge = (status: string) => {
    const lower = (status || "").toLowerCase().replace(/_/g, " ");
    if (lower === "new") return <span className="tt-badge tt-badge-new" style={{ borderRadius: "9999px", whiteSpace: "nowrap" }}>New</span>;
    if (lower === "open") return <span className="tt-badge" style={{ backgroundColor: "#EBF8FF", color: "#2B6CB0", border: "1px solid #63B3ED", borderRadius: "9999px", whiteSpace: "nowrap" }}>Open</span>;
    if (lower === "in progress") return <span className="tt-badge tt-badge-medium" style={{ borderRadius: "9999px", whiteSpace: "nowrap" }}>In Progress</span>;
    if (lower === "waiting for requester" || lower === "waiting") return <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E", borderRadius: "9999px", whiteSpace: "nowrap" }}>Waiting</span>;
    if (lower === "pending verification" || lower === "pending") return <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E", borderRadius: "9999px", fontWeight: 600, whiteSpace: "nowrap" }}>Pending</span>;
    if (lower === "reopened") return <span className="tt-badge" style={{ backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #F87171", borderRadius: "9999px", whiteSpace: "nowrap" }}>Reopened</span>;
    if (lower === "resolved") return <span className="tt-badge" style={{ backgroundColor: "#E6FFFA", color: "#234E52", border: "1px solid #319795", borderRadius: "9999px", whiteSpace: "nowrap" }}>Resolved</span>;
    if (lower === "closed") return <span className="tt-badge" style={{ backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0", borderRadius: "9999px", whiteSpace: "nowrap" }}>Closed</span>;
    if (lower === "cancelled") return <span className="tt-badge" style={{ backgroundColor: "#E2E8F0", color: "#718096", border: "1px solid #A0AEC0", borderRadius: "9999px", whiteSpace: "nowrap" }}>Cancelled</span>;
    return <span className="tt-badge" style={{ backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0", borderRadius: "9999px", whiteSpace: "nowrap" }}>{status}</span>;
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "var(--color-text-main)" }}>
            Administrator Operations & System Overview
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "var(--color-text-muted)", fontSize: "14px" }}>
            Welcome back, {user?.name || "Administrator"}! System-wide queue metrics and user account status.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="tt-btn tt-btn-outline"
            onClick={fetchDashboard}
            style={{ fontSize: "13px", height: "36px" }}
          >
            Refresh
          </button>
          <Link
            to="/admin/users"
            className="tt-btn tt-btn-primary"
            style={{ textDecoration: "none", fontSize: "13px", height: "36px", display: "inline-flex", alignItems: "center" }}
          >
            👥 User Management
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="tt-card tt-empty-state" style={{ padding: "40px 0" }}>
          <div className="tt-spinner" />
          <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading Administrator Dashboard...</p>
        </div>
      ) : error ? (
        <div className="tt-card" style={{ padding: "20px", backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      ) : (
        <>
          {/* User Accounts Summary Card */}
          <div className="tt-card" style={{ marginBottom: "24px", borderLeft: "4px solid #6B46C1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px" }}>User Accounts Summary</h3>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  System user statistics and active account roles.
                </span>
              </div>
              <Link to="/admin/users" className="tt-btn tt-btn-outline" style={{ fontSize: "12px", height: "32px", textDecoration: "none" }}>
                Manage Accounts &rarr;
              </Link>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px" }}>
              <div
                onClick={() => navigate("/admin/users")}
                style={{ padding: "12px", backgroundColor: "#FAF5FF", borderRadius: "var(--radius-sm)", border: "1px solid #E9D8FD", cursor: "pointer" }}
                title="Click to manage all users"
              >
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#6B46C1" }}>Total Users</span>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#6B46C1", marginTop: "4px" }}>
                  {dashboardData?.userStats.totalUsers || 0}
                </div>
                <div style={{ fontSize: "11px", color: "#6B46C1", marginTop: "4px", fontWeight: 500 }}>
                  Manage users &rarr;
                </div>
              </div>

              <div
                onClick={() => navigate("/admin/users?role=REQUESTER")}
                style={{ padding: "12px", backgroundColor: "#F7FAFC", borderRadius: "var(--radius-sm)", border: "1px solid #E2E8F0", cursor: "pointer" }}
                title="Click to view requesters"
              >
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#4A5568" }}>Requesters</span>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#2D3748", marginTop: "4px" }}>
                  {dashboardData?.userStats.requesterCount || 0}
                </div>
                <div style={{ fontSize: "11px", color: "#4A5568", marginTop: "4px", fontWeight: 500 }}>
                  View requesters &rarr;
                </div>
              </div>

              <div
                onClick={() => navigate("/admin/users?role=IT_STAFF")}
                style={{ padding: "12px", backgroundColor: "#EBF8FF", borderRadius: "var(--radius-sm)", border: "1px solid #BEE3F8", cursor: "pointer" }}
                title="Click to view IT staff"
              >
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#2B6CB0" }}>IT Staff</span>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#2B6CB0", marginTop: "4px" }}>
                  {dashboardData?.userStats.staffCount || 0}
                </div>
                <div style={{ fontSize: "11px", color: "#2B6CB0", marginTop: "4px", fontWeight: 500 }}>
                  View staff &rarr;
                </div>
              </div>

              <div
                onClick={() => navigate("/admin/users?role=ADMINISTRATOR")}
                style={{ padding: "12px", backgroundColor: "#FAF5FF", borderRadius: "var(--radius-sm)", border: "1px solid #E9D8FD", cursor: "pointer" }}
                title="Click to view administrators"
              >
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#6B46C1" }}>Administrators</span>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#6B46C1", marginTop: "4px" }}>
                  {dashboardData?.userStats.adminCount || 0}
                </div>
                <div style={{ fontSize: "11px", color: "#6B46C1", marginTop: "4px", fontWeight: 500 }}>
                  View admins &rarr;
                </div>
              </div>

              <div
                onClick={() => navigate("/admin/users?status=false")}
                style={{ padding: "12px", backgroundColor: dashboardData?.userStats.inactiveCount ? "#FFF5F5" : "#F7FAFC", borderRadius: "var(--radius-sm)", border: "1px solid #FEB2B2", cursor: "pointer" }}
                title="Click to view inactive accounts"
              >
                <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "#C53030" }}>Inactive Accounts</span>
                <div style={{ fontSize: "24px", fontWeight: 800, color: "#9B2C2C", marginTop: "4px" }}>
                  {dashboardData?.userStats.inactiveCount || 0}
                </div>
                <div style={{ fontSize: "11px", color: "#C53030", marginTop: "4px", fontWeight: 500 }}>
                  View inactive &rarr;
                </div>
              </div>
            </div>
          </div>

          {/* Top 4 Operational Metric Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {/* Card 1: Unassigned Tickets */}
            <div
              className="tt-card"
              onClick={() => navigate("/staff/queue?assignment=unassigned")}
              style={{
                cursor: "pointer",
                borderLeft: "4px solid #D69E2E",
                backgroundColor: dashboardData?.metrics.unassignedCount ? "#FEFCBF" : "var(--color-surface)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              title="Click to view unassigned tickets"
            >
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#744210", letterSpacing: "0.5px" }}>
                Unassigned Tickets
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#744210", marginTop: "8px" }}>
                {dashboardData?.metrics.unassignedCount || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#975A16", marginTop: "4px", fontWeight: 500 }}>
                Needing staff triage &rarr;
              </div>
            </div>

            {/* Card 2: My Assigned Tickets */}
            <div
              className="tt-card"
              onClick={() => navigate("/staff/queue?assignment=me")}
              style={{
                cursor: "pointer",
                borderLeft: "4px solid var(--color-primary-green)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              title="Click to view tickets assigned to you"
            >
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: "0.5px" }}>
                My Assigned Tickets
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-primary-green)", marginTop: "8px" }}>
                {dashboardData?.metrics.myOwnedCount || 0}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-secondary-green)", marginTop: "4px", fontWeight: 500 }}>
                Assigned to your queue &rarr;
              </div>
            </div>

            {/* Card 3: Urgent & High Priority */}
            <div
              className="tt-card"
              onClick={() => navigate("/staff/queue?priority=high_urgent&sortBy=itPriority&sortDirection=desc")}
              style={{
                cursor: "pointer",
                borderLeft: "4px solid var(--color-error)",
                backgroundColor: dashboardData?.metrics.urgentHighCount ? "var(--color-error-bg)" : "var(--color-surface)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              title="Click to view urgent & high priority tickets"
            >
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-error)", letterSpacing: "0.5px" }}>
                Urgent & High Priority
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-error)", marginTop: "8px" }}>
                {dashboardData?.metrics.urgentHighCount || 0}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-error)", marginTop: "4px", fontWeight: 500 }}>
                Requires immediate action &rarr;
              </div>
            </div>

            {/* Card 4: Follow-Up Needed */}
            <div
              className="tt-card"
              onClick={() => navigate("/staff/queue?followUp=required")}
              style={{
                cursor: "pointer",
                borderLeft: "4px solid #6B46C1",
                backgroundColor: dashboardData?.metrics.followUpCount ? "#FAF5FF" : "var(--color-surface)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              title="Click to view tickets requiring follow-up"
            >
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#6B46C1", letterSpacing: "0.5px" }}>
                Follow-Up Required
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#6B46C1", marginTop: "8px" }}>
                {dashboardData?.metrics.followUpCount || 0}
              </div>
              <div style={{ fontSize: "12px", color: "#6B46C1", marginTop: "4px", fontWeight: 500 }}>
                Pending action follow-ups &rarr;
              </div>
            </div>
          </div>

          {/* Status Breakdown & Recent System Activity Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
            {/* Status Distribution Grid */}
            <div className="tt-card">
              <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Active Ticket Status Breakdown</h3>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                {Object.entries(dashboardData?.statusDistribution || {}).map(([status, count]) => (
                  <div
                    key={status}
                    onClick={() => navigate(`/staff/queue?status=${encodeURIComponent(status)}`)}
                    style={{
                      padding: "12px",
                      border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-sm)",
                      cursor: "pointer",
                      backgroundColor: "var(--color-surface)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>{renderStatusBadge(status)}</div>
                    <span style={{ fontSize: "18px", fontWeight: 700, color: "var(--color-text-main)" }}>
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent System Activity Feed */}
            <div className="tt-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Recent Activity Log</h3>
                <Link to="/staff/queue?sortBy=updatedAt&sortDirection=desc" style={{ fontSize: "13px", textDecoration: "none" }}>
                  Queue View &rarr;
                </Link>
              </div>

              {!dashboardData?.recentActivity || dashboardData.recentActivity.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "14px", fontStyle: "italic", margin: 0, padding: "16px 0" }}>
                  No recent system activity.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {dashboardData.recentActivity.map((ticket) => {
                    const isMine = ticket.assignedToId === user?.id || ticket.requesterId === user?.id;
                    return (
                      <div
                        key={ticket.id}
                        onClick={() => navigate(`/staff/tickets/${ticket.id}`)}
                        style={{
                          padding: "12px 14px",
                          border: isMine ? "1px solid #A3E635" : "1px solid var(--color-border)",
                          borderRadius: "var(--radius-sm)",
                          cursor: "pointer",
                          backgroundColor: isMine ? "var(--color-pale-green)" : "var(--color-surface)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{ fontWeight: 700, fontSize: "14px", color: "var(--color-primary-green)" }}>
                              #{ticket.ticketNumber}
                            </span>
                            {renderStatusBadge(ticket.currentStatus)}
                            {isMine && (
                              <span className="tt-badge" style={{ backgroundColor: "#006B3C", color: "#FFFFFF", fontSize: "10px", padding: "1px 6px" }}>
                                Yours
                              </span>
                            )}
                            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                              (Req: {ticket.requester?.name || `User #${ticket.requesterId}`})
                            </span>
                          </div>
                          <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-main)" }}>
                            {ticket.summary}
                          </div>
                        </div>
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                          {new Date(ticket.updatedAt).toLocaleString(undefined, {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
