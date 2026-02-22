// ─────────────────────────────────────────────
// Core Enums
// ─────────────────────────────────────────────

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
}

export enum OrgPlan {
  FREE = 'FREE',
  PRO = 'PRO',
  ENTERPRISE = 'ENTERPRISE',
}

export enum TaskStatus {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  IN_REVIEW = 'IN_REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED',
}

export enum TaskPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationType {
  TASK_ASSIGNED = 'TASK_ASSIGNED',
  TASK_UPDATED = 'TASK_UPDATED',
  TASK_COMPLETED = 'TASK_COMPLETED',
  MEMBER_INVITED = 'MEMBER_INVITED',
  MEMBER_JOINED = 'MEMBER_JOINED',
  PROJECT_CREATED = 'PROJECT_CREATED',
  MENTION = 'MENTION',
  SYSTEM = 'SYSTEM',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  INVITE = 'INVITE',
  ROLE_CHANGE = 'ROLE_CHANGE',
}

// ─────────────────────────────────────────────
// Entity Types
// ─────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  status: UserStatus;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  plan: OrgPlan;
  createdAt: string;
  updatedAt: string;
}

export interface OrgMember {
  id: string;
  userId: string;
  orgId: string;
  role: Role;
  user: Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  joinedAt: string;
}

export interface Role {
  id: string;
  orgId: string;
  name: string;
  permissions: string[];
  isDefault: boolean;
}

export interface List {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  color?: string;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: string;
  listId: string;
  orgId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  assignee?: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  dueDate?: string;
  order: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  orgId: string;
  type: NotificationType;
  title: string;
  body: string;
  isRead: boolean;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface FileRecord {
  id: string;
  orgId: string;
  uploadedBy: string;
  key: string;
  url: string;
  size: number;
  mimetype: string;
  originalName: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  orgId: string;
  userId: string;
  action: AuditAction;
  resource: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Auth Types
// ─────────────────────────────────────────────

export interface JwtPayload {
  sub: string;
  email: string;
  orgId?: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  expiresIn: number;
}

export interface LoginRequest {
  email: string;
  password: string;
  orgSlug?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

// ─────────────────────────────────────────────
// API Response Wrappers
// ─────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T = unknown> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: Record<string, string[]>;
  timestamp: string;
}

// ─────────────────────────────────────────────
// Realtime Event Types (Socket.io)
// ─────────────────────────────────────────────

export interface SocketEvents {
  // Client → Server
  'room:join': { orgId: string };
  'room:leave': { orgId: string };
  'presence:ping': { userId: string; orgId: string };

  // Server → Client
  'task:created': { task: Task };
  'task:updated': { task: Partial<Task> & { id: string } };
  'task:deleted': { taskId: string; listId: string };
  'notification:new': { notification: Notification };
  'presence:update': { onlineUsers: string[] };
  'activity:new': { activity: ActivityEvent };
}

export interface ActivityEvent {
  id: string;
  orgId: string;
  userId: string;
  user: Pick<User, 'id' | 'name' | 'avatarUrl'>;
  action: string;
  resource: string;
  resourceId: string;
  resourceName: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

// ─────────────────────────────────────────────
// Dashboard Stats
// ─────────────────────────────────────────────

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  inProgressTasks: number;
  overdueTask: number;
  totalLists: number;
  activeMembers: number;
  completionRate: number;
  recentActivity: ActivityEvent[];
}
