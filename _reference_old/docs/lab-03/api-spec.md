# TokTickIT — Lab 3 API Specification

This document details the REST API endpoints for authentication, ticket operations, IT Staff workflows, public comments, internal notes, and Administrator user management.

---

## 1. Authentication & Session APIs

### `POST /api/auth/login`
Authenticates user credentials and establishes a session.

- **Access**: Public
- **Request Body**:
```json
{
  "email": "staff1@toktickit.local",
  "password": "Password123!"
}
```
- **Response (200 OK)**:
Sets `Set-Cookie: session=...; HttpOnly; SameSite=Lax`
```json
{
  "user": {
    "id": 2,
    "email": "staff1@toktickit.local",
    "name": "Jane Staff",
    "role": "IT_STAFF",
    "mustChangePassword": false,
    "isActive": true
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing email or password.
  - `401 Unauthorized`: Invalid credentials or account deactivated (`isActive = false`).

---

### `POST /api/auth/logout`
Destroys the current authenticated session.

- **Access**: Authenticated
- **Response (200 OK)**:
Clears session cookie.
```json
{
  "message": "Logged out successfully"
}
```

---

### `GET /api/auth/me`
Retrieves current authenticated user identity and role.

- **Access**: Authenticated
- **Response (200 OK)**:
```json
{
  "user": {
    "id": 2,
    "email": "staff1@toktickit.local",
    "name": "Jane Staff",
    "role": "IT_STAFF",
    "mustChangePassword": false,
    "isActive": true
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Session invalid or expired.

---

### `POST /api/auth/change-password`
Changes current user password and clears `mustChangePassword` flag.

- **Access**: Authenticated
- **Request Body**:
```json
{
  "currentPassword": "Password123!",
  "newPassword": "NewSecurePass123!"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Password changed successfully",
  "mustChangePassword": false
}
```
- **Error Responses**:
  - `400 Bad Request`: New password does not satisfy complexity rules (min 8 chars, 1 uppercase, 1 lowercase, 1 number) or current password incorrect.

---

## 2. IT Staff Ticket Queue & Workflow APIs

### `GET /api/tickets/staff-queue`
Retrieves tickets for the IT Staff Ticket Queue with search, filtering, sorting, and pagination.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Query Parameters**:
  - `search` (optional string): Keyword match across `ticketNumber`, `summary`, `description`.
  - `status` (optional string): Filter by status (`New`, `Open`, `In Progress`, etc.).
  - `itPriority` (optional string): Filter by priority (`Urgent`, `High`, `Medium`, `Low`).
  - `assignment` (optional string): `unassigned`, `me`, or `assigned`.
  - `assignedToId` (optional number): Specific staff ID.
  - `sortBy` (optional string): `createdAt` (default), `itPriority`, `currentStatus`.
  - `sortOrder` (optional string): `asc`, `desc` (default).
  - `page` (optional number): Default 1.
  - `pageSize` (optional number): Default 10 (10, 25, 50).

- **Response (200 OK)**:
```json
{
  "data": [
    {
      "id": 101,
      "ticketNumber": "TICK-2026-0001",
      "summary": "VPN connection drops frequently",
      "description": "Unable to stay connected to corporate VPN.",
      "requestedPriority": "High",
      "itPriority": "High",
      "currentStatus": "In Progress",
      "isRequesterResolved": false,
      "requester": {
        "id": 5,
        "name": "Alice Smith",
        "email": "alice@company.com"
      },
      "assignedTo": {
        "id": 2,
        "name": "Jane Staff",
        "email": "staff1@toktickit.local"
      },
      "category": { "id": 4, "name": "Network" },
      "relatedSystem": { "id": 2, "name": "Global VPN" },
      "createdAt": "2026-09-12T10:00:00.000Z",
      "updatedAt": "2026-09-13T11:30:00.000Z",
      "_count": {
        "attachments": 1,
        "publicComments": 2,
        "internalNotes": 1
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "pageSize": 10,
    "totalPages": 1
  }
}
```

---

### `PATCH /api/tickets/:id/claim`
Claims ownership of a ticket for the current IT Staff user.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Response (200 OK)**:
```json
{
  "id": 101,
  "assignedToId": 2,
  "assignedTo": {
    "id": 2,
    "name": "Jane Staff",
    "email": "staff1@toktickit.local"
  }
}
```

---

### `PATCH /api/tickets/:id/assign`
Reassigns ticket ownership to another IT Staff or Administrator user.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:
```json
{
  "assignedToId": 3
}
```
- **Response (200 OK)**:
Returns updated ticket object.

---

### `PATCH /api/tickets/:id/priority`
Updates IT Priority of a ticket.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:
```json
{
  "itPriority": "Urgent"
}
```
- **Response (200 OK)**:
Returns updated ticket object.

---

### `PATCH /api/tickets/:id/status`
Updates Ticket status following permitted transition rules.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:
```json
{
  "status": "Resolved"
}
```
- **Response (200 OK)**:
Returns updated ticket object.
- **Error Responses**:
  - `400 Bad Request`: Invalid status value or transition not permitted by business rules.

---

### `PATCH /api/tickets/:id/resolve-indication`
Toggles Requester problem resolution indication flag.

- **Access**: Requester (Ticket Owner)
- **Request Body**:
```json
{
  "isRequesterResolved": true
}
```
- **Response (200 OK)**:
Returns updated ticket object.

---

## 3. Comments & Internal Notes APIs

### `GET /api/tickets/:id/comments`
Retrieves Public Comments for a ticket.

- **Access**: Ticket Owner, `IT_STAFF`, `ADMINISTRATOR`
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "ticketId": 101,
    "content": "I have updated my network drivers as requested.",
    "createdAt": "2026-09-13T12:00:00.000Z",
    "author": {
      "id": 5,
      "name": "Alice Smith",
      "role": "REQUESTER"
    }
  }
]
```

---

### `POST /api/tickets/:id/comments`
Posts a new Public Comment on a ticket.

- **Access**: Ticket Owner, `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:
```json
{
  "content": "We are investigating the VPN gateway logs."
}
```
- **Response (201 Created)**:
Returns created comment object.

---

### `GET /api/tickets/:id/notes`
Retrieves Internal Notes for a ticket.

- **Access**: `IT_STAFF`, `ADMINISTRATOR` (Forbidden for Requesters)
- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "ticketId": 101,
    "content": "Known issue on Gateway #3. Restart scheduled at 14:00.",
    "createdAt": "2026-09-13T12:05:00.000Z",
    "author": {
      "id": 2,
      "name": "Jane Staff",
      "role": "IT_STAFF"
    }
  }
]
```
- **Error Responses**:
  - `403 Forbidden`: Request made by a Requester user.

---

### `POST /api/tickets/:id/notes`
Posts a confidential Internal Note on a ticket.

- **Access**: `IT_STAFF`, `ADMINISTRATOR`
- **Request Body**:
```json
{
  "content": "Escalated to L2 infra team."
}
```
- **Response (201 Created)**:
Returns created note object.

---

## 4. Minimalist User Management APIs

### `GET /api/users`
Retrieves user list with optional search, role, and active status filters.

- **Access**: `ADMINISTRATOR`, `IT_STAFF` (IT Staff permitted for fetching staff list assignment options)
- **Query Parameters**:
  - `search` (optional string): Match name or email.
  - `role` (optional string): `REQUESTER`, `IT_STAFF`, `ADMINISTRATOR`.
  - `isActive` (optional boolean/string): `true` or `false` filter.

- **Response (200 OK)**:
```json
[
  {
    "id": 1,
    "email": "admin@toktickit.local",
    "name": "System Admin",
    "role": "ADMINISTRATOR",
    "isActive": true,
    "mustChangePassword": false,
    "createdAt": "2026-09-01T00:00:00.000Z"
  }
]
```
- **Error Responses**:
  - `403 Forbidden`: Request made by a Requester user.

---

### `POST /api/users`
Creates a new user account.

- **Access**: `ADMINISTRATOR`
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "johndoe@toktickit.local",
  "role": "IT_STAFF",
  "initialPassword": "Password123!"
}
```
- **Response (201 Created)**:
```json
{
  "user": {
    "id": 10,
    "name": "John Doe",
    "email": "johndoe@toktickit.local",
    "role": "IT_STAFF",
    "isActive": true,
    "mustChangePassword": true
  }
}
```
- **Error Responses**:
  - `409 Conflict`: Email already exists.
  - `400 Bad Request`: Missing fields or invalid password complexity.

---

### `PATCH /api/users/:id`
Updates basic user details (name, email, role, active status).

- **Access**: `ADMINISTRATOR`
- **Request Body**:
```json
{
  "name": "Johnathan Doe",
  "email": "johndoe@toktickit.local",
  "role": "IT_STAFF",
  "isActive": false
}
```
- **Response (200 OK)**:
Returns updated user object.
- **Error Responses**:
  - `400 Bad Request`: Self-deactivation by Admin, or deactivating the last active Admin.

---

### `POST /api/users/:id/reset-password`
Assigns a new initial password to a user account.

- **Access**: `ADMINISTRATOR`
- **Request Body**:
```json
{
  "initialPassword": "NewInitialPass123!"
}
```
- **Response (200 OK)**:
```json
{
  "message": "Initial password set successfully",
  "mustChangePassword": true
}
```
