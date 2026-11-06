import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";
import { useAuth } from "../context/AuthContext";
import { getCategories, getRelatedSystems, Category, RelatedSystem, API_BASE_URL } from "../api";

export interface TicketListItem {
  id: number;
  ticketNumber: string;
  summary: string;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requestedPriority: string | null;
  currentStatus: string;
  createdAt: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

export const MyTicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { selectedRequester } = useRequester();

  // Redirect IT staff / admin to staff queue
  useEffect(() => {
    if (user && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR")) {
      navigate("/staff/queue", { replace: true });
    }
  }, [user, navigate]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);

  // List State
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter Controls
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    const statusParam = params.get("status");
    const filterParam = params.get("filter");
    if (statusParam) return statusParam;
    if (filterParam === "open") return "open";
    if (filterParam === "resolved") return "Resolved";
    return "";
  });
  const [priorityFilter, setPriorityFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [systemFilter, setSystemFilter] = useState<string>("");

  // Sort & Pagination Controls
  const [sortBy, setSortBy] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("sortBy") || "priority";
  });
  const [sortDirection, setSortDirection] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("sortDirection") || "desc";
  });
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Sync URL query parameters for drill-down filters from Requester Dashboard
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const statusParam = params.get("status");
    const filterParam = params.get("filter");
    const sortByParam = params.get("sortBy");
    const sortDirParam = params.get("sortDirection");

    if (statusParam) {
      setStatusFilter(statusParam);
    } else if (filterParam === "open") {
      setStatusFilter("open");
    } else if (filterParam === "resolved") {
      setStatusFilter("Resolved");
    }

    if (sortByParam) {
      setSortBy(sortByParam);
    }
    if (sortDirParam) {
      setSortDirection(sortDirParam);
    }
  }, [location.search]);

  // Load Categories & Related Systems on mount for filters
  useEffect(() => {
    let isMounted = true;
    async function loadReferenceData() {
      try {
        const [cats, syss] = await Promise.all([getCategories(), getRelatedSystems()]);
        if (isMounted) {
          setCategories(cats);
          setRelatedSystems(syss);
        }
      } catch (err) {
        console.error("Error loading reference data for filters:", err);
      }
    }
    loadReferenceData();
  }, []);

  // Debounce search input (~300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Fetch Tickets from API
  const fetchTickets = useCallback(async () => {
    const currentRequesterId = selectedRequester?.id || user?.id;
    if (!currentRequesterId) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.append("requesterId", String(currentRequesterId));
      if (debouncedSearch.trim()) params.append("search", debouncedSearch.trim());
      if (statusFilter) params.append("status", statusFilter);
      if (priorityFilter) params.append("priority", priorityFilter);
      if (categoryFilter) params.append("categoryId", categoryFilter);
      if (systemFilter) params.append("relatedSystemId", systemFilter);
      if (sortBy) params.append("sortBy", sortBy);
      if (sortDirection) params.append("sortDirection", sortDirection);
      params.append("page", String(page));
      params.append("pageSize", String(pageSize));

      const res = await fetch(`${API_BASE_URL}/api/tickets?${params.toString()}`, { credentials: "include" });
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error?.message || "Unable to load tickets.");
      }

      setTickets(json.data || []);
      setPagination(json.pagination || null);
    } catch (err: any) {
      console.error("Error loading tickets:", err);
      setError("Unable to load tickets right now. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [
    selectedRequester,
    user,
    debouncedSearch,
    statusFilter,
    priorityFilter,
    categoryFilter,
    systemFilter,
    sortBy,
    sortDirection,
    page,
    pageSize,
  ]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  // Sort Header Toggles (AD-05)
  const handleSortPriority = () => {
    setPage(1);
    if (sortBy !== "priority") {
      setSortBy("priority");
      setSortDirection("desc");
    } else if (sortDirection === "desc") {
      setSortDirection("asc");
    } else {
      setSortBy("");
      setSortDirection("desc");
    }
  };

  const handleSortStatus = () => {
    setPage(1);
    if (sortBy !== "status") {
      setSortBy("status");
      setSortDirection("asc");
    } else if (sortDirection === "asc") {
      setSortDirection("desc");
    } else {
      setSortBy("");
      setSortDirection("desc");
    }
  };

  const handleSortDate = () => {
    setPage(1);
    if (sortBy !== "updatedAt") {
      setSortBy("updatedAt");
      setSortDirection("desc");
    } else if (sortDirection === "desc") {
      setSortDirection("asc");
    } else {
      setSortBy("");
      setSortDirection("desc");
    }
  };

  const handleClearFilters = () => {
    setSearch("");
    setDebouncedSearch("");
    setStatusFilter("");
    setPriorityFilter("");
    setCategoryFilter("");
    setSystemFilter("");
    setSortBy("priority");
    setSortDirection("desc");
    setPage(1);
  };

  const isFilterActive = Boolean(search.trim() || statusFilter || priorityFilter || categoryFilter || systemFilter);

  // Badge Render Helpers
  const renderPriorityBadge = (priority: string | null) => {
    if (!priority) {
      return <span style={{ color: "var(--color-text-muted)" }}>—</span>;
    }

    const up = priority.toUpperCase();
    if (up === "URGENT") {
      return <span className="tt-badge tt-badge-urgent">Urgent</span>;
    }
    if (up === "HIGH") {
      return <span className="tt-badge tt-badge-high">High</span>;
    }
    if (up === "MEDIUM") {
      return <span className="tt-badge tt-badge-medium">Medium</span>;
    }
    if (up === "LOW") {
      return <span className="tt-badge tt-badge-low">Low</span>;
    }
    return <span>{priority}</span>;
  };

  const renderStatusBadge = (status: string) => {
    const lower = status.toLowerCase();
    if (lower === "new") {
      return <span className="tt-badge tt-badge-new" style={{ whiteSpace: "nowrap" }}>New</span>;
    }
    if (lower === "open") {
      return <span className="tt-badge" style={{ backgroundColor: "#EBF8FF", color: "#2B6CB0", border: "1px solid #63B3ED", whiteSpace: "nowrap" }}>Open</span>;
    }
    if (lower === "in progress") {
      return <span className="tt-badge tt-badge-medium" style={{ whiteSpace: "nowrap" }}>In Progress</span>;
    }
    if (lower === "waiting for requester") {
      return <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E", whiteSpace: "nowrap" }}>Waiting</span>;
    }
    if (lower === "pending verification") {
      return <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E", fontWeight: 600, whiteSpace: "nowrap" }}>Pending</span>;
    }
    if (lower === "reopened") {
      return <span className="tt-badge" style={{ backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #F87171", whiteSpace: "nowrap" }}>Reopened</span>;
    }
    if (lower === "resolved") {
      return (
        <span
          className="tt-badge"
          style={{ backgroundColor: "#E6FFFA", color: "#234E52", border: "1px solid #319795", whiteSpace: "nowrap" }}
        >
          Resolved
        </span>
      );
    }
    if (lower === "closed") {
      return (
        <span
          className="tt-badge"
          style={{ backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0", whiteSpace: "nowrap" }}
        >
          Closed
        </span>
      );
    }
    if (lower === "cancelled") {
      return <span className="tt-badge" style={{ backgroundColor: "#E2E8F0", color: "#718096", border: "1px solid #A0AEC0", whiteSpace: "nowrap" }}>Cancelled</span>;
    }
    return <span className="tt-badge" style={{ whiteSpace: "nowrap" }}>{status}</span>;
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1>My Tickets</h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0 }}>
            View and manage your submitted IT support tickets for <strong>{selectedRequester?.name}</strong>.
          </p>
        </div>
        <Link to="/requester/tickets/new" className="tt-btn tt-btn-primary" style={{ textDecoration: "none" }}>
          + Create Ticket
        </Link>
      </div>

      <div className="tt-card">
        {/* Search & Filters Controls Bar */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Keyword Search */}
          <input
            type="text"
            className="tt-input"
            placeholder="Search by ticket number, summary, description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: "1 1 240px", minWidth: "220px" }}
            aria-label="Search tickets"
          />

          {/* Status Filter */}
          <select
            className="tt-select"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: "170px" }}
            aria-label="Filter by Status"
          >
            <option value="">All Statuses</option>
            <option value="open">All Open Tickets</option>
            <option value="New">New</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Waiting for Requester">Waiting for Requester</option>
            <option value="Pending Verification">Pending Verification</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
            <option value="Reopened">Reopened</option>
            <option value="Cancelled">Cancelled</option>
          </select>

          {/* Priority Filter */}
          <select
            className="tt-select"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: "150px" }}
            aria-label="Filter by Priority"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
            <option value="null">Unassigned</option>
          </select>

          {/* Category Filter */}
          <select
            className="tt-select"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: "160px" }}
            aria-label="Filter by Category"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Related System Filter */}
          <select
            className="tt-select"
            value={systemFilter}
            onChange={(e) => {
              setSystemFilter(e.target.value);
              setPage(1);
            }}
            style={{ width: "170px" }}
            aria-label="Filter by Related System"
          >
            <option value="">All Systems</option>
            {relatedSystems.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>

          {/* Clear Filters Button */}
          {isFilterActive && (
            <button type="button" onClick={handleClearFilters} className="tt-btn tt-btn-outline" style={{ height: "42px" }}>
              Clear Filters
            </button>
          )}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="tt-empty-state">
            <div className="tt-spinner" />
            <p style={{ marginTop: "12px" }}>Loading tickets...</p>
          </div>
        ) : error ? (
          <div
            style={{
              backgroundColor: "var(--color-error-bg)",
              border: "1px solid var(--color-error)",
              color: "var(--color-error)",
              padding: "16px",
              borderRadius: "var(--radius-md)",
              textAlign: "center",
            }}
          >
            <p style={{ fontWeight: 600, margin: 0 }}>{error}</p>
            <button
              type="button"
              onClick={fetchTickets}
              className="tt-btn tt-btn-outline"
              style={{ marginTop: "12px", borderColor: "var(--color-error)", color: "var(--color-error)" }}
            >
              Retry
            </button>
          </div>
        ) : tickets.length === 0 ? (
          isFilterActive ? (
            /* No-Results State when filters applied */
            <div className="tt-empty-state">
              <h3>No matching tickets found</h3>
              <p style={{ marginBottom: "16px" }}>No tickets match your active search and filter conditions.</p>
              <button type="button" onClick={handleClearFilters} className="tt-btn tt-btn-primary">
                Clear Filters
              </button>
            </div>
          ) : (
            /* Empty State for Requester with 0 total tickets */
            <div className="tt-empty-state">
              <h3>No tickets submitted yet</h3>
              <p style={{ marginBottom: "16px" }}>
                You have not created any IT support tickets under <strong>{selectedRequester?.name}</strong>.
              </p>
              <Link to="/tickets/new" className="tt-btn tt-btn-primary">
                + Create Your First Ticket
              </Link>
            </div>
          )
        ) : (
          /* Tickets Data Table */
          <>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid var(--color-border)", color: "var(--color-text-muted)", fontSize: "13px" }}>
                    <th style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>Ticket #</th>
                    <th style={{ padding: "12px 8px" }}>Summary</th>
                    <th style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>Category</th>
                    <th style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>Related System</th>
                    {/* Priority Header (Clickable Sort) */}
                    <th
                      onClick={handleSortPriority}
                      style={{
                        padding: "12px 8px",
                        cursor: "pointer",
                        userSelect: "none",
                        color: sortBy === "priority" ? "var(--color-primary-green)" : "inherit",
                        fontWeight: sortBy === "priority" ? 700 : "inherit",
                        whiteSpace: "nowrap",
                      }}
                      title="Click to sort by Priority"
                    >
                      Priority {sortBy === "priority" ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                    </th>
                    {/* Status Header (Clickable Sort) */}
                    <th
                      onClick={handleSortStatus}
                      style={{
                        padding: "12px 8px",
                        cursor: "pointer",
                        userSelect: "none",
                        color: sortBy === "status" ? "var(--color-primary-green)" : "inherit",
                        fontWeight: sortBy === "status" ? 700 : "inherit",
                        whiteSpace: "nowrap",
                      }}
                      title="Click to sort by Status"
                    >
                      Status {sortBy === "status" ? (sortDirection === "asc" ? "↑" : "↓") : ""}
                    </th>
                    {/* Last Updated Header (Clickable Sort) */}
                    <th
                      onClick={handleSortDate}
                      style={{
                        padding: "12px 8px",
                        cursor: "pointer",
                        userSelect: "none",
                        color: ["date", "createdat", "updatedat"].includes(sortBy.toLowerCase()) ? "var(--color-primary-green)" : "inherit",
                        fontWeight: ["date", "createdat", "updatedat"].includes(sortBy.toLowerCase()) ? 700 : "inherit",
                        whiteSpace: "nowrap",
                      }}
                      title="Click to sort by Last Updated"
                    >
                      Last Updated {["date", "createdat", "updatedat"].includes(sortBy.toLowerCase()) ? (sortDirection === "desc" ? "↓" : "↑") : ""}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => navigate(`/requester/tickets/${t.id}`)}
                      style={{
                        borderBottom: "1px solid var(--color-border)",
                        cursor: "pointer",
                        transition: "background-color 0.15s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--color-pale-green)")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                    >
                      <td style={{ padding: "12px 8px", fontWeight: 600, color: "var(--color-primary-green)", whiteSpace: "nowrap" }}>
                        {t.ticketNumber}
                      </td>
                      <td style={{ padding: "12px 8px", fontWeight: 500 }}>{t.summary}</td>
                      <td style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                        {t.category.name}
                      </td>
                      <td style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "13px" }}>
                        {t.relatedSystem.name}
                      </td>
                      <td style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>{renderPriorityBadge(t.requestedPriority)}</td>
                      <td style={{ padding: "12px 8px", whiteSpace: "nowrap" }}>{renderStatusBadge(t.currentStatus)}</td>
                      <td style={{ padding: "12px 8px", color: "var(--color-text-muted)", fontSize: "13px", whiteSpace: "nowrap" }}>
                        {formatDate(t.updatedAt || t.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Bar */}
            {pagination && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "20px",
                  paddingTop: "16px",
                  borderTop: "1px solid var(--color-border)",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                    Page {pagination.page} of {pagination.totalPages} ({pagination.totalItems} total tickets)
                  </span>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <label htmlFor="page-size-select" style={{ fontSize: "13px", color: "var(--color-text-muted)" }}>
                      Per page:
                    </label>
                    <select
                      id="page-size-select"
                      className="tt-select"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      style={{ width: "70px", height: "32px", padding: "2px 6px" }}
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    type="button"
                    className="tt-btn tt-btn-outline"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ height: "34px", padding: "0 12px", fontSize: "13px" }}
                  >
                    &larr; Previous
                  </button>

                  <button
                    type="button"
                    className="tt-btn tt-btn-outline"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((p) => p + 1)}
                    style={{ height: "34px", padding: "0 12px", fontSize: "13px" }}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MyTicketsPage;
