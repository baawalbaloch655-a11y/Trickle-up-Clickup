import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { getSocket } from '../../lib/socket';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

export default function NotificationsPage() {
    const activeOrg = useAuthStore((s) => s.activeOrg);
    const qc = useQueryClient();

    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['notifications', activeOrg?.id],
        queryFn: () => notificationsApi.list().then((r) => r.data.data),
        enabled: !!activeOrg,
    });

    // Realtime notifications
    useEffect(() => {
        const socket = getSocket();
        const handler = () => qc.invalidateQueries({ queryKey: ['notifications'] });
        socket.on('notification:new', handler);
        return () => { socket.off('notification:new', handler); };
    }, [qc]);

    const markRead = useMutation({
        mutationFn: (id: string) => notificationsApi.markRead(id),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
    });

    const markAllRead = useMutation({
        mutationFn: () => notificationsApi.markAllRead(),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All marked as read');
        },
    });

    const unread = notifications.filter((n: any) => !n.isRead);

    return (
        <div className="max-w-2xl mx-auto space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-100">Notifications</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{unread.length} unread</p>
                </div>
                {unread.length > 0 && (
                    <button
                        onClick={() => markAllRead.mutate()}
                        disabled={markAllRead.isPending}
                        className="btn-secondary btn-sm gap-1.5"
                    >
                        {markAllRead.isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCheck size={14} />}
                        Mark all read
                    </button>
                )}
            </div>

            <div className="card divide-y divide-gray-800">
                {isLoading ? (
                    <div className="p-8 flex justify-center">
                        <Loader2 className="animate-spin text-accent-400" />
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-12 text-center">
                        <Bell size={40} className="text-gray-700 mx-auto mb-3" />
                        <p className="text-gray-500">You're all caught up!</p>
                    </div>
                ) : (
                    notifications.map((n: any) => (
                        <div
                            key={n.id}
                            className={clsx(
                                'flex items-start gap-4 p-4 hover:bg-gray-800/40 transition-colors cursor-pointer',
                                !n.isRead && 'bg-accent-600/5',
                            )}
                            onClick={() => !n.isRead && markRead.mutate(n.id)}
                        >
                            <div className={clsx(
                                'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm',
                                !n.isRead ? 'bg-accent-600/20 text-accent-400' : 'bg-gray-800 text-gray-500',
                            )}>
                                <Bell size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                    <p className={clsx('text-sm font-medium truncate', !n.isRead ? 'text-gray-200' : 'text-gray-400')}>
                                        {n.title}
                                    </p>
                                    {!n.isRead && (
                                        <span className="w-2 h-2 rounded-full bg-accent-500 flex-shrink-0" />
                                    )}
                                </div>
                                <p className="text-sm text-gray-500 mt-0.5">{n.body}</p>
                                <p className="text-xs text-gray-600 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
