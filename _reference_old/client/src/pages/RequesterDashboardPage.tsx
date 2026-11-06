import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useRequester } from "../context/RequesterContext";
import { getRequesterDashboard, RequesterDashboardData, TicketDetailData } from "../api";

export const RequesterDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedRequester } = useRequester();

  const [dashboardData, setDashboardData] = useState<RequesterDashboardData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const activeRequesterId = selectedRequester?.id || user?.id;

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRequesterDashboard(activeRequesterId);
      setDashboardData(data);
    } catch (err: any) {
      console.error("Error loading Requester Dashboard:", err);
      setError(err.message || "Failed to load dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [activeRequesterId]);

  const renderStatusBadge = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === "new") return <span className="tt-badge tt-badge-new" style={{ borderRadius: "9999px" }}>New</span>;
    if (lower === "open") return <span className="tt-badge" style={{ backgroundColor: "#EBF8FF", color: "#2B6CB0", border: "1px solid #63B3ED", borderRadius: "9999px" }}>Open</span>;
    if (lower === "in progress") return <span className="tt-badge tt-badge-medium" style={{ borderRadius: "9999px" }}>In Progress</span>;
    if (lower === "waiting for requester") return <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E", borderRadius: "9999px" }}>Waiting for Requester</span>;
    if (lower === "pending verification") return <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E", borderRadius: "9999px", fontWeight: 600 }}>Pending Verification</span>;
    if (lower === "reopened") return <span className="tt-badge" style={{ backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #F87171", borderRadius: "9999px" }}>Reopened</span>;
    if (lower === "resolved") return <span className="tt-badge" style={{ backgroundColor: "#E6FFFA", color: "#234E52", border: "1px solid #319795", borderRadius: "9999px" }}>Resolved</span>;
    if (lower === "closed") return <span className="tt-badge" style={{ backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0", borderRadius: "9999px" }}>Closed</span>;
    if (lower === "cancelled") return <span className="tt-badge" style={{ backgroundColor: "#E2E8F0", color: "#718096", border: "1px solid #A0AEC0", borderRadius: "9999px" }}>Cancelled</span>;
    return <span className="tt-badge" style={{ borderRadius: "9999px" }}>{status}</span>;
  };

  const formatDateTime = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  const hasOpen = (dashboardData?.metrics.totalOpen || 0) > 0;
  const hasWaiting = (dashboardData?.metrics.waitingForRequester || 0) > 0;
  const hasResolved = (dashboardData?.recentlyResolved.length || 0) > 0;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ margin: 0, fontSize: "24px", color: "var(--color-text-main)" }}>
            Welcome back, {user?.name || selectedRequester?.name || "Requester"}!
          </h1>
          <p style={{ margin: "4px 0 0 0", color: "var(--color-text-muted)", fontSize: "14px" }}>
            Overview of your active service requests and support tickets.
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
            to="/requester/tickets/new"
            className="tt-btn tt-btn-primary"
            style={{ textDecoration: "none", fontSize: "13px", height: "36px", display: "inline-flex", alignItems: "center" }}
          >
            + Create New Ticket
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="tt-card tt-empty-state" style={{ padding: "40px 0" }}>
          <div className="tt-spinner" />
          <p style={{ marginTop: "12px", fontSize: "14px" }}>Loading Requester Dashboard...</p>
        </div>
      ) : error ? (
        <div className="tt-card" style={{ padding: "20px", backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)" }}>
          <p style={{ margin: 0, fontWeight: 600 }}>{error}</p>
        </div>
      ) : (
        <>
          {/* Top 4 Summary Cards Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "28px" }}>
            {/* Card 1: Total Open */}
            <div
              className="tt-card"
              onClick={hasOpen ? () => navigate("/requester/tickets?filter=open") : undefined}
              style={{
                cursor: hasOpen ? "pointer" : "default",
                borderLeft: "4px solid var(--color-primary-green)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              title={hasOpen ? "Click to view all open tickets" : "No open tickets"}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: "0.5px" }}>
                Total Open Tickets
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-primary-green)", marginTop: "8px" }}>
                {dashboardData?.metrics.totalOpen || 0}
              </div>
              {hasOpen && (
                <div style={{ fontSize: "12px", color: "var(--color-secondary-green)", marginTop: "4px", fontWeight: 500 }}>
                  Active support requests &rarr;
                </div>
              )}
            </div>

            {/* Card 2: Waiting for Requester */}
            <div
              className="tt-card"
              onClick={hasWaiting ? () => navigate("/requester/tickets?status=WAITING_FOR_REQUESTER") : undefined}
              style={{
                cursor: hasWaiting ? "pointer" : "default",
                borderLeft: "4px solid #D69E2E",
                backgroundColor: hasWaiting ? "#FEFCBF" : "var(--color-surface)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              title={hasWaiting ? "Click to view tickets needing your input" : "No tickets waiting for input"}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "#744210", letterSpacing: "0.5px" }}>
                Waiting for Your Input
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#744210", marginTop: "8px" }}>
                {dashboardData?.metrics.waitingForRequester || 0}
              </div>
              {hasWaiting && (
                <div style={{ fontSize: "12px", color: "#975A16", marginTop: "4px", fontWeight: 500 }}>
                  Requires your response &rarr;
                </div>
              )}
            </div>

            {/* Card 3: Recently Resolved */}
            <div
              className="tt-card"
              onClick={hasResolved ? () => navigate("/requester/tickets?filter=resolved") : undefined}
              style={{
                cursor: hasResolved ? "pointer" : "default",
                borderLeft: "4px solid #319795",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
              title={hasResolved ? "Click to view resolved tickets" : "No resolved tickets"}
            >
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: "0.5px" }}>
                Recently Resolved
              </div>
              <div style={{ fontSize: "28px", fontWeight: 800, color: "#234E52", marginTop: "8px" }}>
                {dashboardData?.recentlyResolved.length || 0}
              </div>
              {hasResolved && (
                <div style={{ fontSize: "12px", color: "#319795", marginTop: "4px", fontWeight: 500 }}>
                  Completed requests &rarr;
                </div>
              )}
            </div>

            {/* Card 4: Quick Action Panel */}
            <div className="tt-card" style={{ borderLeft: "4px solid #4A5568", display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: "var(--color-text-muted)", letterSpacing: "0.5px", marginBottom: "10px" }}>
                Quick Actions
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link to="/requester/tickets/new" className="tt-btn-pill-primary">
                  Submit New Ticket
                </Link>
                <Link to="/requester/tickets" className="tt-btn-pill-secondary">
                  View My Tickets List
                </Link>
              </div>
            </div>
          </div>

          {/* Detailed Lists Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "24px" }}>
            {/* Recently Updated Tickets */}
            <div className="tt-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Recently Updated Tickets</h3>
                <Link to="/requester/tickets?sortBy=updatedAt&sortDirection=desc" style={{ fontSize: "13px", textDecoration: "none" }}>
                  View All &rarr;
                </Link>
              </div>

              {!dashboardData?.recentlyUpdated || dashboardData.recentlyUpdated.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "14px", fontStyle: "italic", margin: 0, padding: "16px 0" }}>
                  No recent ticket updates.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {dashboardData.recentlyUpdated.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/requester/tickets/${ticket.id}`)}
                      style={{
                        padding: "12px 14px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        backgroundColor: "var(--color-surface)",
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
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-main)" }}>
                          {ticket.summary}
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: "2px" }}>
                          Category: {ticket.category.name}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                        {formatDateTime(ticket.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recently Resolved Tickets */}
            <div className="tt-card">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid var(--color-border)" }}>
                <h3 style={{ margin: 0, fontSize: "16px" }}>Recently Resolved Tickets</h3>
                <Link to="/requester/tickets?filter=resolved" style={{ fontSize: "13px", textDecoration: "none" }}>
                  View All &rarr;
                </Link>
              </div>

              {!dashboardData?.recentlyResolved || dashboardData.recentlyResolved.length === 0 ? (
                <p style={{ color: "var(--color-text-muted)", fontSize: "14px", fontStyle: "italic", margin: 0, padding: "16px 0" }}>
                  No resolved tickets yet.
                </p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {dashboardData.recentlyResolved.map((ticket) => (
                    <div
                      key={ticket.id}
                      onClick={() => navigate(`/requester/tickets/${ticket.id}`)}
                      style={{
                        padding: "12px 14px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        cursor: "pointer",
                        backgroundColor: "#F7FAFC",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 700, fontSize: "14px", color: "#234E52" }}>
                            #{ticket.ticketNumber}
                          </span>
                          {renderStatusBadge(ticket.currentStatus)}
                        </div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--color-text-main)" }}>
                          {ticket.summary}
                        </div>
                      </div>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                        {formatDateTime(ticket.updatedAt)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
