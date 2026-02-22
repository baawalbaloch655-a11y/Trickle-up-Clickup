import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../../lib/api';
import {
    Clock,
    Calendar,
    CheckCircle2,
    ClipboardList,
    MoreHorizontal,
    ChevronRight,
    Search,
    Settings,
    LayoutGrid,
    MessageSquare,
    Link as LinkIcon,
    History,
    AlertCircle,
    Loader2
} from 'lucide-react';
import { clsx } from 'clsx';
import { format } from 'date-fns';
import { useAuthStore } from '../../store/authStore';

export default function HomeDashboard() {
    const user = useAuthStore((s) => s.user);
    const [activeWorkTab, setActiveWorkTab] = useState<'todo' | 'done' | 'delegated'>('todo');

    const { data: homeRes, isLoading } = useQuery({
        queryKey: ['home-data'],
        queryFn: () => analyticsApi.home().then(res => res.data.data),
    });

    const homeData = homeRes || { recents: [], agenda: [], myWork: { todo: [], done: [], delegated: [] }, assignedToMe: [] };

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 18) return 'Good afternoon';
        return 'Good evening';
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4 opacity-50">
                <Loader2 className="animate-spin text-accent-500" size={32} />
                <p className="text-sm text-gray-400 font-medium">Preparing your workspace...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto bg-[#0a0a0a] custom-scrollbar p-8">
            <div className="max-w-[1400px] mx-auto space-y-8">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-1">My Tasks</h2>
                        <h1 className="text-3xl font-bold text-gray-100">
                            {getGreeting()}, <span className="text-accent-500">{user?.name?.split(' ')[0]}</span>
                        </h1>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-accent-600 text-white font-bold rounded-xl hover:bg-accent-500 transition-all shadow-glow">
                            Manage cards
                        </button>
                        <button className="p-2 rounded-xl bg-gray-900 border border-gray-800 text-gray-400 hover:text-white transition-colors">
                            <Settings size={20} />
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                    {/* Recents Widget */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col h-[400px]">
                        <div className="flex items-center gap-2 mb-6">
                            <History size={18} className="text-gray-400" />
                            <h3 className="font-bold text-gray-200">Recents</h3>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-1 custom-scrollbar pr-2">
                            {homeData.recents.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 grayscale p-8">
                                    <Clock size={48} className="mb-4" />
                                    <p className="text-sm">No recent activity yet.</p>
                                </div>
                            ) : (
                                homeData.recents.map((item: any) => (
                                    <div key={item.id} className="group flex items-center gap-4 p-2.5 rounded-xl hover:bg-gray-800/50 transition-all cursor-pointer">
                                        <div className="w-8 h-8 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 text-gray-400 group-hover:text-accent-400 transition-colors">
                                            {item.resource === 'TASK' ? <ClipboardList size={14} /> : <LayoutGrid size={14} />}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-300 truncate">
                                                {item.resource} {item.resourceId?.slice(0, 8) || '...'}
                                            </p>
                                            <p className="text-[10px] text-gray-600 uppercase font-bold tracking-tighter">
                                                {item.createdAt ? format(new Date(item.createdAt), 'MMM d, h:mm a') : 'Recently'}
                                            </p>
                                        </div>
                                        <ChevronRight size={14} className="text-gray-700 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Agenda Widget */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Calendar size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-200">Agenda</h3>
                            </div>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-3xl bg-gray-800/50 border border-gray-700/50 flex items-center justify-center">
                                    <Calendar size={40} className="text-gray-700" />
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-accent-600 border-4 border-black flex items-center justify-center">
                                    <Search size={14} className="text-white" />
                                </div>
                            </div>
                            <div className="max-w-[280px] space-y-2">
                                <p className="text-sm text-gray-400">Connect your calendar to view upcoming events and join your next call</p>
                            </div>
                            <div className="grid grid-cols-1 gap-2 w-full max-w-[320px]">
                                <button className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-all text-sm group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center">
                                            <span className="text-blue-500 font-bold text-[10px]">G</span>
                                        </div>
                                        <span className="text-gray-300">Google Calendar</span>
                                    </div>
                                    <span className="text-xs text-gray-500 group-hover:text-accent-400">Connect</span>
                                </button>
                                <button className="flex items-center justify-between px-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl hover:border-gray-700 transition-all text-sm group">
                                    <div className="flex items-center gap-3">
                                        <div className="w-6 h-6 rounded bg-gray-800 flex items-center justify-center text-blue-400">
                                            <span className="font-bold text-[10px]">O</span>
                                        </div>
                                        <span className="text-gray-300">Microsoft Outlook</span>
                                    </div>
                                    <span className="text-xs text-gray-500 group-hover:text-accent-400">Connect</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Personal List Widget */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col h-[400px]">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <LayoutGrid size={18} className="text-gray-400" />
                                <h3 className="font-bold text-gray-200">Personal List</h3>
                                <AlertCircle size={14} className="text-gray-600" />
                            </div>
                            <button className="text-gray-500 hover:text-white transition-colors">
                                <Settings size={16} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                            {homeData.personalList?.length === 0 ? (
                                <p className="text-center py-12 text-gray-600 text-xs italic">No personal tasks yet.</p>
                            ) : (
                                homeData.personalList.map((task: any) => (
                                    <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-gray-800 hover:border-gray-700 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-4 h-4 rounded-full border border-gray-600" />
                                            <span className="text-sm text-gray-300 font-medium">{task.title}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-accent-600/20 flex items-center justify-center text-[10px] font-bold text-accent-400">
                                                {user?.name?.[0]}
                                            </div>
                                            <Calendar size={14} className="text-gray-600" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button className="mt-4 flex items-center gap-2 text-xs text-gray-500 hover:text-accent-400 transition-colors py-2 group">
                            <span className="w-4 h-4 rounded-full border border-gray-600 flex items-center justify-center text-lg font-light group-hover:border-accent-400">+</span>
                            Add Task
                        </button>
                    </div>

                    {/* Assigned Comments Widget */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col h-[400px]">
                        <div className="flex items-center gap-2 mb-6">
                            <MessageSquare size={18} className="text-gray-400" />
                            <h3 className="font-bold text-gray-200">Assigned comments</h3>
                        </div>
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            {homeData.assignedComments?.length === 0 ? (
                                <div className="space-y-4">
                                    <div className="relative inline-block">
                                        <MessageSquare size={48} className="text-gray-800 rotate-12" />
                                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-600 border-2 border-black flex items-center justify-center shadow-lg">
                                            <CheckCircle2 size={10} className="text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">You don't have any assigned comments.</p>
                                        <button className="text-xs text-accent-500 hover:underline mt-1 font-medium">Learn more</button>
                                    </div>
                                </div>
                            ) : (
                                <div className="w-full space-y-3 px-4">
                                    {homeData.assignedComments.map((comment: any) => (
                                        <div key={comment.id} className="p-3 rounded-xl bg-black border border-gray-800 text-left hover:border-gray-700 transition-all cursor-pointer">
                                            <p className="text-sm text-gray-300 line-clamp-2 mb-1">{comment.body}</p>
                                            <p className="text-[10px] text-gray-600">{format(new Date(comment.createdAt), 'MMM d, p')}</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* My Work Card */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col">
                        <div className="mb-6">
                            <h3 className="font-bold text-gray-200 mb-4">My Work</h3>
                            <div className="flex items-center gap-1 p-1 bg-black rounded-xl border border-gray-800 w-fit">
                                {['todo', 'done', 'delegated'].map((tab) => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveWorkTab(tab as any)}
                                        className={clsx(
                                            "px-4 py-1.5 rounded-lg text-xs font-bold capitalize transition-all",
                                            activeWorkTab === tab
                                                ? "bg-gray-800 text-white shadow-glow-sm"
                                                : "text-gray-500 hover:text-gray-300"
                                        )}
                                    >
                                        {tab}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 space-y-4">
                            {homeData.myWork[activeWorkTab].length === 0 ? (
                                <p className="text-center py-12 text-gray-600 text-xs italic">No tasks here yet.</p>
                            ) : (
                                homeData.myWork[activeWorkTab].map((task: any) => (
                                    <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-black border border-gray-800 hover:border-gray-700 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className={clsx(
                                                "w-4 h-4 rounded-full border-2",
                                                task.status === 'DONE' ? "bg-green-500 border-green-500" : "border-gray-700"
                                            )} />
                                            <span className="text-sm text-gray-300 font-medium">{task.title}</span>
                                        </div>
                                        {task.dueDate && (
                                            <span className="text-[10px] text-gray-500">{format(new Date(task.dueDate), 'MMM d')}</span>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Assigned to me Table */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="font-bold text-gray-200">Assigned to me</h3>
                            <button className="text-gray-500 hover:text-white transition-colors">
                                <MoreHorizontal size={18} />
                            </button>
                        </div>
                        <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-left text-xs">
                                <thead className="text-gray-500 border-b border-gray-800">
                                    <tr>
                                        <th className="pb-3 font-semibold">Name</th>
                                        <th className="pb-3 font-semibold">Priority</th>
                                        <th className="pb-3 font-semibold text-right">Due</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-800/50">
                                    {homeData.assignedToMe.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="py-8 text-center text-gray-600 italic">No assigned tasks.</td>
                                        </tr>
                                    ) : (
                                        homeData.assignedToMe.map((task: any) => (
                                            <tr key={task.id} className="group hover:bg-gray-800/30">
                                                <td className="py-3 flex items-center gap-3 pr-4">
                                                    <div className="w-5 h-5 rounded-full border border-gray-700 flex items-center justify-center text-gray-600">
                                                        <ClipboardList size={10} />
                                                    </div>
                                                    <span className="text-gray-300 font-medium">{task.title}</span>
                                                </td>
                                                <td className="py-3">
                                                    <span className={clsx(
                                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                                                        task.priority === 'URGENT' ? "text-red-400 bg-red-400/10" :
                                                            task.priority === 'HIGH' ? "text-orange-400 bg-orange-400/10" :
                                                                "text-gray-500 bg-gray-500/10"
                                                    )}>
                                                        {task.priority}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-right text-gray-500 group-hover:text-gray-300 transition-colors">
                                                    {task.dueDate ? format(new Date(task.dueDate), 'MMM d') : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Priorities Widget */}
                    <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 flex flex-col col-span-1 lg:col-span-2">
                        <div className="flex items-center gap-2 mb-6">
                            <AlertCircle size={18} className="text-red-400" />
                            <h3 className="font-bold text-gray-200">Priorities</h3>
                            <MoreHorizontal size={14} className="text-gray-600 ml-auto" />
                        </div>
                        <div className="h-24 flex items-center justify-center border border-gray-800 rounded-2xl bg-black/20">
                            <p className="text-xs text-gray-600 italic">No high priority items needing immediate attention.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
