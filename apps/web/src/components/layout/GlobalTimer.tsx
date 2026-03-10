import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Square, Clock } from 'lucide-react';
import { timeEntriesApi } from '../../lib/api';
import { clsx } from 'clsx';

export default function GlobalTimer() {
    const qc = useQueryClient();
    const [elapsed, setElapsed] = useState(0);

    const { data: activeTimer } = useQuery({
        queryKey: ['active-timer'],
        queryFn: () => timeEntriesApi.getActive().then(r => r.data),
        refetchInterval: 10000,
    });

    useEffect(() => {
        let interval: any;
        if (activeTimer) {
            const start = new Date(activeTimer.startTime).getTime();
            setElapsed(Math.floor((Date.now() - start) / 1000));
            interval = setInterval(() => {
                setElapsed(Math.floor((Date.now() - start) / 1000));
            }, 1000);
        } else {
            setElapsed(0);
        }
        return () => clearInterval(interval);
    }, [activeTimer]);

    const stopTimer = useMutation({
        mutationFn: (id: string) => timeEntriesApi.stop(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['active-timer'] });
            qc.invalidateQueries({ queryKey: ['time-entries'] });
        }
    });

    if (!activeTimer) return null;

    const formatDuration = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
    };

    return (
        <div className="flex items-center gap-3 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/30 rounded-full group hover:bg-indigo-500/20 transition-all cursor-default">
            <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <div className="flex flex-col">
                    <span className="text-[9px] font-bold text-indigo-400 uppercase leading-none tracking-tighter">
                        Active: {activeTimer.task?.title?.slice(0, 15)}...
                    </span>
                    <span className="text-sm font-mono font-bold text-white leading-none">
                        {formatDuration(elapsed)}
                    </span>
                </div>
            </div>

            <button
                onClick={() => stopTimer.mutate(activeTimer.id)}
                className="w-7 h-7 bg-red-500/20 hover:bg-red-500/40 text-red-500 rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
                title="Stop Timer"
            >
                <Square size={12} fill="currentColor" />
            </button>
        </div>
    );
}
