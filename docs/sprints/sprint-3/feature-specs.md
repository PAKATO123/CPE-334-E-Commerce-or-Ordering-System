# Sprint 3 Feature Engineering Contracts

---

## 1. Feature Contract: F-09 Sales Reporting Engine & Operational Metrics

### 1.1 Overview & Requirements Linkage
- **Linked Requirements**: `FR-14`, `BR-05`, `NFR-01`, `NFR-03`, `NFR-05
- **Allocated Sprint**: Sprint 3
- **Feature Owners**: PAKATO (Backend & Aggregation Service), Joey-pku (Frontend & Dashboard UI)
- **Description**: Delivers store intelligence for Operators and Administrators. Aggregates gross sales revenue, total order volume, average order value (AOV), fulfillment and payment status breakdowns, and operational fulfillment turnaround times (duration from order creation to final `SHIPPED` status).

### 1.2 Feature SDS & Workflow
```mermaid
sequenceDiagram
    autonumber
    actor Admin as Operator / Admin
    participant UI as Reports Dashboard (/operator/reports)
    participant API as Reports API Router (/api/reports)
    participant Auth as Authorization Middleware
    participant Service as Reporting Service
    participant DB as PostgreSQL (Prisma)

    Admin->>UI: Select date range (e.g., Last 30 Days or All Time)
    UI->>API: GET /api/reports/sales-summary?startDate=...&endDate=...
    API->>Auth: Validate session & role (OPERATOR or ADMIN)
    alt Unauthenticated or Customer Role
        Auth-->>UI: 401 Unauthorized / 403 Forbidden
    else Authorized Operator / Admin
        Auth->>API: Proceed
        API->>Service: getSalesSummary(startDate, endDate)
        Service->>DB: Query aggregated totals, status counts, and revenue
        DB-->>Service: Aggregate results
        Service-->>API: Formatted sales summary envelope
        API-->>UI: 200 OK with sales summary JSON

        UI->>API: GET /api/reports/turnaround
        API->>Service: getTurnaroundMetrics()
        Service->>DB: Query shipped orders (createdAt, updatedAt)
        DB-->>Service: Shipped order timestamp records
        Service-->>API: Computed turnaround averages & distribution
        API-->>UI: 200 OK with turnaround metrics JSON

        UI-->>Admin: Render KPI cards, status distribution bars, and turnaround table
    end


### 1.3 Architectural & Layer Impac
- **Presentation Tier**:
  - Add `OperatorReportsPage.tsx` mounted at `/operator/reports`.
  - Add navigation tab "📊 Reports" in the App Navbar, visible exclusively to users with role `OPERATOR` or `ADMIN`.
  - Date Range Filter Controls: Quick buttons ("Today", "Last 7 Days", "Last 30 Days", "All Time") and custom ISO date pickers.
  - KPI Cards: Gross Sales Revenue ($), Completed Orders, Average Order Value (AOV), and Average Turnaround Time.
  - Status Breakdown Section: Order counts and percentage distribution across `PENDING`, `ACCEPTED`, `PACKED`, `SHIPPED`, `CANCELLED`, `REJECTED`.
  - Payment Health Breakdown: `UNPAID`, `PAID`, `REFUNDED`, `VOID` order distribution.
  - Turnaround Duration Table: Average turnaround duration to `SHIPPED`.
- **Application / API Tier**:
  - Create `server/src/services/reports.ts` implementing:
    - `getSalesSummary(filters?: { startDate?: string; endDate?: string })`: Executes efficient PostgreSQL aggregations. Gross revenue sums `totalAmount` for non-cancelled and non-rejected orders (completed or active).
    - `getTurnaroundMetrics()`: Analyzes orders in `SHIPPED` status, calculating the time difference `(updatedAt - createdAt)` in hours and minutes.
  - Create `server/src/routes/reports.ts` mounted at `/api/reports`:
    - `GET /api/reports/sales-summary`: Protected by `requireRole(['OPERATOR', 'ADMIN'])`.
    - `GET /api/reports/turnaround`: Protected by `requireRole(['OPERATOR', 'ADMIN'])`.
- **Persistence Tier**:
  - Uses existing Prisma schema `Order` table.
  - Existing indexes `@@index([status, createdAt])` and `@@index([paymentStatus])` provide index scans for date-bounded aggregations. No schema migrations needed.

### 1.4 API Endpoint Specifications

#### GET /api/reports/sales-summary
- **Access**: Authenticated `OPERATOR` or `ADMIN`.
- **Query Parameters**:
  - `startDate` (optional): ISO 8601 timestamp string (e.g., `2026-11-01T00:00:00.000Z`).
  - `endDate` (optional): ISO 8601 timestamp string (e.g., `2026-11-30T23:59:59.999Z`).
- **Success Response (200 OK)**:
  ```json
  {
    "data": {
      "totalRevenue": "12845.50",
      "totalOrders": 42,
      "averageOrderValue": "305.85",
      "statusCounts": {
        "PENDING": 4,
        "ACCEPTED": 6,
        "PACKED": 8,
        "SHIPPED": 20,
        "CANCELLED": 2,
        "REJECTED": 2
      },
      "paymentStatusCounts": {
        "UNPAID": 4,
        "PAID": 34,
        "REFUNDED": 3,
        "VOID": 1
      }
    }
  }


#### GET /api/reports/turnaround
- **Access**: Authenticated `OPERATOR` or `ADMIN`.
- **Success Response (200 OK)**:
  ```json
  {
    "data": {
      "shippedOrderCount": 20,
      "averageTurnaroundHours": 4.25,
      "averageTurnaroundMinutes": 255,
      "fastestTurnaroundMinutes": 18,
      "slowestTurnaroundMinutes": 720
    }
  }


### 1.5 Acceptance Criteria (AC-REP)
- **AC-REP-01**: `GET /api/reports/sales-summary` computes authoritative total gross revenue as the sum of `totalAmount` for all non-terminal/valid orders.
- **AC-REP-02**: `GET /api/reports/sales-summary` computes total order count and accurately calculates Average Order Value (`totalRevenue / nonTerminalOrders`).
- **AC-REP-03**: Query parameters `startDate` and `endDate` accurately filter order records by `createdAt`.
- **AC-REP-04**: Status counts accurately partition orders across all 6 fulfillment statuses (`PENDING`, `ACCEPTED`, `PACKED`, `SHIPPED`, `CANCELLED`, `REJECTED`).
- **AC-REP-05**: Payment status counts accurately partition orders across all 4 payment states (`UNPAID`, `PAID`, `REFUNDED`, `VOID`).
- **AC-REP-06**: `GET /api/reports/turnaround` calculates the average fulfillment turnaround duration (`updatedAt - createdAt`) for all orders reaching `SHIPPED`.
- **AC-REP-07**: Unauthenticated requests to `/api/reports/*` return `401 Unauthorized`; authenticated requests with role `CUSTOMER` return `403 Forbidden`.

---

## 2. Feature Contract: F-10 Production Security Hardening & Sanitization

### 2.1 Overview & Requirements Linkage
- **Linked Requirements**: `FR-15`, `NFR-01`, `NFR-03`, `NFR-05
- **Allocated Sprint**: Sprint 3
- **Feature Owners**: PAKATO (Security Middleware & Probes), Joey-pku (Error Envelopes & Review)
- **Description**: Hardens public API attack surfaces against credential stuffing and brute force attacks via rate limiting, guarantees zero internal database error/stack trace leakage across all environments, and hardens application health/readiness probe responses.

### 2.2 Security Architecture & Controls

#### Rate Limiting Policy
- **Target Route**: `POST /api/auth/login
- **Mechanism**: Token bucket / sliding window rate limiting via `express-rate-limit`.
- **Configuration**:
  - Window: 15 minutes (`15 * 60 * 1000 ms`).
  - Maximum Requests: 10 attempts per IP address within the window.
  - Skip Successful Requests: Optional or strict. Strict counting prevents password spray.
  - Rate Limit Headers: Returns `RateLimit-Limit`, `RateLimit-Remaining`, and `Retry-After`.
  - Exceeded Response: HTTP `429 Too Many Requests` with standard error envelope:
    ```json
    {
      "error": {
        "code": "TOO_MANY_REQUESTS",
        "message": "Too many login attempts from this IP. Please try again after 15 minutes."
      }
    }


#### Centralized Error Envelope Sanitizer
- **Mechanism**: Central Express error handling middleware mounted as the terminal handler.
- **Rules**:
  - Always returns structured envelope: `{ "error": { "code": string, "message": string } }`.
  - In `production` environment (`NODE_ENV === 'production'`), intercepts raw database driver errors (e.g. Prisma `P2002`, PostgreSQL connection failures, SQL syntax errors) and translates them to safe consumer-facing messages (e.g., `An internal server error occurred`).
  - Stack traces (`err.stack`) are strictly suppressed from API response bodies in production.

#### Health & Readiness Verification
- **`GET /api/health`**: Lightweight liveness probe returning HTTP 200 `{ "status": "ok", "service": "TechTent API" }`.
- **`GET /api/ready`**: Deep readiness probe verifying database connectivity via `prisma.$queryRaw\`SELECT 1\``. Returns HTTP 200 when database is responsive, or HTTP 503 `{ "status": "unavailable", "database": "disconnected" }` if PostgreSQL is unreachable.

### 2.3 Acceptance Criteria (AC-HARD)
- **AC-HARD-01**: Consecutive failed login requests from a single IP exceeding 10 within 15 minutes are blocked with `429 Too Many Requests` and error code `TOO_MANY_REQUESTS`.
- **AC-HARD-02**: Response to rate-limited requests includes standard `Retry-After` header.
- **AC-HARD-03**: General API endpoints (e.g., catalog browsing, order history) are not constrained by the strict authentication rate limit.
- **AC-HARD-04**: Production error responses never contain raw SQL error text, internal database column names, or stack traces.
- **AC-HARD-05**: `/api/ready` probe verifies live database connectivity, responding with 200 OK when healthy and 503 when disconnected.
