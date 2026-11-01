# CPE 334 — E-Commerce / Ordering System (Electronics Store)

**Semester 1/2026 | Group Project Deliverable 1**

Full-stack E-Commerce & Ordering System for an Electronics Store, built with **React** (TypeScript, Vite), **Express** (Node.js REST API), **Prisma ORM**, and **PostgreSQL**.

### Team Information
- **Student 1**: `[FILL IN: Student 1 Full Name — Student ID]`
- **Student 2**: `[FILL IN: Student 2 Full Name — Student ID]`
- **Repository URL**: `[FILL IN: GitHub Repository URL]`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

## 1. Project Overview & Context

- **Theme 4**: E-Commerce or Ordering System (VoltCraft Electronics Store)
- **Stakeholder Goal**: An electronics and hardware retailer accepts customer orders and manages operator fulfillment.
- **Sprint 1 Outcome**:
  - Seeded electronic catalog with authoritative pricing and stock availability.
  - Customer authentication, catalog browsing, multi-item order placement, and order history/detail tracking.
  - Operator authentication and operational queue management (viewing and accepting incoming orders).
  - Authoritative server-side price calculation, price preservation on historical orders, and validation against invalid quantities or unavailable stock.
  - Enforced role-based access control (`CUSTOMER` vs `OPERATOR` / `ADMIN`).

---

## 2. System Architecture

- **Frontend (`client/`)**: React 18 SPA with Vite, React Router 7, context-based Session Auth, responsive design tokens.
- **Backend (`server/`)**: Express REST API with TypeScript, session-based cookie authentication (`express-session`), bcrypt password hashing, and role verification middleware.
- **Database (`server/prisma/`)**: PostgreSQL with Prisma ORM for type-safe persistence, schema management, and reproducible seed data.
- **Reference Assets (`_reference_old/`)**: Clean snapshot of prior labs (UI patterns, documentation styles, test structures) preserved for reference and excluded via `.gitignore`.
- **Testing**:
  - Backend API & Unit Tests: `vitest` + `supertest`
  - Frontend Component Tests: `vitest` + `@testing-library/react`
  - End-to-End Tests: `playwright`

---

## 3. Local Setup Instructions

### 3.1. Install Dependencies
```bash
# Root dependencies (Playwright E2E)
npm install

# Client dependencies
cd client
npm install
cd ..

# Server dependencies
cd server
npm install
cd ..
```

### 3.2. Environment Configuration
In the `server/` directory, configure your `.env` file:
```bash
cd server
cp .env.example .env
```
Ensure `DATABASE_URL` in `server/.env` points to your PostgreSQL database:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ecommerce_db?schema=public"
SESSION_SECRET="ecommerce-session-secret-key-cpe334"
PORT=3000
```

### 3.3. Database Migrations & Seeding
```bash
cd server
npm run prisma:migrate
npm run prisma:seed
```

### 3.4. Running the Application
```bash
# Start backend server (port 3000)
cd server
npm run dev

# In a separate terminal, start frontend client (port 5173)
cd client
npm run dev
```

---

## 4. Default Seeded Accounts (Sprint 1)

| Role | Email | Password | Permissions / Scope |
|---|---|---|---|
| **Customer** | `customer1@example.com` | `Password123!` | Browse catalog, place orders, view own order history |
| **Customer 2** | `customer2@example.com` | `Password123!` | Secondary customer account for multi-user isolation tests |
| **Operator** | `operator1@example.com` | `Password123!` | View incoming order queue, accept/process orders |
| **Administrator**| `admin@example.com` | `Password123!` | Administrative oversight and user management |

---

## 5. Automated Tests

```bash
# Run server test suite
cd server
npm test

# Run client test suite
cd client
npm test

# Run Playwright E2E tests
npm run test:e2e
```
