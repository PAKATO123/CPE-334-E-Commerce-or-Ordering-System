# TechTent — Everyday Electronics Ordering System

**CPE 334 | Group Project Deliverable 1 (Semester 1/2026)**

Full-stack Everyday Consumer Electronics & Ordering System built with **React** (TypeScript, Vite), **Express** (Node.js REST API), **Prisma ORM**, and **PostgreSQL**.

### Team Information
- **Student 1**: `[FILL IN: Student 1 Full Name — Student ID]`
- **Student 2**: `[FILL IN: Student 2 Full Name — Student ID]`
- **Repository URL**: `https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System.git`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

## 1. Project Overview & Context

- **Theme 4**: E-Commerce or Ordering System (TechTent Everyday Consumer Electronics)
- **Stakeholder Goal**: A retailer of everyday technology (Smartphones, Tablets, Smart TVs, Keyboards, Chargers) accepts customer orders and manages operator fulfillment.
- **Sprint 1 Outcome**:
  - Seeded tech catalog with authoritative pricing and inventory stock availability.
  - Customer authentication, catalog browsing, multi-item order placement with atomic stock reservation, and order history/detail tracking.
  - Operator authentication and operational queue management (viewing incoming orders, accepting or rejecting orders with automated inventory restoration).
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
SESSION_SECRET="techtent-session-secret-key-cpe334"
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
| **Operator** | `operator1@example.com` | `Password123!` | View incoming order queue, accept/reject orders |
| **Administrator**| `admin@example.com` | `Password123!` | Administrative oversight and user management |

---

## 5. Seed Catalog Products (Everyday Tech)

| SKU | Product Name | Category | Unit Price (USD) | Initial Stock |
|---|---|---|---|---|
| `PHON-PRO-256` | Flagship Pro Smartphone 256GB | Smartphones | $899.00 | 10 |
| `TAB-ULTRA-11` | Ultra Tablet 11" 128GB | Tablets | $549.00 | 8 |
| `TV-SMART-55` | 55" 4K Smart OLED TV | Smart TVs | $699.00 | 5 |
| `KB-MECH-RGB` | Wireless Mechanical Keyboard | Keyboards | $79.00 | 15 |
| `CHG-GAN-65W` | 65W GaN Fast Charger USB-C | Chargers & Power | $29.00 | 25 |
| `PHON-FLIP-LTD`| Flip Smartphone Limited Edition | Smartphones | $999.00 | **0 (Out of Stock Demo)** |

The seed also includes an inactive product and the active `SIM-ATOM-FAIL` demonstration
product, which deliberately rejects checkout despite displaying stock. This inherited
demonstration behavior is recorded as an outstanding issue in the integration review.

---

## 6. Automated Tests

Run these database-free checks from the repository root:

```powershell
npm.cmd --prefix server run test:unit
npm.cmd --prefix client test
npm.cmd --prefix server run build
npm.cmd --prefix client run build
```

Backend integration tests reset data, and some legacy tests delete all orders.
They are disabled unless an explicitly configured disposable database is approved.
Follow [the isolated test environment instructions](docs/sprints/sprint-1/f05-test-environment.md)
for the dedicated `127.0.0.1:55435/techtent_test` container. Never use the development
database for these suites. Test setup does not automatically initialize or seed it.

Verified results: **93 backend integration/regression tests, 48 backend unit tests,
and 41 frontend tests passed (182 distinct tests; zero failed or skipped)**.
Both builds passed. The separate 47-test Feature 5 run is included in the 93,
not an additional set of tests. Browser E2E and visual checks have not been run.

## 7. Operator Fulfillment (Feature 5)

Sign in as an operator or administrator and open `/operator/orders`:

- Filter all orders, pending orders, accepted orders or rejected orders.
- Open customer receipts and return to the selected queue filter.
- Accept a pending order without changing stock already reserved at checkout.
- Confirm rejection to restore its reserved quantities atomically and exactly once.
- Already processed orders return a conflict and cannot change terminal status.

Queue retrieval and updates require operator/admin authorization and current
password-policy enforcement. See [the API contract](docs/sprints/sprint-1/feature-specs.md#53-api-endpoint-specifications)
and [the integration review](docs/sprints/sprint-1/f05-integration-review.md).

Feature 5's concurrency tests verify fulfillment, not concurrent customer checkout.
The inherited checkout stock/reference races and remaining browser verification
are documented in that review; passing these suites does not establish production readiness.
