import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar as CalendarIcon, Clock, Users, ChevronLeft, ChevronRight, CheckCircle2, Circle } from 'lucide-react';
import { globalTasksApi } from '../lib/api';
import { useAuthStore } from '../store/authStore';
import { clsx } from 'clsx';
import { format, addDays, subDays, startOfWeek, isSameDay } from 'date-fns';

export default function PlannerPage() {
    const activeOrg = useAuthStore(s => s.activeOrg);
    const [currentDate, setCurrentDate] = useState(new Date());

    const startDate = startOfWeek(currentDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startDate, i));

    const { data: tasks = [], isLoading } = useQuery({
        queryKey: ['global-tasks', activeOrg?.id, format(startDate, 'yyyy-MM-dd')],
        queryFn: async () => {
            const res = await globalTasksApi.myTasks({
                startDate: startDate.toISOString(),
                endDate: addDays(startDate, 7).toISOString()
            });
            // The backend wraps responses in { data: [...] } via interceptor,
            // so Axios res.data is actually { data: [...] }
            return res.data?.data || [];
        },
        enabled: !!activeOrg
    });

    const getTasksForDate = (date: Date) => {
        if (!Array.isArray(tasks)) return [];
        return tasks.filter((task: any) => {
            if (!task.dueDate) return false;
            return isSameDay(new Date(task.dueDate), date);
        });
    };

    return (
        <div className="h-full flex flex-col bg-[#0B0D14]">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-800/60 bg-gray-900/40 backdrop-blur-xl sticky top-0 z-10">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
                        <CalendarIcon size={24} className="text-indigo-500" />
                        My Planner
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Organize your week and manage upcoming deadlines.</p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-1">
                        <button onClick={() => setCurrentDate(subDays(currentDate, 7))} className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-gray-200 transition-colors">
                            <ChevronLeft size={16} />
                        </button>
                        <span className="text-sm font-medium text-gray-300 px-4">
                            {format(startDate, 'MMM d')} - {format(addDays(startDate, 6), 'MMM d, yyyy')}
                        </span>
                        <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1.5 hover:bg-gray-800 rounded-md text-gray-400 hover:text-gray-200 transition-colors">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                    <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-sm font-medium text-gray-200 rounded-lg transition-colors border border-gray-700 cursor-pointer">
                        Today
                    </button>
                </div>
            </div>

            {/* Weekly Calendar Grid */}
            <div className="flex-1 overflow-x-auto p-8">
                <div className="min-w-[1000px] h-full flex gap-4">
                    {weekDays.map((date, i) => {
                        const dayTasks = getTasksForDate(date);
                        return (
                            <div key={i} className="flex-1 flex flex-col min-w-[200px] bg-gray-900/20 border border-gray-800/60 rounded-2xl overflow-hidden hover:border-gray-700/60 transition-colors">
                                <div className={clsx(
                                    "py-3 px-4 border-b border-gray-800/60 text-center flex flex-col items-center justify-center",
                                    isSameDay(date, new Date()) ? "bg-indigo-500/10" : "bg-gray-900/40"
                                )}>
                                    <span className={clsx(
                                        "text-xs font-bold uppercase tracking-widest",
                                        isSameDay(date, new Date()) ? "text-indigo-400" : "text-gray-500"
                                    )}>
                                        {format(date, 'EEE')}
                                    </span>
                                    <span className={clsx(
                                        "text-2xl font-light mt-0.5",
                                        isSameDay(date, new Date()) ? "text-indigo-300" : "text-gray-300"
                                    )}>
                                        {format(date, 'd')}
                                    </span>
                                </div>

                                <div className="flex-1 p-3 space-y-3 overflow-y-auto custom-scrollbar">
                                    {isLoading ? (
                                        <div className="h-full flex items-center justify-center">
                                            <div className="w-5 h-5 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                                        </div>
                                    ) : dayTasks.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                                            <p className="text-xs text-gray-500 font-medium">No tasks scheduled</p>
                                        </div>
                                    ) : (
                                        dayTasks.map((task: any) => (
                                            <div key={task.id} className="bg-gray-800/50 hover:bg-gray-800 border border-gray-700/50 rounded-xl p-3 transition-colors cursor-pointer group">
                                                <div className="flex items-start gap-2">
                                                    <div className={clsx(
                                                        "w-4 h-4 rounded mt-0.5 flex-shrink-0 flex items-center justify-center border",
                                                        task.status?.category === 'DONE'
                                                            ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500'
                                                            : 'border-gray-600 hover:border-indigo-400'
                                                    )}>
                                                        {task.status?.category === 'DONE' && <CheckCircle2 size={12} />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className={clsx(
                                                            "text-sm font-medium leading-snug",
                                                            task.status?.category === 'DONE' ? 'text-gray-500 line-through' : 'text-gray-200'
                                                        )}>
                                                            {task.title}
                                                        </p>

                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="text-[10px] bg-gray-900 text-gray-400 px-1.5 py-0.5 rounded font-medium truncate max-w-[100px]">
                                                                {task.list?.name}
                                                            </span>
                                                            {task.timeEstimate && (
                                                                <span className="flex items-center gap-1 text-[10px] text-gray-500 font-medium ml-auto">
                                                                    <Clock size={10} />
                                                                    {task.timeEstimate}m
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

        </div>
    );
}
