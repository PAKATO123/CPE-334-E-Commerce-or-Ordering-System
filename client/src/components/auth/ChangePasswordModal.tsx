import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export interface ChangePasswordModalProps {
  onSuccess?: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { user, changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Real-time password complexity validation checks
  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const isConfirmMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const isComplexityValid = hasMinLength && hasUpper && hasLower && hasDigit;
  const isFormValid = currentPassword.length > 0 && isComplexityValid && isConfirmMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    setError(null);
    setIsSubmitting(true);
    try {
      await changePassword({ currentPassword, newPassword });
      if (onSuccess) onSuccess();
      window.location.reload();
    } catch (err: any) {
      setError(err.message || "Current password is incorrect or new password does not meet requirements.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.75)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 2000,
      }}
      data-testid="change-password-modal"
    >
      <div
        className="tt-card"
        style={{
          maxWidth: "480px",
          width: "90%",
          backgroundColor: "#ffffff",
          borderRadius: "8px",
          padding: "24px",
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "28px" }}>🔒</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "18px" }}>Mandatory Password Change Required</h3>
            <p style={{ margin: 0, color: "var(--color-text-muted)", fontSize: "13px" }}>
              First-time login or administrative policy requires password update before proceeding.
            </p>
          </div>
        </div>

        {error && (
          <div
            className="tt-alert tt-alert-error"
            data-testid="error-alert"
            style={{
              padding: "10px 14px",
              borderRadius: "6px",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #f87171",
              marginBottom: "16px",
              fontSize: "13px",
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 600 }}>
              Current Password
            </label>
            <input
              type="password"
              className="tt-input"
              data-testid="current-password-input"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              required
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ marginBottom: "14px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 600 }}>
              New Password
            </label>
            <input
              type="password"
              className="tt-input"
              data-testid="new-password-input"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New strong password"
              required
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "13px", fontWeight: 600 }}>
              Confirm New Password
            </label>
            <input
              type="password"
              className="tt-input"
              data-testid="confirm-password-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              required
              style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          {/* Password Complexity Checklist */}
          <div
            data-testid="complexity-checklist"
            style={{
              backgroundColor: "#f8fafc",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              marginBottom: "20px",
              fontSize: "12px",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "6px", color: "#475569" }}>Password Requirements:</div>
            <ul style={{ margin: 0, paddingLeft: "18px", listStyleType: "none" }}>
              <li style={{ color: hasMinLength ? "#16a34a" : "#64748b", marginBottom: "3px" }}>
                {hasMinLength ? "✓" : "○"} At least 8 characters long
              </li>
              <li style={{ color: hasUpper ? "#16a34a" : "#64748b", marginBottom: "3px" }}>
                {hasUpper ? "✓" : "○"} At least one uppercase letter (A-Z)
              </li>
              <li style={{ color: hasLower ? "#16a34a" : "#64748b", marginBottom: "3px" }}>
                {hasLower ? "✓" : "○"} At least one lowercase letter (a-z)
              </li>
              <li style={{ color: hasDigit ? "#16a34a" : "#64748b", marginBottom: "3px" }}>
                {hasDigit ? "✓" : "○"} At least one numeric digit (0-9)
              </li>
              <li style={{ color: isConfirmMatch ? "#16a34a" : "#64748b" }}>
                {isConfirmMatch ? "✓" : "○"} Passwords match
              </li>
            </ul>
          </div>

          <button
            type="submit"
            className="tt-btn tt-btn-primary"
            data-testid="save-password-button"
            disabled={!isFormValid || isSubmitting}
            style={{
              width: "100%",
              padding: "10px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: isFormValid ? "pointer" : "not-allowed",
              opacity: isFormValid ? 1 : 0.6,
            }}
          >
            {isSubmitting ? "Updating Password..." : "Save New Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChangePasswordModal;
