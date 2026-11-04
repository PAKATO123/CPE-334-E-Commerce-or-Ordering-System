import React, { useState, useEffect, useCallback } from "react";
import {
  getUsersList,
  createUserAccount,
  updateUserAccount,
  resetUserInitialPassword,
  UserAdminListItem,
} from "../api";
import { useAuth } from "../context/AuthContext";

export const UserManagementPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserAdminListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("role") || "";
  });
  const [statusFilter, setStatusFilter] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const s = params.get("status");
    return s !== null ? s : "";
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const r = params.get("role");
    const s = params.get("status");
    if (r) setRoleFilter(r);
    if (s !== null) setStatusFilter(s);
  }, []);

  // Toast Feedback State
  const [toastMessage, setToastMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    role: "REQUESTER",
    initialPassword: "",
  });
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [editingUser, setEditingUser] = useState<UserAdminListItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "REQUESTER",
    isActive: true,
  });
  const [editError, setEditError] = useState<string | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [resetUser, setResetUser] = useState<UserAdminListItem | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // Pagination Controls State
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [pagination, setPagination] = useState<{
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  } | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params: any = { page, pageSize };
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter !== "") params.isActive = statusFilter === "true";

      const res = await getUsersList(params);
      setUsers(res.data || []);
      setPagination(res.pagination || null);
    } catch (err: any) {
      setError(err.message || "Failed to load users list.");
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter, page, pageSize]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Create User Handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    setCreating(true);

    try {
      await createUserAccount(createForm);
      setToastMessage({ text: "User account created successfully!", type: "success" });
      setShowCreateModal(false);
      setCreateForm({ name: "", email: "", role: "REQUESTER", initialPassword: "" });
      await loadUsers();
    } catch (err: any) {
      setCreateError(err.message || "Failed to create user account.");
    } finally {
      setCreating(false);
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (u: UserAdminListItem) => {
    setEditingUser(u);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
    });
    setEditError(null);
  };

  // Edit User Handler
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);
    setSavingEdit(true);

    try {
      await updateUserAccount(editingUser.id, editForm);
      setToastMessage({ text: "User account updated successfully!", type: "success" });
      setEditingUser(null);
      await loadUsers();
    } catch (err: any) {
      setEditError(err.message || "Failed to update user account.");
    } finally {
      setSavingEdit(false);
    }
  };

  // Open Reset Modal
  const handleOpenReset = (u: UserAdminListItem) => {
    setResetUser(u);
    setResetPassword("");
    setResetError(null);
  };

  // Reset Password Handler
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetUser) return;
    setResetError(null);
    setResetting(true);

    try {
      await resetUserInitialPassword(resetUser.id, resetPassword);
      setToastMessage({ text: `Initial password reset for ${resetUser.name}!`, type: "success" });
      setResetUser(null);
      setResetPassword("");
      await loadUsers();
    } catch (err: any) {
      setResetError(err.message || "Failed to reset initial password.");
    } finally {
      setResetting(false);
    }
  };

  const renderRoleBadge = (role: string) => {
    switch (role) {
      case "ADMINISTRATOR":
        return (
          <span className="tt-badge" style={{ backgroundColor: "#FAF5FF", color: "#6B46C1", border: "1px solid #B794F4" }}>
            Admin
          </span>
        );
      case "IT_STAFF":
        return (
          <span className="tt-badge" style={{ backgroundColor: "#EBF8FF", color: "#2B6CB0", border: "1px solid #63B3ED" }}>
            IT Staff
          </span>
        );
      default:
        return (
          <span className="tt-badge" style={{ backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0" }}>
            Requester
          </span>
        );
    }
  };

  const hasActiveFilters = search !== "" || roleFilter !== "" || statusFilter !== "";

  return (
    <div style={{ padding: "8px 0" }}>
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div
          className="tt-toast"
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 1200,
            backgroundColor: toastMessage.type === "success" ? "var(--color-pale-green)" : "var(--color-error-bg)",
            borderColor: toastMessage.type === "success" ? "var(--color-primary-green)" : "var(--color-error)",
            color: toastMessage.type === "success" ? "var(--color-text-main)" : "var(--color-error)",
          }}
        >
          <span>{toastMessage.text}</span>
          <button
            onClick={() => setToastMessage(null)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "16px",
              lineHeight: 1,
              padding: "0 4px",
              color: "inherit",
            }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      )}

      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ marginBottom: "4px" }}>User Account Management</h1>
          <p style={{ color: "var(--color-text-muted)", margin: 0, fontSize: "14px" }}>
            View and manage user accounts, assign permitted roles, activate/deactivate accounts, and handle credential resets.
          </p>
        </div>
        <button
          className="tt-btn tt-btn-primary"
          onClick={() => {
            setShowCreateModal(true);
            setCreateError(null);
          }}
          data-testid="add-user-button"
        >
          + Add User Account
        </button>
      </div>

      {/* Toolbar / Filters Card */}
      <div className="tt-card" style={{ marginBottom: "24px", padding: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
          {/* Keyword Search Input */}
          <div className="tt-form-group" style={{ marginBottom: 0 }}>
            <label className="tt-label" htmlFor="user-search-input">Search Account</label>
            <input
              id="user-search-input"
              type="text"
              className="tt-input"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              data-testid="user-search-input"
            />
          </div>

          {/* Role Filter Select */}
          <div className="tt-form-group" style={{ marginBottom: 0 }}>
            <label className="tt-label" htmlFor="user-role-filter">Role Filter</label>
            <select
              id="user-role-filter"
              className="tt-select"
              value={roleFilter}
              onChange={(e) => {
                setRoleFilter(e.target.value);
                setPage(1);
              }}
              data-testid="user-role-filter"
            >
              <option value="">All Roles</option>
              <option value="REQUESTER">Requester</option>
              <option value="IT_STAFF">IT Staff</option>
              <option value="ADMINISTRATOR">Administrator</option>
            </select>
          </div>

          {/* Status Filter Select */}
          <div className="tt-form-group" style={{ marginBottom: 0 }}>
            <label className="tt-label" htmlFor="user-status-filter">Account Status</label>
            <select
              id="user-status-filter"
              className="tt-select"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              data-testid="user-status-filter"
            >
              <option value="">All Statuses</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="tt-form-group" style={{ marginBottom: 0, display: "flex", alignItems: "flex-end" }}>
            <button
              className="tt-btn tt-btn-outline"
              style={{ width: "100%", justifyContent: "center" }}
              onClick={() => {
                setSearch("");
                setRoleFilter("");
                setStatusFilter("");
                setPage(1);
              }}
              disabled={!hasActiveFilters}
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="tt-card" style={{ backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error)", color: "var(--color-error)", marginBottom: "24px" }}>
          ⚠️ {error}
        </div>
      )}

      {/* Users Table Card */}
      <div className="tt-card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div className="tt-empty-state">
            <div className="tt-spinner" title="Loading users..." />
            <p style={{ marginTop: "12px", color: "var(--color-text-muted)" }}>Loading user accounts...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="tt-empty-state">
            <h3 style={{ margin: 0 }}>No User Accounts Found</h3>
            <p style={{ color: "var(--color-text-muted)", marginTop: "6px", fontSize: "14px" }}>
              {hasActiveFilters
                ? "No user accounts match your search or filter criteria."
                : "There are currently no user accounts in the database."}
            </p>
          </div>
        ) : (
          <div>
            <div style={{ overflowX: "auto" }}>
              <table className="tt-table" data-testid="users-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#F7FAFC", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>Name</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>Email Address</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>Role</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", fontSize: "13px" }}>Password Reset</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", fontSize: "13px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background-color 0.15s" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "var(--color-text-main)" }}>
                        {u.name}
                        {currentUser?.id === u.id && (
                          <span style={{ marginLeft: "6px", fontSize: "12px", color: "var(--color-primary-green)", fontWeight: 500 }}>
                            (You)
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>{u.email}</td>
                      <td style={{ padding: "12px 16px" }}>{renderRoleBadge(u.role)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.isActive ? (
                          <span className="tt-badge tt-badge-new">Active</span>
                        ) : (
                          <span className="tt-badge tt-badge-low">Inactive</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {u.mustChangePassword ? (
                          <span className="tt-badge tt-badge-high">Required</span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>No</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                          <button
                            type="button"
                            className="tt-btn tt-btn-outline"
                            style={{ height: "32px", padding: "0 12px", fontSize: "13px" }}
                            onClick={() => handleOpenEdit(u)}
                            data-testid={`edit-user-button-${u.id}`}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="tt-btn tt-btn-outline"
                            style={{ height: "32px", padding: "0 12px", fontSize: "13px" }}
                            onClick={() => handleOpenReset(u)}
                            data-testid={`reset-password-button-${u.id}`}
                          >
                            Reset Password
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls Footer */}
            {pagination && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  backgroundColor: "#F7FAFC",
                  borderTop: "1px solid var(--color-border)",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "13px", color: "var(--color-text-muted)", flexWrap: "nowrap" }}>
                  <span style={{ whiteSpace: "nowrap" }}>
                    Showing {pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1} to{" "}
                    {Math.min(pagination.page * pagination.pageSize, pagination.total)} of {pagination.total} users
                  </span>

                  <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", whiteSpace: "nowrap" }}>
                    <label htmlFor="user-page-size-select" style={{ fontSize: "12px", whiteSpace: "nowrap", display: "inline-block", margin: 0 }}>Per page:</label>
                    <select
                      id="user-page-size-select"
                      className="tt-select"
                      data-testid="user-page-size-select"
                      value={pageSize}
                      onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setPage(1);
                      }}
                      style={{ height: "30px", padding: "2px 24px 2px 8px", fontSize: "12px" }}
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    className="tt-btn tt-btn-outline"
                    data-testid="user-prev-page-button"
                    disabled={!pagination.hasPreviousPage}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    style={{ height: "32px", padding: "0 12px", fontSize: "13px" }}
                  >
                    &larr; Previous
                  </button>
                  <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    type="button"
                    className="tt-btn tt-btn-outline"
                    data-testid="user-next-page-button"
                    disabled={!pagination.hasNextPage}
                    onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                    style={{ height: "32px", padding: "0 12px", fontSize: "13px" }}
                  >
                    Next &rarr;
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create User Popup Modal */}
      {showCreateModal && (
        <div className="tt-modal-backdrop" data-testid="create-user-modal">
          <div className="tt-modal" style={{ maxWidth: "480px", width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Add New User Account</h2>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--color-text-muted)" }}
              >
                ×
              </button>
            </div>

            {createError && (
              <div
                data-testid="create-user-error"
                style={{
                  backgroundColor: "var(--color-error-bg)",
                  border: "1px solid var(--color-error)",
                  color: "var(--color-error)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                ⚠️ {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit}>
              <div className="tt-form-group">
                <label className="tt-label" htmlFor="create-user-name">
                  Full Name <span className="tt-required-asterisk">*</span>
                </label>
                <input
                  id="create-user-name"
                  type="text"
                  className="tt-input"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  data-testid="create-user-name"
                />
              </div>

              <div className="tt-form-group">
                <label className="tt-label" htmlFor="create-user-email">
                  Email Address <span className="tt-required-asterisk">*</span>
                </label>
                <input
                  id="create-user-email"
                  type="email"
                  className="tt-input"
                  required
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="e.g. john@toktickit.local"
                  data-testid="create-user-email"
                />
              </div>

              <div className="tt-form-group">
                <label className="tt-label" htmlFor="create-user-role">
                  Assigned Role <span className="tt-required-asterisk">*</span>
                </label>
                <select
                  id="create-user-role"
                  className="tt-select"
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                  data-testid="create-user-role"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div className="tt-form-group" style={{ marginBottom: "24px" }}>
                <label className="tt-label" htmlFor="create-user-password">
                  Initial Password <span className="tt-required-asterisk">*</span>
                </label>
                <input
                  id="create-user-password"
                  type="password"
                  className="tt-input"
                  required
                  value={createForm.initialPassword}
                  onChange={(e) => setCreateForm({ ...createForm, initialPassword: e.target.value })}
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit"
                  data-testid="create-user-password"
                />
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginTop: "4px" }}>
                  User will be forced to set a new password on first login.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="tt-btn tt-btn-outline"
                  onClick={() => setShowCreateModal(false)}
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tt-btn tt-btn-primary"
                  disabled={creating}
                  data-testid="submit-create-user"
                >
                  {creating ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Popup Modal */}
      {editingUser && (
        <div className="tt-modal-backdrop" data-testid="edit-user-modal">
          <div className="tt-modal" style={{ maxWidth: "480px", width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Edit User Account</h2>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--color-text-muted)" }}
              >
                ×
              </button>
            </div>

            {editError && (
              <div
                data-testid="edit-user-error"
                style={{
                  backgroundColor: "var(--color-error-bg)",
                  border: "1px solid var(--color-error)",
                  color: "var(--color-error)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                ⚠️ {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit}>
              <div className="tt-form-group">
                <label className="tt-label" htmlFor="edit-user-name">
                  Full Name <span className="tt-required-asterisk">*</span>
                </label>
                <input
                  id="edit-user-name"
                  type="text"
                  className="tt-input"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  data-testid="edit-user-name"
                />
              </div>

              <div className="tt-form-group">
                <label className="tt-label" htmlFor="edit-user-email">
                  Email Address <span className="tt-required-asterisk">*</span>
                </label>
                <input
                  id="edit-user-email"
                  type="email"
                  className="tt-input"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  data-testid="edit-user-email"
                />
              </div>

              <div className="tt-form-group">
                <label className="tt-label" htmlFor="edit-user-role">
                  Assigned Role <span className="tt-required-asterisk">*</span>
                </label>
                <select
                  id="edit-user-role"
                  className="tt-select"
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  data-testid="edit-user-role"
                >
                  <option value="REQUESTER">Requester</option>
                  <option value="IT_STAFF">IT Staff</option>
                  <option value="ADMINISTRATOR">Administrator</option>
                </select>
              </div>

              <div className="tt-form-group" style={{ marginBottom: "24px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, cursor: "pointer", color: "var(--color-text-main)" }}>
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    data-testid="edit-user-active"
                  />
                  Account Active Status
                </label>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="tt-btn tt-btn-outline"
                  onClick={() => setEditingUser(null)}
                  disabled={savingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tt-btn tt-btn-primary"
                  disabled={savingEdit}
                  data-testid="submit-edit-user"
                >
                  {savingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Popup Modal */}
      {resetUser && (
        <div className="tt-modal-backdrop" data-testid="reset-password-modal">
          <div className="tt-modal" style={{ maxWidth: "440px", width: "90%" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)", paddingBottom: "12px", marginBottom: "16px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, margin: 0 }}>Reset Initial Password</h2>
              <button
                type="button"
                onClick={() => setResetUser(null)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "var(--color-text-muted)" }}
              >
                ×
              </button>
            </div>

            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", margin: "0 0 16px 0" }}>
              Set a new initial password for <strong>{resetUser.name}</strong> ({resetUser.email}).
            </p>

            {resetError && (
              <div
                data-testid="reset-password-error"
                style={{
                  backgroundColor: "var(--color-error-bg)",
                  border: "1px solid var(--color-error)",
                  color: "var(--color-error)",
                  padding: "10px 14px",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "16px",
                  fontSize: "13px",
                }}
              >
                ⚠️ {resetError}
              </div>
            )}

            <form onSubmit={handleResetSubmit}>
              <div className="tt-form-group" style={{ marginBottom: "24px" }}>
                <label className="tt-label" htmlFor="reset-password-input">
                  New Initial Password <span className="tt-required-asterisk">*</span>
                </label>
                <input
                  id="reset-password-input"
                  type="password"
                  className="tt-input"
                  required
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="Min 8 chars, 1 upper, 1 lower, 1 digit"
                  data-testid="reset-password-input"
                />
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)", display: "block", marginTop: "4px" }}>
                  This forces mandatory password change on the user's next login.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                <button
                  type="button"
                  className="tt-btn tt-btn-outline"
                  onClick={() => setResetUser(null)}
                  disabled={resetting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tt-btn tt-btn-primary"
                  disabled={resetting}
                  data-testid="submit-reset-password"
                >
                  {resetting ? "Resetting..." : "Set Initial Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
