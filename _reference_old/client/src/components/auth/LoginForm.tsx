import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getMeApi } from "../../api";

export interface LoginFormProps {
  onSuccess?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const { login, error: globalError, clearError } = useAuth();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    clearError();

    if (!email.trim() || !password) {
      setLocalError("Email and password are required.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      if (onSuccess) {
        onSuccess();
      } else {
        try {
          const me = await getMeApi();
          if (me.user?.role === "ADMINISTRATOR") {
            navigate("/admin/dashboard", { replace: true });
          } else if (me.user?.role === "IT_STAFF") {
            navigate("/staff/dashboard", { replace: true });
          } else {
            navigate("/requester/dashboard", { replace: true });
          }
        } catch {
          navigate("/requester/dashboard", { replace: true });
        }
      }
    } catch (err: any) {
      setLocalError(err.message || "Invalid email address or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const errorMessage = localError || globalError;

  return (
    <div className="tt-auth-container" style={{ maxWidth: "420px", margin: "40px auto" }}>
      <div className="tt-card">
        <h2 style={{ marginBottom: "8px", textAlign: "center" }}>Sign In to TokTickIT</h2>
        <p style={{ color: "var(--color-text-muted)", textAlign: "center", marginBottom: "24px", fontSize: "14px" }}>
          Enter your corporate credentials to access your account
        </p>

        {errorMessage && (
          <div
            className="tt-alert tt-alert-error"
            data-testid="error-alert"
            style={{
              padding: "12px",
              borderRadius: "6px",
              backgroundColor: "#fee2e2",
              color: "#991b1b",
              border: "1px solid #f87171",
              marginBottom: "16px",
              fontSize: "14px",
            }}
          >
            ⚠️ {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "14px" }}>
              Email Address
            </label>
            <input
              id="email-input"
              type="email"
              className="tt-input"
              data-testid="email-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="requester1@toktickit.local"
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontWeight: 500, fontSize: "14px" }}>
              Password
            </label>
            <input
              id="password-input"
              type="password"
              className="tt-input"
              data-testid="password-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
            />
          </div>

          <button
            type="submit"
            className="tt-btn tt-btn-primary"
            data-testid="submit-button"
            disabled={isSubmitting}
            style={{ width: "100%", padding: "12px", fontSize: "15px", fontWeight: 600, cursor: "pointer" }}
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginForm;
