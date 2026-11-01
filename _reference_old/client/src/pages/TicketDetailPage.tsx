import React, { useState, useEffect, useRef } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";
import { useAuth } from "../context/AuthContext";
import { ActionsTakenSection } from "../components/ActionsTakenSection";
import {
  getTicketDetail,
  addAttachmentToTicket,
  deleteAttachment,
  getAttachmentDownloadUrl,
  getAttachmentPreviewUrl,
  requestResolutionIndication,
  claimTicket,
  assignTicket,
  updateItPriority,
  updateTicketStatus,
  getPublicComments,
  postPublicComment,
  getInternalNotes,
  postInternalNote,
  getStaffUsers,
  TicketDetailData,
  AttachmentMeta,
  CommentItem,
  InternalNoteItem,
  UserOption,
} from "../api";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (BR-27)

export const TicketDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { selectedRequester } = useRequester();
  const { user } = useAuth();

  const isStaff = user?.role === "IT_STAFF" || user?.role === "ADMINISTRATOR";

  const [ticket, setTicket] = useState<TicketDetailData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorStatus, setErrorStatus] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Attachment Management States
  const [uploadingAttachment, setUploadingAttachment] = useState<boolean>(false);
  const [attachmentActionError, setAttachmentActionError] = useState<string | null>(null);

  // Modals & Actions
  const [previewAttachment, setPreviewAttachment] = useState<AttachmentMeta | null>(null);
  const [removingAttachment, setRemovingAttachment] = useState<AttachmentMeta | null>(null);
  const [removalReasonInput, setRemovalReasonInput] = useState<string>("");
  const [submittingRemoval, setSubmittingRemoval] = useState<boolean>(false);
  const [showResolveModal, setShowResolveModal] = useState<boolean>(false);
  const [submittingResolution, setSubmittingResolution] = useState<boolean>(false);

  // Staff Management States (F-08)
  const [staffUsers, setStaffUsers] = useState<UserOption[]>([]);
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [hasFollowUpRequired, setHasFollowUpRequired] = useState<boolean>(false);

  // Activity Feed States (F-08 & Lab 4 Sprint)
  const [activeTab, setActiveTab] = useState<"comments" | "notes">("comments");
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [notes, setNotes] = useState<InternalNoteItem[]>([]);
  const [commentInput, setCommentInput] = useState<string>("");
  const [noteInput, setNoteInput] = useState<string>("");
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [submittingNote, setSubmittingNote] = useState<boolean>(false);
  const [feedCollapsed, setFeedCollapsed] = useState<boolean>(false);
  const [commentsPage, setCommentsPage] = useState<number>(1);
  const [notesPage, setNotesPage] = useState<number>(1);
  const COMMENTS_PER_PAGE = 10;
  const NOTES_PER_PAGE = 10;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(
    (location.state as { toastMessage?: string })?.toastMessage || null
  );

  const currentRequesterId = selectedRequester?.id || user?.id;

  // Track initial requester ID to detect requester switches (BR-07)
  const initialRequesterIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (currentRequesterId && initialRequesterIdRef.current === null) {
      initialRequesterIdRef.current = currentRequesterId;
    }
  }, [currentRequesterId]);

  // BR-07: Redirect to /requester/tickets if requester context changes while on detail page
  useEffect(() => {
    if (!isStaff && selectedRequester && initialRequesterIdRef.current !== null && selectedRequester.id !== initialRequesterIdRef.current) {
      navigate("/requester/tickets");
    }
  }, [selectedRequester, navigate, isStaff]);

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

  const loadTicket = async () => {
    if (!id) return;

    if (!ticket) {
      setLoading(true);
    }
    setErrorStatus(null);
    setErrorMessage(null);

    try {
      const data = await getTicketDetail(id, currentRequesterId);
      setTicket(data);

      // Fetch public comments
      try {
        const comms = await getPublicComments(data.id);
        setComments(comms);
      } catch (e) {
        console.error("Error loading public comments:", e);
      }

      // If IT Staff or Admin, fetch internal notes & staff list
      if (isStaff) {
        try {
          const nts = await getInternalNotes(data.id);
          setNotes(nts);
        } catch (e) {
          console.error("Error loading internal notes:", e);
        }

        try {
          const staffList = await getStaffUsers();
          setStaffUsers(staffList);
        } catch (e) {
          console.error("Error loading staff users list:", e);
        }
      }
    } catch (err: any) {
      console.error("Error fetching ticket detail:", err);
      setErrorStatus(err.status || 500);
      setErrorMessage(err.message || "Unable to load ticket details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTicket();
  }, [id, selectedRequester, isStaff]);

  // Handle Staff Controls (F-08)
  const handleClaimTicket = async () => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const updated = await claimTicket(ticket.id);
      setTicket(updated);
      setToastMessage("Ticket claimed successfully.");
    } catch (err: any) {
      console.error("Error claiming ticket:", err);
      setAttachmentActionError(err.message || "Failed to claim ticket.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTicket = async (assignedToId: number | null) => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const updated = await assignTicket(ticket.id, assignedToId);
      setTicket(updated);
      setToastMessage("Assignee updated successfully.");
    } catch (err: any) {
      console.error("Error assigning ticket:", err);
      setAttachmentActionError(err.message || "Failed to update assignee.");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePriorityChange = async (itPriority: string | null) => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const updated = await updateItPriority(ticket.id, itPriority);
      setTicket(updated);
      setToastMessage("IT Priority updated successfully.");
    } catch (err: any) {
      console.error("Error updating IT priority:", err);
      setAttachmentActionError(err.message || "Failed to update IT priority.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!ticket) return;
    setActionLoading(true);
    try {
      const updated = await updateTicketStatus(ticket.id, status, ticket.updatedAt);
      setTicket(updated);
      setToastMessage(`Status updated to '${status}'.`);
    } catch (err: any) {
      console.error("Error updating status:", err);
      setAttachmentActionError(err.message || "Failed to update status.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Comment & Note Submissions (F-08)
  const handlePostComment = async () => {
    if (!ticket || !commentInput.trim()) return;
    setSubmittingComment(true);
    try {
      await postPublicComment(ticket.id, commentInput.trim());
      setCommentInput("");
      const updatedComments = await getPublicComments(ticket.id);
      setComments(updatedComments);
      setCommentsPage(1);
      setToastMessage("Comment posted.");
    } catch (err: any) {
      console.error("Error posting comment:", err);
      setAttachmentActionError(err.message || "Failed to post comment.");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handlePostNote = async () => {
    if (!ticket || !noteInput.trim()) return;
    setSubmittingNote(true);
    try {
      await postInternalNote(ticket.id, noteInput.trim());
      setNoteInput("");
      const updatedNotes = await getInternalNotes(ticket.id);
      setNotes(updatedNotes);
      setNotesPage(1);
      setToastMessage("Internal note added.");
    } catch (err: any) {
      console.error("Error posting note:", err);
      setAttachmentActionError(err.message || "Failed to post internal note.");
    } finally {
      setSubmittingNote(false);
    }
  };

  // Handle Add Attachment File Picker
  const handleAddAttachmentClick = () => {
    setAttachmentActionError(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !ticket) return;

    const file = files[0];
    e.target.value = ""; // reset file input

    // Pre-validation checks (AC-20, AC-21)
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setAttachmentActionError("Unsupported file type. Only JPG, PNG, WEBP, and PDF files are allowed.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setAttachmentActionError("File size exceeds the 5 MB limit.");
      return;
    }

    setUploadingAttachment(true);
    setAttachmentActionError(null);

    try {
      const reqId = selectedRequester?.id || user?.id || ticket.requesterId;
      await addAttachmentToTicket(ticket.id, reqId, file);
      // Reload ticket details to reflect new attachment
      const refreshed = await getTicketDetail(ticket.id, reqId);
      setTicket(refreshed);
    } catch (err: any) {
      console.error("Error uploading attachment:", err);
      if (err.status === 409) {
        setAttachmentActionError("This ticket already has the maximum of 5 active attachments.");
      } else {
        setAttachmentActionError(err.message || "Failed to upload attachment.");
      }
    } finally {
      setUploadingAttachment(false);
    }
  };

  // Handle Attachment Removal Submission
  const handleConfirmRemoval = async () => {
    if (!removingAttachment || !ticket) return;
    const trimmedReason = removalReasonInput.trim();
    if (!trimmedReason) return;

    setSubmittingRemoval(true);
    try {
      const reqId = selectedRequester?.id || user?.id || ticket.requesterId;
      await deleteAttachment(removingAttachment.id, reqId, trimmedReason);
      setRemovingAttachment(null);
      setRemovalReasonInput("");
      // Refresh ticket details
      const refreshed = await getTicketDetail(ticket.id, reqId);
      setTicket(refreshed);
    } catch (err: any) {
      console.error("Error removing attachment:", err);
      setAttachmentActionError(err.message || "Failed to remove attachment.");
      setRemovingAttachment(null);
    } finally {
      setSubmittingRemoval(false);
    }
  };

  const handleConfirmResolution = async () => {
    if (!ticket) return;
    setSubmittingResolution(true);
    try {
      const updated = await requestResolutionIndication(ticket.id);
      setTicket(updated);
      setShowResolveModal(false);
      setToastMessage("Resolution request submitted. IT support has been notified to verify.");
    } catch (err: any) {
      console.error("Error requesting resolution:", err);
      setAttachmentActionError(err.message || "Failed to submit resolution request.");
      setShowResolveModal(false);
    } finally {
      setSubmittingResolution(false);
    }
  };

  const activeAttachments = ticket?.attachments?.filter((a) => !a.isDeleted) || [];
  const deletedAttachments = ticket?.attachments?.filter((a) => a.isDeleted) || [];

  const formatPriorityText = (priority: string | null): string => {
    if (!priority) return "Unassigned";
    const up = priority.toUpperCase();
    if (up === "URGENT") return "Urgent";
    if (up === "HIGH") return "High";
    if (up === "MEDIUM") return "Medium";
    if (up === "LOW") return "Low";
    return priority;
  };

  const renderPriorityBadge = (priority: string | null, labelPrefix?: string) => {
    if (!priority || priority.toLowerCase() === "unassigned") {
      return (
        <span className="tt-badge" style={{ backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0" }}>
          {labelPrefix ? `${labelPrefix}: ` : ""}Unassigned
        </span>
      );
    }
    const up = priority.toUpperCase();
    let badgeClass = "tt-badge";
    if (up === "URGENT") badgeClass = "tt-badge tt-badge-urgent";
    else if (up === "HIGH") badgeClass = "tt-badge tt-badge-high";
    else if (up === "MEDIUM") badgeClass = "tt-badge tt-badge-medium";
    else if (up === "LOW") badgeClass = "tt-badge tt-badge-low";

    return (
      <span className={badgeClass}>
        {labelPrefix ? `${labelPrefix}: ` : ""}{formatPriorityText(priority)}
      </span>
    );
  };

  const renderStatusBadge = (status: string, isRequesterResolved?: boolean) => {
    const lower = status.toLowerCase();
    if (isRequesterResolved || lower === "pending verification") {
      return (
        <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E", fontWeight: 600 }}>
          Pending Verification
        </span>
      );
    }
    if (lower === "new") return <span className="tt-badge tt-badge-new">New</span>;
    if (lower === "open") return <span className="tt-badge" style={{ backgroundColor: "#EBF8FF", color: "#2B6CB0", border: "1px solid #63B3ED" }}>Open</span>;
    if (lower === "in progress") return <span className="tt-badge tt-badge-medium">In Progress</span>;
    if (lower === "waiting for requester") return <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E" }}>Waiting for Requester</span>;
    if (lower === "reopened") return <span className="tt-badge" style={{ backgroundColor: "#FEE2E2", color: "#991B1B", border: "1px solid #F87171" }}>Reopened</span>;
    if (lower === "resolved") {
      return (
        <span className="tt-badge" style={{ backgroundColor: "#E6FFFA", color: "#234E52", border: "1px solid #319795" }}>
          Resolved
        </span>
      );
    }
    if (lower === "closed") {
      return (
        <span className="tt-badge" style={{ backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0" }}>
          Closed
        </span>
      );
    }
    if (lower === "cancelled") {
      return (
        <span className="tt-badge" style={{ backgroundColor: "#E2E8F0", color: "#718096", border: "1px solid #A0AEC0" }}>
          Cancelled
        </span>
      );
    }
    return <span className="tt-badge">{status}</span>;
  };

  const formatDate = (dateStr: string): string => {
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

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", position: "relative" }}>
      {/* Hidden file input for adding attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,application/pdf"
        style={{ display: "none" }}
      />

      {/* Success Toast Notification */}
      {toastMessage && (
        <div className="tt-toast" role="status">
          <span>✅</span>
          <span>{toastMessage}</span>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            style={{
              background: "none",
              border: "none",
              color: "var(--color-primary-green)",
              fontWeight: "bold",
              cursor: "pointer",
              marginLeft: "12px",
              fontSize: "14px",
            }}
            title="Close notification"
          >
            ✕
          </button>
        </div>
      )}

      {/* Inline Preview Modal */}
      {previewAttachment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.65)",
            zIndex: 1100,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
          onClick={() => setPreviewAttachment(null)}
        >
          <div
            className="tt-card"
            style={{
              maxWidth: "800px",
              maxHeight: "85vh",
              width: "100%",
              overflow: "auto",
              position: "relative",
              display: "flex",
              flexDirection: "column",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0 }}>Preview: {previewAttachment.fileName}</h3>
              <button
                type="button"
                className="tt-btn tt-btn-outline"
                onClick={() => setPreviewAttachment(null)}
                style={{ padding: "4px 10px" }}
              >
                ✕ Close
              </button>
            </div>

            <div style={{ textAlign: "center", flex: 1, overflow: "auto" }}>
              {previewAttachment.contentType.includes("pdf") ? (
                <object
                  data={getAttachmentPreviewUrl(previewAttachment.id, selectedRequester?.id || user?.id)}
                  type="application/pdf"
                  width="100%"
                  height="500px"
                >
                  <p>PDF preview unavailable in this browser. Use download button instead.</p>
                </object>
              ) : (
                <img
                  src={getAttachmentPreviewUrl(previewAttachment.id, selectedRequester?.id || user?.id)}
                  alt={previewAttachment.fileName}
                  style={{ maxWidth: "100%", maxHeight: "550px", borderRadius: "var(--radius-sm)", objectFit: "contain" }}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Removal Reason Modal */}
      {removingAttachment && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            zIndex: 1100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div className="tt-card" style={{ maxWidth: "500px", width: "100%" }}>
            <h3 style={{ marginTop: 0, marginBottom: "8px" }}>Remove Attachment</h3>
            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "16px" }}>
              Are you sure you want to remove <strong>{removingAttachment.fileName}</strong>? Please enter a reason below.
            </p>

            <div className="tt-form-group">
              <label className="tt-label" htmlFor="removal-reason-input">
                Removal Reason <span className="tt-required-asterisk">*</span>
              </label>
              <textarea
                id="removal-reason-input"
                className="tt-textarea"
                placeholder="Enter reason for removing this attachment..."
                value={removalReasonInput}
                onChange={(e) => setRemovalReasonInput(e.target.value)}
                style={{ height: "80px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
              <button
                type="button"
                className="tt-btn tt-btn-outline"
                disabled={submittingRemoval}
                onClick={() => {
                  setRemovingAttachment(null);
                  setRemovalReasonInput("");
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="tt-btn tt-btn-primary"
                style={{ backgroundColor: "var(--color-error)", borderColor: "var(--color-error)" }}
                disabled={!removalReasonInput.trim() || submittingRemoval}
                onClick={handleConfirmRemoval}
              >
                {submittingRemoval ? "Removing..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ marginBottom: "16px" }}>
        <Link to={isStaff ? "/staff/queue" : "/tickets"} style={{ fontSize: "14px", textDecoration: "none" }}>
          &larr; {isStaff ? "Back to Staff Queue" : "Back to My Tickets"}
        </Link>
      </div>

      {loading ? (
        <div className="tt-card tt-empty-state">
          <div className="tt-spinner" />
          <p style={{ marginTop: "12px" }}>Loading ticket details...</p>
        </div>
      ) : errorStatus === 403 ? (
        /* 403 Forbidden State View */
        <div className="tt-card tt-empty-state" style={{ backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
          <h2 style={{ color: "var(--color-error)", marginBottom: "8px" }}>403 Access Denied</h2>
          <p style={{ color: "var(--color-text-main)", marginBottom: "20px" }}>
            {errorMessage || "You do not have permission to view this ticket as it belongs to another requester."}
          </p>
          <Link to="/tickets" className="tt-btn tt-btn-primary">
            Return to My Tickets
          </Link>
        </div>
      ) : errorStatus === 404 ? (
        /* 404 Not Found State View */
        <div className="tt-card tt-empty-state">
          <h2 style={{ marginBottom: "8px" }}>404 Ticket Not Found</h2>
          <p style={{ color: "var(--color-text-muted)", marginBottom: "20px" }}>
            {errorMessage || "The requested ticket could not be found."}
          </p>
          <Link to="/tickets" className="tt-btn tt-btn-primary">
            Return to My Tickets
          </Link>
        </div>
      ) : errorStatus ? (
        /* General API Error View */
        <div className="tt-card tt-empty-state" style={{ backgroundColor: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
          <h3 style={{ color: "var(--color-error)" }}>Unable to load ticket details</h3>
          <p>{errorMessage}</p>
          <Link to="/tickets" className="tt-btn tt-btn-outline" style={{ marginTop: "12px" }}>
            Return to My Tickets
          </Link>
        </div>
      ) : ticket ? (
        <div>
          {/* Header Row */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            <div>
              <h1 style={{ marginBottom: "6px" }}>Ticket #{ticket.ticketNumber}</h1>
              <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                {renderStatusBadge(ticket.currentStatus, ticket.isRequesterResolved)}
                {renderPriorityBadge(ticket.requestedPriority, "Req Priority")}
                {ticket.itPriority && renderPriorityBadge(ticket.itPriority, "IT Priority")}
                {hasFollowUpRequired && (
                  <span className="tt-badge" style={{ backgroundColor: "#FEFCBF", color: "#744210", border: "1px solid #D69E2E", fontWeight: 600 }}>
                    Follow-Up Required
                  </span>
                )}
                {ticket.assignedTo && (
                  <span className="tt-badge" style={{ backgroundColor: "#EDF2F7", color: "#2D3748", border: "1px solid #CBD5E0" }}>
                    👤 {ticket.assignedTo.name}
                  </span>
                )}
              </div>
            </div>

            {/* Resolution Indication Button for Ticket Owner (F-06) */}
            {ticket.requesterId === (user?.id || selectedRequester?.id) && (
              <div>
                {ticket.isRequesterResolved || ticket.currentStatus === "Pending Verification" ? (
                  <button
                    type="button"
                    className="tt-btn tt-btn-outline"
                    disabled
                    data-testid="resolution-requested-badge"
                    style={{ backgroundColor: "#F7FAFC", color: "#4A5568", borderColor: "#CBD5E0", cursor: "not-allowed" }}
                  >
                    Resolution Requested ✓
                  </button>
                ) : !["Closed", "Resolved", "Cancelled"].includes(ticket.currentStatus) && (
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary"
                    data-testid="request-resolution-button"
                    onClick={() => setShowResolveModal(true)}
                  >
                    I consider this issue resolved
                  </button>
                )}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: isStaff ? "1fr 320px" : "1fr", gap: "24px" }}>
            {/* Main Content Column */}
            <div>
              <div className="tt-card" style={{ marginBottom: "24px" }}>
                {/* 3 Read-Only Fields (Ticket Number, Requester Name, Requester ID) */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                  <div className="tt-form-group" style={{ marginBottom: 0 }}>
                    <label className="tt-label">Ticket #</label>
                    <input type="text" className="tt-input tt-readonly" readOnly value={ticket.ticketNumber} />
                  </div>
                  <div className="tt-form-group" style={{ marginBottom: 0 }}>
                    <label className="tt-label">Requester Name</label>
                    <input
                      type="text"
                      className="tt-input tt-readonly"
                      readOnly
                      value={ticket.requester?.name || selectedRequester?.name || "N/A"}
                    />
                  </div>
                  <div className="tt-form-group" style={{ marginBottom: 0 }}>
                    <label className="tt-label">Requester ID</label>
                    <input type="text" className="tt-input tt-readonly" readOnly value={String(ticket.requesterId)} />
                  </div>
                </div>

                {/* Category, Related System, and Priorities Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "16px", marginBottom: "20px" }}>
                  <div className="tt-form-group" style={{ marginBottom: 0 }}>
                    <label className="tt-label">Category</label>
                    <input type="text" className="tt-input tt-readonly" readOnly value={ticket.category.name} />
                  </div>
                  <div className="tt-form-group" style={{ marginBottom: 0 }}>
                    <label className="tt-label">Related System</label>
                    <input type="text" className="tt-input tt-readonly" readOnly value={ticket.relatedSystem.name} />
                  </div>
                  <div className="tt-form-group" style={{ marginBottom: 0 }}>
                    <label className="tt-label">Requested Priority</label>
                    <input
                      type="text"
                      className="tt-input tt-readonly"
                      readOnly
                      value={formatPriorityText(ticket.requestedPriority)}
                    />
                  </div>
                </div>

                {/* Summary */}
                <div className="tt-form-group">
                  <label className="tt-label">Summary</label>
                  <input type="text" className="tt-input tt-readonly" readOnly value={ticket.summary} />
                </div>

                {/* Description */}
                <div className="tt-form-group">
                  <label className="tt-label">Description</label>
                  <textarea className="tt-textarea tt-readonly" readOnly value={ticket.description} />
                </div>

                {/* Timestamps */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginTop: "16px", paddingTop: "16px", borderTop: "1px solid var(--color-border)" }}>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Submitted On:</span>
                    <p style={{ margin: "2px 0 0 0", fontWeight: 500 }}>{formatDate(ticket.createdAt)}</p>
                  </div>
                  <div>
                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Last Updated:</span>
                    <p style={{ margin: "2px 0 0 0", fontWeight: 500 }}>{formatDate(ticket.updatedAt)}</p>
                  </div>
                </div>

                {/* Attachment Management Section */}
                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                    <h3 style={{ fontSize: "16px", margin: 0 }}>
                      Attachments ({activeAttachments.length} / 5 active)
                    </h3>
                    <button
                      type="button"
                      className="tt-btn tt-btn-outline"
                      disabled={activeAttachments.length >= 5 || uploadingAttachment}
                      onClick={handleAddAttachmentClick}
                      style={{ fontSize: "13px", height: "34px" }}
                      title={activeAttachments.length >= 5 ? "Maximum of 5 active attachments reached" : "Upload new attachment"}
                    >
                      {uploadingAttachment ? "Uploading..." : "+ Add Attachment"}
                    </button>
                  </div>

                  {attachmentActionError && (
                    <div
                      style={{
                        backgroundColor: "var(--color-error-bg)",
                        border: "1px solid var(--color-error)",
                        color: "var(--color-error)",
                        padding: "8px 12px",
                        borderRadius: "var(--radius-sm)",
                        marginBottom: "12px",
                        fontSize: "13px",
                      }}
                    >
                      {attachmentActionError}
                    </div>
                  )}

                  {/* Active Attachments */}
                  {activeAttachments.length === 0 && deletedAttachments.length === 0 ? (
                    <p style={{ color: "var(--color-text-muted)", fontSize: "13px", margin: 0 }}>
                      No attachments uploaded for this ticket.
                    </p>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {activeAttachments.map((att) => (
                        <div
                          key={att.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            border: "1px solid var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "var(--color-surface)",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "18px" }}>{att.contentType.includes("pdf") ? "📄" : "🖼️"}</span>
                            <div>
                              <button
                                type="button"
                                onClick={() => setPreviewAttachment(att)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  padding: 0,
                                  margin: 0,
                                  fontWeight: 600,
                                  fontSize: "14px",
                                  color: "var(--color-primary-green)",
                                  textDecoration: "underline",
                                  cursor: "pointer",
                                  textAlign: "left",
                                }}
                                title="Click to preview attachment"
                              >
                                {att.fileName}
                              </button>
                              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                                {formatFileSize(att.fileSize)} · Uploaded {formatDate(att.createdAt)}
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <a
                              href={getAttachmentDownloadUrl(att.id, selectedRequester?.id || user?.id)}
                              download={att.fileName}
                              className="tt-btn tt-btn-outline"
                              style={{ fontSize: "12px", height: "30px", padding: "0 10px", textDecoration: "none" }}
                            >
                              Download
                            </a>
                            <button
                              type="button"
                              className="tt-btn tt-btn-outline"
                              onClick={() => {
                                setRemovingAttachment(att);
                                setRemovalReasonInput("");
                              }}
                              style={{
                                fontSize: "12px",
                                height: "30px",
                                padding: "0 10px",
                                borderColor: "var(--color-error)",
                                color: "var(--color-error)",
                              }}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}

                      {/* Soft-Removed Attachments */}
                      {deletedAttachments.map((att) => (
                        <div
                          key={att.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "10px 14px",
                            border: "1px dashed var(--color-border)",
                            borderRadius: "var(--radius-sm)",
                            backgroundColor: "#F7FAFC",
                            color: "var(--color-text-muted)",
                            opacity: 0.85,
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{ fontSize: "16px", color: "var(--color-error)" }} title="Attachment Removed">
                              ❌
                            </span>
                            <div>
                              <p style={{ margin: 0, fontWeight: 500, fontSize: "14px", textDecoration: "line-through", color: "var(--color-text-muted)" }}>
                                {att.fileName}
                              </p>
                              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                                {formatFileSize(att.fileSize)} · Removed {att.deletedAt ? formatDate(att.deletedAt) : ""}
                                {att.removalReason && (
                                  <span style={{ fontStyle: "italic", marginLeft: "6px" }}>
                                    — Reason: &quot;{att.removalReason}&quot;
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <span style={{ fontSize: "12px", fontStyle: "italic", color: "var(--color-text-muted)" }}>
                            [Removed]
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Taken Section (Lab 4 Sprint) */}
              <ActionsTakenSection
                ticketId={ticket.id}
                currentUserRole={user?.role || "REQUESTER"}
                ticketStatus={ticket.currentStatus}
                onActionsChange={(actions) => setHasFollowUpRequired(actions.some((a) => a.followUpRequired))}
              />

              {/* Activity Feed & Ticket Communication (F-08 & Lab 4 Sprint) */}
              <div className="tt-card">
                {/* Section Header matching Actions Taken design */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: feedCollapsed ? 0 : "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <button
                      type="button"
                      onClick={() => setFeedCollapsed(!feedCollapsed)}
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
                      title={feedCollapsed ? "Expand Comments" : "Collapse Comments"}
                    >
                      <span>{feedCollapsed ? "▶" : "▼"}</span>
                      <h3 style={{ margin: 0, fontSize: "16px", color: "var(--color-text-main)" }}>
                        {isStaff && activeTab === "notes" ? "Confidential Internal Notes" : "Comments"}
                      </h3>
                    </button>

                    {/* Plain Text Record Count (No Pill) matching Actions Taken */}
                    <span style={{ fontSize: "13px", color: "var(--color-text-muted)", fontWeight: 500 }}>
                      ({activeTab === "comments" ? comments.length : notes.length}{" "}
                      {activeTab === "comments"
                        ? comments.length === 1 ? "Comment" : "Comments"
                        : notes.length === 1 ? "Note" : "Notes"})
                    </span>
                  </div>
                </div>

                {/* Extra Control Strip for Staff/Admin to switch tabs — invisible to Requester */}
                {isStaff && !feedCollapsed && (
                  <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px", marginBottom: "16px" }}>
                    <button
                      type="button"
                      data-testid="comments-tab"
                      onClick={() => setActiveTab("comments")}
                      style={{
                        background: "none",
                        border: "none",
                        borderBottom: activeTab === "comments" ? "2px solid var(--color-primary-green)" : "2px solid transparent",
                        padding: "4px 8px",
                        fontWeight: activeTab === "comments" ? 700 : 500,
                        color: activeTab === "comments" ? "var(--color-primary-green)" : "var(--color-text-muted)",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      💬 Comments ({comments.length})
                    </button>

                    <button
                      type="button"
                      data-testid="notes-tab"
                      onClick={() => setActiveTab("notes")}
                      style={{
                        background: "none",
                        border: "none",
                        borderBottom: activeTab === "notes" ? "2px solid #D69E2E" : "2px solid transparent",
                        padding: "4px 8px",
                        fontWeight: activeTab === "notes" ? 700 : 500,
                        color: activeTab === "notes" ? "#744210" : "var(--color-text-muted)",
                        fontSize: "13px",
                        cursor: "pointer",
                      }}
                    >
                      🔒 Confidential Internal Notes ({notes.length})
                    </button>
                  </div>
                )}

                {!feedCollapsed && (
                  <>
                    {/* Comments Panel */}
                    {activeTab === "comments" && (
                      <div>
                        {/* Add Comment Form (Persistent ON TOP before list) */}
                        <div className="tt-form-group" style={{ marginBottom: "16px", backgroundColor: "#FAFAFA", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid var(--color-border)" }}>
                          <label className="tt-label" htmlFor="public-comment-input" style={{ fontSize: "13px", marginBottom: "6px" }}>
                            Add a Comment
                          </label>
                          <textarea
                            id="public-comment-input"
                            data-testid="comment-input"
                            className="tt-textarea"
                            placeholder="Write a comment..."
                            value={commentInput}
                            onChange={(e) => setCommentInput(e.target.value)}
                            style={{ height: "80px", marginBottom: "8px" }}
                          />
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              data-testid="post-comment-button"
                              className="tt-btn tt-btn-primary"
                              style={{ height: "34px", fontSize: "13px" }}
                              disabled={!commentInput.trim() || submittingComment}
                              onClick={handlePostComment}
                            >
                              {submittingComment ? "Posting..." : "Post Comment"}
                            </button>
                          </div>
                        </div>

                        {/* Paginated Comments Feed Sorted Descending (Newest First, Max 10 per page) */}
                        <div data-testid="comments-feed" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                          {!Array.isArray(comments) || comments.length === 0 ? (
                            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", fontStyle: "italic", margin: 0 }}>
                              No comments posted yet.
                            </p>
                          ) : (
                            [...comments]
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .slice((commentsPage - 1) * COMMENTS_PER_PAGE, commentsPage * COMMENTS_PER_PAGE)
                              .map((comm) => (
                                <div
                                  key={comm.id}
                                  style={{
                                    padding: "12px 16px",
                                    border: "1px solid var(--color-border)",
                                    borderRadius: "var(--radius-sm)",
                                    backgroundColor: "var(--color-surface)",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <span style={{ fontWeight: 600, fontSize: "14px" }}>
                                        {comm.author?.name || "Unknown Author"}
                                      </span>
                                      {comm.author?.role === "IT_STAFF" && (
                                        <span className="tt-badge" style={{ backgroundColor: "#EBF8FF", color: "#2B6CB0", border: "1px solid #63B3ED", fontSize: "11px", marginLeft: "6px", padding: "2px 6px" }}>
                                          IT Staff
                                        </span>
                                      )}
                                      {comm.author?.role === "ADMINISTRATOR" && (
                                        <span className="tt-badge" style={{ backgroundColor: "#FAF5FF", color: "#6B46C1", border: "1px solid #B794F4", fontSize: "11px", marginLeft: "6px", padding: "2px 6px" }}>
                                          Admin
                                        </span>
                                      )}
                                      {comm.author?.role === "REQUESTER" && (
                                        <span className="tt-badge" style={{ backgroundColor: "#EDF2F7", color: "#4A5568", border: "1px solid #CBD5E0", fontSize: "11px", marginLeft: "6px", padding: "2px 6px" }}>
                                          Requester
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{formatDate(comm.createdAt)}</span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: "14px", whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{comm.content}</p>
                                </div>
                              ))
                          )}
                        </div>

                        {/* Comments Pagination (Max 10 per page) */}
                        {Math.ceil(comments.length / COMMENTS_PER_PAGE) > 1 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
                            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                              Page {commentsPage} of {Math.ceil(comments.length / COMMENTS_PER_PAGE)} ({comments.length} total)
                            </span>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                className="tt-btn tt-btn-outline"
                                onClick={() => setCommentsPage((p) => Math.max(1, p - 1))}
                                disabled={commentsPage === 1}
                                style={{ height: "30px", padding: "0 10px", fontSize: "12px" }}
                              >
                                &larr; Previous
                              </button>
                              <button
                                type="button"
                                className="tt-btn tt-btn-outline"
                                onClick={() => setCommentsPage((p) => Math.min(Math.ceil(comments.length / COMMENTS_PER_PAGE), p + 1))}
                                disabled={commentsPage === Math.ceil(comments.length / COMMENTS_PER_PAGE)}
                                style={{ height: "30px", padding: "0 10px", fontSize: "12px" }}
                              >
                                Next &rarr;
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Confidential Internal Notes Tab Panel (Staff/Admin only) */}
                    {activeTab === "notes" && isStaff && (
                      <div>
                        <div
                          style={{
                            backgroundColor: "#FEFCBF",
                            border: "1px solid #D69E2E",
                            color: "#744210",
                            padding: "10px 14px",
                            borderRadius: "var(--radius-sm)",
                            fontSize: "13px",
                            marginBottom: "16px",
                          }}
                        >
                          🔒 <strong>Confidential Internal Notes</strong> — Visible strictly to IT Staff and Administrators. Requesters cannot view these notes.
                        </div>

                        {/* Add Internal Note Form (Persistent ON TOP before list) */}
                        <div className="tt-form-group" style={{ marginBottom: "16px", backgroundColor: "#FFFFF0", padding: "14px", borderRadius: "var(--radius-sm)", border: "1px solid #F6E05E" }}>
                          <label className="tt-label" htmlFor="internal-note-input" style={{ fontSize: "13px", marginBottom: "6px", color: "#744210" }}>
                            Add Confidential Internal Note
                          </label>
                          <textarea
                            id="internal-note-input"
                            data-testid="note-input"
                            className="tt-textarea"
                            placeholder="Write an internal note for staff members..."
                            value={noteInput}
                            onChange={(e) => setNoteInput(e.target.value)}
                            style={{ height: "80px", marginBottom: "8px", backgroundColor: "#FFFFFF" }}
                          />
                          <div style={{ display: "flex", justifyContent: "flex-end" }}>
                            <button
                              type="button"
                              data-testid="post-note-button"
                              className="tt-btn tt-btn-primary"
                              style={{ backgroundColor: "#D69E2E", borderColor: "#D69E2E", height: "34px", fontSize: "13px" }}
                              disabled={!noteInput.trim() || submittingNote}
                              onClick={handlePostNote}
                            >
                              {submittingNote ? "Saving..." : "Add Internal Note"}
                            </button>
                          </div>
                        </div>

                        {/* Paginated Notes Feed Sorted Descending (Newest First, Max 10 per page) */}
                        <div data-testid="notes-feed" style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
                          {!Array.isArray(notes) || notes.length === 0 ? (
                            <p style={{ color: "var(--color-text-muted)", fontSize: "14px", fontStyle: "italic", margin: 0 }}>
                              No confidential internal notes recorded yet.
                            </p>
                          ) : (
                            [...notes]
                              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                              .slice((notesPage - 1) * NOTES_PER_PAGE, notesPage * NOTES_PER_PAGE)
                              .map((n) => (
                                <div
                                  key={n.id}
                                  style={{
                                    padding: "12px 16px",
                                    border: "1px solid #F6E05E",
                                    borderRadius: "var(--radius-sm)",
                                    backgroundColor: "#FFFFF0",
                                  }}
                                >
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                    <div style={{ display: "flex", alignItems: "center" }}>
                                      <span style={{ fontWeight: 600, fontSize: "14px", color: "#744210" }}>
                                        👤 {n.author?.name || "Staff Member"}
                                      </span>
                                      {n.author?.role === "IT_STAFF" && (
                                        <span className="tt-badge" style={{ backgroundColor: "#EBF8FF", color: "#2B6CB0", border: "1px solid #63B3ED", fontSize: "11px", marginLeft: "6px", padding: "2px 6px" }}>
                                          IT Staff
                                        </span>
                                      )}
                                      {n.author?.role === "ADMINISTRATOR" && (
                                        <span className="tt-badge" style={{ backgroundColor: "#FAF5FF", color: "#6B46C1", border: "1px solid #B794F4", fontSize: "11px", marginLeft: "6px", padding: "2px 6px" }}>
                                          Admin
                                        </span>
                                      )}
                                    </div>
                                    <span style={{ fontSize: "12px", color: "#975A16" }}>{formatDate(n.createdAt)}</span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: "14px", whiteSpace: "pre-wrap", color: "#2D3748", lineHeight: 1.5 }}>{n.content}</p>
                                </div>
                              ))
                          )}
                        </div>

                        {/* Notes Pagination (Max 10 per page) */}
                        {Math.ceil(notes.length / NOTES_PER_PAGE) > 1 && (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--color-border)" }}>
                            <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                              Page {notesPage} of {Math.ceil(notes.length / NOTES_PER_PAGE)} ({notes.length} total)
                            </span>
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                type="button"
                                className="tt-btn tt-btn-outline"
                                onClick={() => setNotesPage((p) => Math.max(1, p - 1))}
                                disabled={notesPage === 1}
                                style={{ height: "30px", padding: "0 10px", fontSize: "12px" }}
                              >
                                &larr; Previous
                              </button>
                              <button
                                type="button"
                                className="tt-btn tt-btn-outline"
                                onClick={() => setNotesPage((p) => Math.min(Math.ceil(notes.length / NOTES_PER_PAGE), p + 1))}
                                disabled={notesPage === Math.ceil(notes.length / NOTES_PER_PAGE)}
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
              </div>
            </div>

            {/* Sidebar Column: IT Staff Controls (F-08) */}
            {isStaff && (
              <div>
                <div className="tt-card" style={{ position: "sticky", top: "20px" }}>
                  <h3 style={{ marginTop: 0, marginBottom: "16px", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
                    🛠️ IT Staff Controls
                  </h3>

                  {/* Claim Button */}
                  <div style={{ marginBottom: "20px" }}>
                    {(() => {
                      const currentAssignedId = ticket.assignedToId || ticket.assignedTo?.id || null;
                      const isClaimedByMe = currentAssignedId === user?.id;
                      return (
                        <button
                          type="button"
                          data-testid="claim-ticket-button"
                          className="tt-btn tt-btn-primary"
                          style={{ width: "100%", justifyContent: "center" }}
                          disabled={actionLoading || isClaimedByMe}
                          onClick={handleClaimTicket}
                        >
                          {isClaimedByMe ? "✓ Claimed by You" : "Claim Ticket (Assign to Me)"}
                        </button>
                      );
                    })()}
                  </div>

                  {/* Assignee Selection */}
                  <div className="tt-form-group">
                    <label className="tt-label" htmlFor="assignee-select">
                      Assigned IT Staff
                    </label>
                    <select
                      id="assignee-select"
                      data-testid="assignee-select"
                      className="tt-select"
                      value={ticket.assignedToId || ticket.assignedTo?.id || ""}
                      disabled={actionLoading}
                      onChange={(e) => handleAssignTicket(e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Unassigned</option>
                      {(() => {
                        const optionsMap = new Map<number, { id: number; name: string; email?: string; role: string }>();

                        // Active IT Staff
                        staffUsers.forEach((u) => {
                          if (u.role === "IT_STAFF" && u.isActive) {
                            optionsMap.set(u.id, { id: u.id, name: u.name, email: u.email, role: u.role });
                          }
                        });

                        // Logged-in Admin user can assign to self
                        if (user?.role === "ADMINISTRATOR") {
                          optionsMap.set(user.id, { id: user.id, name: user.name, email: user.email, role: user.role });
                        }

                        // Currently assigned user (even if Admin) so dropdown shows assigned user properly
                        if (ticket.assignedTo) {
                          const existing = optionsMap.get(ticket.assignedTo.id);
                          const assignedRole = (ticket.assignedTo as any).role || existing?.role || "IT_STAFF";
                          if (assignedRole === "IT_STAFF" || assignedRole === "ADMINISTRATOR") {
                            optionsMap.set(ticket.assignedTo.id, {
                              id: ticket.assignedTo.id,
                              name: ticket.assignedTo.name,
                              email: (ticket.assignedTo as any).email || existing?.email,
                              role: assignedRole,
                            });
                          }
                        }

                        // Check for duplicate names to disambiguate if needed
                        const nameCounts = new Map<string, number>();
                        optionsMap.forEach((val) => {
                          nameCounts.set(val.name, (nameCounts.get(val.name) || 0) + 1);
                        });

                        return Array.from(optionsMap.values()).map((u) => {
                          const hasDuplicateName = (nameCounts.get(u.name) || 0) > 1;
                          const label = `${u.name}${hasDuplicateName && u.email ? ` (${u.email})` : ""}${u.role === "ADMINISTRATOR" ? " (Admin)" : ""}`;
                          return (
                            <option key={u.id} value={u.id}>
                              {label}
                            </option>
                          );
                        });
                      })()}
                    </select>
                  </div>

                  {/* IT Priority Selector */}
                  <div className="tt-form-group">
                    <label className="tt-label" htmlFor="it-priority-select">
                      IT Priority
                    </label>
                    <select
                      id="it-priority-select"
                      data-testid="it-priority-select"
                      className="tt-select"
                      value={ticket.itPriority || ""}
                      disabled={actionLoading}
                      onChange={(e) => handlePriorityChange(e.target.value || null)}
                    >
                      <option value="">Unassigned</option>
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Status Transition Dropdown */}
                  <div className="tt-form-group">
                    <label className="tt-label" htmlFor="status-select">
                      Ticket Status
                    </label>
                    <select
                      id="status-select"
                      data-testid="status-select"
                      className="tt-select"
                      value={ticket.currentStatus}
                      disabled={actionLoading || ticket.currentStatus === "Cancelled"}
                      onChange={(e) => handleStatusChange(e.target.value)}
                    >
                      {(() => {
                        const PERMITTED_MAP: Record<string, string[]> = {
                          New: ["Open", "In Progress", "Cancelled"],
                          Open: ["In Progress", "Waiting for Requester", "Pending Verification", "Resolved", "Cancelled"],
                          "In Progress": ["Waiting for Requester", "Pending Verification", "Resolved", "Cancelled"],
                          "Waiting for Requester": ["In Progress", "Pending Verification", "Resolved", "Cancelled"],
                          "Pending Verification": ["Resolved", "Closed", "In Progress", "Open"],
                          Resolved: ["Closed", "Reopened"],
                          Closed: ["Reopened"],
                          Reopened: ["In Progress", "Pending Verification", "Resolved", "Cancelled"],
                          Cancelled: [],
                        };
                        const nextAllowed = PERMITTED_MAP[ticket.currentStatus] || [];
                        const allOptions = Array.from(new Set([ticket.currentStatus, ...nextAllowed]));
                        return allOptions.map((s) => (
                          <option key={s} value={s}>
                            {s} {s === ticket.currentStatus ? "(Current)" : ""}
                          </option>
                        ));
                      })()}
                    </select>
                  </div>

                  {/* Pending Verification Banner & Actions */}
                  {(ticket.currentStatus === "Pending Verification" || ticket.isRequesterResolved) && (
                    <div
                      style={{
                        marginTop: "20px",
                        padding: "14px",
                        backgroundColor: "#FEFCBF",
                        border: "1px solid #D69E2E",
                        borderRadius: "var(--radius-sm)",
                      }}
                    >
                      <h4 style={{ margin: "0 0 8px 0", color: "#744210", fontSize: "14px" }}>
                        ⚠️ Pending Verification
                      </h4>
                      <p style={{ margin: "0 0 12px 0", fontSize: "12px", color: "#744210", lineHeight: 1.4 }}>
                        Requester has indicated that the issue is resolved. Please verify the fix.
                      </p>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <button
                          type="button"
                          data-testid="confirm-verification-button"
                          className="tt-btn tt-btn-primary"
                          style={{ fontSize: "13px", justifyContent: "center" }}
                          disabled={actionLoading}
                          onClick={() => handleStatusChange("Resolved")}
                        >
                          Confirm & Mark Resolved
                        </button>
                        <button
                          type="button"
                          data-testid="revert-verification-button"
                          className="tt-btn tt-btn-outline"
                          style={{ fontSize: "13px", justifyContent: "center", borderColor: "#D69E2E", color: "#744210" }}
                          disabled={actionLoading}
                          onClick={() => handleStatusChange("In Progress")}
                        >
                          Revert to In Progress
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Resolution Indication Confirmation Modal */}
          {showResolveModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                zIndex: 1100,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "20px",
              }}
              data-testid="resolution-confirmation-modal"
            >
              <div className="tt-card" style={{ maxWidth: "460px", width: "100%", margin: 0 }}>
                <h3 style={{ marginTop: 0, marginBottom: "10px" }}>Request Ticket Resolution</h3>
                <p style={{ color: "var(--color-text-muted)", fontSize: "14px", marginBottom: "20px", lineHeight: "1.5" }}>
                  Are you sure you consider this issue resolved? Your IT support team will be notified to verify and close the ticket.
                </p>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                  <button
                    type="button"
                    className="tt-btn tt-btn-outline"
                    data-testid="cancel-resolution-button"
                    onClick={() => setShowResolveModal(false)}
                    disabled={submittingResolution}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className="tt-btn tt-btn-primary"
                    data-testid="confirm-resolution-button"
                    onClick={handleConfirmResolution}
                    disabled={submittingResolution}
                  >
                    {submittingResolution ? "Submitting..." : "Yes, Mark as Resolved"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default TicketDetailPage;
