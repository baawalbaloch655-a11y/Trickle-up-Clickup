import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';
import InboxItem from '../../components/inbox/InboxItem';
import {
    Inbox,
    Zap,
    Clock,
    CheckCircle2,
    Filter,
    Loader2,
    Settings,
    MoreHorizontal,
    ChevronDown
} from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';
import { isToday, isYesterday, subDays, startOfDay, isAfter } from 'date-fns';

const TABS = [
    { id: 'PRIMARY', label: 'Primary', icon: Inbox },
    { id: 'OTHER', label: 'Other', icon: Zap },
    { id: 'LATER', label: 'Later', icon: Clock },
    { id: 'CLEARED', label: 'Cleared', icon: CheckCircle2 },
];

export default function InboxPage() {
    const { filter } = useParams();
    const [activeTab, setActiveTab] = useState('PRIMARY');
    const queryClient = useQueryClient();

    // Sync tab with filter if needed
    useEffect(() => {
        if (filter) setActiveTab('PRIMARY'); // Filters usually fall under Primary
    }, [filter]);

    const { data: notificationsRes, isLoading } = useQuery({
        queryKey: ['notifications', activeTab, filter],
        queryFn: async () => {
            const res = await notificationsApi.list({
                category: activeTab === 'CLEARED' ? undefined : activeTab,
                isCleared: activeTab === 'CLEARED'
            });

            let data = res.data?.data || [];

            // Client-side filtering for specialized views
            if (filter === 'replies') data = data.filter((n: any) => n.type === 'COMMENT_REPLY');
            if (filter === 'assigned') data = data.filter((n: any) => n.type === 'COMMENT_ASSIGNED');
            if (filter === 'tasks') data = data.filter((n: any) => n.type === 'TASK_ASSIGNED');

            return data;
        },
    });

    const notifications = notificationsRes || [];

    const clearAllMutation = useMutation({
        mutationFn: () => notificationsApi.clearAll(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            toast.success('All notifications cleared');
        }
    });

    // Grouping logic
    const groupNotifications = (items: any[]) => {
        const now = new Date();
        const today: any[] = [];
        const yesterday: any[] = [];
        const last7Days: any[] = [];
        const older: any[] = [];

        items.forEach(item => {
            const date = new Date(item.createdAt);
            if (isToday(date)) {
                today.push(item);
            } else if (isYesterday(date)) {
                yesterday.push(item);
            } else if (isAfter(date, subDays(startOfDay(now), 6))) {
                last7Days.push(item);
            } else {
                older.push(item);
            }
        });

        return [
            { label: 'Today', items: today },
            { label: 'Yesterday', items: yesterday },
            { label: 'Last 7 days', items: last7Days },
            { label: 'Older', items: older }
        ].filter(group => group.items.length > 0);
    };

    const grouped = groupNotifications(notifications);

    return (
        <div className="flex flex-col h-full bg-[#0a0a0a]">
            {/* Header */}
            <div className="h-14 px-6 border-b border-gray-800/50 flex items-center justify-between bg-black/40 backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-800/50 cursor-pointer transition-colors group">
                        <Filter size={16} className="text-gray-500 group-hover:text-gray-300" />
                        <span className="text-xs font-semibold text-gray-400 group-hover:text-gray-200">Filter</span>
                    </div>

                    <nav className="flex items-center gap-1">
                        {TABS.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={clsx(
                                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2",
                                    activeTab === tab.id
                                        ? "bg-gray-800 text-white shadow-glow-sm"
                                        : "text-gray-500 hover:text-gray-300 hover:bg-gray-800/30"
                                )}
                            >
                                {tab.label}
                                {activeTab === tab.id && notifications.length > 0 && (
                                    <span className="text-[10px] opacity-60 font-medium">
                                        {notifications.length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="flex items-center gap-2">
                    <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
                        <Settings size={16} />
                    </button>
                    {activeTab !== 'CLEARED' && notifications.length > 0 && (
                        <button
                            onClick={() => clearAllMutation.mutate()}
                            disabled={clearAllMutation.isPending}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold text-gray-400 hover:text-white transition-colors border border-transparent hover:border-gray-800 rounded-lg group"
                        >
                            <CheckCircle2 size={14} className="group-hover:text-accent-500 transition-colors" />
                            Clear all
                        </button>
                    )}
                    <button className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors">
                        <MoreHorizontal size={16} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                        <Loader2 className="animate-spin text-accent-500" size={32} />
                        <p className="text-sm text-gray-400 font-medium tracking-tight">Updating your stream...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-6 max-w-sm mx-auto p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-gray-900 border border-gray-800 flex items-center justify-center shadow-inner mb-2 rotate-12">
                            <CheckCircle2 size={40} className="text-gray-800" />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-xl font-bold text-gray-100 tracking-tight">Inbox Zero!</h3>
                            <p className="text-sm text-gray-500 leading-relaxed">You've cleared everything for now. Enjoy the peace or dive into a new project.</p>
                        </div>
                    </div>
                ) : (
                    <div className="max-w-5xl mx-auto p-8 space-y-12 pb-32">
                        {grouped.map((group) => (
                            <div key={group.label} className="space-y-4">
                                <div className="flex items-center gap-3 px-2">
                                    <ChevronDown size={14} className="text-gray-700" />
                                    <h3 className="text-sm font-bold text-gray-100 tracking-tight">{group.label}</h3>
                                    <div className="h-[1px] flex-1 bg-gray-900" />
                                </div>
                                <div className="space-y-px">
                                    {group.items.map((notif: any) => (
                                        <InboxItem key={notif.id} notification={notif} />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
