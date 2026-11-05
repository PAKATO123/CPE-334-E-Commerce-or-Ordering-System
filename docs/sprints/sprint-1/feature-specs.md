# Sprint 1 Feature Engineering Contracts
## CPE 334 — TechTent Everyday Electronics Ordering System
**Document Version**: 1.1.0 | **Date**: November 2026

### Team Information
> **Fill in the student details below:**
- **Student 1**: `Pattarapon Sribuathong 67070503434`
- **Student 2**: `Wai Phyo 67070503487`
- **Repository URL**: `https://github.com/PAKATO123/CPE-334-E-Commerce-or-Ordering-System.git`
- **Submitted Release Tag / Commit**: `[FILL IN: Release Tag / Commit SHA]`

---

## 1. Feature Contract: F-01 User Authentication & Role-Based Session Control

### 1.1 Overview & Requirements Linkage
- **Linked Requirements**: NFR-01, BR-04, BR-05
- **Description**: Provides cookie-based session authentication for `CUSTOMER`, `OPERATOR`, and `ADMIN` users. Enforces backend authorization middleware and frontend navigation guards.

### 1.2 User Interface Behavior
- **Screen**: `/login` (LoginForm modal/card).
- **Controls**: Email input, Password input, "Sign In" button.
- **States**:
  - *Submitting*: Disables button and displays "Signing in...".
  - *Invalid Credentials*: Displays red error alert banner (`⚠️ Invalid email address or password`).
  - *Success*: Automatically redirects Customers to `/` (Catalog) and Operators/Admins to `/operator/orders`.
- **Top Navbar Display**: Renders brand "⛺ TechTent", logged-in user name, and a stylized role badge (`Customer`, `Operator`, `Admin`) with a "Sign Out" button.

### 1.3 API Endpoint Specifications

#### POST /api/auth/login
- **Access**: Public / Anonymous
- **Request Body**:
  ```json
  {
    "email": "customer1@example.com",
    "password": "Password123!"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "user": {
      "id": 1,
      "email": "customer1@example.com",
      "name": "Alice Customer",
      "role": "CUSTOMER",
      "isActive": true,
      "mustChangePassword": false
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: `{ "error": { "code": "MISSING_FIELDS", "message": "Email and password are required." } }`
  - `401 Unauthorized`: `{ "error": { "code": "INVALID_CREDENTIALS", "message": "Invalid email address or password." } }`

#### POST /api/auth/logout
- **Access**: Authenticated (`CUSTOMER`, `OPERATOR`, `ADMIN`)
- **Success Response (`200 OK`)**: `{ "message": "Logged out successfully" }` (Clears `connect.sid` cookie).
- **Error Response (`401 Unauthorized`)**: If unauthenticated.

#### GET /api/auth/me
- **Access**: Authenticated
- **Success Response (`200 OK`)**: Returns current `user` object.
- **Error Response (`401 Unauthorized`)**: If unauthenticated.

### 1.4 Acceptance Criteria (F-01)
- **AC-AUTH-01**: Submitting valid credentials establishes an authenticated HTTP-only session cookie and returns user profile data with corresponding role.
- **AC-AUTH-02**: Submitting incorrect password returns `401 Unauthorized` without creating a session.
- **AC-AUTH-03**: Calling `POST /api/auth/logout` destroys the backend session and invalidates the session cookie.
- **AC-AUTH-04**: Unauthenticated access to protected endpoints (`POST /api/orders`, `GET /api/operator/orders`) is rejected with `401 Unauthorized`.

---

## 2. Feature Contract: F-02 Everyday Tech Catalog Browsing & Stock Display

### 2.1 Overview & Requirements Linkage
- **Linked Requirements**: FR-01, FR-02, BR-01
- **Description**: Displays the active TechTent inventory. Customers can view item names, SKUs, categories (Smartphones, Tablets, Smart TVs, Keyboards, Chargers), descriptions, authoritative prices (USD), and available stock.
 
### 2.2 User Interface Behavior
- **Screen**: `/` (CatalogPage).
- **Layout**: Grid of electronic product cards grouped or filterable by Category (`Smartphones`, `Tablets`, `Smart TVs`, `Keyboards`, `Chargers & Power`).
- **Card Elements**:
  - SKU pill (`PHON-PRO-256`), Product Name, Category badge, Description, Authoritative Unit Price (`$899.00`).
  - Stock Indicator:
    - In Stock (`stockQuantity > 0`): Displays green badge (e.g., `In Stock: 10 available`).
    - Out of Stock (`stockQuantity == 0`): Displays muted red badge (`Out of Stock`), disables quantity input and "Add to Order" button.
- **Cart Summary Strip**: Floating counter displaying total items added and running total amount.
 
### 2.3 API Endpoint Specifications
 
#### GET /api/products
- **Access**: Public / Authenticated
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": 1,
        "sku": "PHON-PRO-256",
        "name": "Flagship Pro Smartphone 256GB",
        "category": "Smartphones",
        "description": "6.7-inch OLED display, 5G flagship processor, triple-camera array.",
        "price": "899.00",
        "stockQuantity": 10,
        "isActive": true
      },
      {
        "id": 2,
        "sku": "KB-MECH-RGB",
        "name": "Wireless Mechanical Keyboard",
        "category": "Keyboards",
        "description": "Multi-device Bluetooth/2.4GHz RGB mechanical keyboard with hot-swap switches.",
        "price": "79.00",
        "stockQuantity": 15,
        "isActive": true
      }
    ]
  }
  ```

### 2.4 Acceptance Criteria (F-02)
- **AC-CAT-01**: Catalog endpoint returns all active devices with accurate SKU, name, category, price, and stock levels.
- **AC-CAT-02**: Inactive products (`isActive = false`) are omitted from public catalog queries.
- **AC-CAT-03**: Products with 0 stock display an "Out of Stock" state and cannot be added to an order.

---

## 3. Feature Contract: F-03 Multi-Item Order Assembly & Atomic Persistence

### 3.1 Overview & Requirements Linkage
- **Linked Requirements**: FR-03, FR-04, FR-05, BR-01, BR-02, BR-03, NFR-02
- **Description**: Customers build a multi-item order. The backend authoritatively computes line item subtotals and grand totals, validates stock availability, creates the `Order` and `OrderItem` records, and decrements inventory atomically.

### 3.2 User Interface Behavior
- **Screen**: Cart Drawer / Order Checkout View.
- **Controls**:
  - Quantity increment/decrement buttons per line item.
  - Remove line item button.
  - Calculated preview totals.
  - "Place Order" button.
- **Client Validation**: Blocks submission if quantity is < 1 or exceeds visible available stock.
- **Success Behavior**: Displays confirmation modal with the generated Order Number (`ORD-YYYYMMDD-XXXX`) and button to "View Order Receipt".

### 3.3 API Endpoint Specifications

#### POST /api/orders
- **Access**: Authenticated `CUSTOMER` only (Operators & Admins receive `403 Forbidden`).
- **Request Body**:
  ```json
  {
    "items": [
      { "productId": 1, "quantity": 1 },
      { "productId": 2, "quantity": 2 }
    ]
  }
  ```
  *(Note: Even if client sends `"price": 1.00`, the server ignores it completely and uses authoritative database prices).*
- **Success Response (`201 Created`)**:
  ```json
  {
    "data": {
      "id": 42,
      "orderNumber": "ORD-20261101-0001",
      "customerId": 1,
      "status": "PENDING",
      "totalAmount": "1057.00",
      "createdAt": "2026-11-01T15:30:00.000Z",
      "items": [
        {
          "id": 101,
          "productId": 1,
          "productName": "Flagship Pro Smartphone 256GB",
          "sku": "PHON-PRO-256",
          "unitPrice": "899.00",
          "quantity": 1,
          "subtotal": "899.00"
        },
        {
          "id": 102,
          "productId": 2,
          "productName": "Wireless Mechanical Keyboard",
          "sku": "KB-MECH-RGB",
          "unitPrice": "79.00",
          "quantity": 2,
          "subtotal": "158.00"
        }
      ]
    }
  }
  ```
- **Error Responses**:
  - `400 Bad Request`: Empty item list (`EMPTY_ORDER`) or non-positive quantity (`INVALID_QUANTITY`).
  - `404 Not Found`: Product ID not found or deactivated.
  - `409 Conflict`: Insufficient stock available (`INSUFFICIENT_STOCK`).

### 3.4 Acceptance Criteria (F-03)
- **AC-ORD-01**: Submitting valid items creates an order with unique `orderNumber` (`ORD-YYYYMMDD-XXXX`), status `PENDING`, and correct authoritative totals.
- **AC-ORD-02**: Decrements `stockQuantity` in the `Product` table by the ordered amount for each item.
- **AC-BR-01**: Attempting to supply manipulated client prices or totals does not alter the server's calculation (`BR-01`).
- **AC-BR-02**: Stored `OrderItem.unitPrice` captures the price at the moment of order creation (`BR-02`).
- **AC-BR-03**: Attempting to order quantity > available stock rejects the entire order with `409 Conflict` and does not decrement any stock (`BR-03`, `NFR-02`).
- **AC-BR-04**: Attempting to order non-integer, zero, or negative quantity is rejected with `400 Bad Request`.

---

## 4. Feature Contract: F-04 Customer Order History & Receipt Details

### 4.1 Overview & Requirements Linkage
- **Linked Requirements**: FR-06, FR-07, BR-02, BR-04
- **Description**: Customers can view a chronological list of their orders and drill down into itemized receipts showing preserved historical purchase prices. Enforces customer data isolation.

### 4.2 User Interface Behavior
- **Screen**: `/orders` (OrderHistoryPage) and `/orders/:id` (OrderDetailPage).
- **List View**: Table showing Order Number, Date, Total Amount, Status badge (`Pending` in yellow, `Accepted` in green, `Rejected` in red), and "View Receipt" link.
- **Receipt Detail View**:
  - Order Header: Order Number, Placement Timestamp, Customer Name, Status Badge.
  - Itemized Table: SKU, Product Name, Preserved Unit Price, Quantity, Subtotal.
  - Summary Box: Subtotal, Grand Total.
  - Isolation Check: If Customer A enters Customer B's order ID in the URL, an error screen renders: *"Order not found or permission denied."*

### 4.3 API Endpoint Specifications

#### GET /api/orders
- **Access**: Authenticated `CUSTOMER`
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": [
      {
        "id": 42,
        "orderNumber": "ORD-20261101-0001",
        "status": "PENDING",
        "totalAmount": "1057.00",
        "itemCount": 3,
        "createdAt": "2026-11-01T15:30:00.000Z"
      }
    ]
  }
  ```

#### GET /api/orders/:id
- **Access**: Authenticated `CUSTOMER` (Own orders only) or `OPERATOR`/`ADMIN`
- **Success Response (`200 OK`)**: Returns full order details with `items` array.
- **Error Responses**:
  - `403 Forbidden` / `404 Not Found`: Customer attempting to access an order created by another customer.

### 4.4 Acceptance Criteria (F-04)
- **AC-ORD-04**: Customer queries return only orders placed by their authenticated user account.
- **AC-ORD-05**: Detail endpoint displays itemized receipt with the exact historic unit prices captured at purchase time.
- **AC-SEC-01**: Customer A requesting Customer B's order receives `403 Forbidden` or `404 Not Found` without disclosing any line items.

---

## 5. Feature Contract: F-05 Operator Order Queue & Fulfillment Processing

### 5.1 Overview & Requirements Linkage
- **Linked Requirements**: FR-08, FR-09, FR-10, BR-05, BR-06
- **Description**: Operational queue allowing TechTent operators to view pending incoming orders across all customers, inspect components, and accept or reject orders.

### 5.2 User Interface Behavior
- **Screen**: `/operator/orders` (OperatorOrdersPage).
- **Controls**:
  - Status Filter Tabs: `All`, `Pending`, `Accepted`, `Rejected`.
  - Queue Cards / Table: Order Number, Customer Name & Email, Placement Time, Item Count, Total ($), Current Status badge.
  - Action Buttons (on `PENDING` orders):
    - "Accept Order" (Green button): Transitions order to `ACCEPTED`.
    - "Reject Order" (Red outline button): Prompts for confirmation and transitions order to `REJECTED`, releasing inventory.
  - Non-Operator Access: If a customer attempts to navigate to `/operator/orders`, they are redirected to `/` or shown an access denied warning.

### 5.3 API Endpoint Specifications

#### GET /api/operator/orders
- **Access**: Authenticated `OPERATOR` or `ADMIN` (Customers rejected with `403 Forbidden`).
- **Query Parameters**: Optional `status=PENDING`, `status=ACCEPTED`, or `status=REJECTED`. Omission returns all orders. Empty, repeated, structured, lowercase, or unsupported values return `400 INVALID_STATUS`.
- **Success Response (`200 OK`)**: `{ "data": [...] }`, newest placement first, then descending ID for timestamp ties.
- **Queue Entry**: `id`, `orderNumber`, `customerId`, `customerName`, `customerEmail`, `status`, `totalAmount`, `itemCount` (sum of quantities), `lineItemCount`, `createdAt`, `updatedAt`, and item summaries (`id`, `productId`, `productName`, `sku`, stored `unitPrice`, `quantity`, stored `subtotal`). Money is a two-decimal USD string; timestamps are ISO strings. No password hashes or session data are returned.
- **Authorization**: Anonymous requests return `401 UNAUTHORIZED`; customers return `403 FORBIDDEN`. Account state and password policy are refreshed/enforced before the operator/admin role check. Mandatory password changes return `403 PASSWORD_CHANGE_REQUIRED`.

#### PATCH /api/operator/orders/:id/status
- **Access**: Authenticated `OPERATOR` or `ADMIN`
- **Request Body**:
  ```json
  {
    "status": "ACCEPTED"
  }
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "data": {
      "id": 42,
      "orderNumber": "ORD-20261101-0001",
      "status": "ACCEPTED",
      "updatedAt": "2026-11-01T15:45:00.000Z"
    }
  }
  ```
- **Error Responses**:
  - `400 INVALID_ID`: ID is not a canonical positive decimal integer in PostgreSQL's signed 32-bit range (1 through 2147483647).
  - `400 INVALID_STATUS`: Missing or invalid target; only `ACCEPTED` and `REJECTED` are accepted. `PENDING` is invalid regardless of current state.
  - `401 UNAUTHORIZED`: No active session.
  - `403 FORBIDDEN`: Non-operator role; inactive accounts receive `401 ACCOUNT_DEACTIVATED` and password-policy restrictions receive `403 PASSWORD_CHANGE_REQUIRED`.
  - `404 ORDER_NOT_FOUND`: Valid ID with no matching order.
  - `409 ORDER_ALREADY_PROCESSED`: Valid terminal target applied to an already `ACCEPTED` or `REJECTED` order.
  - `409 ORDER_PROCESSING_CONFLICT`: Three attempts exhausted after Prisma transaction write-conflict/deadlock errors; refresh before retrying.
  - `500 INTERNAL_ERROR`: Unexpected persistence failure; internal details are not returned.

#### Fulfillment Transaction and UI Behavior

- A conditional `PENDING` update claims the order inside a `ReadCommitted` Prisma transaction; exactly one affected row is required before inventory changes.
- Acceptance changes only order status/timestamp. Checkout has already reserved stock.
- Rejection increments stock by each stored item quantity, including inactive products, in stable product-ID order. Status and all increments commit or roll back together.
- Competing/repeated terminal requests cannot restore stock twice. Only aborted `P2034` transactions are retried, with a bounded three-attempt budget.
- The frontend preserves its selected filter through refresh and receipt navigation, disables processing controls while a request is pending, and distinguishes processing success from subsequent refresh failure.
- Rejection uses a named native modal dialog with initial cancel focus, Escape cancellation while idle, and focus restoration. Browser-native focus trapping still needs manual verification.
- A `409` triggers queue refresh and conflict feedback. Operators/admins return from receipts to their queue, while customers retain their own history navigation.

### 5.4 Acceptance Criteria (F-05)
- **AC-OP-01**: Operator queue lists incoming orders with customer details and item summaries.
- **AC-OP-02**: Operator can accept a `PENDING` order, changing status to `ACCEPTED`.
- **AC-OP-03**: Operator rejecting a `PENDING` order transitions status to `REJECTED` and atomically restores product stock in the database.
- **AC-SEC-02**: Customer role attempting to call `GET /api/operator/orders` or `PATCH /api/operator/orders/:id/status` is blocked with `403 Forbidden`.

All four criteria have passing automated implementation evidence; see the [integration review](f05-integration-review.md) for test mapping and verification limits.
