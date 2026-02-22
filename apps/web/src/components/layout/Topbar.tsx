import { Bell, Search, PanelLeft, Plus, Wifi, WifiOff } from 'lucide-react';
import { useUIStore } from '../../store/uiStore';
import { useAuthStore } from '../../store/authStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';
import { useNavigate } from 'react-router-dom';
import { useSocketStore, getSocket } from '../../lib/socket';
import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Topbar() {
    const { toggleSidebar, toggleNotificationPanel } = useUIStore();
    const { activeOrg } = useAuthStore();
    const { isConnected } = useSocketStore();
    const navigate = useNavigate();
    const qc = useQueryClient();

    const { data: countData } = useQuery({
        queryKey: ['notifications', 'unread', activeOrg?.id],
        queryFn: () => notificationsApi.getUnreadCount().then((r: any) => r.data.data),
        enabled: !!activeOrg,
        refetchInterval: 60000,
    });

    useEffect(() => {
        if (!activeOrg) return;
        const socket = getSocket();

        const handleNewNotification = ({ notification }: any) => {
            qc.invalidateQueries({ queryKey: ['notifications', 'unread', activeOrg.id] });
            if (notification?.title) {
                toast(notification.title, {
                    icon: '🔔',
                    style: {
                        background: '#1f2937',
                        color: '#f3f4f6',
                        border: '1px solid #374151'
                    }
                });
            }
        };
        socket.on('notification.new', handleNewNotification);

        return () => {
            socket.off('notification.new', handleNewNotification);
        };
    }, [activeOrg, qc]);

    const unreadCount = countData?.count || 0;

    return (
        <header className="h-16 flex items-center gap-3 px-6 border-b border-gray-800 bg-gray-900/80 backdrop-blur-sm flex-shrink-0">
            <button onClick={toggleSidebar} className="btn-ghost btn-sm p-2 rounded-xl">
                <PanelLeft size={18} />
            </button>

            {/* Connection Status UI */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium border ${isConnected ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20 animate-pulse'}`}>
                {isConnected ? <Wifi size={10} /> : <WifiOff size={10} />}
                {isConnected ? 'Live' : 'Offline'}
            </div>

            {/* Search */}
            <div className="flex-1 max-w-sm">
                <div className="relative">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                        type="search"
                        placeholder="Search tasks, projects..."
                        className="input pl-9 py-2 text-sm bg-gray-800/60 border-gray-700/60 h-9"
                    />
                </div>
            </div>

            <div className="flex-1" />

            {/* Create button */}
            <button className="btn-primary btn-sm gap-1.5">
                <Plus size={15} />
                <span className="hidden sm:inline">New Task</span>
            </button>

            {/* Notifications */}
            <button
                onClick={toggleNotificationPanel}
                className="relative btn-ghost btn-sm p-2 rounded-xl"
                title="Notifications"
            >
                <Bell size={18} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-500 rounded-full text-[10px] font-bold flex items-center justify-center text-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>
        </header>
    );
}
