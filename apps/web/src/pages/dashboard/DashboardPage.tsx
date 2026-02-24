import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';
import {
    BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
    ResponsiveContainer, CartesianGrid, RadialBarChart, RadialBar, Legend,
} from 'recharts';
import { BarChart2, Target, ListChecks, Users2, X, CheckCircle2, Clock, CircleDot, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';

// ── Color palettes ────────────────────────────────────────────────────────────
const STATUS_COLORS: Record<string, string> = {
    TODO: '#6b7280',
    IN_PROGRESS: '#6366f1',
    IN_REVIEW: '#f59e0b',
    DONE: '#22c55e',
    CANCELLED: '#ef4444',
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: '#22c55e',
    MEDIUM: '#f59e0b',
    HIGH: '#f97316',
    URGENT: '#ef4444',
};

const LIST_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#22c55e', '#3b82f6', '#14b8a6', '#f97316'];

// ── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ title, items, onClose }: {
    title: string;
    items: Array<{ label: string; sublabel?: string; badge?: string; badgeColor?: string }>;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-y-0 right-0 z-50 w-96 bg-gray-950 border-l border-gray-800 shadow-2xl flex flex-col animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
                <h3 className="text-lg font-bold text-gray-100">{title}</h3>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-800 text-gray-400 hover:text-white transition-colors">
                    <X size={18} />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {items.length === 0 ? (
                    <p className="text-center text-gray-600 py-12 italic text-sm">No tasks in this category.</p>
                ) : items.map((item, i) => (
                    <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-all">
                        <CircleDot size={16} className="text-gray-500 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-200 font-medium leading-tight">{item.label}</p>
                            {item.sublabel && <p className="text-xs text-gray-500 mt-0.5">{item.sublabel}</p>}
                        </div>
                        {item.badge && (
                            <span className={clsx('text-[10px] font-bold uppercase px-1.5 py-0.5 rounded', item.badgeColor || 'bg-gray-800 text-gray-400')}>
                                {item.badge}
                            </span>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ── Custom Tooltip ────────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
            {payload.map((p: any, i: number) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full" style={{ background: p.color || p.fill }} />
                    <span className="text-gray-300">{p.name || 'Count'}:</span>
                    <span className="font-bold text-white">{p.value}</span>
                </div>
            ))}
        </div>
    );
}

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, color }: {
    icon: any; label: string; value: number | string; sub: string; color: string;
}) {
    return (
        <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-5 flex items-center gap-4">
            <div className={clsx('w-12 h-12 rounded-xl flex items-center justify-center', color)}>
                <Icon size={22} />
            </div>
            <div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">{label}</p>
                <p className="text-3xl font-extrabold text-gray-100 leading-none mt-0.5">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
    const [panel, setPanel] = useState<null | { title: string; items: any[] }>(null);

    const { data: statusRes } = useQuery({ queryKey: ['analytics-status'], queryFn: analyticsApi.tasksByStatus });
    const { data: priorityRes } = useQuery({ queryKey: ['analytics-priority'], queryFn: analyticsApi.tasksByPriority });
    const { data: listRes } = useQuery({ queryKey: ['analytics-list'], queryFn: analyticsApi.tasksByList });
    const { data: assigneeRes } = useQuery({ queryKey: ['analytics-assignee'], queryFn: analyticsApi.tasksByAssignee });

    const statusData: any[] = (statusRes?.data?.data || statusRes?.data || []).map((d: any) => ({ name: d.status.replace('_', ' '), value: d.count, status: d.status }));
    const priorityData: any[] = (priorityRes?.data?.data || priorityRes?.data || []).map((d: any) => ({ name: d.priority, value: d.count }));
    const listData: any[] = (listRes?.data?.data || listRes?.data || []).filter((l: any) => l.total > 0);
    const assigneeData: any[] = (assigneeRes?.data?.data || assigneeRes?.data || []);

    const totalTasks = statusData.reduce((s, d) => s + d.value, 0);
    const doneTasks = statusData.find(d => d.status === 'DONE')?.value || 0;
    const overdueTasks = assigneeData.reduce((s, a) => s + (a.overdue || 0), 0);
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const openPanel = (title: string, tasks: any[]) => {
        const items = tasks.map(t => ({
            label: t.title,
            sublabel: t.status?.replace('_', ' '),
            badge: t.priority,
            badgeColor: t.priority === 'URGENT' ? 'bg-red-900/50 text-red-400'
                : t.priority === 'HIGH' ? 'bg-orange-900/50 text-orange-400'
                    : 'bg-gray-800 text-gray-500',
        }));
        setPanel({ title, items });
    };

    return (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8 custom-scrollbar">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-100 tracking-tight">Analytics</h1>
                    <p className="text-gray-500 mt-1">Task and project insights across your organization</p>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard icon={ListChecks} label="Total Tasks" value={totalTasks} sub="Across all lists" color="bg-indigo-600/20 text-indigo-400" />
                    <StatCard icon={CheckCircle2} label="Completed" value={doneTasks} sub={`${completionRate}% completion rate`} color="bg-green-600/20 text-green-400" />
                    <StatCard icon={AlertTriangle} label="Overdue" value={overdueTasks} sub="Need attention" color="bg-red-600/20 text-red-400" />
                    <StatCard icon={Users2} label="Contributors" value={assigneeData.length} sub="Active assignees" color="bg-purple-600/20 text-purple-400" />
                </div>

                {/* Charts Row 1 — Status Breakdown + Priority Donut */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Task Status Bar Chart */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <BarChart2 size={18} className="text-indigo-400" />
                            <h2 className="font-bold text-gray-200">Tasks by Status</h2>
                            <span className="text-xs text-gray-600 ml-auto">Click a bar for details</span>
                        </div>
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart data={statusData} margin={{ top: 0, right: 8, bottom: 0, left: -24 }}
                                onClick={(state: any) => {
                                    if (!state?.activePayload?.[0]) return;
                                    const s = state.activePayload[0].payload.status;
                                    const tasks = listData.flatMap((l: any) => l.tasks.filter((t: any) => t.status === s));
                                    openPanel(`${s.replace('_', ' ')} Tasks`, tasks);
                                }}
                                style={{ cursor: 'pointer' }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                                <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                                <Bar dataKey="value" radius={[6, 6, 0, 0]} label={{ position: 'top', fill: '#6b7280', fontSize: 11 }}>
                                    {statusData.map((entry) => (
                                        <Cell key={entry.status} fill={STATUS_COLORS[entry.status] || '#6366f1'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Priority Pie Chart */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Target size={18} className="text-yellow-400" />
                            <h2 className="font-bold text-gray-200">Tasks by Priority</h2>
                            <span className="text-xs text-gray-600 ml-auto">Click a slice for details</span>
                        </div>
                        <div className="flex items-center gap-6">
                            <ResponsiveContainer width="55%" height={240}>
                                <PieChart onClick={(state: any) => {
                                    const p = state?.activePayload?.[0]?.payload;
                                    if (!p) return;
                                    const tasks = listData.flatMap((l: any) => l.tasks.filter((t: any) => t.priority === p.name));
                                    openPanel(`${p.name} Priority Tasks`, tasks);
                                }}>
                                    <Pie dataKey="value" data={priorityData} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                                        paddingAngle={3} style={{ cursor: 'pointer' }}>
                                        {priorityData.map((entry) => (
                                            <Cell key={entry.name} fill={PRIORITY_COLORS[entry.name] || '#6366f1'} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<ChartTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="flex flex-col gap-3">
                                {priorityData.map((d) => (
                                    <div key={d.name}
                                        onClick={() => {
                                            const tasks = listData.flatMap((l: any) => l.tasks.filter((t: any) => t.priority === d.name));
                                            openPanel(`${d.name} Priority Tasks`, tasks);
                                        }}
                                        className="flex items-center gap-2 cursor-pointer group"
                                    >
                                        <div className="w-3 h-3 rounded-full shrink-0" style={{ background: PRIORITY_COLORS[d.name] }} />
                                        <span className="text-sm text-gray-400 group-hover:text-gray-200 transition-colors">{d.name}</span>
                                        <span className="text-sm font-bold text-gray-200 ml-1">{d.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Charts Row 2 — Lists Breakdown + Assignee Radial */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Tasks Per List — Stacked Bar */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <ListChecks size={18} className="text-emerald-400" />
                            <h2 className="font-bold text-gray-200">Tasks per List</h2>
                            <span className="text-xs text-gray-600 ml-auto">Click to drill down</span>
                        </div>
                        {listData.length === 0 ? (
                            <div className="flex items-center justify-center h-60 text-gray-700 text-sm italic">No lists with tasks found.</div>
                        ) : (
                            <ResponsiveContainer width="100%" height={260}>
                                <BarChart data={listData} layout="vertical" margin={{ left: 0, right: 32, top: 0, bottom: 0 }}
                                    onClick={(state: any) => {
                                        if (!state?.activePayload?.[0]) return;
                                        const list = state.activePayload[0].payload;
                                        openPanel(list.name + ' — All Tasks', list.tasks || []);
                                    }}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <YAxis type="category" dataKey="name" width={100} tick={{ fill: '#9ca3af', fontSize: 11 }} axisLine={false} tickLine={false} />
                                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.08)' }} />
                                    <Bar dataKey="done" name="Done" stackId="a" fill="#22c55e" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#6366f1" />
                                    <Bar dataKey="todo" name="To Do" stackId="a" fill="#374151" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>

                    {/* Tasks Per Assignee — Radial Bar */}
                    <div className="bg-gray-900/60 border border-gray-800 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-6">
                            <Users2 size={18} className="text-purple-400" />
                            <h2 className="font-bold text-gray-200">Workload per Member</h2>
                            <span className="text-xs text-gray-600 ml-auto">Click for breakdown</span>
                        </div>
                        {assigneeData.length === 0 ? (
                            <div className="flex items-center justify-center h-60 text-gray-700 text-sm italic">No assignment data found.</div>
                        ) : (
                            <div className="space-y-3 overflow-y-auto max-h-64 pr-1">
                                {assigneeData.map((a, idx) => {
                                    const pct = a.total > 0 ? Math.round((a.done / a.total) * 100) : 0;
                                    const color = LIST_COLORS[idx % LIST_COLORS.length];
                                    return (
                                        <div key={a.userId}
                                            onClick={() => {
                                                const tasks = listData.flatMap((l: any) =>
                                                    l.tasks.filter((t: any) => t.assigneeId === a.userId));
                                                openPanel(`${a.name}'s Tasks`, tasks);
                                            }}
                                            className="cursor-pointer group"
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: color }}>
                                                        {a.name?.[0]?.toUpperCase() || '?'}
                                                    </div>
                                                    <span className="text-sm text-gray-300 font-medium group-hover:text-white transition-colors">{a.name}</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs text-gray-500">
                                                    <span>{a.done}/{a.total} done</span>
                                                    {a.overdue > 0 && <span className="text-red-400">{a.overdue} overdue</span>}
                                                    <span className="font-bold text-gray-300">{pct}%</span>
                                                </div>
                                            </div>
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Detail side panel */}
            {panel && (
                <>
                    <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setPanel(null)} />
                    <DetailPanel title={panel.title} items={panel.items} onClose={() => setPanel(null)} />
                </>
            )}
        </div>
    );
}
