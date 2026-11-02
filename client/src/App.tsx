import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import AppShell from "./components/AppShell";
import RoleGuard from "./components/RoleGuard";
import CatalogPage from "./pages/CatalogPage";
import OrderHistoryPage from "./pages/OrderHistoryPage";
import OperatorOrdersPage from "./pages/OperatorOrdersPage";
import LoginPage from "./pages/LoginPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<CatalogPage />} />
        <Route path="login" element={<LoginPage />} />

        {/* Customer Protected Routes */}
        <Route element={<RoleGuard />}>
          <Route path="orders" element={<OrderHistoryPage />} />
        </Route>

        {/* Operator Protected Routes */}
        <Route element={<RoleGuard allowedRoles={["OPERATOR", "ADMIN"]} />}>
          <Route path="operator/orders" element={<OperatorOrdersPage />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </CartProvider>
    </AuthProvider>
  );
}
