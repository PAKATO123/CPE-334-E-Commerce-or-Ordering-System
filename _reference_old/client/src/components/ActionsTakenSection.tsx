import React, { useState, useEffect } from "react";
import { ActionTaken, getActionsTaken, createActionTaken, updateActionTaken } from "../api";

interface ActionsTakenSectionProps {
  ticketId: number;
  currentUserRole: string;
  ticketStatus: string;
  onActionsChange?: (actions: ActionTaken[]) => void;
}

export const ActionsTakenSection: React.FC<ActionsTakenSectionProps> = ({
  ticketId,
  currentUserRole,
  ticketStatus,
  onActionsChange,
}) => {
  const [actionsTaken, setActionsTaken] = useState<ActionTaken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Follow-Up Sort Toggle (Default ON)
  const [putFollowUpFirst, setPutFollowUpFirst] = useState<boolean>(true);

  // Collapsible & Pagination State
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 5;

  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingAction, setEditingAction] = useState<ActionTaken | null>(null);

  const [description, setDescription] = useState<string>("");
  const [result, setResult] = useState<string>("");
  const [followUpRequired, setFollowUpRequired] = useState<boolean>(false);
  const [followUpNote, setFollowUpNote] = useState<string>("");
  const [attachmentNotes, setAttachmentNotes] = useState<string>("");
  const [actionDate, setActionDate] = useState<string>("");

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const isStaffOrAdmin = currentUserRole === "IT_STAFF" || currentUserRole === "ADMINISTRATOR";
  const isCancelled = ticketStatus === "Cancelled";

  const fetchActions = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getActionsTaken(ticketId);
      setActionsTaken(data);
      if (onActionsChange) {
        onActionsChange(data);
      }
    } catch (err: any) {
      console.error("Error loading actions taken:", err);
      setError(err.message || "Failed to load Actions Taken.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [ticketId]);

  const [actionToMarkDone, setActionToMarkDone] = useState<ActionTaken | null>(null);

  const handleOpenMarkDoneModal = (action: ActionTaken) => {
    setActionToMarkDone(action);
  };

  const confirmMarkDone = async () => {
    if (!actionToMarkDone) return;
    const action = actionToMarkDone;
    setActionToMarkDone(null);

    try {
      await updateActionTaken(ticketId, action.id, {
        actionDate: action.actionDate,
        description: action.description,
        result: action.result,
        followUpRequired: false,
        isFollowedUp: true,
        followUpNote: action.followUpNote?.trim() ? action.followUpNote : "Followed up",
        attachmentNotes: action.attachmentNotes || undefined,
        expectedUpdatedAt: action.updatedAt,
      });
      await fetchActions();
    } catch (err: any) {
      console.error("Error marking follow-up as done:", err);
      setError(err.message || "Failed to mark follow-up as done.");
    }
  };

  const sortedActions = [...actionsTaken].sort((a, b) => {
    if (putFollowUpFirst) {
      if (a.followUpRequired && !b.followUpRequired) return -1;
      if (!a.followUpRequired && b.followUpRequired) return 1;

      if (a.followUpRequired && b.followUpRequired) {
        return new Date(a.actionDate).getTime() - new Date(b.actionDate).getTime();
      }

      if (!a.followUpRequired && !b.followUpRequired) {
        return new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime();
      }
    }
    return new Date(b.actionDate).getTime() - new Date(a.actionDate).getTime();
  });

  const totalPages = Math.ceil(sortedActions.length / PAGE_SIZE) || 1;
  const paginatedActions = sortedActions.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const formatLocalDatetime = (d: Date | string = new Date()) => {
    const dateObj = typeof d === "string" ? new Date(d) : d;
    if (isNaN(dateObj.getTime())) return "";
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`;
  };

  const handleOpenCreateModal = () => {
    setEditingAction(null);
    setDescription("");
    setResult("");
    setFollowUpRequired(false);
    setFollowUpNote("");
    setAttachmentNotes("");
    setActionDate(formatLocalDatetime(new Date()));
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (action: ActionTaken) => {
    setEditingAction(action);
    setDescription(action.description);
    setResult(action.result);
    setFollowUpRequired(action.followUpRequired);
    setFollowUpNote(action.followUpNote || "");
    setAttachmentNotes(action.attachmentNotes || "");
    setActionDate(formatLocalDatetime(action.actionDate));
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAction(null);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!description.trim() || description.trim().length < 3) {
      setFormError("Action description is required (min 3 characters).");
      return;
    }

    if (!result.trim() || result.trim().length < 3) {
      setFormError("Action result is required (min 3 characters).");
      return;
    }

    if (followUpRequired && !followUpNote.trim()) {
      setFormError("Follow-up note is required when follow-up is checked.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        actionDate: actionDate ? new Date(actionDate).toISOString() : undefined,
        description: description.trim(),
        result: result.trim(),
        followUpRequired,
        isFollowedUp: false,
        followUpNote: followUpRequired ? followUpNote.trim() : undefined,
        attachmentNotes: attachmentNotes.trim() || undefined,
        expectedUpdatedAt: editingAction?.updatedAt,
      };

      if (editingAction) {
        await updateActionTaken(ticketId, editingAction.id, payload);
      } else {
        await createActionTaken(ticketId, payload);
        setCurrentPage(1); // Jump to first page on new action
      }

      handleCloseModal();
      fetchActions();
    } catch (err: any) {
      console.error("Error saving Action Taken:", err);
      setFormError(err.message || "Unable to save Action Taken.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tt-card" style={{ marginBottom: "24px" }}>
      {/* Section Header with Collapse Toggle and Metadata */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: isCollapsed ? 0 : "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: "14px",
              color: "var(--color-text-muted)",
              padding: 0,
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
            title={isCollapsed ? "Expand Actions Taken" : "Collapse Actions Taken"}
          >
            <span>{isCollapsed ? "▶" : "▼"}</span>
            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--color-text-main)" }}>Actions Taken</h3>
          </button>

          {/* Plain Text Record Count (No Pill) */}
          <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>
            ({actionsTaken.length} {actionsTaken.length === 1 ? "Record" : "Records"})
          </span>

          {/* Checkbox Toggle to put Follow-Up Required first */}
          <label style={{ fontSize: "13px", color: "var(--color-text-main)", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", userSelect: "none" }}>
            <input
              type="checkbox"
              checked={putFollowUpFirst}
              onChange={(e) => setPutFollowUpFirst(e.target.checked)}
            />
            Put 'Follow-Up Required' first
          </label>
        </div>

        {isStaffOrAdmin && !isCancelled && (
          <button
            type="button"
            onClick={handleOpenCreateModal}
            className="tt-btn tt-btn-primary"
            style={{ fontSize: "13px", height: "34px", padding: "0 12px" }}
          >
            + Add Action Taken
          </button>
        )}
      </div>

      {/* Collapsible Content Panel */}
      {!isCollapsed && (
        <>
          {loading ? (
            <div className="tt-empty-state" style={{ padding: "20px 0" }}>
              <div className="tt-spinner" />
              <p style={{ marginTop: "8px", fontSize: "13px" }}>Loading Actions Taken...</p>
            </div>
          ) : error ? (
            <div style={{ padding: "12px", backgroundColor: "var(--color-error-bg)", border: "1px solid var(--color-error)", color: "var(--color-error)", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
              {error}
            </div>
          ) : actionsTaken.length === 0 ? (
            <div className="tt-empty-state" style={{ padding: "24px 0", border: "1px dashed var(--color-border)", borderRadius: "var(--radius-sm)" }}>
              <p style={{ margin: 0, fontSize: "14px", color: "var(--color-text-muted)" }}>
                No Actions Taken recorded for this ticket yet.
              </p>
              {isStaffOrAdmin && !isCancelled && (
                <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "var(--color-text-muted)" }}>
                  Click "+ Add Action Taken" above to log work performed on this ticket.
                </p>
              )}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {paginatedActions.map((action) => (
                <div
                  key={action.id}
                  style={{
                    padding: "16px",
                    border: action.followUpRequired ? "1px solid #F6E05E" : "1px solid var(--color-border)",
                    borderRadius: "var(--radius-md)",
                    backgroundColor: action.followUpRequired ? "#FFFFF0" : "var(--color-surface)",
                    boxShadow: "var(--shadow-sm)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                        {new Date(action.actionDate).toLocaleString()}
                      </span>
                      <span className="tt-badge" style={{ backgroundColor: "var(--color-pale-green)", color: "var(--color-primary-green)", border: "1px solid var(--color-secondary-green)" }}>
                        👤 {action.performedBy?.name || `Staff #${action.performedById}`}
                      </span>
                      {action.followUpRequired ? (
                        <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E", fontWeight: 600 }}>
                          Follow-Up Required
                        </span>
                      ) : action.isFollowedUp ? (
                        <span className="tt-badge" style={{ backgroundColor: "#E6FFFA", color: "#234E52", border: "1px solid #319795", fontWeight: 600 }}>
                          Followed up
                        </span>
                      ) : (
                        <span className="tt-badge tt-badge-low">
                          No Follow-Up Needed
                        </span>
                      )}
                    </div>

                    {isStaffOrAdmin && !isCancelled && (
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        {action.followUpRequired && (
                          <button
                            type="button"
                            onClick={() => handleOpenMarkDoneModal(action)}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--color-secondary-green)",
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: "pointer",
                              textDecoration: "underline",
                            }}
                          >
                            Mark done
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenEditModal(action)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--color-secondary-green)",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: "pointer",
                            textDecoration: "underline",
                          }}
                        >
                          Edit
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Distinct Bordered Text Areas for Description and Result */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", fontSize: "13px" }}>
                    <div
                      style={{
                        padding: "10px 12px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "#FAFAFA",
                      }}
                    >
                      <span style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                        Action Description
                      </span>
                      <p style={{ margin: 0, color: "var(--color-text-main)", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                        {action.description}
                      </p>
                    </div>

                    <div
                      style={{
                        padding: "10px 12px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "#FAFAFA",
                      }}
                    >
                      <span style={{ display: "block", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--color-text-muted)", marginBottom: "4px" }}>
                        Result / Outcome
                      </span>
                      <p style={{ margin: 0, color: "var(--color-text-main)", whiteSpace: "pre-wrap", lineHeight: 1.4 }}>
                        {action.result}
                      </p>
                    </div>
                  </div>

                  {action.followUpRequired && action.followUpNote && (
                    <div style={{ marginTop: "12px", padding: "10px 12px", backgroundColor: "var(--color-warning-bg)", border: "1px solid var(--color-warning)", borderRadius: "var(--radius-sm)", fontSize: "12px" }}>
                      <span style={{ fontWeight: 600, color: "#744210" }}>Follow-Up Note:</span>{" "}
                      <span style={{ color: "#744210" }}>{action.followUpNote}</span>
                    </div>
                  )}

                  {action.isFollowedUp && action.followUpNote && (
                    <div style={{ marginTop: "12px", padding: "10px 12px", backgroundColor: "#E6FFFA", border: "1px solid #319795", borderRadius: "var(--radius-sm)", fontSize: "12px" }}>
                      <span style={{ fontWeight: 600, color: "#234E52" }}>Followed up:</span>{" "}
                      <span style={{ color: "#234E52" }}>{action.followUpNote}</span>
                    </div>
                  )}

                  {action.attachmentNotes && (
                    <div style={{ marginTop: "8px", fontSize: "12px", color: "var(--color-text-muted)" }}>
                      <span style={{ fontWeight: 600 }}>Attachment Notes:</span> {action.attachmentNotes}
                    </div>
                  )}
                </div>
              ))}

              {/* Single-Line Pagination Bar (Max 5 per page) */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--color-border)", marginTop: "4px" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    Page {currentPage} of {totalPages} ({actionsTaken.length} total)
                  </span>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      type="button"
                      className="tt-btn tt-btn-outline"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      style={{ height: "30px", padding: "0 10px", fontSize: "12px" }}
                    >
                      &larr; Previous
                    </button>
                    <button
                      type="button"
                      className="tt-btn tt-btn-outline"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      style={{ height: "30px", padding: "0 10px", fontSize: "12px" }}
                    >
                      Next &rarr;
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Add / Edit Action Taken Modal (Zen Green Design System) */}
      {showModal && (
        <div className="tt-modal-backdrop" onClick={handleCloseModal}>
          <div className="tt-modal" style={{ maxWidth: "540px" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>
                {editingAction ? "Edit Action Taken" : "Add Action Taken"}
              </h3>
              <button
                type="button"
                className="tt-btn tt-btn-outline"
                onClick={handleCloseModal}
                style={{ height: "30px", padding: "0 8px", fontSize: "12px" }}
              >
                ✕ Close
              </button>
            </div>

            {formError && (
              <div style={{ marginBottom: "16px", padding: "10px 14px", backgroundColor: "var(--color-error-bg)", border: "1px solid var(--color-error)", color: "var(--color-error)", borderRadius: "var(--radius-sm)", fontSize: "13px" }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="tt-form-group">
                <label className="tt-label">Action Date & Time</label>
                <input
                  type="datetime-local"
                  className="tt-input"
                  value={actionDate}
                  onChange={(e) => setActionDate(e.target.value)}
                />
              </div>

              <div className="tt-form-group">
                <label className="tt-label">
                  Action Description <span className="tt-required-asterisk">*</span>
                </label>
                <textarea
                  className="tt-textarea"
                  style={{ minHeight: "80px" }}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the action taken..."
                  required
                />
              </div>

              <div className="tt-form-group">
                <label className="tt-label">
                  Result / Outcome <span className="tt-required-asterisk">*</span>
                </label>
                <textarea
                  className="tt-textarea"
                  style={{ minHeight: "60px" }}
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                  placeholder="Describe the result or outcome of the action..."
                  required
                />
              </div>

              <div className="tt-form-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <input
                  type="checkbox"
                  id="followUpRequired"
                  checked={followUpRequired}
                  onChange={(e) => setFollowUpRequired(e.target.checked)}
                  style={{ width: "16px", height: "16px", cursor: "pointer" }}
                />
                <label htmlFor="followUpRequired" className="tt-label" style={{ margin: 0, cursor: "pointer" }}>
                  Follow-Up Required?
                </label>
              </div>

              {followUpRequired && (
                <div className="tt-form-group">
                  <label className="tt-label" style={{ color: "#744210" }}>
                    Follow-Up Note <span className="tt-required-asterisk">*</span>
                  </label>
                  <textarea
                    className="tt-textarea"
                    style={{ minHeight: "60px", backgroundColor: "var(--color-warning-bg)", borderColor: "var(--color-warning)" }}
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    placeholder="Specify what follow-up action is required..."
                    required={followUpRequired}
                  />
                </div>
              )}

              <div className="tt-form-group">
                <label className="tt-label">Attachment Notes (Optional)</label>
                <input
                  type="text"
                  className="tt-input"
                  value={attachmentNotes}
                  onChange={(e) => setAttachmentNotes(e.target.value)}
                  placeholder="Reference relevant attached filenames or images..."
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "20px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
                <button
                  type="button"
                  className="tt-btn tt-btn-outline"
                  onClick={handleCloseModal}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="tt-btn tt-btn-primary"
                  disabled={submitting}
                >
                  {submitting ? "Saving..." : editingAction ? "Update Action" : "Save Action"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Done Confirmation Modal Overlay */}
      {actionToMarkDone && (
        <div className="tt-modal-backdrop" data-testid="mark-done-confirmation-modal">
          <div className="tt-modal" style={{ maxWidth: "440px", width: "90%" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid var(--color-border)",
                paddingBottom: "12px",
                marginBottom: "16px",
              }}
            >
              <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--color-text-main)" }}>
                Confirm Follow-Up Completion
              </h3>
              <button
                type="button"
                onClick={() => setActionToMarkDone(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "20px",
                  cursor: "pointer",
                  color: "var(--color-text-muted)",
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "14px", color: "var(--color-text-main)", margin: "0 0 16px 0", lineHeight: 1.5 }}>
              Are you sure you want to mark this follow-up requirement as completed?
            </p>

            {actionToMarkDone.description && (
              <div
                style={{
                  padding: "10px 12px",
                  backgroundColor: "#FAFAFA",
                  border: "1px solid var(--color-border)",
                  borderRadius: "var(--radius-sm)",
                  marginBottom: "20px",
                  fontSize: "13px",
                  color: "var(--color-text-muted)",
                }}
              >
                <strong style={{ color: "var(--color-text-main)" }}>Action:</strong> {actionToMarkDone.description}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button
                type="button"
                className="tt-btn tt-btn-outline"
                onClick={() => setActionToMarkDone(null)}
                style={{ fontSize: "13px", height: "36px" }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tt-btn tt-btn-primary"
                onClick={confirmMarkDone}
                style={{ fontSize: "13px", height: "36px" }}
              >
                Confirm Mark Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
