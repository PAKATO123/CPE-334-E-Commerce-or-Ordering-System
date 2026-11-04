import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRequester } from "../context/RequesterContext";
import { useAuth } from "../context/AuthContext";
import { getRequesters } from "../api";
import { Requester } from "../types/requester";

export const RequesterSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedRequester, setSelectedRequester } = useRequester();
  const { user } = useAuth();

  const [requesters, setRequesters] = useState<Requester[]>([]);
  const [selectedId, setSelectedId] = useState<string>(
    selectedRequester ? String(selectedRequester.id) : ""
  );
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.role === "ADMINISTRATOR") {
        navigate("/admin/dashboard", { replace: true });
      } else if (user.role === "IT_STAFF") {
        navigate("/staff/dashboard", { replace: true });
      } else {
        navigate("/requester/dashboard", { replace: true });
      }
      return;
    }

    let isMounted = true;

    async function fetchRequesters() {
      setLoading(true);
      setError(null);
      try {
        const data = await getRequesters();
        if (isMounted) {
          setRequesters(data);
        }
      } catch (err: any) {
        if (isMounted) {
          console.error("Error loading requesters:", err);
          setError("Unable to load Development Requesters.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    fetchRequesters();

    return () => {
      isMounted = false;
    };
  }, [user, navigate]);

  const handleContinue = () => {
    if (!selectedId) return;
    const chosen = requesters.find((r) => String(r.id) === selectedId);
    if (chosen) {
      setSelectedRequester(chosen);
      navigate("/tickets");
    }
  };

  return (
    <div className="tt-card" style={{ maxWidth: "600px", margin: "40px auto" }}>
      <h1>Select Development Requester</h1>
      <p style={{ color: "var(--color-text-muted)", marginBottom: "24px" }}>
        Select a Development Requester to test requester-specific ticket behavior.
        This is not a login screen. Authentication and role-based access will be introduced in Lab 3.
      </p>

      {loading && (
        <div style={{ textAlign: "center", padding: "32px 0" }}>
          <div className="tt-spinner" title="Loading requesters"></div>
          <p style={{ color: "var(--color-text-muted)", marginTop: "12px" }}>Loading Requesters...</p>
        </div>
      )}

      {error && !loading && (
        <div
          className="tt-card"
          style={{
            borderColor: "var(--color-error)",
            backgroundColor: "var(--color-error-bg)",
            color: "var(--color-error)",
            marginBottom: "20px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {!loading && !error && requesters.length === 0 && (
        <div className="tt-empty-state" style={{ padding: "20px 0" }}>
          <p>No active Development Requesters found.</p>
        </div>
      )}

      {!loading && !error && requesters.length > 0 && (
        <div className="tt-form-group">
          <label className="tt-label" htmlFor="requester-select">
            Development Requester <span className="tt-required-asterisk">*</span>
          </label>
          <select
            id="requester-select"
            className="tt-select"
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
          >
            <option value="" disabled>-- Select Requester --</option>
            {requesters.map((req) => (
              <option key={req.id} value={req.id}>
                {req.name} {req.department ? `(${req.department})` : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="button"
        className="tt-btn tt-btn-primary"
        style={{ width: "100%", marginTop: "16px" }}
        disabled={loading || !!error || requesters.length === 0 || !selectedId}
        onClick={handleContinue}
      >
        Continue
      </button>
    </div>
  );
};

export default RequesterSelectorPage;
