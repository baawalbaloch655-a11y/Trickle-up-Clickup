import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Play, Square, Clock, List as ListIcon, Trash2 } from 'lucide-react';
import { timeEntriesApi } from '../../lib/api';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

interface TimeTrackingProps {
    taskId: string;
}

export default function TimeTracking({ taskId }: TimeTrackingProps) {
    const qc = useQueryClient();
    const [elapsed, setElapsed] = useState(0);

    const { data: entries, isLoading, error: entriesError } = useQuery({
        queryKey: ['time-entries', taskId],
        queryFn: () => timeEntriesApi.getTaskTime(taskId).then(r => r.data),
    });

    const { data: activeTimer, error: timerError } = useQuery({
        queryKey: ['active-timer'],
        queryFn: () => timeEntriesApi.getActive().then(r => r.data),
        refetchInterval: 10000,
    });

    if (timerError) console.error('GlobalTimer Error:', timerError);
    console.log('GlobalTimer Active Timer:', activeTimer);

    if (entriesError) console.error('TimeEntries Error:', entriesError);
    if (timerError) console.error('ActiveTimer Error:', timerError);
    console.log('TimeTracking Component Rendered for Task:', taskId);
    console.log('Active Timer Data:', activeTimer);

    const isCurrentTaskActive = activeTimer && activeTimer.taskId === taskId;

    useEffect(() => {
        let interval: any;
        if (isCurrentTaskActive && activeTimer) {
            const start = new Date(activeTimer.startTime).getTime();
            interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [isCurrentTaskActive, activeTimer]);

    const startTimer = useMutation({
        mutationFn: () => timeEntriesApi.start({ taskId }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['active-timer'] });
            qc.invalidateQueries({ queryKey: ['time-entries', taskId] });
            toast.success('Timer started');
        }
    });

    const stopTimer = useMutation({
        mutationFn: (id: string) => timeEntriesApi.stop(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['active-timer'] });
            qc.invalidateQueries({ queryKey: ['time-entries', taskId] });
            qc.invalidateQueries({ queryKey: ['task', taskId] }); // To update total tracked if stored on task
            toast.success('Timer stopped');
        }
    });

    const deleteEntry = useMutation({
        mutationFn: (id: string) => timeEntriesApi.delete(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['time-entries', taskId] });
            toast.success('Entry deleted');
        }
    });

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
    };

    const totalTrackedSeconds = entries?.reduce((acc: number, curr: any) => acc + (curr.duration || 0), 0) || 0;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1.5 uppercase tracking-wider">
                    <Clock size={12} /> Time Tracked
                </span>
                <span className="text-xs font-mono text-gray-400 bg-gray-800/50 px-2 py-0.5 rounded">
                    {formatDuration(totalTrackedSeconds)}
                </span>
            </div>

            {/* Active Timer Controls */}
            <div className={clsx(
                "p-3 rounded-xl border transition-all duration-300",
                isCurrentTaskActive
                    ? "bg-indigo-500/10 border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.1)]"
                    : "bg-gray-800/30 border-gray-800 hover:border-gray-700"
            )}>
                <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className={clsx(
                            "text-[10px] font-bold uppercase tracking-tighter mb-0.5",
                            isCurrentTaskActive ? "text-indigo-400 animate-pulse" : "text-gray-500"
                        )}>
                            {isCurrentTaskActive ? "Tracking Now" : "Timer Stopped"}
                        </span>
                        <span className={clsx(
                            "text-lg font-mono font-bold leading-none",
                            isCurrentTaskActive ? "text-white" : "text-gray-400"
                        )}>
                            {isCurrentTaskActive ? formatDuration(elapsed) : "0h 0m 0s"}
                        </span>
                    </div>

                    {isCurrentTaskActive ? (
                        <button
                            onClick={() => stopTimer.mutate(activeTimer.id)}
                            className="w-10 h-10 bg-red-500/20 hover:bg-red-500/30 text-red-500 rounded-full flex items-center justify-center transition-colors"
                        >
                            <Square size={18} fill="currentColor" />
                        </button>
                    ) : (
                        <button
                            onClick={() => startTimer.mutate()}
                            disabled={activeTimer && !isCurrentTaskActive}
                            title={activeTimer ? "Stop current timer first" : "Start Tracking"}
                            className="w-10 h-10 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-500 rounded-full flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Play size={18} fill="currentColor" className="ml-1" />
                        </button>
                    )}
                </div>
            </div>

            {/* History Link/Toggle */}
            {entries && entries.length > 0 && (
                <div className="pt-2 border-t border-gray-800">
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2 block">Recent Entries</span>
                    <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                        {entries.slice(0, 5).map((entry: any) => (
                            <div key={entry.id} className="group flex items-center justify-between text-[11px] bg-gray-950/30 p-2 rounded-lg border border-transparent hover:border-gray-800 transition-colors">
                                <div className="flex flex-col">
                                    <span className="text-gray-300 font-medium">{formatDuration(entry.duration || 0)}</span>
                                    <span className="text-gray-500 flex items-center gap-1">
                                        {new Date(entry.startTime).toLocaleDateString()} · {entry.user.name}
                                    </span>
                                </div>
                                <button
                                    onClick={() => deleteEntry.mutate(entry.id)}
                                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
