import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dashboardsApi, analyticsApi } from '../../lib/api';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';
import { ArrowLeft, Plus, Settings, Trash2, LayoutGrid } from 'lucide-react';
import toast from 'react-hot-toast';
import { clsx } from 'clsx';

const STATUS_COLORS: Record<string, string> = {
    TODO: '#6b7280', IN_PROGRESS: '#6366f1', DONE: '#22c55e', CANCELLED: '#ef4444'
};

const PRIORITY_COLORS: Record<string, string> = {
    LOW: '#22c55e', MEDIUM: '#f59e0b', HIGH: '#f97316', URGENT: '#ef4444'
};

function ChartTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 shadow-2xl z-50">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{label || payload[0].payload.name}</p>
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

function WidgetContainer({ widget, dashboardId, onDelete }: { widget: any, dashboardId: string, onDelete: () => void }) {
    // We will fetch the analytics data individually for each widget or pass it down.
    // For simplicity, let's fetch here based on type.
    const { data: statusRes } = useQuery({ queryKey: ['analytics-status'], queryFn: analyticsApi.tasksByStatus, enabled: widget.type === 'TASKS_BY_STATUS' || widget.type === 'PIE_STATUS' });
    const { data: priorityRes } = useQuery({ queryKey: ['analytics-priority'], queryFn: analyticsApi.tasksByPriority, enabled: widget.type === 'TASKS_BY_PRIORITY' });
    const { data: listRes } = useQuery({ queryKey: ['analytics-list'], queryFn: analyticsApi.tasksByList, enabled: widget.type === 'TASKS_PER_LIST' });

    let content = null;

    if (widget.type === 'TASKS_BY_STATUS') {
        const data = (statusRes?.data?.data || statusRes?.data || []).map((d: any) => ({ name: d.status.replace('_', ' '), value: d.count, fill: STATUS_COLORS[d.status] || '#6366f1' }));
        content = (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, bottom: 20, left: -20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
        );
    } else if (widget.type === 'PIE_STATUS') {
        const data = (statusRes?.data?.data || statusRes?.data || []).filter((d: any) => d.count > 0).map((d: any) => ({ name: d.status.replace('_', ' '), value: d.count, fill: STATUS_COLORS[d.status] || '#6366f1' }));
        content = (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} />
                    <Tooltip content={<ChartTooltip />} />
                </PieChart>
            </ResponsiveContainer>
        );
    } else if (widget.type === 'TASKS_BY_PRIORITY') {
        const data = (priorityRes?.data?.data || priorityRes?.data || []).filter((d: any) => d.count > 0).map((d: any) => ({ name: d.priority, value: d.count, fill: PRIORITY_COLORS[d.priority] || '#f59e0b' }));
        content = (
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={80} paddingAngle={2} />
                    <Tooltip content={<ChartTooltip />} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
            </ResponsiveContainer>
        );
    } else if (widget.type === 'TASKS_PER_LIST') {
        const data = (listRes?.data?.data || listRes?.data || []);
        content = (
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} layout="vertical" margin={{ left: 0, right: 10, top: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fill: '#9ca3af', fontSize: 11 }} />
                    <Tooltip content={<ChartTooltip />} />
                    <Bar dataKey="done" name="Done" stackId="a" fill="#22c55e" />
                    <Bar dataKey="inProgress" name="In Progress" stackId="a" fill="#6366f1" />
                    <Bar dataKey="todo" name="To Do" stackId="a" fill="#374151" />
                </BarChart>
            </ResponsiveContainer>
        );
    } else {
        content = <div className="flex items-center justify-center h-full text-gray-500">Preview not available</div>;
    }

    return (
        <div
            className="bg-gray-900 border border-gray-800 rounded-2xl flex flex-col group relative overflow-hidden"
            style={{
                gridColumn: `span ${widget.width || 2}`,
                gridRow: `span ${widget.height || 2}`,
                minHeight: '280px'
            }}
        >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800/50">
                <h3 className="text-sm font-bold text-gray-200">{widget.name}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={onDelete} className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-gray-800 rounded-md">
                        <Trash2 size={14} />
                    </button>
                    <button className="p-1.5 text-gray-500 hover:text-indigo-400 hover:bg-gray-800 rounded-md cursor-move">
                        <LayoutGrid size={14} />
                    </button>
                </div>
            </div>
            <div className="flex-1 p-4 min-h-0 bg-gray-900/50">
                {content}
            </div>
        </div>
    );
}

export default function DashboardDetailPage() {
    const { id } = useParams();
    const qc = useQueryClient();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const { data: res, isLoading } = useQuery({
        queryKey: ['dashboard', id],
        queryFn: () => dashboardsApi.get(id as string),
        enabled: !!id,
    });

    const board = res?.data?.data || res?.data;

    const addWidgetMutation = useMutation({
        mutationFn: (data: any) => dashboardsApi.addWidget(id as string, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dashboard', id] });
            setIsAddModalOpen(false);
            toast.success('Widget added');
        }
    });

    const removeWidgetMutation = useMutation({
        mutationFn: (widgetId: string) => dashboardsApi.removeWidget(id as string, widgetId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['dashboard', id] });
        }
    });

    if (isLoading) {
        return <div className="p-12 flex justify-center"><div className="animate-spin w-8 h-8 border-4 border-t-accent-500 rounded-full border-gray-800" /></div>;
    }

    if (!board) return <div className="p-8 text-gray-500">Dashboard not found</div>;

    const WIDGET_OPTIONS = [
        { type: 'TASKS_BY_STATUS', name: 'Bar Chart: Tasks by Status', width: 2, height: 2 },
        { type: 'PIE_STATUS', name: 'Pie Chart: Tasks by Status', width: 2, height: 2 },
        { type: 'TASKS_BY_PRIORITY', name: 'Donut: Tasks by Priority', width: 2, height: 2 },
        { type: 'TASKS_PER_LIST', name: 'Stacked Bar: Tasks per List', width: 3, height: 2 },
    ];

    return (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] p-8 custom-scrollbar relative">
            <div className="max-w-[1400px] mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link to="/dashboards" className="p-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-gray-400 transition-colors">
                            <ArrowLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-100">{board.name}</h1>
                            {board.description && <p className="text-sm text-gray-500">{board.description}</p>}
                        </div>
                    </div>
                    <button onClick={() => setIsAddModalOpen(true)} className="btn-primary flex items-center gap-2">
                        <Plus size={16} /> Add Widget
                    </button>
                </div>

                {/* Grid */}
                {(!board.widgets || board.widgets.length === 0) ? (
                    <div className="border border-dashed border-gray-800 rounded-2xl bg-gray-900/30 p-20 flex flex-col items-center justify-center text-center">
                        <LayoutGrid className="text-gray-700 mb-4" size={48} />
                        <h2 className="text-xl font-bold text-gray-300">Empty Dashboard</h2>
                        <p className="text-gray-500 max-w-sm mt-2">Add widgets to build your custom reporting view. You can combine charts, lists, and metrics.</p>
                        <button onClick={() => setIsAddModalOpen(true)} className="btn-primary mt-6">Add First Widget</button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-min">
                        {board.widgets?.map((w: any) => (
                            <WidgetContainer
                                key={w.id}
                                widget={w}
                                dashboardId={board.id}
                                onDelete={() => removeWidgetMutation.mutate(w.id)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Add Widget Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="w-full max-w-2xl bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-100">Add Widget</h2>
                            <button onClick={() => setIsAddModalOpen(false)} className="text-gray-500 hover:text-white"><Settings size={18} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {WIDGET_OPTIONS.map((opt) => (
                                <div
                                    key={opt.type}
                                    onClick={() => addWidgetMutation.mutate({ type: opt.type, name: opt.name, width: opt.width, height: opt.height })}
                                    className="bg-gray-950 border border-gray-800 rounded-xl p-5 cursor-pointer hover:border-accent-500 transition-colors group"
                                >
                                    <h3 className="font-bold text-gray-300 group-hover:text-accent-400">{opt.name}</h3>
                                    <div className="flex items-center gap-3 mt-4 text-xs font-semibold text-gray-600">
                                        <span className="bg-gray-900 px-2 py-1 rounded">W: {opt.width}</span>
                                        <span className="bg-gray-900 px-2 py-1 rounded">H: {opt.height}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
