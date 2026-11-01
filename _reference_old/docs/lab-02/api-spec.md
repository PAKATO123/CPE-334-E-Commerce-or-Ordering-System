# TokTickIT — Lab 2 API Specification

## 1. API Conventions

### 1.1 Base URL

All Lab 2 REST endpoints use:

`/api`

### 1.2 Content Type

JSON endpoints use:

`Content-Type: application/json`

Attachment upload endpoints use:

`multipart/form-data`

Attachment download responses use the attachment's stored MIME type.

### 1.3 Requester Context

Lab 2 does not use authentication.

The currently selected Development Requester is supplied explicitly using `requesterId`. This value represents the temporary testing context only and must not be treated as an authenticated identity.

The backend must use the supplied `requesterId` to scope all requester-facing Ticket and Attachment operations.

The API must not accept a Requester identity from a Ticket object or Attachment object when that identity can instead be derived from the selected Ticket. Ownership must be determined from the database relationship.

### 1.4 Common Error Response

All expected API errors use the following structure:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted ticket data is invalid.",
    "details": [
      {
        "field": "description",
        "message": "Description must contain at least 20 characters."
      }
    ]
  }
}
```

`details` is omitted when the error does not require field-level information.

Error messages must be safe for end users and must not expose stack traces, SQL errors, database details, filesystem paths, or other internal implementation information.

---

## 2. HTTP Status Codes

| Status                       | Usage                                                                   |
| ---------------------------- | ----------------------------------------------------------------------- |
| `200 OK`                     | Successful retrieval, update, download, or soft removal                 |
| `201 Created`                | Successful creation of a Ticket or Attachment                           |
| `400 Bad Request`            | Invalid request structure or invalid parameter value                    |
| `403 Forbidden`              | Resource exists but belongs to another Requester                        |
| `404 Not Found`              | Requested resource does not exist                                       |
| `409 Conflict`               | Request cannot be completed because of a resource/state conflict        |
| `413 Payload Too Large`      | Attachment exceeds the 5 MB limit                                       |
| `415 Unsupported Media Type` | Attachment type is not permitted                                        |
| `422 Unprocessable Entity`   | Request structure is valid but supplied values fail business validation |
| `429 Too Many Requests`      | Ticket creation attempted within the 15-second requester cooldown       |
| `500 Internal Server Error`  | Unexpected server-side failure                                          |

---

# 3. Reference Data APIs

## 3.1 Get Active Development Requesters

### `GET /api/requesters`

Returns all active Development Requesters available for the Lab 2 testing selector.

Inactive Requesters must not be returned.

### Query Parameters

None.

### Success — `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "name": "Alice Chen",
      "email": "alice.chen@example.com",
      "department": "Engineering"
    },
    {
      "id": 2,
      "name": "Bob Smith",
      "email": "bob.smith@example.com",
      "department": "Marketing"
    }
  ]
}
```

The API does not return inactive Requesters.

### Failure

`500 Internal Server Error`

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unable to load Development Requesters."
  }
}
```

An empty active Requester table is a successful response with an empty `data` array. The frontend is responsible for displaying the required empty state.

---

## 3.2 Get Active Categories

### `GET /api/categories`

Returns active Ticket Categories for Ticket creation.

### Success — `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "name": "Account and Access"
    },
    {
      "id": 2,
      "name": "Hardware"
    },
    {
      "id": 3,
      "name": "Software"
    },
    {
      "id": 4,
      "name": "Network"
    }
  ]
}
```

Inactive Categories are not returned.

---

## 3.3 Get Active Related Systems

### `GET /api/related-systems`

Returns active Related Systems for Ticket creation.

### Success — `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "name": "Email & Collaboration",
      "description": "Email and collaboration services."
    },
    {
      "id": 2,
      "name": "VPN & Remote Access",
      "description": "Remote network access services."
    }
  ]
}
```

Inactive Related Systems are not returned.

---

# 4. Ticket Creation API

## 4.1 Create Ticket

### `POST /api/tickets`

Creates one Ticket for the selected Development Requester.

The endpoint accepts Ticket fields and optional initial attachments in one multipart request.

Initial Ticket and Attachment creation is atomic. If any attachment fails validation or persistence, the Ticket creation transaction must fail and no Ticket record or partial Attachment records may remain.

### Request

`Content-Type: multipart/form-data`

Required form fields:

| Field               | Type    | Required | Rules                                                                  |
| ------------------- | ------- | -------: | ---------------------------------------------------------------------- |
| `requesterId`       | Integer |      Yes | Must identify an active Development Requester                          |
| `categoryId`        | Integer |      Yes | Must identify an active Category                                       |
| `relatedSystemId`   | Integer |      Yes | Must identify an active Related System                                 |
| `summary`           | String  |      Yes | Maximum 255 characters                                                 |
| `description`       | String  |      Yes | Minimum 20 characters                                                  |
| `requestedPriority` | String  |       No | `URGENT`, `HIGH`, `MEDIUM`, `LOW`; omitted means no requested priority |
| `attachments`       | File[]  |       No | Maximum 5 active files; each maximum 5 MB                              |

Example conceptual request:

```text
requesterId=1
categoryId=2
relatedSystemId=1
summary=Laptop cannot connect to email
description=My laptop cannot connect to the company email service.
requestedPriority=HIGH
attachments=<file>
```

### Validation

The backend must validate all fields regardless of frontend validation.

Validation failures include:

* missing `requesterId`;
* missing `categoryId`;
* missing `relatedSystemId`;
* missing `summary`;
* missing `description`;
* `summary` exceeding 255 characters;
* `description` containing fewer than 20 characters;
* invalid `requestedPriority`;
* requester does not exist or is inactive;
* category does not exist or is inactive;
* related system does not exist or is inactive;
* more than 5 attachments;
* unsupported attachment type;
* attachment larger than 5 MB.

### Duplicate Submission Throttling

A Ticket creation request is subject to the 15-second requester cooldown defined by `BR-18`.

If the same `requesterId` submits another Ticket creation request within the cooldown period, the backend returns:

`429 Too Many Requests`

```json
{
  "error": {
    "code": "TICKET_CREATION_RATE_LIMITED",
    "message": "You are submitting tickets too quickly. Please wait before trying again."
  }
}
```

The cooldown is enforced server-side and must not rely only on the frontend button state.

### Success — `201 Created`

```json
{
  "data": {
    "id": 1,
    "ticketNumber": "TICK-2026-0001",
    "requesterId": 1,
    "category": {
      "id": 2,
      "name": "Hardware"
    },
    "relatedSystem": {
      "id": 1,
      "name": "Email & Collaboration"
    },
    "summary": "Laptop cannot connect to email",
    "description": "My laptop cannot connect to the company email service.",
    "requestedPriority": "HIGH",
    "currentStatus": "New",
    "createdAt": "2026-08-26T09:00:00.000Z",
    "updatedAt": "2026-08-26T09:00:00.000Z",
    "attachments": [
      {
        "id": 1,
        "fileName": "error.png",
        "contentType": "image/png",
        "fileSize": 183421,
        "createdAt": "2026-08-26T09:00:00.000Z"
      }
    ]
  }
}
```

The official Ticket Number is generated by the backend and is never supplied by the client.

### Failure — `400 Bad Request`

Used when the request structure or parameter format is invalid.

### Failure — `422 Unprocessable Entity`

Used when supplied values fail Ticket business validation.

Example:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The submitted ticket data is invalid.",
    "details": [
      {
        "field": "description",
        "message": "Description must contain at least 20 characters."
      }
    ]
  }
}
```

### Failure — `413 Payload Too Large`

Returned when an attachment exceeds 5 MB.

### Failure — `415 Unsupported Media Type`

Returned when an attachment is not JPG/JPEG, PNG, WEBP, or PDF.

### Failure — `429 Too Many Requests`

Returned when the requester is within the 15-second Ticket creation cooldown.

### Failure — `500 Internal Server Error`

Returned for unexpected failures.

If initial attachment creation fails for any reason, the Ticket creation transaction is rolled back.

---

# 5. My Tickets API

## 5.1 Retrieve Requester's Tickets

### `GET /api/tickets`

Returns a paginated list of Tickets belonging only to the selected Development Requester.

### Query Parameters

| Parameter         | Required | Description                       |
| ----------------- | -------: | --------------------------------- |
| `requesterId`     |      Yes | Current Development Requester     |
| `search`          |       No | Case-insensitive substring search |
| `status`          |       No | Filter by Current Status          |
| `priority`        |       No | Filter by Requested Priority      |
| `categoryId`      |       No | Filter by Category                |
| `relatedSystemId` |       No | Filter by Related System          |
| `sortBy`          |       No | `priority` or `status`            |
| `sortDirection`   |       No | `asc` or `desc`                   |
| `page`            |       No | 1-based page number; default `1`  |
| `pageSize`        |       No | `10`, `25`, or `50`; default `10` |

Example:

`GET /api/tickets?requesterId=1&search=laptop&priority=HIGH&sortBy=priority&sortDirection=asc&page=1&pageSize=10`

### Search Behavior

`search` performs case-insensitive substring matching against:

* `ticketNumber`
* `summary`
* `description`

Search is restricted to the selected Requester's Tickets.

### Filtering

The following filters are supported:

* `status`
* `priority`
* `categoryId`
* `relatedSystemId`

Each filter accepts one value. Multiple different filter categories may be used simultaneously.

### Sorting

`sortBy=priority` applies:

1. Requested Priority
2. Current Status
3. Ticket Number

`sortBy=status` applies:

1. Current Status
2. Requested Priority
3. Ticket Number

The requested sort direction applies consistently to all three levels.

Priority ranking is:

`URGENT` → `HIGH` → `MEDIUM` → `LOW` → unassigned

Unassigned Requested Priority is always ranked after assigned priorities within the same sort direction according to the defined priority ranking.

If `sortBy` is omitted, the API uses Requested Priority as the default primary sort followed by Current Status and Ticket Number.

If `sortDirection` is omitted, the default is `asc`.

### Pagination

Pagination is applied after requester filtering, search, filtering, and sorting.

`page` starts at `1`.

Permitted `pageSize` values are:

* `10`
* `25`
* `50`

### Success — `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "ticketNumber": "TICK-2026-0001",
      "summary": "Laptop cannot connect to email",
      "category": {
        "id": 2,
        "name": "Hardware"
      },
      "relatedSystem": {
        "id": 1,
        "name": "Email & Collaboration"
      },
      "requestedPriority": "HIGH",
      "currentStatus": "New",
      "createdAt": "2026-08-26T09:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

### Invalid Query Parameters — `400 Bad Request`

Examples:

* `page=0`
* `page=-1`
* `pageSize=15`
* invalid `sortBy`
* invalid `sortDirection`
* malformed IDs

Example:

```json
{
  "error": {
    "code": "INVALID_QUERY",
    "message": "One or more query parameters are invalid."
  }
}
```

### Requester Not Found — `404 Not Found`

```json
{
  "error": {
    "code": "REQUESTER_NOT_FOUND",
    "message": "The selected Development Requester could not be found."
  }
}
```

### Failure — `500 Internal Server Error`

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "Unable to load tickets."
  }
}
```

An existing Requester with no Tickets is a successful response with:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "totalItems": 0,
    "totalPages": 0,
    "hasPreviousPage": false,
    "hasNextPage": false
  }
}
```

---

# 6. Ticket Detail API

## 6.1 Retrieve Owned Ticket

### `GET /api/tickets/:ticketId?requesterId=:requesterId`

Retrieves the full Ticket Detail for a Ticket owned by the selected Development Requester.

### Ownership Check

The backend must verify:

`Ticket.requesterId === requesterId`

The check must occur before returning Ticket data.

### Success — `200 OK`

```json
{
  "data": {
    "id": 1,
    "ticketNumber": "TICK-2026-0001",
    "requester": {
      "id": 1,
      "name": "Alice Chen"
    },
    "category": {
      "id": 2,
      "name": "Hardware"
    },
    "relatedSystem": {
      "id": 1,
      "name": "Email & Collaboration"
    },
    "summary": "Laptop cannot connect to email",
    "description": "My laptop cannot connect to the company email service.",
    "requestedPriority": "HIGH",
    "currentStatus": "New",
    "createdAt": "2026-08-26T09:00:00.000Z",
    "updatedAt": "2026-08-26T09:00:00.000Z",
    "attachments": [
      {
        "id": 1,
        "fileName": "error.png",
        "contentType": "image/png",
        "fileSize": 183421,
        "createdAt": "2026-08-26T09:00:00.000Z"
      }
    ]
  }
}
```

Only active attachments are included.

Soft-deleted attachments are excluded.

### Ownership Failure — `403 Forbidden`

If the Ticket belongs to another Requester:

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this ticket."
  }
}
```

The response must not expose the other Requester's Ticket data.

### Missing Ticket — `404 Not Found`

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "The requested ticket could not be found."
  }
}
```

---

# 7. Attachment APIs

## 7.1 Add Attachment to Existing Ticket

### `POST /api/tickets/:ticketId/attachments`

Adds an attachment to an existing Ticket.

### Request

`Content-Type: multipart/form-data`

Required:

`requesterId`

`file`

### Validation

The backend must verify:

1. Ticket exists.
2. Ticket belongs to `requesterId`.
3. Attachment is an allowed type.
4. Attachment is no larger than 5 MB.
5. Ticket currently has fewer than 5 active attachments.

Allowed types:

* JPG/JPEG
* PNG
* WEBP
* PDF

The server must validate the uploaded file rather than trusting the client-provided filename or MIME type alone.

### Ownership Failure — `403 Forbidden`

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to modify this ticket."
  }
}
```

### Ticket Not Found — `404 Not Found`

```json
{
  "error": {
    "code": "TICKET_NOT_FOUND",
    "message": "The requested ticket could not be found."
  }
}
```

### Attachment Limit — `409 Conflict`

```json
{
  "error": {
    "code": "ATTACHMENT_LIMIT_REACHED",
    "message": "This ticket already has the maximum number of active attachments."
  }
}
```

### Oversized File — `413 Payload Too Large`

```json
{
  "error": {
    "code": "ATTACHMENT_TOO_LARGE",
    "message": "The attachment exceeds the 5 MB size limit."
  }
}
```

### Unsupported File — `415 Unsupported Media Type`

```json
{
  "error": {
    "code": "ATTACHMENT_TYPE_NOT_ALLOWED",
    "message": "This attachment type is not supported."
  }
}
```

### Success — `201 Created`

```json
{
  "data": {
    "id": 2,
    "ticketId": 1,
    "fileName": "network-error.pdf",
    "contentType": "application/pdf",
    "fileSize": 438211,
    "createdAt": "2026-08-26T09:30:00.000Z"
  }
}
```

---

## 7.2 Retrieve Attachment Metadata

### `GET /api/tickets/:ticketId/attachments`

Returns active Attachment metadata belonging to the selected Requester's Ticket.

### Query Parameters

`requesterId` — required.

### Success — `200 OK`

```json
{
  "data": [
    {
      "id": 1,
      "fileName": "error.png",
      "contentType": "image/png",
      "fileSize": 183421,
      "createdAt": "2026-08-26T09:00:00.000Z"
    }
  ]
}
```

Soft-deleted Attachments are excluded.

Ownership and missing-resource behavior follows the Ticket Detail ownership rules.

---

## 7.3 Download Active Attachment

### `GET /api/attachments/:attachmentId/download?requesterId=:requesterId`

Downloads the binary contents of an active Attachment.

### Ownership Check

The backend must resolve:

`Attachment → Ticket → Requester`

and verify that the Ticket belongs to `requesterId`.

### Success — `200 OK`

Response body contains the stored binary data.

Response headers include:

```text
Content-Type: <stored content type>
Content-Disposition: attachment; filename="<safe filename>"
Content-Length: <file size>
```

The server must provide the stored attachment using a safe filename representation.

### Ownership Failure — `403 Forbidden`

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this attachment."
  }
}
```

### Missing or Removed Attachment — `404 Not Found`

```json
{
  "error": {
    "code": "ATTACHMENT_NOT_FOUND",
    "message": "The requested attachment could not be found."
  }
}
```

Soft-deleted Attachments must behave as unavailable resources and must never be downloaded.

---

## 7.4 Preview Active Attachment

### `GET /api/attachments/:attachmentId/preview?requesterId=:requesterId`

Previews the binary contents of an active Attachment inline in browser or preview modal.

### Ownership Check

The backend must resolve `Attachment → Ticket → Requester` and verify that the Ticket belongs to `requesterId`.

### Success — `200 OK`

Response body contains the stored binary data with inline disposition:

```text
Content-Type: <stored content type>
Content-Disposition: inline; filename="<safe filename>"
Content-Length: <file size>
```

### Soft-Deleted Attachment — `404 Not Found`

Soft-deleted attachments cannot be previewed and return `404 ATTACHMENT_NOT_FOUND`.

---

## 7.5 Soft-Remove Attachment

### `DELETE /api/attachments/:attachmentId`

Soft-removes an Attachment belonging to the selected Requester's Ticket, requiring a non-empty removal reason.

### Request

`Content-Type: application/json`

```json
{
  "requesterId": 1,
  "reason": "Uploaded wrong file version"
}
```

`reason` is required and must contain at least 1 non-whitespace character.

### Behavior

The API sets:

```text
isDeleted = true
removalReason = reason.trim()
deletedAt = current timestamp
```

The binary data remains stored in the database but becomes inaccessible for downloading or previewing.

In Ticket Detail, soft-deleted attachments remain visible at the bottom of the attachment list with `isDeleted: true`, `removalReason`, and `deletedAt` for requester rendering.

### Success — `200 OK`

```json
{
  "data": {
    "id": 1,
    "isDeleted": true,
    "removalReason": "Uploaded wrong file version",
    "deletedAt": "2026-09-03T10:00:00.000Z"
  }
}
```

### Validation Error — `422 Unprocessable Entity`

If `reason` is missing or empty:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Removal reason is required.",
    "details": [
      {
        "field": "reason",
        "message": "Removal reason is required."
      }
    ]
  }
}
```

### Ownership Failure — `403 Forbidden`

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to remove this attachment."
  }
}
```

### Missing or Already Removed Attachment — `404 Not Found`

```json
{
  "error": {
    "code": "ATTACHMENT_NOT_FOUND",
    "message": "The requested attachment could not be found."
  }
}
```

The frontend is responsible for displaying the required removal confirmation before sending this request.

---

# 8. Ownership Rules

Every requester-facing Ticket API must enforce ownership server-side.

For operations involving a Ticket:

```text
Ticket.requesterId === requesterId
```

For operations involving an Attachment:

```text
Attachment.ticket.requesterId === requesterId
```

A client must never be able to bypass ownership by changing an ID in the URL or request body.

The following operations require ownership verification:

* Ticket Detail retrieval;
* Attachment metadata retrieval;
* Attachment upload;
* Attachment download;
* Attachment soft removal.

Cross-Requester access returns `403 Forbidden`.

The API must not rely on the frontend hiding inaccessible Tickets as an ownership mechanism.

---

# 9. Validation Authority

Frontend validation exists for immediate user feedback.

Backend validation is authoritative.

Every Ticket and Attachment constraint defined in `specification.md` must be checked by the API even if the frontend already performed the same validation.

This includes:

* required Ticket fields;
* Summary maximum length;
* Description minimum length;
* allowed Requested Priority values;
* active reference-data validation;
* attachment file type;
* attachment size;
* maximum active attachment count;
* Ticket ownership;
* Ticket creation throttling.

---

# 10. API-to-Requirement Traceability

| API Capability                                | Requirement                      |
| --------------------------------------------- | -------------------------------- |
| `GET /api/requesters`                         | FR-02, BR-04                     |
| `GET /api/categories`                         | FR-31                            |
| `GET /api/related-systems`                    | FR-32                            |
| `POST /api/tickets`                           | FR-08–FR-14, BR-01–BR-19         |
| `GET /api/tickets`                            | FR-15–FR-20, BR-20–BR-25         |
| `GET /api/tickets/:ticketId`                  | FR-21–FR-24, BR-09–BR-10         |
| `POST /api/tickets/:ticketId/attachments`     | FR-25–FR-27, BR-26–BR-29         |
| `GET /api/tickets/:ticketId/attachments`      | FR-27, BR-09, BR-31              |
| `GET /api/attachments/:attachmentId/download` | FR-28, FR-30, BR-09–BR-10, BR-31 |
| `DELETE /api/attachments/:attachmentId`       | FR-29–FR-30, BR-30–BR-31         |

---

# 11. API Design Decisions

### AD-API-01 — Explicit Requester Context

Because Lab 2 has no authentication, `requesterId` is explicitly supplied by the frontend as the temporary testing context. This represents the selected Development Requester and must not be considered authentication.

### AD-API-02 — Atomic Initial Ticket Creation

Initial attachments are submitted together with Ticket creation through `POST /api/tickets`. Ticket and Attachment persistence must succeed or fail as one transaction, preventing orphaned Tickets when an initial attachment fails.

### AD-API-03 — Server-Side Pagination

Search, filtering, sorting, and pagination are performed by the backend. Pagination is applied after requester scoping, search, filtering, and sorting so that the returned page represents the correct subset of the Requester's Tickets.

### AD-API-04 — Ownership at Resource Boundary

Ownership is checked by the backend for every Ticket and Attachment operation rather than relying on the frontend's currently displayed list.

### AD-API-05 — Soft Removal

Attachment removal uses a soft-delete flag. Removed Attachments remain database records but are excluded from requester-facing retrieval and cannot be downloaded.

### AD-API-06 — No Attachment Preview API

Lab 2 explicitly excludes Attachment preview. The API therefore provides metadata and download operations only.

### AD-API-07 — Safe Error Responses

Expected API failures use stable error codes and user-safe messages. Internal database, filesystem, and server implementation details are never returned to the client.


### Minor Implementation Tips to Keep in Mind
## DELETE /api/attachments/:id Requester Parameter:

Section 7.4 specifies requesterId in a JSON body for DELETE. In HTTP clients (like fetch or axios) and some proxy configurations, DELETE bodies can occasionally be omitted or require explicit parser middleware.

Tip: It is good practice in Express to accept requesterId from either the request body or query parameters (e.g. req.body.requesterId ?? req.query.requesterId).

## Priority Value Case Insensitivity:

Priority in creation is specified as URGENT, HIGH, MEDIUM, LOW, while UI displays Urgent, High, etc.

Tip: Ensure the backend validation normalizes string input case-insensitively before checking validity or persisting.