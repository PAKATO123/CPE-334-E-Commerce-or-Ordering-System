# System-Level Software Design Specification (SDS)
## CPE 334 — E-Commerce / Ordering System (Electronics Store)

### Team Information
> **Fill in the student details below:**
- **Student 1**: `[FILL IN: Student 1 Full Name — Student ID]`
- **Student 2**: `[FILL IN: Student 2 Full Name — Student ID]`
- **Repository URL**: `[FILL IN: GitHub Repository URL]`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

### 1. Architectural Overview & Component Responsibilities

The application follows a standard three-layer full-stack architecture:

1. **Presentation Layer (`client/`)**:
   - Single Page Application (SPA) built with React 18, TypeScript, and Vite.
   - Client routing via React Router 7 with route protection (`RoleGuard`).
   - Global session and auth state managed through `AuthContext`.
   - UI styling using modular CSS custom properties and responsive components.

2. **Application / API Layer (`server/`)**:
   - Node.js service running Express and TypeScript.
   - Session management backed by `express-session` with HTTP-only cookies.
   - Server-side authentication and role-based authorization middleware (`requireAuth`, `requireRole`).
   - Enforces authoritative domain calculations (subtotals, discounts, taxes, and order totals).

3. **Data Layer (`server/prisma/`)**:
   - PostgreSQL relational database.
   - Object-Relational Mapping (ORM) and migrations powered by Prisma.
   - Seed scripts (`prisma/seed.ts`) delivering deterministic baseline test data.

---

### 2. Major Data Entities & Relationships

- **User**: Represents system actors with `email`, `passwordHash`, `name`, `role` (`CUSTOMER`, `OPERATOR`, `ADMIN`), and account flags (`isActive`, `mustChangePassword`).
- **Product**: Electronic catalog items with `sku` (unique), `name`, `category` (e.g., Peripherals, Microcontrollers, Audio, Storage), `description`, `price` (Decimal), `stockQuantity` (Int), and `isActive`.
- **Order**: Customer transactions with `orderNumber` (unique), `customerId`, `status` (`PENDING`, `ACCEPTED`, `REJECTED`, `CANCELLED`), `totalAmount` (Decimal), and timestamps.
- **OrderItem**: Individual line items preserving the `unitPrice` and `subtotal` at time of purchase, linked to `Order` and `Product`.

---

### 3. API Conventions & Access Matrix

#### Conventions
- RESTful HTTP verbs (`GET`, `POST`, `PATCH`, `DELETE`).
- Standardized JSON responses: `{ "data": ... }` or `{ "error": { "code": "...", "message": "..." } }`.
- Credentials included on every request via `credentials: "include"`.

#### Access Control Matrix
| Endpoint / Resource | Anonymous | Customer | Operator | Admin |
|---|---|---|---|---|
| `GET /api/health` | Allow | Allow | Allow | Allow |
| `POST /api/auth/login` | Allow | Allow | Allow | Allow |
| `POST /api/auth/logout` | Deny (401) | Allow | Allow | Allow |
| `GET /api/auth/me` | Deny (401) | Allow | Allow | Allow |
| `GET /api/products` | Deny (401) | Allow | Allow | Allow |
| `POST /api/orders` | Deny (401) | Allow | Deny (403) | Deny (403) |
| `GET /api/orders/my-orders` | Deny (401) | Allow | Deny (403) | Deny (403) |
| `GET /api/orders/:id` | Deny (401) | Own Order Only | Allow (Scoped) | Allow |
| `GET /api/operator/orders` | Deny (401) | Deny (403) | Allow | Allow |
| `PATCH /api/operator/orders/:id/status` | Deny (401) | Deny (403) | Allow | Allow |

---

### 4. Configuration & Deployment Design
- Environment variables configured via `.env` (`PORT`, `DATABASE_URL`, `SESSION_SECRET`).
- Designed for containerization with multi-stage Docker builds (due in Lab 5).
