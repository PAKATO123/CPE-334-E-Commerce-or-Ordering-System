import React from "react";
import LoginForm from "../components/auth/LoginForm";

export const LoginPage: React.FC = () => {
  return (
    <div style={{ padding: "40px 16px" }}>
      <LoginForm />
    </div>
  );
};

export default LoginPage;

