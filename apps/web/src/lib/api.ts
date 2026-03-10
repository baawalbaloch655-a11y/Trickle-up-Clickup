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
    statuses: (id: string) => api.get(`/organizations/${id}/statuses`),
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
    listAll: () => api.get('/lists'),
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
    get: (listId: string, taskId: string) => api.get(`/lists/${listId}/tasks/${taskId}`),
    create: (listId: string, data: object) => api.post(`/lists/${listId}/tasks`, data),
    update: (listId: string, taskId: string, data: object) =>
        api.patch(`/lists/${listId}/tasks/${taskId}`, data),
    move: (listId: string, taskId: string, data: { statusId?: string; order?: number }) =>
        api.patch(`/lists/${listId}/tasks/${taskId}/move`, data),
    delete: (listId: string, taskId: string) =>
        api.delete(`/lists/${listId}/tasks/${taskId}`),

    // Dependencies
    addDependency: (listId: string, taskId: string, data: { dependentTaskId: string, type: 'BLOCKING' | 'WAITING_ON' }) =>
        api.post(`/lists/${listId}/tasks/${taskId}/dependencies`, data),
    removeDependency: (listId: string, taskId: string, dependencyId: string) =>
        api.delete(`/lists/${listId}/tasks/${taskId}/dependencies/${dependencyId}`),

    // Checklists
    addChecklist: (listId: string, taskId: string, data: { name: string }) =>
        api.post(`/lists/${listId}/tasks/${taskId}/checklists`, data),
    removeChecklist: (listId: string, taskId: string, checklistId: string) =>
        api.delete(`/lists/${listId}/tasks/${taskId}/checklists/${checklistId}`),
    addChecklistItem: (listId: string, taskId: string, checklistId: string, data: { name: string, assigneeId?: string }) =>
        api.post(`/lists/${listId}/tasks/${taskId}/checklists/${checklistId}/items`, data),
    updateChecklistItem: (listId: string, taskId: string, checklistId: string, itemId: string, data: { name?: string, isResolved?: boolean, assigneeId?: string, order?: number }) =>
        api.patch(`/lists/${listId}/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`, data),
    removeChecklistItem: (listId: string, taskId: string, checklistId: string, itemId: string) =>
        api.delete(`/lists/${listId}/tasks/${taskId}/checklists/${checklistId}/items/${itemId}`),
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
    tasksByList: () => api.get('/analytics/tasks/by-list'),
    tasksByAssignee: () => api.get('/analytics/tasks/by-assignee'),
    tasksForPriority: (priority: string) => api.get(`/analytics/tasks/by-priority/${priority}`),
    activity: () => api.get('/analytics/activity'),
    health: () => api.get('/analytics/health'),
    getTimesheets: (params?: { userId?: string, startDate?: string, endDate?: string }) =>
        api.get('/analytics/timesheets', { params }),
    getProductivity: () => api.get('/analytics/productivity'),
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

export const dashboardsApi = {
    list: () => api.get('/dashboards'),
    create: (data: { name: string; description?: string; isPrivate?: boolean }) =>
        api.post('/dashboards', data),
    get: (id: string) => api.get(`/dashboards/${id}`),
    update: (id: string, data: { name?: string; description?: string; isPrivate?: boolean }) =>
        api.patch(`/dashboards/${id}`, data),
    delete: (id: string) => api.delete(`/dashboards/${id}`),

    addWidget: (dashboardId: string, data: any) =>
        api.post(`/dashboards/${dashboardId}/widgets`, data),
    updateWidget: (dashboardId: string, widgetId: string, data: any) =>
        api.patch(`/dashboards/${dashboardId}/widgets/${widgetId}`, data),
    removeWidget: (dashboardId: string, widgetId: string) =>
        api.delete(`/dashboards/${dashboardId}/widgets/${widgetId}`),
};

export const docsApi = {
    list: (params?: { spaceId?: string; folderId?: string }) => {
        const query = new URLSearchParams();
        if (params?.spaceId) query.append('spaceId', params.spaceId);
        if (params?.folderId) query.append('folderId', params.folderId);
        return api.get(`/docs?${query.toString()}`);
    },
    get: (id: string) => api.get(`/docs/${id}`),
    create: (data: { title: string; content?: string; spaceId?: string; folderId?: string; parentId?: string }) =>
        api.post('/docs', data),
    update: (id: string, data: { title?: string; content?: string }) =>
        api.patch(`/docs/${id}`, data),
    delete: (id: string) => api.delete(`/docs/${id}`),
};

export const goalsApi = {
    list: () => api.get('/goals'),
    get: (id: string) => api.get(`/goals/${id}`),
    create: (data: { name: string; description?: string; color?: string; endDate?: string; isPrivate?: boolean }) =>
        api.post('/goals', data),
    update: (id: string, data: Partial<{ name: string; description: string; color: string; endDate: string; isPrivate: boolean }>) =>
        api.patch(`/goals/${id}`, data),
    delete: (id: string) => api.delete(`/goals/${id}`),

    addTarget: (goalId: string, data: { name: string; type?: string; targetValue: number; currentValue?: number; unit?: string }) =>
        api.post(`/goals/${goalId}/targets`, data),
    updateTarget: (goalId: string, targetId: string, data: Partial<{ name: string; targetValue: number; currentValue: number }>) =>
        api.patch(`/goals/${goalId}/targets/${targetId}`, data),
    removeTarget: (goalId: string, targetId: string) =>
        api.delete(`/goals/${goalId}/targets/${targetId}`),
};

// AI API
export const aiApi = {
    create: (data: any) => api.post('/ai', data).then(res => res.data),
    list: () => api.get('/ai').then(res => res.data),
    get: (id: string) => api.get(`/ai/${id}`).then(res => res.data),
};

// Integrations API
export const integrationsApi = {
    create: (data: any) => api.post('/integrations', data).then(res => res.data),
    list: () => api.get('/integrations').then(res => res.data),
    get: (id: string) => api.get(`/integrations/${id}`).then(res => res.data),
    update: (id: string, data: any) => api.patch(`/integrations/${id}`, data).then(res => res.data),
    delete: (id: string) => api.delete(`/integrations/${id}`).then(res => res.data),
};

// Webhooks API
export const webhooksApi = {
    create: (data: any) => api.post('/webhooks', data).then(res => res.data),
    list: () => api.get('/webhooks').then(res => res.data),
    get: (id: string) => api.get(`/webhooks/${id}`).then(res => res.data),
    update: (id: string, data: any) => api.patch(`/webhooks/${id}`, data).then(res => res.data),
    delete: (id: string) => api.delete(`/webhooks/${id}`).then(res => res.data),
};

// Time Entries API
export const timeEntriesApi = {
    start: (data: { taskId: string; description?: string; duration?: number }) =>
        api.post('/time-entries/start', data).then(res => res.data),
    stop: (id: string) =>
        api.patch(`/time-entries/${id}/stop`).then(res => res.data),
    getActive: () =>
        api.get('/time-entries/active').then(res => res.data),
    getTaskTime: (taskId: string) =>
        api.get(`/time-entries/task/${taskId}`).then(res => res.data),
    update: (id: string, data: any) =>
        api.patch(`/time-entries/${id}`, data).then(res => res.data),
    delete: (id: string) =>
        api.delete(`/time-entries/${id}`).then(res => res.data),
};

// Forms API
export const formsApi = {
    create: (data: any) => api.post('/forms', data).then(res => res.data),
    list: () => api.get('/forms').then(res => res.data),
    get: (id: string) => api.get(`/forms/${id}`).then(res => res.data),
    update: (id: string, data: any) => api.patch(`/forms/${id}`, data).then(res => res.data),
    delete: (id: string) => api.delete(`/forms/${id}`).then(res => res.data),
    submit: (id: string, data: any) => api.post(`/forms/${id}/submit`, data).then(res => res.data),
};
