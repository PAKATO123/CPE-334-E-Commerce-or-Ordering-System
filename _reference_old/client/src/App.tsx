import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RequesterProvider } from "./context/RequesterContext";
import { AuthProvider } from "./context/AuthContext";
import AppShell from "./components/AppShell";
import RequesterGuard from "./components/RequesterGuard";
import RequesterSelectorPage from "./pages/RequesterSelectorPage";
import MyTicketsPage from "./pages/MyTicketsPage";
import CreateTicketPage from "./pages/CreateTicketPage";
import TicketDetailPage from "./pages/TicketDetailPage";
import StaffQueuePage from "./pages/StaffQueuePage";
import AdminGuard from "./components/AdminGuard";
import { UserManagementPage } from "./pages/UserManagementPage";

import { RequesterDashboardPage } from "./pages/RequesterDashboardPage";
import { StaffDashboardPage } from "./pages/StaffDashboardPage";
import { AdminDashboardPage } from "./pages/AdminDashboardPage";
import { Navigate } from "react-router-dom";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<AppShell />}>
        <Route index element={<RequesterSelectorPage />} />
        
        <Route element={<RequesterGuard />}>
          {/* Uniform Requester Routes */}
          <Route path="requester/dashboard" element={<RequesterDashboardPage />} />
          <Route path="requester/tickets" element={<MyTicketsPage />} />
          <Route path="requester/tickets/new" element={<CreateTicketPage />} />
          <Route path="requester/tickets/:id" element={<TicketDetailPage />} />

          {/* Legacy Ticket Route Aliases & Redirects */}
          <Route path="tickets" element={<Navigate to="/requester/tickets" replace />} />
          <Route path="tickets/new" element={<Navigate to="/requester/tickets/new" replace />} />
          <Route path="tickets/:id" element={<TicketDetailPage />} />

          {/* Staff Routes */}
          <Route path="staff/dashboard" element={<StaffDashboardPage />} />
          <Route path="staff/queue" element={<StaffQueuePage />} />
          <Route path="staff/tickets/:id" element={<TicketDetailPage />} />

          {/* Admin Routes */}
          <Route element={<AdminGuard />}>
            <Route path="admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="admin/users" element={<UserManagementPage />} />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RequesterProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </RequesterProvider>
    </AuthProvider>
  );
}
