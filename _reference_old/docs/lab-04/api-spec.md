# TokTickIT — Lab 4 API Specification
Actions Taken, Operational Dashboards, and Ticket Lifecycle APIs

This document details the REST API endpoints for Actions Taken management, role-based operational dashboards, ticket status lifecycle rules, and authorization enforcement.

---

## 1. Actions Taken APIs

### `GET /api/tickets/:ticketId/actions-taken`
Retrieves all Actions Taken records associated with a specific ticket.

- **Access**: Authenticated users (`REQUESTER` on owned tickets only; `IT_STAFF` and `ADMINISTRATOR` on all accessible tickets).
- **URL Parameters**:
  - `ticketId`: String (CUID/UUID of the ticket).
- **Response (200 OK)**:
```json
{
  "actionsTaken": [
    {
      "id": "act_clx123abc456",
      "ticketId": "tkt_clx999xyz789",
      "actionDate": "2026-09-28T14:30:00.000Z",
      "description": "Replaced faulty RAM module in slot 2 and ran memory diagnostic sweep.",
      "result": "Memory diagnostic passed with 0 errors. System stability confirmed.",
      "performedBy": {
        "id": "usr_staff01",
        "name": "Jane Staff",
        "email": "staff1@toktickit.local",
        "role": "IT_STAFF"
      },
      "followUpRequired": true,
      "followUpNote": "Schedule follow-up check in 48 hours to confirm zero BSOD events under heavy load.",
      "attachmentNotes": "RAM diagnostic report screenshot (ram_diag_pass.png)",
      "createdAt": "2026-09-28T14:35:10.000Z",
      "updatedAt": "2026-09-28T14:35:10.000Z"
    }
  ]
}
```
- **Error Responses**:
  - `401 Unauthorized`: Missing or invalid session authentication.
  - `403 Forbidden`: Authenticated Requester attempting to view Actions Taken on a ticket owned by another user.
  - `404 Not Found`: Specified ticket ID does not exist.

---

### `POST /api/tickets/:ticketId/actions-taken`
Creates a new Action Taken record under a ticket.

- **Access**: `IT_STAFF` or `ADMINISTRATOR` role required. (`REQUESTER` calls return `403 Forbidden`).
- **URL Parameters**:
  - `ticketId`: String (CUID/UUID of the target ticket).
- **Request Body**:
```json
{
  "actionDate": "2026-09-28T15:00:00.000Z",
  "description": "Reconfigured local printer drivers and cleared print spooler cache.",
  "result": "Test page printed successfully.",
  "followUpRequired": false,
  "followUpNote": "",
  "attachmentNotes": "spooler_log.txt attached in attachments tab"
}
```
- **Server Binding Rule**: `performedById` is automatically bound to `req.session.user.id` on the server. Any client-submitted user ID field is ignored.
- **Validation Rules**:
  - `description`: String (Required, min 3 characters).
  - `result`: String (Required, min 3 characters).
  - `followUpRequired`: Boolean (Required).
  - `followUpNote`: String (Mandatory when `followUpRequired == true`; must not be empty or whitespace).
- **Response (201 Created)**:
```json
{
  "actionTaken": {
    "id": "act_clx456def789",
    "ticketId": "tkt_clx999xyz789",
    "actionDate": "2026-09-28T15:00:00.000Z",
    "description": "Reconfigured local printer drivers and cleared print spooler cache.",
    "result": "Test page printed successfully.",
    "performedById": "usr_staff01",
    "followUpRequired": false,
    "followUpNote": null,
    "attachmentNotes": "spooler_log.txt attached in attachments tab",
    "createdAt": "2026-09-28T15:02:00.000Z",
    "updatedAt": "2026-09-28T15:02:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Missing required fields, or `followUpRequired` is true but `followUpNote` is blank.
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: Authenticated Requester attempting to create Action Taken.
  - `404 Not Found`: Ticket ID does not exist.
  - `409 Conflict`: Ticket is in a terminal status (`Cancelled`).

---

### `PUT /api/tickets/:ticketId/actions-taken/:actionId`
Updates an existing Action Taken record.

- **Access**: `IT_STAFF` or `ADMINISTRATOR` role.
- **URL Parameters**:
  - `ticketId`: String (CUID/UUID of target ticket).
  - `actionId`: String (CUID/UUID of target Action Taken record).
- **Request Body**:
```json
{
  "description": "Updated action details after secondary diagnostic.",
  "result": "System operating nominally.",
  "followUpRequired": true,
  "followUpNote": "Monitor CPU thermals tomorrow morning.",
  "attachmentNotes": "thermal_sweep.png"
}
```
- **Response (200 OK)**:
```json
{
  "actionTaken": {
    "id": "act_clx456def789",
    "ticketId": "tkt_clx999xyz789",
    "description": "Updated action details after secondary diagnostic.",
    "result": "System operating nominally.",
    "performedById": "usr_staff01",
    "followUpRequired": true,
    "followUpNote": "Monitor CPU thermals tomorrow morning.",
    "attachmentNotes": "thermal_sweep.png",
    "updatedAt": "2026-09-28T15:15:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Validation failure on required fields or follow-up note rules.
  - `401 Unauthorized`: Unauthenticated request.
  - `403 Forbidden`: Requester role access attempt.
  - `404 Not Found`: Action Taken record or ticket not found.

---

## 2. Role Dashboard APIs

### `GET /api/dashboard/requester`
Retrieves operational dashboard metrics and recent ticket summaries for the authenticated Requester.

- **Access**: Authenticated `REQUESTER` (or `ADMINISTRATOR` testing requester perspective).
- **Response (200 OK)**:
```json
{
  "metrics": {
    "totalOpenTickets": 3,
    "waitingForRequesterCount": 1,
    "recentlyUpdatedCount": 4,
    "recentlyResolvedCount": 2
  },
  "recentlyUpdatedTickets": [
    {
      "id": "tkt_101",
      "ticketNumber": "TKT-2026-0101",
      "summary": "VPN connection drops every 10 minutes",
      "category": "NETWORK",
      "requestedPriority": "HIGH",
      "itPriority": "HIGH",
      "status": "WAITING_FOR_REQUESTER",
      "updatedAt": "2026-09-28T14:10:00.000Z"
    }
  ],
  "recentlyResolvedTickets": [
    {
      "id": "tkt_088",
      "ticketNumber": "TKT-2026-0088",
      "summary": "Password reset for legacy payroll portal",
      "status": "RESOLVED",
      "resolvedAt": "2026-09-27T11:00:00.000Z"
    }
  ]
}
```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated.

---

### `GET /api/dashboard/staff`
Retrieves operational dashboard metrics and queue alerts for IT Staff.

- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Response (200 OK)**:
```json
{
  "metrics": {
    "unassignedTicketsCount": 5,
    "myOwnedTicketsCount": 8,
    "urgentAndHighPriorityCount": 4,
    "followUpRequiredCount": 3
  },
  "statusBreakdown": {
    "NEW": 3,
    "OPEN": 2,
    "IN_PROGRESS": 6,
    "WAITING_FOR_REQUESTER": 4,
    "RESOLVED": 5,
    "CLOSED": 12,
    "REOPENED": 1,
    "CANCELLED": 2
  },
  "priorityBreakdown": {
    "URGENT": 2,
    "HIGH": 4,
    "MEDIUM": 10,
    "LOW": 5
  },
  "recentlyUpdatedTickets": [
    {
      "id": "tkt_105",
      "ticketNumber": "TKT-2026-0105",
      "summary": "Core switch port flap in BIdg B",
      "itPriority": "URGENT",
      "status": "IN_PROGRESS",
      "assignedTo": {
        "id": "usr_staff01",
        "name": "Jane Staff"
      },
      "updatedAt": "2026-09-28T16:00:00.000Z"
    }
  ]
}
```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: Requester accessing staff dashboard.

---

### `GET /api/dashboard/admin`
Retrieves Administrator dashboard metrics incorporating IT Staff metrics and user account statistics.

- **Access**: `ADMINISTRATOR` role required.
- **Response (200 OK)**:
```json
{
  "staffMetrics": {
    "unassignedTicketsCount": 5,
    "myOwnedTicketsCount": 2,
    "urgentAndHighPriorityCount": 4,
    "followUpRequiredCount": 3
  },
  "userAccountMetrics": {
    "totalUsers": 25,
    "activeRequesters": 18,
    "activeITStaff": 5,
    "activeAdministrators": 2,
    "inactiveUsers": 1
  }
}
```
- **Error Responses**:
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: Non-Admin accessing admin dashboard.

---

## 3. Ticket Status Transition API

### `PATCH /api/tickets/:ticketId/status`
Updates ticket status following the permitted state transition matrix.

- **Access**: `IT_STAFF` or `ADMINISTRATOR`.
- **Request Body**:
```json
{
  "status": "RESOLVED"
}
```
- **Transition Rule**:
  - Validates that target status transition is permitted from current status according to the state transition matrix.
  - IT Staff and Administrators may transition status to `RESOLVED` or `CLOSED` at any time without gating prerequisites.
- **Response (200 OK)**:
```json
{
  "ticket": {
    "id": "tkt_101",
    "status": "RESOLVED",
    "updatedAt": "2026-09-28T16:20:00.000Z"
  }
}
```
- **Error Responses**:
  - `400 Bad Request`: Unpermitted status transition attempt.
  - `401 Unauthorized`: Unauthenticated.
  - `403 Forbidden`: Requester role.
  - `409 Conflict`: Stale update conflict.
