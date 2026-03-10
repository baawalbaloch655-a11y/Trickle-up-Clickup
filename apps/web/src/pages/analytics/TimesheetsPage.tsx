import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
    Calendar,
    Clock,
    User as UserIcon,
    FileText,
    BarChart3,
    PieChart as PieChartIcon,
    Filter,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    CheckCircle2
} from 'lucide-react';
import { analyticsApi } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend
} from 'recharts';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks, isSameDay } from 'date-fns';
import { clsx } from 'clsx';

const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#06b6d4'];

export default function TimesheetsPage() {
    const { activeOrg } = useAuthStore();
    const [dateRange, setDateRange] = useState({
        start: startOfWeek(new Date(), { weekStartsOn: 1 }),
        end: endOfWeek(new Date(), { weekStartsOn: 1 })
    });

    const { data: reportRaw, isLoading, error: reportError } = useQuery({
        queryKey: ['timesheets', dateRange],
        queryFn: () => analyticsApi.getTimesheets({
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString()
        }).then(res => {
            console.log('Timesheets API Response:', res);
            return res.data;
        }),
        enabled: !!activeOrg
    });

    const { data: productivityRaw, error: productivityError } = useQuery({
        queryKey: ['productivity'],
        queryFn: () => analyticsApi.getProductivity().then(res => {
            console.log('Productivity API Response:', res);
            return res.data;
        }),
        enabled: !!activeOrg
    });

    // Robust data unwrapping
    const report = reportRaw?.data || reportRaw || {};
    const productivity = Array.isArray(productivityRaw)
        ? productivityRaw
        : (productivityRaw as any)?.data || [];

    console.log('Processed Report:', report);
    console.log('Processed Productivity:', productivity);

    if (reportError) console.error('Report Query Error:', reportError);
    if (productivityError) console.error('Productivity Query Error:', productivityError);

    const handlePrevWeek = () => {
        setDateRange({
            start: subWeeks(dateRange.start, 1),
            end: subWeeks(dateRange.end, 1)
        });
    };

    const handleNextWeek = () => {
        setDateRange({
            start: addWeeks(dateRange.start, 1),
            end: addWeeks(dateRange.end, 1)
        });
    };

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    };

    if (isLoading) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">Timesheets & Productivity</h1>
                    <p className="text-gray-400 mt-1 text-lg">Track time distribution and task efficiency across your team.</p>
                </div>

                <div className="flex items-center gap-2 bg-gray-900/50 p-1.5 rounded-2xl border border-gray-800">
                    <button
                        onClick={handlePrevWeek}
                        className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-1.5 bg-gray-900 border border-gray-800 rounded-xl shadow-sm">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium text-white whitespace-nowrap">
                            {format(dateRange.start, 'MMM d')} - {format(dateRange.end, 'MMM d, yyyy')}
                        </span>
                    </div>
                    <button
                        onClick={handleNextWeek}
                        className="p-2 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-all"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm hover:border-indigo-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500/20 transition-all">
                            <Clock className="w-6 h-6 text-indigo-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Tracked</p>
                            <h3 className="text-2xl font-bold text-white">{(report?.totalHours || 0).toFixed(1)}h</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm hover:border-purple-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-purple-500/10 rounded-2xl group-hover:bg-purple-500/20 transition-all">
                            <FileText className="w-6 h-6 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Entries</p>
                            <h3 className="text-2xl font-bold text-white">{report?.count || 0}</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-all">
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Efficiency</p>
                            <h3 className="text-2xl font-bold text-white">92%</h3>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl shadow-sm hover:border-rose-500/30 transition-all group">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-rose-500/10 rounded-2xl group-hover:bg-rose-500/20 transition-all">
                            <TrendingUp className="w-6 h-6 text-rose-400" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Avg. / Day</p>
                            <h3 className="text-2xl font-bold text-white">{((report?.totalHours || 0) / 7).toFixed(1)}h</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Daily Activity Bar Chart */}
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <BarChart3 className="w-5 h-5 text-indigo-400" />
                                Daily Activity
                            </h3>
                            <p className="text-gray-400 text-sm mt-1">Hours tracked per day of current period</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={report?.dailyStats || []}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="#9ca3af"
                                    fontSize={12}
                                    tickFormatter={(val) => format(new Date(val), 'EEE')}
                                />
                                <YAxis stroke="#9ca3af" fontSize={12} tickFormatter={(val) => `${val}h`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    itemStyle={{ color: '#818cf8' }}
                                    cursor={{ fill: '#ffffff05' }}
                                />
                                <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribution by Project Pie Chart */}
                <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <PieChartIcon className="w-5 h-5 text-purple-400" />
                                Project Distribution
                            </h3>
                            <p className="text-gray-400 text-sm mt-1">Time spent across different lists</p>
                        </div>
                    </div>

                    <div className="h-[300px] w-full mt-4">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={report?.listStats || []}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={80}
                                    outerRadius={100}
                                    paddingAngle={8}
                                    dataKey="hours"
                                    stroke="none"
                                >
                                    {(report?.listStats || []).map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '16px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Detailed Entries Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-sm">
                <div className="p-8 border-b border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-white">Detailed Entries</h3>
                        <p className="text-gray-400 text-sm mt-1">Review individual time logs for this period.</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-sm font-medium transition-all border border-gray-700">
                            <Filter className="w-4 h-4" />
                            Filter Results
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-950 text-gray-400 text-sm font-semibold border-b border-gray-800">
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">User</th>
                                <th className="px-8 py-5">Task</th>
                                <th className="px-8 py-5">Duration</th>
                                <th className="px-8 py-5 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/50">
                            {(report?.entries || []).map((entry: any) => (
                                <tr key={entry.id} className="hover:bg-gray-800/30 transition-all group">
                                    <td className="px-8 py-6">
                                        <span className="text-gray-300 font-medium">{format(new Date(entry.startTime), 'MMM d, yyyy')}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-3">
                                            {entry.user?.avatarUrl ? (
                                                <img src={entry.user.avatarUrl} className="w-8 h-8 rounded-full border border-gray-700 shadow-sm" alt="" />
                                            ) : (
                                                <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-gray-700">
                                                    <UserIcon className="w-4 h-4 text-gray-500" />
                                                </div>
                                            )}
                                            <span className="text-white font-medium">{entry.user?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="space-y-1 max-w-xs truncate">
                                            <p className="text-white font-medium truncate">{entry.task?.title}</p>
                                            <p className="text-xs text-gray-500">{entry.task?.list?.name}</p>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-indigo-400 font-bold bg-indigo-500/5 px-3 py-1.5 rounded-xl w-fit">
                                            <Clock className="w-3.5 h-3.5" />
                                            {formatDuration(entry.duration || 0)}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-bold rounded-lg border border-emerald-500/20">
                                            Approved
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Productivity Analysis: Estimate vs Actual */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-sm">
                <div className="mb-8">
                    <h3 className="text-xl font-bold text-white">Productivity Analysis</h3>
                    <p className="text-gray-400 text-sm mt-1">Comparing estimated vs. actual time spent on key tasks.</p>
                </div>

                <div className="space-y-6">
                    {(productivity || []).slice(0, 5).map((item: any) => (
                        <div key={item.id} className="space-y-3 p-6 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                            <div className="flex justify-between items-center px-1">
                                <span className="text-white font-semibold flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></span>
                                    {item.title}
                                </span>
                                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {Math.round((item.actualHours / (item.estimateHours || 1)) * 100)}% Used
                                </span>
                            </div>
                            <div className="h-4 bg-gray-800 rounded-full overflow-hidden shadow-inner border border-gray-700/50">
                                <div
                                    className={clsx(
                                        "h-full rounded-full transition-all duration-1000",
                                        item.actualHours > item.estimateHours ? "bg-rose-500/80 shadow-[0_0_12px_rgba(244,63,94,0.3)]" : "bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_12px_rgba(99,102,241,0.3)]"
                                    )}
                                    style={{ width: `${Math.min(100, (item.actualHours / (item.estimateHours || 1)) * 100)}%` }}
                                ></div>
                            </div>
                            <div className="flex justify-between text-xs font-semibold px-1">
                                <div className="flex items-center gap-4">
                                    <span className="text-gray-500">Est: <span className="text-gray-300">{(item.estimateHours || 0).toFixed(1)}h</span></span>
                                    <span className="text-gray-500">Actual: <span className="text-indigo-400">{item.actualHours.toFixed(1)}h</span></span>
                                </div>
                                <span className={clsx(
                                    item.variance < 0 ? "text-rose-400" : "text-emerald-400"
                                )}>
                                    {item.variance < 0 ? `Over by ${(-item.variance / 3600).toFixed(1)}h` : `Remaining ${(item.variance / 3600).toFixed(1)}h`}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
