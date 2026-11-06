import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";
import { useAuth } from "../context/AuthContext";
import { getCategories, getRelatedSystems, getNextTicketNumber, Category, RelatedSystem, API_BASE_URL } from "../api";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB (BR-27)
const MAX_FILES_COUNT = 5;

export const CreateTicketPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedRequester, setIsFormDirty } = useRequester();
  const { user } = useAuth();

  // Redirect IT staff / admin to staff queue
  useEffect(() => {
    if (user && (user.role === "IT_STAFF" || user.role === "ADMINISTRATOR")) {
      navigate("/staff/queue", { replace: true });
    }
  }, [user, navigate]);

  const [categories, setCategories] = useState<Category[]>([]);
  const [relatedSystems, setRelatedSystems] = useState<RelatedSystem[]>([]);
  const [previewTicketNumber, setPreviewTicketNumber] = useState<string>("TICK-2026-XXXX");
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  // Form Fields
  const [categoryId, setCategoryId] = useState<string>("");
  const [relatedSystemId, setRelatedSystemId] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [requestedPriority, setRequestedPriority] = useState<string>("");
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);

  // Submission & Validation States
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);

  // Fetch Category & System options and Next Ticket Number on mount
  useEffect(() => {
    let isMounted = true;
    async function loadOptions() {
      setLoadingData(true);
      setDataError(null);
      try {
        const [cats, syss, nextNum] = await Promise.all([
          getCategories(),
          getRelatedSystems(),
          getNextTicketNumber(),
        ]);
        if (isMounted) {
          setCategories(cats);
          setRelatedSystems(syss);
          setPreviewTicketNumber(nextNum);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error loading form reference data:", err);
          setDataError("Unable to load form options. Please refresh the page.");
        }
      } finally {
        if (isMounted) {
          setLoadingData(false);
        }
      }
    }
    loadOptions();
  }, []);

  // Track dirty form state for route & requester switch guards (BR-08, AD-02)
  useEffect(() => {
    const isDirty = Boolean(
      categoryId || relatedSystemId || summary.trim() || description.trim() || requestedPriority || stagedFiles.length > 0
    );
    setIsFormDirty(isDirty);

    return () => {
      setIsFormDirty(false);
    };
  }, [categoryId, relatedSystemId, summary, description, requestedPriority, stagedFiles, setIsFormDirty]);

  // Handle client-side file attachment selection & validation
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray = Array.from(e.target.files);
    const newStagedFiles = [...stagedFiles];

    for (const file of filesArray) {
      if (newStagedFiles.length >= MAX_FILES_COUNT) {
        setFileError(`Maximum ${MAX_FILES_COUNT} attachments allowed per ticket.`);
        break;
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setFileError(`File "${file.name}" has an unsupported format. Allowed formats: JPG, PNG, WEBP, PDF.`);
        continue;
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        setFileError(`File "${file.name}" exceeds the 5 MB size limit.`);
        continue;
      }

      // Check duplicate
      if (!newStagedFiles.some((f) => f.name === file.name && f.size === file.size)) {
        newStagedFiles.push(file);
      }
    }

    setStagedFiles(newStagedFiles);
    // Reset file input value to allow re-selecting same file if deleted
    e.target.value = "";
  };

  const handleRemoveFile = (index: number) => {
    setStagedFiles((prev) => prev.filter((_, i) => i !== index));
    setFileError(null);
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!categoryId) {
      errors.categoryId = "Category is required.";
    }
    if (!relatedSystemId) {
      errors.relatedSystemId = "Related System is required.";
    }

    const trimmedSummary = summary.trim();
    if (!trimmedSummary) {
      errors.summary = "Summary is required.";
    } else if (trimmedSummary.length > 255) {
      errors.summary = "Summary cannot exceed 255 characters.";
    }

    const trimmedDesc = description.trim();
    if (!trimmedDesc) {
      errors.description = "Description is required.";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setFileError(null);

    const currentRequesterId = selectedRequester?.id || user?.id;
    if (!currentRequesterId) {
      setSubmitError("Please sign in to submit a ticket.");
      return;
    }

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("requesterId", String(currentRequesterId));
      formData.append("categoryId", categoryId);
      formData.append("relatedSystemId", relatedSystemId);
      formData.append("summary", summary.trim());
      formData.append("description", description.trim());
      if (requestedPriority) {
        formData.append("requestedPriority", requestedPriority);
      }

      stagedFiles.forEach((file) => {
        formData.append("attachments", file);
      });

      const response = await fetch(`${API_BASE_URL}/api/tickets`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const json = await response.json();

      if (!response.ok) {
        if (response.status === 422 && json.error?.details) {
          const apiErrors: Record<string, string> = {};
          json.error.details.forEach((d: { field: string; message: string }) => {
            apiErrors[d.field] = d.message;
          });
          setFieldErrors(apiErrors);
          setSubmitError(json.error.message || "Please fix validation errors below.");
        } else if (response.status === 429) {
          setSubmitError("You are submitting tickets too quickly. Please wait before trying again.");
          startCooldown(15);
        } else {
          setSubmitError(json.error?.message || "Failed to create ticket. Please try again.");
        }
        return;
      }

      // Success (201 Created)
      setIsFormDirty(false);
      const createdTicket = json.data;

      // Navigate to ticket detail page with success toast state
      navigate(`/tickets/${createdTicket.id}`, {
        state: {
          toastMessage: `Ticket #${createdTicket.ticketNumber} created successfully!`,
        },
      });
    } catch (err: any) {
      console.error("Submission error:", err);
      setSubmitError("Unable to connect to server. Please check your network and try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const startCooldown = (seconds: number) => {
    setCooldownSeconds(seconds);
    const interval = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "16px" }}>
        <Link to="/tickets" style={{ fontSize: "14px", textDecoration: "none" }}>
          &larr; Back to My Tickets
        </Link>
      </div>

      <h1>Create New Ticket</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
        Submit a new IT support request. Required fields are marked with an asterisk (<span className="tt-required-asterisk">*</span>).
      </p>

      {dataError && (
        <div
          style={{
            backgroundColor: "var(--color-error-bg)",
            border: "1px solid var(--color-error)",
            color: "var(--color-error)",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            marginBottom: "20px",
          }}
        >
          {dataError}
        </div>
      )}

      {submitError && (
        <div
          style={{
            backgroundColor: "var(--color-error-bg)",
            border: "1px solid var(--color-error)",
            color: "var(--color-error)",
            padding: "12px 16px",
            borderRadius: "var(--radius-md)",
            marginBottom: "20px",
          }}
        >
          {submitError}
        </div>
      )}

      <div className="tt-card">
        {loadingData ? (
          <div className="tt-empty-state">
            <div className="tt-spinner" />
            <p style={{ marginTop: "12px" }}>Loading form options...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            {/* 3 Read-Only Fields (Ticket Number, Requester Name, Requester ID) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              <div className="tt-form-group" style={{ marginBottom: 0 }}>
                <label className="tt-label" htmlFor="ticket-number-readonly">To-Be-Created Ticket #</label>
                <input
                  id="ticket-number-readonly"
                  type="text"
                  className="tt-input tt-readonly"
                  readOnly
                  value={previewTicketNumber}
                />
              </div>
              <div className="tt-form-group" style={{ marginBottom: 0 }}>
                <label className="tt-label" htmlFor="requester-name-readonly">Requester Name</label>
                <input
                  id="requester-name-readonly"
                  type="text"
                  className="tt-input tt-readonly"
                  readOnly
                  value={selectedRequester?.name || "N/A"}
                />
              </div>
              <div className="tt-form-group" style={{ marginBottom: 0 }}>
                <label className="tt-label" htmlFor="requester-id-readonly">Requester ID</label>
                <input
                  id="requester-id-readonly"
                  type="text"
                  className="tt-input tt-readonly"
                  readOnly
                  value={selectedRequester?.id ? String(selectedRequester.id) : "N/A"}
                />
              </div>
            </div>

            {/* Category, Related System, and Requested Priority (3 fields in one line above Summary) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginBottom: "20px" }}>
              {/* Category */}
              <div className="tt-form-group" style={{ marginBottom: 0 }}>
                <label className="tt-label" htmlFor="category-select">
                  Category <span className="tt-required-asterisk">*</span>
                </label>
                <select
                  id="category-select"
                  className="tt-select"
                  value={categoryId}
                  onChange={(e) => {
                    setCategoryId(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, categoryId: "" }));
                  }}
                  style={fieldErrors.categoryId ? { borderColor: "var(--color-error)", backgroundColor: "var(--color-error-bg)" } : {}}
                >
                  <option value="">-- Select Category --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.categoryId && <span className="tt-error-message">{fieldErrors.categoryId}</span>}
              </div>

              {/* Related System */}
              <div className="tt-form-group" style={{ marginBottom: 0 }}>
                <label className="tt-label" htmlFor="system-select">
                  Related System <span className="tt-required-asterisk">*</span>
                </label>
                <select
                  id="system-select"
                  className="tt-select"
                  value={relatedSystemId}
                  onChange={(e) => {
                    setRelatedSystemId(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, relatedSystemId: "" }));
                  }}
                  style={fieldErrors.relatedSystemId ? { borderColor: "var(--color-error)", backgroundColor: "var(--color-error-bg)" } : {}}
                >
                  <option value="">-- Select Related System --</option>
                  {relatedSystems.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                {fieldErrors.relatedSystemId && <span className="tt-error-message">{fieldErrors.relatedSystemId}</span>}
              </div>

              {/* Requested Priority */}
              <div className="tt-form-group" style={{ marginBottom: 0 }}>
                <label className="tt-label" htmlFor="priority-select">
                  Requested Priority
                </label>
                <select
                  id="priority-select"
                  className="tt-select"
                  value={requestedPriority}
                  onChange={(e) => setRequestedPriority(e.target.value)}
                >
                  <option value="">-- Optional (Omitted) --</option>
                  <option value="URGENT">Urgent</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </select>
              </div>
            </div>

            {/* Summary */}
            <div className="tt-form-group">
              <label className="tt-label" htmlFor="summary-input">
                Summary <span className="tt-required-asterisk">*</span>
              </label>
              <input
                id="summary-input"
                type="text"
                className="tt-input"
                placeholder="Brief summary of the issue (max 255 characters)"
                value={summary}
                maxLength={255}
                onChange={(e) => {
                  setSummary(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, summary: "" }));
                }}
                style={fieldErrors.summary ? { borderColor: "var(--color-error)", backgroundColor: "var(--color-error-bg)" } : {}}
              />
              {fieldErrors.summary && <span className="tt-error-message">{fieldErrors.summary}</span>}
            </div>

            {/* Description */}
            <div className="tt-form-group">
              <label className="tt-label" htmlFor="description-input">
                Description <span className="tt-required-asterisk">*</span>
              </label>
              <textarea
                id="description-input"
                className="tt-textarea"
                placeholder="Full detailed explanation of the request"
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, description: "" }));
                }}
                style={fieldErrors.description ? { borderColor: "var(--color-error)", backgroundColor: "var(--color-error-bg)" } : {}}
              />
              {fieldErrors.description && <span className="tt-error-message">{fieldErrors.description}</span>}
            </div>

            {/* Attachments Section */}
            <div className="tt-form-group" style={{ marginTop: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label className="tt-label" style={{ marginBottom: 0 }}>
                  Attachments <span style={{ fontWeight: "normal", color: "var(--color-text-muted)" }}>(Optional)</span>
                </label>
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                  {stagedFiles.length} / {MAX_FILES_COUNT} files
                </span>
              </div>

              <p style={{ fontSize: "12px", color: "var(--color-text-muted)", marginTop: 0, marginBottom: "12px" }}>
                Allowed formats: JPG, PNG, WEBP, PDF (Max 5 MB per file).
              </p>

              {fileError && (
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
                  {fileError}
                </div>
              )}

              {/* File picker button */}
              <input
                id="attachment-file-input"
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,application/pdf"
                onChange={handleFileSelect}
                style={{ display: "none" }}
                disabled={stagedFiles.length >= MAX_FILES_COUNT}
              />

              <label
                htmlFor="attachment-file-input"
                className="tt-btn tt-btn-outline"
                style={{
                  cursor: stagedFiles.length >= MAX_FILES_COUNT ? "not-allowed" : "pointer",
                  opacity: stagedFiles.length >= MAX_FILES_COUNT ? 0.6 : 1,
                  display: "inline-flex",
                  marginBottom: "16px",
                }}
              >
                📎 Add Attachments...
              </label>

              {/* Staged files list */}
              {stagedFiles.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {stagedFiles.map((file, idx) => (
                    <div
                      key={`${file.name}-${idx}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        border: "1px solid var(--color-border)",
                        borderRadius: "var(--radius-sm)",
                        backgroundColor: "var(--color-pale-green)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", overflow: "hidden" }}>
                        <span style={{ fontSize: "16px" }}>
                          {file.type.includes("pdf") ? "📄" : "🖼️"}
                        </span>
                        <span
                          style={{
                            fontWeight: 500,
                            fontSize: "13px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            maxWidth: "300px",
                          }}
                        >
                          {file.name}
                        </span>
                        <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                          ({formatFileSize(file.size)})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveFile(idx)}
                        style={{
                          background: "none",
                          border: "none",
                          color: "var(--color-error)",
                          fontWeight: "bold",
                          cursor: "pointer",
                          fontSize: "14px",
                          padding: "2px 6px",
                        }}
                        title="Remove attachment"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Buttons */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "32px" }}>
              <Link to="/tickets" className="tt-btn tt-btn-outline">
                Cancel
              </Link>

              <button
                type="submit"
                className="tt-btn tt-btn-primary"
                disabled={submitting || cooldownSeconds > 0}
              >
                {submitting ? (
                  <>
                    <span className="tt-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />
                    Submitting...
                  </>
                ) : cooldownSeconds > 0 ? (
                  `Please wait (${cooldownSeconds}s)`
                ) : (
                  "Submit Ticket"
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default CreateTicketPage;
