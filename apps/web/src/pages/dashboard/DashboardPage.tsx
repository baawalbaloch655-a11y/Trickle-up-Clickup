import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
    CheckCircle2, Clock, AlertTriangle, Folders,
    Users, TrendingUp, Activity, BarChart3
} from 'lucide-react';

interface StatCard {
    label: string;
    value: number | string;
    icon: React.ElementType;
    color: string;
    description?: string;
}

export default function DashboardPage() {
    const activeOrg = useAuthStore((s) => s.activeOrg);
    const user = useAuthStore((s) => s.user);

    const { data, isLoading } = useQuery({
        queryKey: ['analytics', 'dashboard', activeOrg?.id],
        queryFn: () => analyticsApi.dashboard().then((r) => r.data.data),
        enabled: !!activeOrg,
    });

    const stats: StatCard[] = [
        {
            label: 'Total Tasks',
            value: data?.totalTasks ?? 0,
            icon: BarChart3,
            color: 'text-accent-400',
            description: `${data?.inProgressTasks ?? 0} in progress`,
        },
        {
            label: 'Completed',
            value: data?.completedTasks ?? 0,
            icon: CheckCircle2,
            color: 'text-green-400',
            description: `${data?.completionRate ?? 0}% completion rate`,
        },
        {
            label: 'Overdue',
            value: data?.overdueTask ?? 0,
            icon: AlertTriangle,
            color: 'text-orange-400',
            description: 'Needs attention',
        },
        {
            label: 'Lists',
            value: data?.totalLists ?? 0,
            icon: Folders,
            color: 'text-purple-400',
            description: 'Across your hierarchy',
        },
        {
            label: 'Members',
            value: data?.activeMembers ?? 0,
            icon: Users,
            color: 'text-cyan-400',
            description: 'In your organization',
        },
        {
            label: 'Progress',
            value: `${data?.completionRate ?? 0}%`,
            icon: TrendingUp,
            color: 'text-accent-400',
            description: 'Overall completion',
        },
    ];

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-100">
                    Good {getGreeting()},{' '}
                    <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
                </h1>
                <p className="text-gray-500 text-sm mt-1">
                    Here's what's happening in <span className="text-gray-400">{activeOrg?.name}</span>
                </p>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
                {stats.map((s) => (
                    <div key={s.label} className="card p-4 hover:border-gray-700 transition-colors">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                            <s.icon size={16} className={s.color} />
                        </div>
                        {isLoading ? (
                            <div className="h-7 w-16 bg-gray-700 animate-pulse rounded" />
                        ) : (
                            <p className="text-2xl font-bold text-gray-100">{s.value}</p>
                        )}
                        <p className="text-[11px] text-gray-600 mt-1">{s.description}</p>
                    </div>
                ))}
            </div>

            {/* Body: Progress bar + Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Completion progress */}
                <div className="card p-6 col-span-1">
                    <h3 className="font-semibold text-gray-200 mb-4">Task Progress</h3>
                    <div className="space-y-4">
                        {[
                            { label: 'Done', count: data?.completedTasks ?? 0, color: 'bg-green-500' },
                            { label: 'In Progress', count: data?.inProgressTasks ?? 0, color: 'bg-blue-500' },
                            { label: 'Overdue', count: data?.overdueTask ?? 0, color: 'bg-orange-500' },
                        ].map(({ label, count, color }) => {
                            const total = data?.totalTasks || 1;
                            const pct = Math.round((count / total) * 100);
                            return (
                                <div key={label}>
                                    <div className="flex justify-between text-xs mb-1.5">
                                        <span className="text-gray-400">{label}</span>
                                        <span className="text-gray-500">{count} ({pct}%)</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full ${color} rounded-full transition-all duration-700`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Recent activity */}
                <div className="card p-6 col-span-2">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity size={16} className="text-accent-400" />
                        <h3 className="font-semibold text-gray-200">Recent Activity</h3>
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <div key={i} className="h-10 bg-gray-800 animate-pulse rounded-xl" />
                            ))}
                        </div>
                    ) : data?.recentActivity?.length === 0 ? (
                        <p className="text-gray-500 text-sm text-center py-8">No activity yet. Create a task to get started!</p>
                    ) : (
                        <div className="space-y-2">
                            {(data?.recentActivity || []).slice(0, 8).map((a: any) => (
                                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-800/60 transition-colors">
                                    <div className="w-7 h-7 rounded-full bg-accent-600/20 flex items-center justify-center flex-shrink-0 text-xs font-bold text-accent-400 uppercase">
                                        {a.user?.name?.[0] ?? '?'}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm text-gray-300 truncate">
                                            <span className="font-medium">{a.user?.name}</span>{' '}
                                            <span className="text-gray-500">{a.action.toLowerCase()}d</span>{' '}
                                            <span className="text-gray-400">{a.resource}</span>
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            {new Date(a.createdAt).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
}
