import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { queryClient } from './queryClient';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const api = axios.create({
    baseURL: `${API_BASE}/api/v1`,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// Request interceptor: attach access token and org-id header
api.interceptors.request.use((config) => {
    const { accessToken, activeOrg } = useAuthStore.getState();
    if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (activeOrg) {
        config.headers['x-org-id'] = activeOrg.id;
    }
    return config;
});

// Response interceptor: handle 401 & token refresh
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const original = error.config;

        if (error.response?.status === 401 && !original._retry) {
            if (isRefreshing) {
                return new Promise((resolve) => {
                    refreshQueue.push((token) => {
                        original.headers.Authorization = `Bearer ${token}`;
                        resolve(api(original));
                    });
                });
            }

            original._retry = true;
            isRefreshing = true;

            try {
                const { refreshToken, setTokens, logout } = useAuthStore.getState();
                if (!refreshToken) throw new Error('No refresh token');

                const res = await axios.post(`${API_BASE}/api/v1/auth/refresh`, { refreshToken });
                const { accessToken, refreshToken: newRefresh, expiresIn } = res.data.data;

                setTokens(accessToken, newRefresh, expiresIn);
                refreshQueue.forEach((cb) => cb(accessToken));
                refreshQueue = [];

                original.headers.Authorization = `Bearer ${accessToken}`;
                return api(original);
            } catch {
                useAuthStore.getState().logout();
                queryClient.clear();
                window.location.href = '/login';
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    },
);

// Typed API helpers
export const authApi = {
    register: (data: { name: string; email: string; password: string }) =>
        api.post('/auth/register', data),
    login: (data: { email: string; password: string }) =>
        api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
};

export const orgsApi = {
    list: () => api.get('/organizations'),
    create: (data: { name: string; slug: string }) => api.post('/organizations', data),
    get: (id: string) => api.get(`/organizations/${id}`),
    update: (id: string, data: object) => api.patch(`/organizations/${id}`, data),
    members: (id: string) => api.get(`/organizations/${id}/members`),
    invite: (id: string, data: { email: string; roleId: string }) =>
        api.post(`/organizations/${id}/members`, data),
    removeMember: (orgId: string, memberId: string) =>
        api.delete(`/organizations/${orgId}/members/${memberId}`),
};

export const spacesApi = {
    list: () => api.get('/spaces'),
    get: (id: string) => api.get(`/spaces/${id}`),
    create: (data: { name: string; description?: string; color?: string; icon?: string }) =>
        api.post('/spaces', data),
    update: (id: string, data: object) => api.patch(`/spaces/${id}`, data),
    delete: (id: string) => api.delete(`/spaces/${id}`),
};

export const foldersApi = {
    list: (spaceId: string) => api.get(`/spaces/${spaceId}/folders`),
    create: (spaceId: string, data: { name: string }) =>
        api.post(`/spaces/${spaceId}/folders`, data),
    get: (id: string) => api.get(`/folders/${id}`),
    update: (id: string, data: object) => api.patch(`/folders/${id}`, data),
    delete: (id: string) => api.delete(`/folders/${id}`),
};

export const listsApi = {
    listInSpace: (spaceId: string) => api.get(`/spaces/${spaceId}/lists`),
    listInFolder: (folderId: string) => api.get(`/folders/${folderId}/lists`),
    create: (data: { name: string; spaceId: string; folderId?: string; color?: string }) =>
        api.post('/lists', data),
    get: (id: string) => api.get(`/lists/${id}`),
    update: (id: string, data: object) => api.patch(`/lists/${id}`, data),
    delete: (id: string) => api.delete(`/lists/${id}`),
};

export const tasksApi = {
    list: (listId: string) => api.get(`/lists/${listId}/tasks`),
    create: (listId: string, data: object) => api.post(`/lists/${listId}/tasks`, data),
    update: (listId: string, taskId: string, data: object) =>
        api.patch(`/lists/${listId}/tasks/${taskId}`, data),
    move: (listId: string, taskId: string, data: { status: string; order?: number }) =>
        api.patch(`/lists/${listId}/tasks/${taskId}/move`, data),
    delete: (listId: string, taskId: string) =>
        api.delete(`/lists/${listId}/tasks/${taskId}`),
};

export const notificationsApi = {
    list: (params?: { category?: string; isCleared?: boolean }) => {
        const query = new URLSearchParams();
        if (params?.category) query.append('category', params.category);
        if (params?.isCleared !== undefined) query.append('isCleared', params.isCleared.toString());
        return api.get(`/notifications?${query.toString()}`);
    },
    getUnreadCount: () => api.get('/notifications/unread-count'),
    markRead: (id: string) => api.patch(`/notifications/${id}/read`),
    markAllRead: () => api.patch('/notifications/mark-all-read'),
    clear: (id: string) => api.patch(`/notifications/${id}/clear`),
    clearAll: () => api.patch('/notifications/clear-all'),
    updateCategory: (id: string, category: string) => api.patch(`/notifications/${id}/category?category=${category}`),
};

export const employeesApi = {
    getAll: (orgId: string) => api.get('/employees'),
    getOne: (orgId: string, employeeId: string) => api.get(`/employees/${employeeId}`),
    update: (orgId: string, employeeId: string, data: object) => api.patch(`/employees/${employeeId}`, data),
    deactivate: (orgId: string, employeeId: string) => api.delete(`/employees/${employeeId}`),
};

export const analyticsApi = {
    dashboard: () => api.get('/analytics/dashboard'),
    home: () => api.get('/analytics/home'),
    trackView: (resource: string, resourceId: string) =>
        api.post(`/analytics/track-view?resource=${resource}&resourceId=${resourceId}`),
    tasksByStatus: () => api.get('/analytics/tasks/by-status'),
    tasksByPriority: () => api.get('/analytics/tasks/by-priority'),
    activity: () => api.get('/analytics/activity'),
    health: () => api.get('/analytics/health'),
};

export const usersApi = {
    updateProfile: (data: { name?: string; avatarUrl?: string }) =>
        api.patch('/users/profile', data),
    search: (q: string) => api.get(`/users/search?q=${encodeURIComponent(q)}`),
};

export const favoritesApi = {
    toggle: (data: { entityType: 'SPACE' | 'FOLDER' | 'LIST' | 'TASK', entityId: string }) =>
        api.post('/favorites/toggle', data),
    list: () => api.get('/favorites'),
};

export const channelsApi = {
    list: () => api.get('/channels'),
    get: (id: string) => api.get(`/channels/${id}`),
    create: (data: { name: string, description?: string, isPrivate?: boolean }) =>
        api.post('/channels', data),
    join: (id: string) => api.post(`/channels/${id}/join`),
    leave: (id: string) => api.delete(`/channels/${id}/leave`),
};

export const conversationsApi = {
    list: () => api.get('/conversations'),
    get: (id: string) => api.get(`/conversations/${id}`),
    create: (data: { userIds: string[], isGroup?: boolean, name?: string }) =>
        api.post('/conversations', data),
};

export const messagesApi = {
    send: (data: { content: string, channelId?: string, conversationId?: string }) =>
        api.post('/messages', data),
    listChannel: (channelId: string) => api.get(`/messages/channel/${channelId}`),
    listConversation: (conversationId: string) => api.get(`/messages/conversation/${conversationId}`),
};
