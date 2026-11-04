# TokTickIT — Internal IT Ticketing System

TokTickIT is an enterprise internal IT support ticketing application built with **React** (TypeScript, Vite, Vanilla CSS), **Express** (Node.js REST API), **Prisma ORM**, and **PostgreSQL**.

---

## Key Features & Capabilities

- **Authentication & Security**: Email/password authentication, non-dismissible mandatory first-login password change with real-time complexity validation, and session-based auth.
- **Role-Based Access Control (RBAC)**: Enforced authorization across 3 roles: `REQUESTER`, `IT_STAFF`, and `ADMINISTRATOR`.
- **Operational Role Dashboards**:
  - **Requester Dashboard** (`/requester/dashboard`): Metrics for open tickets, input requests, recently updated tickets, and quick action shortcuts.
  - **IT Staff Dashboard** (`/staff/dashboard`): Real-time counts for unassigned tickets, owned tickets, urgent/high priority, pending follow-ups, status distribution, and activity feeds.
  - **Administrator Dashboard** (`/admin/dashboard`): Integrates staff operational metrics with complete user account stats.
- **IT Staff Queue & Filter Controls** (`/staff/queue`):
  - 2-row responsive filter bar (Search, Status, IT Priority, Assignment on row 1; Category, Related System, Follow-up Required, Clear All Filters on row 2).
  - Green ticket links, hover highlighting, muted table headers, single `Last Updated` date column, and simplified `Yes`/`No` follow-up values.
- **Actions Taken Management**:
  - Audit log for logging work done, results, and follow-ups.
  - 3-state follow-up tracking: `Follow-Up Required` (yellow `#FEFCBF`), `Followed up` (green `#E6FFFA`), and `No Follow-Up Needed` (gray).
  - One-click "Mark done" action transition and custom sorting option (*"Put 'Follow-Up Required' first"*).
- **Activity Feed & Resolution Workflow**:
  - Public Comments feed and Confidential Internal Notes feed.
  - Requester resolution indication (`Pending Verification` / `Waiting` compact badges).
- **Administrator User Management** (`/admin/users`): Account management, role assignment, status toggling, and safety rules.
- **Zen Green Design System**: Mobile-first responsive UI built with custom CSS variables (`--color-primary-green: #006B3C`).

---

## Demo Login Credentials

For testing and grading, use the following seeded accounts:

| Role | Email | Initial Password | Notes / Permissions |
|---|---|---|---|
| **Requester (Standard)** | `requester1@toktickit.local` | `Password123!` | Active requester with pre-seeded tickets (Direct dashboard access) |
| **Requester (1st Login Change)** | `requester4@toktickit.local` | `Password123!` | Demonstrates Lab 3 mandatory first-login password change (`mustChangePassword: true`) |
| **IT Staff** | `staff1@toktickit.local` | `Password123!` | Access to Staff Queue, Claim, Assignee, Actions Taken & IT Controls |
| **Administrator** | `admin@toktickit.local` | `AdminPassword123!` | Full access including User Management (`/admin/users`) |

---

## Setup Instructions

### 1. Install Dependencies
Install dependencies for root (E2E testing), frontend (`client`), and backend (`server`):
```bash
# Root dependencies (Playwright E2E)
npm install
npx playwright install chromium

# Frontend client
cd client
npm install

# Backend server
cd ../server
npm install
```

### 2. Environment Variables
In the `server/` directory, copy `.env.example` to `.env`:
```bash
cd server
cp .env.example .env
```
Ensure `DATABASE_URL` in `.env` points to your active PostgreSQL instance.

### 3. Database Migration & Seeding
Push the Prisma schema to PostgreSQL and seed initial reference data (Users, Categories, Related Systems, Sample Tickets, Actions Taken):
```bash
cd server
npx prisma db push
npm run prisma:seed
```

---

## Running the Application

Start the backend API and frontend client development servers:

**Backend API (`http://localhost:3000`):**
```bash
cd server
npm run dev
```

**Frontend Client (`http://localhost:5173`):**
```bash
cd client
npm run dev
```

---

## Testing & Quality Assurance

The application features 100% passing test coverage across Unit, API/Integration, UI Component, and End-to-End (E2E) levels:

- **Server API Tests:**
  ```bash
  cd server
  npx vitest run tests/lab-04
  ```

- **Client React Component Tests:**
  ```bash
  cd client
  npx vitest run tests/lab-04
  ```

- **Playwright End-to-End (E2E) Tests:**
  ```bash
  npx playwright test e2e/lab-04
  ```

---