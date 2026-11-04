import { Requester } from "./types/requester";
import { SessionUser, LoginCredentials, ChangePasswordPayload } from "./types/auth";

export const API_BASE_URL = import.meta.env.VITE_API_URL ?? "";

export interface Category {
  id: number;
  name: string;
}

export interface RelatedSystem {
  id: number;
  name: string;
  description?: string | null;
}

// ---------------------------------------------------------------------------
// Authentication & Session API Calls
// ---------------------------------------------------------------------------

export async function loginApi(credentials: LoginCredentials): Promise<{ user: SessionUser }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials),
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Invalid credentials.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}

export async function logoutApi(): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error?.message || "Logout failed.");
  }
}

export async function getMeApi(): Promise<{ user: SessionUser }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
    method: "GET",
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Not authenticated.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}

export async function changePasswordApi(payload: ChangePasswordPayload): Promise<{ user: SessionUser; message: string }> {
  const res = await fetch(`${API_BASE_URL}/api/auth/change-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to change password.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json;
}

// ---------------------------------------------------------------------------
// Reference Data & Ticket APIs
// ---------------------------------------------------------------------------

export async function getRequesters(): Promise<Requester[]> {
  const res = await fetch(`${API_BASE_URL}/api/requesters`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Unable to load Development Requesters.");
  }
  const json = await res.json();
  return json.data || [];
}

export async function getRelatedSystems(): Promise<RelatedSystem[]> {
  const res = await fetch(`${API_BASE_URL}/api/related-systems`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Unable to load Related Systems.");
  }
  const json = await res.json();
  return json.data || [];
}

export async function getCategories(): Promise<Category[]> {
  const res = await fetch(`${API_BASE_URL}/api/categories`, { credentials: "include" });
  if (!res.ok) {
    throw new Error("Unable to load Categories.");
  }
  const json = await res.json();
  return json.data || [];
}

export async function getNextTicketNumber(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/tickets/next-number`, { credentials: "include" });
    if (!res.ok) return "TICK-2026-XXXX";
    const json = await res.json();
    return json.data?.nextTicketNumber || "TICK-2026-XXXX";
  } catch {
    return "TICK-2026-XXXX";
  }
}

export interface AttachmentMeta {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  isDeleted?: boolean;
  removalReason?: string | null;
  deletedAt?: string | null;
  createdAt: string;
}

export interface TicketDetailData {
  id: number;
  ticketNumber: string;
  requesterId: number;
  requester?: Requester;
  category: Category;
  relatedSystem: RelatedSystem;
  summary: string;
  description: string;
  requestedPriority: string | null;
  itPriority?: string | null;
  currentStatus: string;
  isRequesterResolved?: boolean;
  assignedToId?: number | null;
  assignedTo?: { id: number; name: string; email: string } | null;
  createdAt: string;
  updatedAt: string;
  attachments: AttachmentMeta[];
}

export async function getTicketDetail(id: number | string, requesterId?: number): Promise<TicketDetailData> {
  const query = requesterId ? `?requesterId=${requesterId}` : "";
  const res = await fetch(`${API_BASE_URL}/api/tickets/${id}${query}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to load ticket detail.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export async function requestResolutionIndication(ticketId: number): Promise<TicketDetailData> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/resolve-indication`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to request resolution.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export interface StaffQueueTicketItem {
  id: number;
  ticketNumber: string;
  summary: string;
  description: string;
  currentStatus: string;
  requestedPriority: string | null;
  itPriority: string | null;
  isRequesterResolved: boolean;
  createdAt: string;
  updatedAt?: string;
  hasFollowUpRequired?: boolean;
  category: { id: number; name: string };
  relatedSystem: { id: number; name: string };
  requester: { id: number; name: string; email: string };
  assignedTo: { id: number; name: string; email: string } | null;
  _count?: {
    attachments: number;
    publicComments: number;
    internalNotes: number;
  };
}

export interface StaffQueueParams {
  search?: string;
  status?: string;
  itPriority?: string;
  assignment?: string;
  followUp?: string;
  categoryId?: string | number;
  relatedSystemId?: string | number;
  sortBy?: string;
  sortDirection?: string;
  page?: number;
  pageSize?: number;
}

export interface StaffQueueResponse {
  data: StaffQueueTicketItem[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export async function getStaffQueue(params: StaffQueueParams = {}): Promise<StaffQueueResponse> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.append("search", params.search.trim());
  if (params.status) query.append("status", params.status);
  if (params.itPriority) query.append("itPriority", params.itPriority);
  if (params.assignment) query.append("assignment", params.assignment);
  if (params.followUp) query.append("followUp", params.followUp);
  if (params.categoryId) query.append("categoryId", String(params.categoryId));
  if (params.relatedSystemId) query.append("relatedSystemId", String(params.relatedSystemId));
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortDirection) query.append("sortDirection", params.sortDirection);
  if (params.page) query.append("page", String(params.page));
  if (params.pageSize) query.append("pageSize", String(params.pageSize));

  const res = await fetch(`${API_BASE_URL}/api/tickets/staff-queue?${query.toString()}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to load IT staff queue.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return {
    data: json.data || [],
    pagination: json.pagination || json.meta || {
      total: json.data?.length || 0,
      page: params.page || 1,
      pageSize: params.pageSize || 10,
      totalPages: 1,
      hasPreviousPage: false,
      hasNextPage: false,
    },
  };
}

export async function addAttachmentToTicket(ticketId: number, requesterId: number, file: File): Promise<AttachmentMeta> {
  const formData = new FormData();
  formData.append("requesterId", String(requesterId));
  formData.append("file", file);

  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/attachments`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to add attachment.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export async function deleteAttachment(attachmentId: number, requesterId: number, reason: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/api/attachments/${attachmentId}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ requesterId, reason }),
    credentials: "include",
  });

  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to remove attachment.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export function getAttachmentDownloadUrl(attachmentId: number, requesterId?: number): string {
  const query = requesterId ? `?requesterId=${requesterId}` : "";
  return `${API_BASE_URL}/api/attachments/${attachmentId}/download${query}`;
}

export function getAttachmentPreviewUrl(attachmentId: number, requesterId?: number): string {
  const query = requesterId ? `?requesterId=${requesterId}` : "";
  return `${API_BASE_URL}/api/attachments/${attachmentId}/preview${query}`;
}

// ---------------------------------------------------------------------------
// Staff Ticket Management & Communication APIs (F-08)
// ---------------------------------------------------------------------------

export async function claimTicket(ticketId: number): Promise<TicketDetailData> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/claim`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to claim ticket.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export async function assignTicket(ticketId: number, assignedToId: number | null): Promise<TicketDetailData> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/assign`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ assignedToId }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to assign ticket.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export async function updateItPriority(ticketId: number, itPriority: string | null): Promise<TicketDetailData> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/priority`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itPriority }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to update IT priority.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export async function updateTicketStatus(ticketId: number, status: string, expectedUpdatedAt?: string): Promise<TicketDetailData> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/status`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status, expectedUpdatedAt }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to update ticket status.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export interface CommentItem {
  id: number;
  ticketId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: string;
    email: string;
  };
}

export interface InternalNoteItem {
  id: number;
  ticketId: number;
  authorId: number;
  content: string;
  createdAt: string;
  author: {
    id: number;
    name: string;
    role: string;
    email: string;
  };
}

export interface UserOption {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
}

export async function getPublicComments(ticketId: number): Promise<CommentItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to load public comments.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data || [];
}

export async function postPublicComment(ticketId: number, content: string): Promise<CommentItem> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/comments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to post comment.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export async function getInternalNotes(ticketId: number): Promise<InternalNoteItem[]> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/notes`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to load internal notes.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data || [];
}

export async function postInternalNote(ticketId: number, content: string): Promise<InternalNoteItem> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to post internal note.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export async function getStaffUsers(): Promise<UserOption[]> {
  const res = await fetch(`${API_BASE_URL}/api/users?role=IT_STAFF&isActive=true`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    throw new Error("Unable to load staff users list.");
  }
  return json.data || [];
}

export interface UserAdminListItem {
  id: number;
  email: string;
  name: string;
  role: "REQUESTER" | "IT_STAFF" | "ADMINISTRATOR";
  isActive: boolean;
  mustChangePassword: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface UsersListResponse {
  data: UserAdminListItem[];
  pagination?: {
    total: number;
    totalItems: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasPreviousPage: boolean;
    hasNextPage: boolean;
  };
}

export async function getUsersList(params?: {
  search?: string;
  role?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}): Promise<UsersListResponse> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.role) query.append("role", params.role);
  if (params?.isActive !== undefined) query.append("isActive", String(params.isActive));
  if (params?.page) query.append("page", String(params.page));
  if (params?.pageSize) query.append("pageSize", String(params.pageSize));

  const url = `${API_BASE_URL}/api/users${query.toString() ? `?${query.toString()}` : ""}`;
  const res = await fetch(url, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to load users list.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return {
    data: json.data || [],
    pagination: json.pagination || json.meta,
  };
}

export async function createUserAccount(data: {
  name: string;
  email: string;
  role: string;
  initialPassword: string;
}): Promise<UserAdminListItem> {
  const res = await fetch(`${API_BASE_URL}/api/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to create user account.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.user || json.data;
}

export async function updateUserAccount(
  id: number,
  data: { name?: string; email?: string; role?: string; isActive?: boolean }
): Promise<UserAdminListItem> {
  const res = await fetch(`${API_BASE_URL}/api/users/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to update user account.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.user || json.data;
}

export async function resetUserInitialPassword(
  id: number,
  initialPassword: string
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/api/users/${id}/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ initialPassword }),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to reset initial password.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Actions Taken API Calls (Lab 4 Sprint)
// ---------------------------------------------------------------------------

export interface ActionTaken {
  id: number;
  ticketId: number;
  actionDate: string;
  description: string;
  result: string;
  performedById: number;
  performedBy: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
  followUpRequired: boolean;
  isFollowedUp: boolean;
  followUpNote?: string | null;
  attachmentNotes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateActionTakenPayload {
  actionDate?: string;
  description: string;
  result: string;
  followUpRequired: boolean;
  isFollowedUp?: boolean;
  followUpNote?: string;
  attachmentNotes?: string;
  expectedUpdatedAt?: string;
}

export async function getActionsTaken(ticketId: number): Promise<ActionTaken[]> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/actions-taken`, {
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to fetch Actions Taken.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.actionsTaken || [];
}

export async function createActionTaken(
  ticketId: number,
  payload: CreateActionTakenPayload
): Promise<ActionTaken> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/actions-taken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to create Action Taken.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.actionTaken;
}

export async function updateActionTaken(
  ticketId: number,
  actionId: number,
  payload: CreateActionTakenPayload
): Promise<ActionTaken> {
  const res = await fetch(`${API_BASE_URL}/api/tickets/${ticketId}/actions-taken/${actionId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: "include",
  });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to update Action Taken.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.actionTaken;
}

export interface RequesterDashboardData {
  metrics: {
    totalOpen: number;
    waitingForRequester: number;
  };
  recentlyUpdated: TicketDetailData[];
  recentlyResolved: TicketDetailData[];
}

export interface StaffDashboardData {
  metrics: {
    unassignedCount: number;
    myOwnedCount: number;
    urgentHighCount: number;
    followUpCount: number;
  };
  statusDistribution: Record<string, number>;
  recentActivity: TicketDetailData[];
}

export interface AdminDashboardData extends StaffDashboardData {
  userStats: {
    totalUsers: number;
    requesterCount: number;
    staffCount: number;
    adminCount: number;
    inactiveCount: number;
  };
}

export async function getRequesterDashboard(requesterId?: number): Promise<RequesterDashboardData> {
  const query = requesterId ? `?requesterId=${requesterId}` : "";
  const res = await fetch(`${API_BASE_URL}/api/dashboard/requester${query}`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to fetch Requester Dashboard data.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export async function getStaffDashboard(): Promise<StaffDashboardData> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/staff`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to fetch Staff Dashboard data.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}

export async function getAdminDashboard(): Promise<AdminDashboardData> {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/admin`, { credentials: "include" });
  const json = await res.json();
  if (!res.ok) {
    const error: any = new Error(json.error?.message || "Unable to fetch Admin Dashboard data.");
    error.status = res.status;
    error.code = json.error?.code;
    throw error;
  }
  return json.data;
}


