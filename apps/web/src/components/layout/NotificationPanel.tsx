import { X, Bell, CheckCheck, Trash2, BellOff } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';
import { format, formatDistanceToNow } from 'date-fns';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

function getIcon(type: string) {
    const map: Record<string, string> = {
        TASK_ASSIGNED: '📋',
        TASK_COMMENT: '💬',
        TASK_STATUS_CHANGED: '🔄',
        TASK_DUE_SOON: '⏰',
        TASK_OVERDUE: '🚨',
        MENTION: '🏷️',
        COMMENT_ASSIGNED: '📌',
    };
    return map[type] || '🔔';
}

export default function NotificationPanel() {
    const { notificationPanelOpen, toggleNotificationPanel } = useUIStore();
    const { activeOrg } = useAuthStore();
    const qc = useQueryClient();
    const navigate = useNavigate();

    const handleNotificationClick = (notif: any) => {
        // Mark as read if not already
        if (!notif.isRead) markRead.mutate(notif.notifId || notif.id);

        const metadata = notif.metadata || {};

        if (metadata.isChat && metadata.targetId && metadata.targetType) {
            const path = metadata.targetType === 'CHANNEL'
                ? `/channels/${metadata.targetId}`
                : `/conversations/${metadata.targetId}`;
            navigate(path);
        } else if (metadata.taskId) {
            // Navigate to task or list
            if (metadata.listId) {
                navigate(`/lists/${metadata.listId}`);
                // Optional: Open task modal via search param or global state
            }
        }

        // Close panel after navigation
        toggleNotificationPanel();
    };

    const { data: notifRes, isLoading } = useQuery({
        queryKey: ['notifications', 'list', activeOrg?.id],
        queryFn: () => notificationsApi.list({ isCleared: false }),
        enabled: !!activeOrg && notificationPanelOpen,
        select: (res: any) => res.data?.data || res.data || [],
    });

    const notifications: any[] = notifRes || [];

    const markRead = useMutation({
        mutationFn: (id: string) => notificationsApi.markRead(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications'] });
        },
    });

    const markAllRead = useMutation({
        mutationFn: () => notificationsApi.markAllRead(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const clearOne = useMutation({
        mutationFn: (id: string) => notificationsApi.clear(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const clearAll = useMutation({
        mutationFn: () => notificationsApi.clearAll(),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });

    if (!notificationPanelOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
                onClick={toggleNotificationPanel}
            />

            {/* Panel */}
            <div className="fixed top-16 right-4 z-50 w-[400px] max-h-[calc(100vh-5rem)] bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800 shrink-0">
                    <div className="flex items-center gap-2">
                        <Bell size={16} className="text-accent-400" />
                        <h3 className="font-bold text-gray-100">Notifications</h3>
                        {notifications.filter(n => !n.isRead).length > 0 && (
                            <span className="text-[10px] font-bold bg-accent-600 text-white rounded-full px-1.5 py-0.5">
                                {notifications.filter(n => !n.isRead).length}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        {notifications.length > 0 && (
                            <>
                                <button
                                    onClick={() => markAllRead.mutate()}
                                    disabled={markAllRead.isPending}
                                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-green-400 transition-colors"
                                    title="Mark all as read"
                                >
                                    <CheckCheck size={15} />
                                </button>
                                <button
                                    onClick={() => clearAll.mutate()}
                                    disabled={clearAll.isPending}
                                    className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-red-400 transition-colors"
                                    title="Clear all"
                                >
                                    <Trash2 size={15} />
                                </button>
                            </>
                        )}
                        <button
                            onClick={toggleNotificationPanel}
                            className="p-1.5 rounded-lg hover:bg-gray-800 text-gray-500 hover:text-white transition-colors"
                        >
                            <X size={15} />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto divide-y divide-gray-800/60 custom-scrollbar">
                    {isLoading ? (
                        <div className="flex flex-col gap-3 p-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-3 animate-pulse">
                                    <div className="w-8 h-8 rounded-full bg-gray-800 shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-800 rounded w-3/4" />
                                        <div className="h-3 bg-gray-800 rounded w-1/2" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
                            <div className="w-14 h-14 rounded-2xl bg-gray-900 flex items-center justify-center mb-4">
                                <BellOff size={24} className="text-gray-700" />
                            </div>
                            <p className="text-sm font-semibold text-gray-500">All caught up!</p>
                            <p className="text-xs text-gray-700 mt-1">No new notifications.</p>
                        </div>
                    ) : (
                        notifications.map((notif: any) => (
                            <div
                                key={notif.id}
                                className={clsx(
                                    'flex items-start gap-3 px-4 py-3.5 hover:bg-gray-900/60 transition-colors group cursor-pointer',
                                    !notif.isRead && 'bg-accent-600/5 border-l-2 border-accent-500'
                                )}
                                onClick={() => handleNotificationClick(notif)}
                            >
                                {/* Icon */}
                                <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center text-base shrink-0 mt-0.5">
                                    {getIcon(notif.type)}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <p className={clsx('text-sm leading-snug', notif.isRead ? 'text-gray-400' : 'text-gray-100 font-medium')}>
                                        {notif.title || notif.body || 'Notification'}
                                    </p>
                                    {notif.body && notif.title && (
                                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{notif.body}</p>
                                    )}
                                    <p className="text-[10px] text-gray-600 mt-1">
                                        {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true })}
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                    {!notif.isRead && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); markRead.mutate(notif.id); }}
                                            className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-green-400"
                                            title="Mark read"
                                        >
                                            <CheckCheck size={13} />
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); clearOne.mutate(notif.id); }}
                                        className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-500 hover:text-red-400"
                                        title="Dismiss"
                                    >
                                        <X size={13} />
                                    </button>
                                </div>

                                {/* Unread dot */}
                                {!notif.isRead && (
                                    <div className="w-2 h-2 rounded-full bg-accent-500 shrink-0 mt-1.5" />
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </>
    );
}
